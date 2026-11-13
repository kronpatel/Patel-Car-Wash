import {
  apiSuccess,
  apiError,
  requireAdmin,
  validateStaffInput,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getStaffWithStats, findStaffByMobile } from "@/lib/staff-helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Helper to resolve staff by cuid or staffId (EMP001)
 */
async function resolveStaff(idOrStaffId: string) {
  return prisma.staff.findFirst({
    where: {
      OR: [{ id: idOrStaffId }, { staffId: idOrStaffId.trim().toUpperCase() }],
    },
  });
}

/**
 * GET /api/admin/employees/[id]
 * id can be internal cuid OR staffId (e.g. EMP001)
 * Admin-only
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("Staff ID parameter is required", 400);
    }

    const staffWithStats = await getStaffWithStats(id);
    if (!staffWithStats) {
      return apiError("Staff not found", 404);
    }

    // Exclude password
    const { password: _, ...sanitizedStaff } = staffWithStats;

    return apiSuccess(sanitizedStaff);
  } catch (error) {
    console.error("GET /api/admin/employees/[id] error:", error);
    return apiError("Failed to fetch staff details", 500);
  }
}

/**
 * PUT /api/admin/employees/[id]
 * Updates staff details
 * Admin-only
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("Staff ID parameter is required", 400);
    }

    const staff = await resolveStaff(id);
    if (!staff) {
      return apiError("Staff not found", 404);
    }

    const body = (await req.json()) as Record<string, unknown>;

    // 1. Validate updated fields
    const validation = validateStaffInput(body, true);
    if (!validation.valid || !validation.data) {
      return apiError(validation.error || "Invalid input data", 400);
    }

    const updateData = { ...validation.data };

    // 2. Mobile duplicate check if mobile changed
    if (updateData.mobile && updateData.mobile !== staff.mobile) {
      const existing = await findStaffByMobile(updateData.mobile);
      if (existing && existing.id !== staff.id) {
        return apiError(
          "Mobile number already registered to another staff member.",
          400
        );
      }
    }

    // Perform database update
    const updatedStaff = await prisma.staff.update({
      where: { id: staff.id },
      data: updateData,
    });

    const { password: _, ...sanitizedStaff } = updatedStaff;

    return apiSuccess(sanitizedStaff, "Staff updated successfully");
  } catch (error) {
    console.error("PUT /api/admin/employees/[id] error:", error);
    return apiError("Failed to update staff record", 500);
  }
}

/**
 * DELETE /api/admin/employees/[id]
 * Soft delete staff member (sets status to INACTIVE)
 * Admin-only
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("Staff ID parameter is required", 400);
    }

    const staff = await resolveStaff(id);
    if (!staff) {
      return apiError("Staff not found", 404);
    }

    // Check pending advance balance
    const openAdvances = await prisma.advance.findMany({
      where: {
        staffId: staff.id,
        status: "OPEN",
      },
      select: { remainingBalance: true },
    });

    const totalPendingAdvance = openAdvances.reduce(
      (sum, adv) => sum + (adv.remainingBalance || 0),
      0
    );

    // Soft delete: Never hard delete; set status to INACTIVE
    await prisma.staff.update({
      where: { id: staff.id },
      data: { status: "INACTIVE" },
    });

    const warning =
      totalPendingAdvance > 0
        ? `Staff has ₹${totalPendingAdvance.toLocaleString("en-IN")} pending advance`
        : undefined;

    return apiSuccess(
      { deactivatedId: staff.id, status: "INACTIVE", warning },
      "Staff deactivated successfully"
    );
  } catch (error) {
    console.error("DELETE /api/admin/employees/[id] error:", error);
    return apiError("Failed to deactivate staff member", 500);
  }
}
