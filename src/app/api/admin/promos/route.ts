import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getPromoCodeStatus(promo: { isActive: boolean; expiryDate: Date }): "active" | "expired" | "inactive" {
  if (!promo.isActive) return "inactive";
  if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) return "expired";
  return "active";
}

/**
 * GET /api/admin/promos
 * Lists all promo codes from MySQL enriched with usage count and computed status.
 * Admin-only.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const rawPromos = await prisma.promoCode.findMany({
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const promos = rawPromos.map((p) => ({
      ...p,
      usedCount: p._count.usages,
      computedStatus: getPromoCodeStatus(p),
    }));

    return NextResponse.json({
      success: true,
      count: promos.length,
      promos,
    });
  } catch (error) {
    console.error("GET /api/admin/promos error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promos
 * Creates a new promo code in MySQL via Prisma.
 * Admin-only.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      minBookingAmount,
      expiryDate,
      isActive = true,
      usageLimitPerUser = 1,
      totalUsageLimit,
    } = body;

    // Validation
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "Promo code is required" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check uniqueness
    const existing = await prisma.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Promo code "${normalizedCode}" already exists` },
        { status: 409 }
      );
    }

    if (discountType !== "FLAT" && discountType !== "PERCENTAGE") {
      return NextResponse.json(
        { success: false, error: "Discount type must be FLAT or PERCENTAGE" },
        { status: 400 }
      );
    }

    const numDiscount = Number(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      return NextResponse.json(
        { success: false, error: "Discount value must be a positive number" },
        { status: 400 }
      );
    }

    if (discountType === "PERCENTAGE" && numDiscount > 100) {
      return NextResponse.json(
        { success: false, error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
      return NextResponse.json(
        { success: false, error: "Valid expiry date is required" },
        { status: 400 }
      );
    }

    const numUsageLimit = Number(usageLimitPerUser);
    if (isNaN(numUsageLimit) || numUsageLimit < 1) {
      return NextResponse.json(
        { success: false, error: "Usage limit per user must be at least 1" },
        { status: 400 }
      );
    }

    const created = await prisma.promoCode.create({
      data: {
        code: normalizedCode,
        discountType: discountType as "FLAT" | "PERCENTAGE",
        discountValue: numDiscount,
        minBookingAmount:
          minBookingAmount !== undefined && minBookingAmount !== null && minBookingAmount !== ""
            ? Number(minBookingAmount)
            : null,
        expiryDate: new Date(expiryDate),
        isActive: Boolean(isActive),
        usageLimitPerUser: Math.floor(numUsageLimit),
        totalUsageLimit:
          totalUsageLimit !== undefined && totalUsageLimit !== null && totalUsageLimit !== ""
            ? Math.floor(Number(totalUsageLimit))
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Promo code "${created.code}" created successfully`,
        promo: {
          ...created,
          usedCount: 0,
          computedStatus: getPromoCodeStatus(created),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/promos error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}
