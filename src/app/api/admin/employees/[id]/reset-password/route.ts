import { apiSuccess, apiError, requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/staff-helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/employees/[id]/reset-password
 * Resets staff password back to their mobile number
 * Admin-only
 */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("Staff ID parameter is required", 400);
    }

    // Resolve staff by cuid or staffId (EMP001)
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [{ id }, { staffId: id.trim().toUpperCase() }],
      },
    });

    if (!staff) {
      return apiError("Staff not found", 404);
    }

    // Default password = clean 10-digit mobile number
    const cleanMobile = staff.mobile
      .replace(/[\s\-()]/g, "")
      .replace(/^(\+91|91)/, "");

    const hashedPassword = await hashPassword(cleanMobile);

    await prisma.staff.update({
      where: { id: staff.id },
      data: { password: hashedPassword },
    });

    return apiSuccess(
      null,
      "Password reset to mobile number successfully"
    );
  } catch (error) {
    console.error("POST /api/admin/employees/[id]/reset-password error:", error);
    return apiError("Failed to reset staff password", 500);
  }
}
