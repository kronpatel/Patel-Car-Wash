import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, requireAdmin } from "@/lib/api-helpers";
import type { PaymentMode } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/employees/salary/[id]
 * Update salary record: Mark as paid, update paymentMode, bonus, deduction, or remark
 * Admin-only
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("Salary ID is required", 400);
    }

    const salary = await prisma.salary.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!salary) {
      return apiError("Salary record not found", 404);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Request body is missing", 400);
    }

    const {
      markPaid,
      unmarkPaid,
      paymentMode,
      paymentDate,
      bonus,
      deduction,
      advanceCut,
      remark,
    } = body;

    const updateData: any = {};

    // 1. Mark as Paid or Unmarked
    if (unmarkPaid === true) {
      updateData.paymentDate = null;
      updateData.paymentMode = null;
    } else if (markPaid === true || paymentMode) {
      const mode = (paymentMode || salary.paymentMode || "CASH").toUpperCase();
      if (!["CASH", "UPI", "BANK"].includes(mode)) {
        return apiError("Invalid paymentMode. Must be CASH, UPI, or BANK.", 400);
      }
      updateData.paymentMode = mode as PaymentMode;
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    }

    // 2. Adjust financial values if provided
    let newBonus = salary.bonus;
    let newDeduction = salary.deduction;
    let newAdvanceCut = salary.advanceCut;
    let isFinancialChanged = false;

    if (bonus !== undefined && bonus !== null) {
      newBonus = Math.max(0, typeof bonus === "number" ? bonus : parseFloat(bonus) || 0);
      updateData.bonus = newBonus;
      isFinancialChanged = true;
    }

    if (deduction !== undefined && deduction !== null) {
      newDeduction = Math.max(0, typeof deduction === "number" ? deduction : parseFloat(deduction) || 0);
      updateData.deduction = newDeduction;
      isFinancialChanged = true;
    }

    if (advanceCut !== undefined && advanceCut !== null) {
      newAdvanceCut = Math.max(0, typeof advanceCut === "number" ? advanceCut : parseFloat(advanceCut) || 0);
      updateData.advanceCut = newAdvanceCut;
      isFinancialChanged = true;
    }

    if (isFinancialChanged) {
      updateData.finalSalary = Math.max(
        0,
        Math.round((salary.baseSalary - newDeduction - newAdvanceCut + newBonus) * 100) / 100
      );
      updateData.isManual = true;
    }

    if (remark !== undefined) {
      updateData.remark = remark ? remark.trim() : null;
    }

    const updated = await prisma.salary.update({
      where: { id },
      data: updateData,
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
    });

    return apiSuccess(updated, "Salary record updated successfully");
  } catch (error: any) {
    console.error("PUT /api/admin/employees/salary/[id] error:", error);
    return apiError(error?.message || "Failed to update salary record", 500);
  }
}

/**
 * DELETE /api/admin/employees/salary/[id]
 * Delete salary record (only allowed if unpaid)
 * Admin-only
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("Salary ID is required", 400);
    }

    const salary = await prisma.salary.findUnique({
      where: { id },
    });

    if (!salary) {
      return apiError("Salary record not found", 404);
    }

    if (salary.paymentDate !== null) {
      return apiError(
        "Cannot delete a paid salary record. Please unmark paid first.",
        400
      );
    }

    await prisma.salary.delete({
      where: { id },
    });

    return apiSuccess({ deletedId: id }, "Salary record deleted successfully");
  } catch (error: any) {
    console.error("DELETE /api/admin/employees/salary/[id] error:", error);
    return apiError(error?.message || "Failed to delete salary record", 500);
  }
}
