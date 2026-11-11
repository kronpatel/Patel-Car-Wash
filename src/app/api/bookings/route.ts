import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import {
  getBookings,
  countBookingsInSlot,
  findUserById,
  updateUser,
  createBooking,
  deleteBooking,
  findCouponByCode,
  createCoinTransaction,
  updateBooking,
} from "@/lib/jsonDb";
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

    const filter: { userId?: string; status?: string; date?: string } = {};

    if (session.user.role === "admin") {
      if (status) filter.status = status;
      if (date) filter.date = date;
    } else {
      // Customers only access their own bookings
      filter.userId = session.user.id;
    }

    const bookings = getBookings(filter);

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
 * - Creates a new booking in local JSON DB
 * - Requires customer authentication
 * - Calculates flat pricing for basic wash or tiered pricing for detailing
 * - Handles Clean Coins redemption & coupon discounts
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

    // 0. Bay Capacity Check (Max 4 wash bays per date + time slot)
    const activeInSlot = countBookingsInSlot(date, timeSlot);

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
    const user = findUserById(session.user.id);
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

    // 3. Handle Promo Coupon Validation
    if (couponCode && typeof couponCode === "string") {
      const coupon = findCouponByCode(couponCode);

      if (coupon && coupon.isActive) {
        const notExpired = !coupon.validUntil || new Date() <= new Date(coupon.validUntil);
        const orderMeetsMin = !coupon.minOrderValue || basePrice >= coupon.minOrderValue;

        if (notExpired && orderMeetsMin) {
          if (coupon.discountAmount && coupon.discountAmount > 0) {
            discount += coupon.discountAmount;
          } else if (coupon.discountPercent && coupon.discountPercent > 0) {
            const percentOff = Math.round(
              (basePrice * coupon.discountPercent) / 100
            );
            discount += percentOff;
          }
        }
      }
    }

    const finalPrice = Math.max(basePrice - discount, 99);

    // 4. Generate QR Code Data URL placeholder
    const qrPayload = JSON.stringify({
      customer: user.name,
      vehicle: `${vehicleType} (${vehicleNumber.toUpperCase()})`,
      plan,
      date,
      timeSlot,
      amountDue: finalPrice,
    });
    const qrCode = await QRCode.toDataURL(qrPayload, {
      margin: 2,
      width: 256,
      color: {
        dark: "#0F0F12",
        light: "#FFFFFF",
      },
    });

    // 5. Create Booking in JSON DB
    const booking = createBooking({
      userId: user.id || user._id,
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email,
      service,
      plan,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      date,
      timeSlot,
      address: address?.trim() || "",
      notes: notes?.trim() || "",
      basePrice,
      coinsUsed,
      discount,
      finalPrice,
      status: "confirmed",
      qrCode,
    });

    // 6. Deduct Clean Coins if used
    if (coinsUsed > 0) {
      const freshUser = findUserById(user.id || user._id);
      if (!freshUser || freshUser.cleanCoins < coinsUsed) {
        deleteBooking(booking.id);
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient Clean Coins balance. Please refresh and try again.",
          },
          { status: 400 }
        );
      }

      updateUser(freshUser.id || freshUser._id, {
        cleanCoins: Math.max(0, freshUser.cleanCoins - coinsUsed),
      });

      createCoinTransaction({
        userId: freshUser.id || freshUser._id,
        type: "redeemed",
        amount: coinsUsed,
        reason: `Discount of ₹${calculateCoinsDiscount(coinsUsed)} on booking ${booking.bookingId}`,
        bookingId: booking.id || booking._id,
      });
    }

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
        updateBooking(booking.id, {
          whatsappSent: {
            ...booking.whatsappSent,
            bookingConfirmed: true,
          },
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
