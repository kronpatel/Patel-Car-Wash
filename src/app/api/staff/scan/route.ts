import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-helpers";
import { validateQRToken } from "@/lib/qr-helpers";
import { isWithinShopRadius } from "@/lib/location";
import { LATE_MARK_TIME, SHOP_ATTENDANCE_RADIUS_METERS } from "@/lib/constants";
import {
  getCurrentISTTime,
  getAttendanceStatus,
  getTodayDateIST,
  formatISTTime,
} from "@/lib/timezone";
import type { AttendanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/staff/scan
 * Validate token, check GPS shop radius, authenticate staff, and mark attendance in one go
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return apiError("Request body is missing", 400);
    }

    const { token, identifier, password, latitude, longitude } = body;

    // 1. Validate required fields
    if (!token || typeof token !== "string" || !token.trim()) {
      return apiError("QR token is required", 400);
    }

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return apiError("Email or mobile identifier is required", 400);
    }

    if (!password || typeof password !== "string") {
      return apiError("Password is required", 400);
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return apiError("Valid GPS coordinates (latitude and longitude) are required", 400);
    }

    // 2. Validate QR Token
    const tokenResult = await validateQRToken(token.trim());
    if (!tokenResult.valid) {
      if (tokenResult.reason === "EXPIRED") {
        return apiError("QR Expired", 400);
      }
      return apiError("Invalid QR", 400);
    }

    // 3. Location Check: use isWithinShopRadius(lat, lng) from "@/lib/location"
    const locationCheck = isWithinShopRadius(latitude, longitude);
    if (!locationCheck.isWithin) {
      return apiError(
        `You are outside the shop area (${locationCheck.distance} meters away).`,
        400
      );
    }

    // 4. Authenticate Staff
    const rawIdentifier = identifier.trim();
    const normalizedEmail = rawIdentifier.toLowerCase();
    const cleanMobile = rawIdentifier.replace(/[\s\-\+]/g, "").replace(/^91/, "");

    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: rawIdentifier },
          { mobile: rawIdentifier },
          ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
        ],
      },
    });

    if (!staff || staff.status !== "ACTIVE") {
      return apiError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return apiError("Invalid credentials", 401);
    }

    // 5. Mark Attendance
    const todayDate = getTodayDateIST();

    // Check if attendance already exists for this staff today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: todayDate,
        },
      },
    });

    if (existingAttendance) {
      return apiError("Attendance already marked for today", 400);
    }

    // Determine status (PRESENT vs LATE) using IST timezone
    const now = new Date();
    const { totalMinutes: currentMinutes } = getCurrentISTTime(now);
    const status: AttendanceStatus = getAttendanceStatus(currentMinutes, LATE_MARK_TIME);
    const isLate = status === "LATE";
    const timeStr = formatISTTime(now);

    const attendance = await prisma.attendance.create({
      data: {
        staffId: staff.id,
        date: todayDate,
        inTime: new Date(),
        status,
        method: "QR",
        latitude,
        longitude,
        remark: isLate
          ? `Late punch-in via QR at ${timeStr} (${locationCheck.distance}m from shop)`
          : `Punched in via QR at ${timeStr} (${locationCheck.distance}m from shop)`,
      },
    });

    // 6. Return Success payload
    return apiSuccess(
      {
        staff: {
          id: staff.id,
          name: staff.name,
          staffId: staff.staffId,
          role: staff.role,
          email: staff.email,
          mobile: staff.mobile,
        },
        attendance: {
          id: attendance.id,
          date: attendance.date,
          inTime: attendance.inTime,
          status: attendance.status,
          distanceMeters: locationCheck.distance,
          remark: attendance.remark,
        },
      },
      isLate
        ? "Attendance marked as LATE (punched after 09:30 AM)"
        : "Attendance marked successfully! Have a great shift."
    );
  } catch (error: any) {
    console.error("Error in /api/staff/scan:", error);
    return apiError(error?.message || "Internal server error", 500);
  }
}
