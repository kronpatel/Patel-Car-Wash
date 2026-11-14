import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiError, requireAdmin } from "@/lib/api-helpers";
import { parseDateStringIST, getISTDateString } from "@/lib/timezone";
import type { AttendanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "LEAVE",
  "LATE",
] as const;

/**
 * GET /api/admin/employees/attendance
 * List attendance for a specific date (default: today)
 * Query params: date (YYYY-MM-DD), search (staff name/id/mobile), status (filter)
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
    const search = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status")?.trim() || "";

    const targetDate = parseDateStringIST(dateParam);

    // 1. Fetch all active staff (with optional search filter)
    const staffList = await prisma.staff.findMany({
      where: {
        status: "ACTIVE",
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { staffId: { contains: search } },
                { mobile: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ staffId: "asc" }],
      select: {
        id: true,
        staffId: true,
        name: true,
        role: true,
        photo: true,
        mobile: true,
        email: true,
      },
    });

    if (staffList.length === 0) {
      return apiSuccess([]);
    }

    // 2. Fetch existing attendances for the given date
    const attendances = await prisma.attendance.findMany({
      where: {
        date: targetDate,
        staffId: { in: staffList.map((s) => s.id) },
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.staffId, a]));

    // 3. Map staff to attendance record (or NOT_MARKED)
    let records = staffList.map((staff) => {
      const att = attendanceMap.get(staff.id);
      const status = att ? att.status : "NOT_MARKED";

      return {
        id: staff.id,
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        photo: staff.photo,
        mobile: staff.mobile,
        email: staff.email,
        status, // PRESENT, LATE, ABSENT, HALF_DAY, LEAVE, or NOT_MARKED
        inTime: att?.inTime ? att.inTime.toISOString() : null,
        outTime: att?.outTime ? att.outTime.toISOString() : null,
        method: att ? att.method : null,
        remark: att?.remark || null,
        attendanceId: att?.id || null,
      };
    });

    // 4. Filter by status if requested
    if (statusParam && statusParam.toUpperCase() !== "ALL") {
      const normalizedStatus = statusParam.toUpperCase();
      records = records.filter(
        (r) => r.status.toUpperCase() === normalizedStatus
      );
    }

    return apiSuccess(records);
  } catch (error: any) {
    console.error("GET /api/admin/employees/attendance error:", error);
    return apiError(error?.message || "Failed to fetch attendance directory", 500);
  }
}

/**
 * POST /api/admin/employees/attendance
 * Manual Attendance Mark by Admin
 * Body: { staffId: string, date: string, status: AttendanceStatus, inTime?: string, remark?: string }
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

    const { staffId, date, status, inTime, remark } = body;

    // 1. Validation
    if (!staffId || typeof staffId !== "string" || !staffId.trim()) {
      return apiError("Staff ID is required", 400);
    }

    if (!status || !VALID_ATTENDANCE_STATUSES.includes(status as AttendanceStatus)) {
      return apiError(
        `Invalid status. Must be one of: ${VALID_ATTENDANCE_STATUSES.join(", ")}`,
        400
      );
    }

    // 2. Find Staff by id or staffId (e.g. EMP001)
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [{ id: staffId.trim() }, { staffId: staffId.trim() }],
      },
    });

    if (!staff) {
      return apiError("Staff member not found", 404);
    }

    if (staff.status !== "ACTIVE") {
      return apiError("Cannot mark attendance for an inactive staff member", 400);
    }

    // 3. Resolve normalized date
    const dateStr = date && typeof date === "string" ? date.trim() : getISTDateString();
    const targetDate = parseDateStringIST(dateStr);

    // 4. Check if attendance already exists for this date
    const existing = await prisma.attendance.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: targetDate,
        },
      },
    });

    if (existing) {
      return apiError("Attendance already marked for this date", 400);
    }

    // 5. Parse In-Time if provided
    let inTimeDate: Date = new Date();
    if (inTime && typeof inTime === "string") {
      const cleanTime = inTime.trim();
      // If time format like "HH:MM" (e.g. "09:00")
      if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        const [h, m] = cleanTime.split(":").map((v) => parseInt(v, 10));
        const y = targetDate.getUTCFullYear();
        const mon = targetDate.getUTCMonth();
        const d = targetDate.getUTCDate();
        // Indian Standard Time is UTC+05:30
        inTimeDate = new Date(Date.UTC(y, mon, d, h - 5, m - 30, 0));
      } else {
        const parsed = new Date(cleanTime);
        if (!isNaN(parsed.getTime())) {
          inTimeDate = parsed;
        }
      }
    }

    // 6. Create Manual Attendance
    const attendance = await prisma.attendance.create({
      data: {
        staffId: staff.id,
        date: targetDate,
        inTime: inTimeDate,
        status: status as AttendanceStatus,
        method: "MANUAL",
        remark:
          remark && typeof remark === "string" && remark.trim()
            ? remark.trim()
            : `Manually marked by admin (${session.user.name || "Admin"})`,
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

    return apiCreated(attendance, "Attendance marked successfully");
  } catch (error: any) {
    if (error?.code === "P2002") {
      return apiError("Attendance already marked for this date", 400);
    }
    console.error("POST /api/admin/employees/attendance error:", error);
    return apiError(error?.message || "Failed to mark attendance manually", 500);
  }
}
