import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

function getPromoCodeStatus(promo: { isActive: boolean; expiryDate: Date }): "active" | "expired" | "inactive" {
  if (!promo.isActive) return "inactive";
  if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) return "expired";
  return "active";
}

/**
 * PATCH /api/admin/promos/[id]
 * Updates an existing promo code in MySQL.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promo code not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data: any = {};

    if (body.code !== undefined) {
      const normalized = String(body.code).trim().toUpperCase();
      if (!normalized) {
        return NextResponse.json(
          { success: false, error: "Promo code cannot be empty" },
          { status: 400 }
        );
      }
      const collision = await prisma.promoCode.findUnique({
        where: { code: normalized },
      });
      if (collision && collision.id !== id) {
        return NextResponse.json(
          { success: false, error: `Promo code "${normalized}" is already in use` },
          { status: 409 }
        );
      }
      data.code = normalized;
    }

    if (body.discountType !== undefined) {
      if (body.discountType !== "FLAT" && body.discountType !== "PERCENTAGE") {
        return NextResponse.json(
          { success: false, error: "Discount type must be FLAT or PERCENTAGE" },
          { status: 400 }
        );
      }
      data.discountType = body.discountType;
    }

    if (body.discountValue !== undefined) {
      const val = Number(body.discountValue);
      if (isNaN(val) || val <= 0) {
        return NextResponse.json(
          { success: false, error: "Discount value must be positive" },
          { status: 400 }
        );
      }
      data.discountValue = val;
    }

    if (body.minBookingAmount !== undefined) {
      data.minBookingAmount =
        body.minBookingAmount === null || body.minBookingAmount === ""
          ? null
          : Number(body.minBookingAmount);
    }

    if (body.expiryDate !== undefined) {
      if (isNaN(new Date(body.expiryDate).getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid expiry date" },
          { status: 400 }
        );
      }
      data.expiryDate = new Date(body.expiryDate);
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (body.usageLimitPerUser !== undefined) {
      const limit = Number(body.usageLimitPerUser);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { success: false, error: "Usage limit per user must be at least 1" },
          { status: 400 }
        );
      }
      data.usageLimitPerUser = Math.floor(limit);
    }

    if (body.totalUsageLimit !== undefined) {
      data.totalUsageLimit =
        body.totalUsageLimit === null || body.totalUsageLimit === ""
          ? null
          : Math.floor(Number(body.totalUsageLimit));
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data,
      include: {
        _count: { select: { usages: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Promo code "${updated.code}" updated`,
      promo: {
        ...updated,
        usedCount: updated._count.usages,
        computedStatus: getPromoCodeStatus(updated),
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/promos/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promos/[id]
 * Deletes a promo code from MySQL.
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promo code not found" },
        { status: 404 }
      );
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Promo code "${existing.code}" deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/promos/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
