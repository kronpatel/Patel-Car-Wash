import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  findPromoCodeById,
  findPromoCodeByCode,
  updatePromoCode,
  deletePromoCode,
  countPromoUsageTotal,
  getPromoCodeStatus,
} from "@/lib/jsonDb";
import { DiscountType } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/admin/promos/[id]
 * Updates an existing promo code.
 * Allows updating code, discount, limits, expiry, and active status.
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
    const existing = findPromoCodeById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promo code not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.code !== undefined) {
      const normalized = String(body.code).trim().toUpperCase();
      if (!normalized) {
        return NextResponse.json(
          { success: false, error: "Promo code cannot be empty" },
          { status: 400 }
        );
      }
      // Check if new code conflicts with another promo
      const collision = findPromoCodeByCode(normalized);
      if (collision && collision.id !== id) {
        return NextResponse.json(
          { success: false, error: `Promo code "${normalized}" is already in use` },
          { status: 409 }
        );
      }
      updates.code = normalized;
    }

    if (body.discountType !== undefined) {
      if (body.discountType !== "FLAT" && body.discountType !== "PERCENTAGE") {
        return NextResponse.json(
          { success: false, error: "Discount type must be FLAT or PERCENTAGE" },
          { status: 400 }
        );
      }
      updates.discountType = body.discountType as DiscountType;
    }

    if (body.discountValue !== undefined) {
      const val = Number(body.discountValue);
      if (isNaN(val) || val <= 0) {
        return NextResponse.json(
          { success: false, error: "Discount value must be positive" },
          { status: 400 }
        );
      }
      updates.discountValue = val;
    }

    if (body.minBookingAmount !== undefined) {
      updates.minBookingAmount =
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
      updates.expiryDate = new Date(body.expiryDate).toISOString();
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (body.usageLimitPerUser !== undefined) {
      const limit = Number(body.usageLimitPerUser);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { success: false, error: "Usage limit per user must be at least 1" },
          { status: 400 }
        );
      }
      updates.usageLimitPerUser = Math.floor(limit);
    }

    if (body.totalUsageLimit !== undefined) {
      updates.totalUsageLimit =
        body.totalUsageLimit === null || body.totalUsageLimit === ""
          ? null
          : Math.floor(Number(body.totalUsageLimit));
    }

    const updated = updatePromoCode(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update promo code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Promo code "${updated.code}" updated`,
      promo: {
        ...updated,
        usedCount: countPromoUsageTotal(updated.id),
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
 * Deletes a promo code. Keeps usage history intact for records.
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
    const existing = findPromoCodeById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promo code not found" },
        { status: 404 }
      );
    }

    const deleted = deletePromoCode(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete promo code" },
        { status: 500 }
      );
    }

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
