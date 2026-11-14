import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiError, requireAdmin } from "@/lib/api-helpers";
import { calculateAutoSalary, generateSalaryRecord } from "@/lib/salary-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/employees/salary/calculate
 * Preview auto-calculated salary breakdown without saving to database
 * Query params: staffId, month, year
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId")?.trim();
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);

    if (!staffId) {
      return apiError("staffId is required", 400);
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return apiError("Valid month (1-12) is required", 400);
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return apiError("Valid 4-digit year is required", 400);
    }

    const calculation = await calculateAutoSalary(staffId, month, year);

    // Check if salary record already exists
    const existing = await prisma.salary.findUnique({
      where: {
        staffId_month_year: {
          staffId: calculation.staffId,
          month,
          year,
        },
      },
    });

    return apiSuccess({
      ...calculation,
      isAlreadyGenerated: Boolean(existing),
      existingRecord: existing,
    });
  } catch (error) {
    console.error("GET /api/admin/employees/salary/calculate error:", error);
    return apiError("Failed to calculate salary preview", 500);
  }
}

/**
 * POST /api/admin/employees/salary/calculate
 * Generate & store salary record with optional manual overrides
 * Body: { staffId, month, year, advanceCut?, bonus?, deduction?, remark?, paymentMode?, markPaid? }
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

    const { staffId, month, year, advanceCut, bonus, deduction, remark, paymentMode, markPaid } =
      body;

    if (!staffId || typeof staffId !== "string" || !staffId.trim()) {
      return apiError("staffId is required", 400);
    }

    const m = typeof month === "number" ? month : parseInt(month, 10);
    const y = typeof year === "number" ? year : parseInt(year, 10);

    if (isNaN(m) || m < 1 || m > 12) {
      return apiError("Valid month (1-12) is required", 400);
    }

    if (isNaN(y) || y < 2000 || y > 2100) {
      return apiError("Valid 4-digit year is required", 400);
    }

    // Validate financial inputs (no negative values allowed)
    const parsedBonus =
      bonus !== undefined && bonus !== null
        ? typeof bonus === "number"
          ? bonus
          : parseFloat(bonus)
        : 0;
    const parsedDeduction =
      deduction !== undefined && deduction !== null
        ? typeof deduction === "number"
          ? deduction
          : parseFloat(deduction)
        : undefined;
    const parsedAdvanceCut =
      advanceCut !== undefined && advanceCut !== null
        ? typeof advanceCut === "number"
          ? advanceCut
          : parseFloat(advanceCut)
        : 0;

    if (
      (parsedBonus !== undefined && (isNaN(parsedBonus) || parsedBonus < 0)) ||
      (parsedDeduction !== undefined && (isNaN(parsedDeduction) || parsedDeduction < 0)) ||
      (parsedAdvanceCut !== undefined && (isNaN(parsedAdvanceCut) || parsedAdvanceCut < 0))
    ) {
      return apiError("Negative values are not allowed", 400);
    }

    // Resolve staff database ID
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [{ id: staffId.trim() }, { staffId: staffId.trim() }],
      },
    });

    if (!staff) {
      return apiError("Staff member not found", 404);
    }

    // Check if salary already exists
    const existing = await prisma.salary.findUnique({
      where: {
        staffId_month_year: {
          staffId: staff.id,
          month: m,
          year: y,
        },
      },
    });

    if (existing) {
      return apiError("Salary already generated for this staff for this month", 400);
    }

    const salary = await generateSalaryRecord(staff.id, m, y, {
      advanceCut: parsedAdvanceCut,
      bonus: parsedBonus,
      deduction: parsedDeduction,
      remark: remark?.trim() || undefined,
      paymentMode: paymentMode || undefined,
      markPaid: Boolean(markPaid),
    });

    return apiCreated(salary, "Salary generated successfully");
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return apiError("Salary already generated for this staff for this month", 400);
    }
    console.error("POST /api/admin/employees/salary/calculate error:", error);
    return apiError("Failed to generate salary record", 500);
  }
}
