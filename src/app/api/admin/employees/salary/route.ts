import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, requireAdmin } from "@/lib/api-helpers";
import type { Prisma, PaymentMode } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/employees/salary
 * List salary records with filters: month, year, staffId, status (PAID/UNPAID), paymentMode
 * Admin-only
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const staffId = searchParams.get("staffId")?.trim() || undefined;
    const status = searchParams.get("status")?.trim()?.toUpperCase(); // "PAID", "UNPAID", "ALL"
    const paymentMode = searchParams.get("paymentMode")?.trim()?.toUpperCase() as PaymentMode | undefined;

    const whereClause: Prisma.SalaryWhereInput = {};

    if (month && !isNaN(month)) {
      whereClause.month = month;
    }

    if (year && !isNaN(year)) {
      whereClause.year = year;
    }

    if (staffId) {
      whereClause.OR = [
        { staffId: staffId },
        { staff: { staffId: staffId } },
      ];
    }

    if (status === "PAID") {
      whereClause.paymentDate = { not: null };
    } else if (status === "UNPAID") {
      whereClause.paymentDate = null;
    }

    if (paymentMode && ["CASH", "UPI", "BANK"].includes(paymentMode)) {
      whereClause.paymentMode = paymentMode;
    }

    const salaries = await prisma.salary.findMany({
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
            baseSalary: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { staff: { staffId: "asc" } }],
    });

    let totalPayout = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    const formattedSalaries = salaries.map((sal) => {
      const isPaid = Boolean(sal.paymentDate);
      totalPayout += sal.finalSalary;
      if (isPaid) {
        totalPaid += sal.finalSalary;
      } else {
        totalUnpaid += sal.finalSalary;
      }

      return {
        id: sal.id,
        staffId: sal.staffId,
        month: sal.month,
        year: sal.year,
        baseSalary: sal.baseSalary,
        presentDays: sal.presentDays,
        absentDays: sal.absentDays,
        advanceCut: sal.advanceCut,
        deduction: sal.deduction,
        bonus: sal.bonus,
        finalSalary: sal.finalSalary,
        paymentDate: sal.paymentDate ? sal.paymentDate.toISOString() : null,
        paymentMode: sal.paymentMode,
        isPaid,
        isManual: sal.isManual,
        remark: sal.remark,
        createdAt: sal.createdAt.toISOString(),
        staff: sal.staff,
      };
    });

    return apiSuccess({
      records: formattedSalaries,
      summary: {
        count: formattedSalaries.length,
        totalPayout: Math.round(totalPayout * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalUnpaid: Math.round(totalUnpaid * 100) / 100,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/employees/salary error:", error);
    return apiError("Failed to fetch salary records", 500);
  }
}
