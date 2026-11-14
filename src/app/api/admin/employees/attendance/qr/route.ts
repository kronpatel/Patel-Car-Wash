import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiError, requireAdmin } from "@/lib/api-helpers";
import {
  generateQRToken,
  generateQRDataURL,
  buildScanURL,
  calculateExpiry,
  getActiveQR,
  deactivateExpiredQRs,
} from "@/lib/qr-helpers";

function getDaysRemaining(expiresAt: Date): number {
  const diffMs = expiresAt.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getQRStatus(item: {
  isActive: boolean;
  expiresAt: Date;
}): "ACTIVE" | "EXPIRED" | "DEACTIVATED" {
  if (item.expiresAt < new Date()) {
    return "EXPIRED";
  }
  if (!item.isActive) {
    return "DEACTIVATED";
  }
  return "ACTIVE";
}

/**
 * GET /api/admin/employees/attendance/qr
 * Fetch currently active QR details with Data URL and historical records
 */
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    // Clean up any overdue active QRs first
    await deactivateExpiredQRs();

    const [active, history] = await Promise.all([
      getActiveQR(),
      prisma.attendanceQR.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let activeQR = null;
    if (active) {
      const [qrImage, scanURL] = await Promise.all([
        generateQRDataURL(active.token),
        Promise.resolve(buildScanURL(active.token)),
      ]);

      activeQR = {
        id: active.id,
        token: active.token,
        expiresAt: active.expiresAt,
        expiresIn: active.expiresIn,
        createdAt: active.createdAt,
        qrImage,
        scanURL,
        daysRemaining: getDaysRemaining(active.expiresAt),
      };
    }

    const formattedHistory = history.map((item) => ({
      id: item.id,
      token: item.token,
      isActive: item.isActive,
      expiresAt: item.expiresAt,
      expiresIn: item.expiresIn,
      createdAt: item.createdAt,
      status: getQRStatus(item),
    }));

    return apiSuccess({
      activeQR,
      history: formattedHistory,
    });
  } catch (error: any) {
    console.error("Error fetching attendance QR:", error);
    return apiError(error?.message || "Internal server error", 500);
  }
}

/**
 * POST /api/admin/employees/attendance/qr
 * Generate a new attendance QR token and deactivate previous ones
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const body = await req.json().catch(() => null);
    const expiresInDays = Number(body?.expiresInDays);

    if (
      !body ||
      typeof expiresInDays !== "number" ||
      isNaN(expiresInDays) ||
      !Number.isInteger(expiresInDays) ||
      expiresInDays < 1 ||
      expiresInDays > 365
    ) {
      return apiError(
        "Invalid expiresInDays. Must be an integer between 1 and 365.",
        400
      );
    }

    // 1. Auto-deactivate expired QRs
    await deactivateExpiredQRs();

    // 2. Deactivate all currently active QRs
    await prisma.attendanceQR.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // 3. Generate new unique token (verify no collision)
    let token = generateQRToken();
    let collision = await prisma.attendanceQR.findUnique({ where: { token } });
    while (collision) {
      token = generateQRToken();
      collision = await prisma.attendanceQR.findUnique({ where: { token } });
    }

    // 4. Calculate expiresAt
    const expiresAt = calculateExpiry(expiresInDays);

    // 5. Create new AttendanceQR record
    const newQR = await prisma.attendanceQR.create({
      data: {
        token,
        isActive: true,
        expiresAt,
        expiresIn: expiresInDays,
        createdBy: session.user.id,
      },
    });

    // 6. Generate QR image and scanURL
    const [qrImage, scanURL] = await Promise.all([
      generateQRDataURL(newQR.token),
      Promise.resolve(buildScanURL(newQR.token)),
    ]);

    return apiCreated(
      {
        ...newQR,
        qrImage,
        scanURL,
        daysRemaining: expiresInDays,
      },
      "QR code generated successfully"
    );
  } catch (error: any) {
    console.error("Error generating attendance QR:", error);
    return apiError(error?.message || "Internal server error", 500);
  }
}
