import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/coupons/validate
 * Validates a promo code against an order amount and the logged-in user's
 * redemption history in MySQL. Enforces per-user and total usage limits.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Please log in to apply a promo code" },
        { status: 401 }
      );
    }

    const { code, orderAmount } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a promo code" },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive promo code" },
        { status: 404 }
      );
    }

    // Check expiration
    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: "This promo code has expired" },
        { status: 400 }
      );
    }

    const amount = Number(orderAmount) || 0;

    // Check minimum order value
    if (promo.minBookingAmount && amount < promo.minBookingAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Promo requires a minimum booking amount of ₹${promo.minBookingAmount}`,
        },
        { status: 400 }
      );
    }

    // ── THE FIX: per-user usage limit ──
    const usedByThisUser = await prisma.promoCodeUsage.count({
      where: { promoCodeId: promo.id, userId: session.user.id },
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

    // ── Total usage limit across all users (optional) ──
    if (promo.totalUsageLimit) {
      const usedTotal = await prisma.promoCodeUsage.count({
        where: { promoCodeId: promo.id },
      });
      if (usedTotal >= promo.totalUsageLimit) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This promo code has reached its total usage limit and is no longer available.",
          },
          { status: 409 }
        );
      }
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "FLAT") {
      discount = promo.discountValue;
    } else {
      discount = Math.round((amount * promo.discountValue) / 100);
    }

    const discountedTotal = Math.max(amount - discount, 99);

    return NextResponse.json({
      success: true,
      code: promo.code,
      discount,
      discountedTotal,
      message: `Promo applied! ₹${discount} off.`,
    });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
