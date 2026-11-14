import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiError, requireAdmin } from "@/lib/api-helpers";
import type { Prisma, AdvanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/employees/advances
 * List advances with filters: staffId, status (OPEN/CLOSED)
 * Admin-only
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId")?.trim() || undefined;
    const statusParam = searchParams.get("status")?.trim()?.toUpperCase() as AdvanceStatus | undefined;

    const whereClause: Prisma.AdvanceWhereInput = {};

    if (staffId) {
      whereClause.OR = [
        { staffId: staffId },
        { staff: { staffId: staffId } },
      ];
    }

    if (statusParam && ["OPEN", "CLOSED"].includes(statusParam)) {
      whereClause.status = statusParam;
    }

    const advances = await prisma.advance.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            staffId: true,
            name: true,
            role: true,
            photo: true,
            mobile: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    let totalGiven = 0;
    let totalRecovered = 0;
    let totalRemaining = 0;

    for (const adv of advances) {
      totalGiven += adv.amountGiven;
      totalRecovered += adv.amountRecovered;
      totalRemaining += adv.remainingBalance;
    }

    return apiSuccess({
      records: advances,
      summary: {
        count: advances.length,
        totalGiven: Math.round(totalGiven * 100) / 100,
        totalRecovered: Math.round(totalRecovered * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/employees/advances error:", error);
    return apiError("Failed to fetch advances list", 500);
  }
}

/**
 * POST /api/admin/employees/advances
 * Grant new advance/loan to a staff member
 * Body: { staffId, amountGiven, reason?, date? }
 * Admin-only
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Request body is missing", 400);
    }

    const { staffId, amountGiven, reason, date } = body;

    if (!staffId || typeof staffId !== "string" || !staffId.trim()) {
      return apiError("Staff ID is required", 400);
    }

    const amount = typeof amountGiven === "number" ? amountGiven : parseFloat(amountGiven);
    if (isNaN(amount) || amount <= 0) {
      return apiError("Valid positive amountGiven is required", 400);
    }

    // Find staff
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [{ id: staffId.trim() }, { staffId: staffId.trim() }],
      },
    });

    if (!staff) {
      return apiError("Staff member not found", 404);
    }

    const parsedDate = date ? new Date(date) : new Date();
    const advanceDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const advance = await prisma.advance.create({
      data: {
        staffId: staff.id,
        amountGiven: Math.round(amount * 100) / 100,
        amountRecovered: 0,
        remainingBalance: Math.round(amount * 100) / 100,
        reason: reason?.trim() || null,
        date: advanceDate,
        status: "OPEN",
      },
      include: {
        staff: {
          select: {
            id: true,
            staffId: true,
            name: true,
            role: true,
            photo: true,
          },
        },
      },
    });

    return apiCreated(advance, `Advance of ₹${amount} granted to ${staff.name}`);
  } catch (error) {
    console.error("POST /api/admin/employees/advances error:", error);
    return apiError("Failed to grant advance", 500);
  }
}
