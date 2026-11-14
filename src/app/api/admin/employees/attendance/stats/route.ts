import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, requireAdmin } from "@/lib/api-helpers";
import { parseDateStringIST, getISTDateString } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/employees/attendance/stats
 * Attendance summary metrics for a given date
 * Query params: date (YYYY-MM-DD, default today in IST)
 * Admin-only
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || getISTDateString();
    const targetDate = parseDateStringIST(dateParam);

    // 1. Total active staff count
    const totalStaff = await prisma.staff.count({
      where: {
        status: "ACTIVE",
      },
    });

    // 2. Fetch all attendance statuses for target date
    const attendances = await prisma.attendance.findMany({
      where: {
        date: targetDate,
        staff: {
          status: "ACTIVE",
        },
      },
      select: {
        status: true,
      },
    });

    let present = 0;
    let late = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;

    for (const record of attendances) {
      switch (record.status) {
        case "PRESENT":
          present++;
          break;
        case "LATE":
          late++;
          break;
        case "ABSENT":
          absent++;
          break;
        case "HALF_DAY":
          halfDay++;
          break;
        case "LEAVE":
          leave++;
          break;
      }
    }

    // Unmarked count is total active staff minus those who have any attendance record
    const notMarked = Math.max(0, totalStaff - attendances.length);

    return apiSuccess({
      date: dateParam,
      totalStaff,
      present,
      late,
      absent,
      halfDay,
      leave,
      notMarked,
    });
  } catch (error) {
    console.error("GET /api/admin/employees/attendance/stats error:", error);
    return apiError("Failed to fetch attendance stats", 500);
  }
}
