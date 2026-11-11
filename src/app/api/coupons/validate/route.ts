import { NextResponse } from "next/server";
import { findCouponByCode } from "@/lib/jsonDb";

/**
 * POST /api/coupons/validate
 * Validates promo coupon codes for booking discounts from JSON DB.
 */
export async function POST(req: Request) {
  try {
    const { code, orderAmount } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a coupon code" },
        { status: 400 }
      );
    }

    const coupon = findCouponByCode(code);

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // Check expiration
    if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
      return NextResponse.json(
        { success: false, error: "This coupon code has expired" },
        { status: 400 }
      );
    }

    const amount = Number(orderAmount) || 0;

    // Check minimum order value
    if (coupon.minOrderValue && amount < coupon.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          error: `Coupon requires a minimum booking amount of ₹${coupon.minOrderValue}`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountAmount && coupon.discountAmount > 0) {
      discount = coupon.discountAmount;
    } else if (coupon.discountPercent && coupon.discountPercent > 0) {
      discount = Math.round((amount * coupon.discountPercent) / 100);
    }

    const discountedTotal = Math.max(amount - discount, 99);

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discount,
      discountedTotal,
      message: `Coupon applied! ₹${discount} off.`,
    });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
