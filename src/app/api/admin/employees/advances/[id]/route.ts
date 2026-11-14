import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, requireAdmin } from "@/lib/api-helpers";
import type { AdvanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/employees/advances/[id]
 * Update advance record: amountRecovered, reason, status
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
      return apiError("Advance ID is required", 400);
    }

    const advance = await prisma.advance.findUnique({
      where: { id },
    });

    if (!advance) {
      return apiError("Advance record not found", 404);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Request body is missing", 400);
    }

    const { amountRecovered, reason, status } = body;
    const updateData: any = {};

    if (amountRecovered !== undefined && amountRecovered !== null) {
      const recovered = Math.max(0, typeof amountRecovered === "number" ? amountRecovered : parseFloat(amountRecovered) || 0);
      const remaining = Math.max(0, Math.round((advance.amountGiven - recovered) * 100) / 100);

      updateData.amountRecovered = recovered;
      updateData.remainingBalance = remaining;
      updateData.status = remaining <= 0 ? "CLOSED" : status || "OPEN";
    } else if (status) {
      if (["OPEN", "CLOSED"].includes(status.toUpperCase())) {
        updateData.status = status.toUpperCase() as AdvanceStatus;
        if (updateData.status === "CLOSED" && advance.remainingBalance > 0) {
          updateData.amountRecovered = advance.amountGiven;
          updateData.remainingBalance = 0;
        }
      }
    }

    if (reason !== undefined) {
      updateData.reason = reason ? reason.trim() : null;
    }

    const updated = await prisma.advance.update({
      where: { id },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            staffId: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return apiSuccess(updated, "Advance record updated successfully");
  } catch (error: any) {
    console.error("PUT /api/admin/employees/advances/[id] error:", error);
    return apiError(error?.message || "Failed to update advance record", 500);
  }
}

/**
 * DELETE /api/admin/employees/advances/[id]
 * Delete advance record
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
      return apiError("Advance ID is required", 400);
    }

    await prisma.advance.delete({
      where: { id },
    });

    return apiSuccess({ deletedId: id }, "Advance record deleted successfully");
  } catch (error: any) {
    console.error("DELETE /api/admin/employees/advances/[id] error:", error);
    return apiError(error?.message || "Failed to delete advance record", 500);
  }
}
