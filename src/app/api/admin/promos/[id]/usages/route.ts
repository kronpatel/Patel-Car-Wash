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

/**
 * GET /api/admin/promos/[id]/usages
 * Returns redemption history from MySQL for one promo code (who used it and when).
 * Admin-only.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { id } = params;
    const promo = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promo) {
      return NextResponse.json(
        { success: false, error: "Promo code not found" },
        { status: 404 }
      );
    }

    const usages = await prisma.promoCodeUsage.findMany({
      where: { promoCodeId: id },
      orderBy: { usedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      promo: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        usageLimitPerUser: promo.usageLimitPerUser,
        totalUsageLimit: promo.totalUsageLimit,
      },
      count: usages.length,
      usages,
    });
  } catch (error) {
    console.error("GET /api/admin/promos/[id]/usages error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promo code history" },
      { status: 500 }
    );
  }
}
