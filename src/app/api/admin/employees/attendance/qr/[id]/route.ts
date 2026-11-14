import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/admin/employees/attendance/qr/[id]
 * Deactivate an attendance QR code
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("QR ID parameter is required", 400);
    }

    const qr = await prisma.attendanceQR.findUnique({
      where: { id },
    });

    if (!qr) {
      return apiError("QR code not found", 404);
    }

    const body = await req.json().catch(() => ({}));
    if (body && typeof body.isActive !== "undefined" && body.isActive !== false) {
      return apiError("Only setting isActive to false is supported", 400);
    }

    await prisma.attendanceQR.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess(null, "QR code deactivated");
  } catch (error: any) {
    console.error("Error deactivating attendance QR:", error);
    return apiError(error?.message || "Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/employees/attendance/qr/[id]
 * Delete an inactive attendance QR code
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { id } = params;
    if (!id) {
      return apiError("QR ID parameter is required", 400);
    }

    const qr = await prisma.attendanceQR.findUnique({
      where: { id },
    });

    if (!qr) {
      return apiError("QR code not found", 404);
    }

    if (qr.isActive) {
      return apiError("Cannot delete active QR. Deactivate first.", 400);
    }

    await prisma.attendanceQR.delete({
      where: { id },
    });

    return apiSuccess(null, "QR code deleted");
  } catch (error: any) {
    console.error("Error deleting attendance QR:", error);
    return apiError(error?.message || "Internal server error", 500);
  }
}
