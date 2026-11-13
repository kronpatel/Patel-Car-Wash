import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlanPrice, calculateCoinsDiscount } from "@/lib/utils";
import { LOYALTY_RULES, VEHICLE_TYPES, TIME_SLOTS } from "@/lib/constants";
import { sendBookingConfirmationWhatsApp } from "@/lib/whatsapp";
import { PlanType, VehicleType } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings
 * - Admins can view all bookings (with optional status or date query params)
 * - Customers can view only their own bookings
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const date = searchParams.get("date") || undefined;

    const where: any = {};

    if (session.user.role === "admin") {
      if (status) where.status = status;
      if (date) where.date = date;
    } else {
      // Customers only access their own bookings
      where.userId = session.user.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve bookings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * - Creates a new booking in MySQL via Prisma
 * - Requires customer authentication
 * - Calculates flat pricing for basic wash or tiered pricing for detailing
 * - Handles Clean Coins redemption & promo code discounts
 * - Generates QR Code
 * - Dispatches WhatsApp Booking Confirmation #1
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Please log in to book a service" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      service,
      plan,
      vehicleType,
      vehicleNumber,
      date,
      timeSlot,
      address,
      notes,
      useCleanCoins,
      couponCode,
    } = body;

    // Validate required fields
    if (
      !service ||
      !plan ||
      !vehicleType ||
      !vehicleNumber ||
      !date ||
      !timeSlot
    ) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required booking fields" },
        { status: 400 }
      );
    }

    if (!VEHICLE_TYPES.includes(vehicleType as VehicleType)) {
      return NextResponse.json(
        { success: false, error: "Invalid vehicle type selected" },
        { status: 400 }
      );
    }

    const VALID_PLANS: PlanType[] = ["Basic Wash", "Premium Wash", "Full Detailing"];
    if (!VALID_PLANS.includes(plan as PlanType)) {
      return NextResponse.json(
        { success: false, error: "Invalid wash package selected" },
        { status: 400 }
      );
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment time slot selected" },
        { status: 400 }
      );
    }

    // 0. Bay Capacity Check in MySQL (Max 4 wash bays per date + time slot)
    const activeInSlot = await prisma.booking.count({
      where: {
        date,
        timeSlot,
        status: { in: ["confirmed", "in_progress", "ready"] },
      },
    });

    if (activeInSlot >= 4) {
      return NextResponse.json(
        {
          success: false,
          error: "All 4 wash bays are fully booked for this time slot. Please choose another slot.",
        },
        { status: 409 }
      );
    }

    // Fetch user details for phone & coin balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    // 1. Calculate Base Price
    const basePrice = calculatePlanPrice(
      plan as PlanType,
      vehicleType as VehicleType
    );

    let discount = 0;
    let coinsUsed = 0;

    // 2. Handle Clean Coins Loyalty Redemption (Min 50 coins; Max 50% discount)
    if (useCleanCoins && user.cleanCoins >= LOYALTY_RULES.MIN_COINS_TO_REDEEM) {
      const maxDiscountFromCoins = Math.floor(basePrice * 0.5);
      const coinsAvailableValue = calculateCoinsDiscount(user.cleanCoins);

      if (coinsAvailableValue <= maxDiscountFromCoins) {
        coinsUsed = user.cleanCoins;
        discount += coinsAvailableValue;
      } else {
        coinsUsed = Math.floor(
          maxDiscountFromCoins / LOYALTY_RULES.COIN_REDEMPTION_VALUE
        );
        discount += maxDiscountFromCoins;
      }
    }

    // 3. Handle Promo Code Validation (with per-user & total usage limits)
    let appliedPromo: { id: string; code: string } | null = null;
    if (couponCode && typeof couponCode === "string") {
      const promo = await prisma.promoCode.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (promo && promo.isActive) {
        // Expiry & min-order checks
        const notExpired = !promo.expiryDate || new Date(promo.expiryDate) >= new Date();
        if (!notExpired) {
          return NextResponse.json(
            { success: false, error: "This promo code has expired" },
            { status: 400 }
          );
        }

        const orderMeetsMin =
          !promo.minBookingAmount || basePrice >= promo.minBookingAmount;
        if (!orderMeetsMin) {
          return NextResponse.json(
            {
              success: false,
              error: `Promo requires a minimum booking amount of ₹${promo.minBookingAmount}`,
            },
            { status: 400 }
          );
        }

        // Enforce Per-User Usage Limit
        const usedByThisUser = await prisma.promoCodeUsage.count({
          where: { promoCodeId: promo.id, userId: user.id },
        });

        if (usedByThisUser >= promo.usageLimitPerUser) {
          return NextResponse.json(
            {
              success: false,
              error: `You have already used this promo code. Limit is ${promo.usageLimitPerUser} time${
                promo.usageLimitPerUser > 1 ? "s" : ""
              } per user.`,
            },
            { status: 409 }
          );
        }

        // Enforce Total Usage Limit
        if (promo.totalUsageLimit) {
          const usedTotal = await prisma.promoCodeUsage.count({
            where: { promoCodeId: promo.id },
          });
          if (usedTotal >= promo.totalUsageLimit) {
            return NextResponse.json(
              {
                success: false,
                error: "This promo code has reached its total usage limit.",
              },
              { status: 409 }
            );
          }
        }

        // Calculate discount
        if (promo.discountType === "FLAT") {
          discount += promo.discountValue;
        } else {
          discount += Math.round((basePrice * promo.discountValue) / 100);
        }
        appliedPromo = { id: promo.id, code: promo.code };
      }
    }

    const finalPrice = Math.max(basePrice - discount, 99);

    // 4. Generate Unique Sequential Booking ID: CW-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.booking.count({
      where: { bookingId: { startsWith: `CW-${currentYear}-` } },
    });
    const bookingId = `CW-${currentYear}-${String(countThisYear + 1).padStart(4, "0")}`;

    // 5. Generate QR Code Data URL
    const qrPayload = JSON.stringify({
      customer: user.name,
      vehicle: `${vehicleType} (${vehicleNumber.toUpperCase()})`,
      bookingId,
      finalPrice,
    });
    const qrCode = await QRCode.toDataURL(qrPayload, {
      margin: 2,
      width: 256,
      color: {
        dark: "#0F0F12",
        light: "#FFFFFF",
      },
    });

    // 6. Atomic Execution via Prisma Transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create Booking in MySQL
      const createdBooking = await tx.booking.create({
        data: {
          bookingId,
          userId: user.id,
          customerName: user.name,
          customerPhone: user.phone,
          customerEmail: user.email,
          service,
          plan,
          vehicleType,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          date,
          timeSlot,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          basePrice,
          coinsUsed,
          discount,
          finalPrice,
          status: "confirmed",
          qrCode,
        },
      });

      // Deduct Clean Coins if used
      if (coinsUsed > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { cleanCoins: { decrement: coinsUsed } },
        });

        await tx.coinTransaction.create({
          data: {
            userId: user.id,
            type: "redeemed",
            amount: coinsUsed,
            reason: `Discount of ₹${calculateCoinsDiscount(coinsUsed)} on booking ${createdBooking.bookingId}`,
            bookingId: createdBooking.id,
          },
        });
      }

      // Record promo code usage if applied
      if (appliedPromo) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: appliedPromo.id,
            promoCode: appliedPromo.code,
            userId: user.id,
            userName: user.name,
            bookingId: createdBooking.id,
            bookingRef: createdBooking.bookingId,
          },
        });
      }

      return createdBooking;
    });

    // 7. Auto-Trigger WhatsApp Confirmation #1
    try {
      const waResult = await sendBookingConfirmationWhatsApp({
        customerName: user.name,
        phone: user.phone,
        bookingId: booking.bookingId,
        vehicleType,
        vehicleNumber: booking.vehicleNumber,
        date,
        timeSlot,
        plan,
        finalPrice,
      });

      if (waResult.success) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { whatsappConfirmed: true },
        });
      }
    } catch (waError) {
      console.warn("WhatsApp notification error (non-fatal):", waError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking confirmed successfully",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process booking. Please try again.",
      },
      { status: 500 }
    );
  }
}
