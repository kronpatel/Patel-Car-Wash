import { NextRequest } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-helpers";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";
import { validateQRToken } from "@/lib/qr-helpers";
import { isWithinShopRadius, isSuspiciousLocation } from "@/lib/location";
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

    const { token, identifier, password, latitude, longitude, accuracy } = body;

    // 0. Double-Layer Anti Brute-Force Rate Limiting (5 attempts per 15 min per IP)
    const headerList = headers();
    const forwarded = headerList.get("x-forwarded-for") || req.headers.get("x-forwarded-for");
    const clientIp = (forwarded ? forwarded.split(",")[0].trim() : null) || req.ip || "127.0.0.1";
    const rateKey = `api:staff-scan:${clientIp}`;
    const rateLimit = checkRateLimit(rateKey, 5, 15 * 60 * 1000);

    if (!rateLimit.success) {
      const minutes = Math.max(1, Math.ceil(rateLimit.retryAfter / 60));
      return apiError(
        `Too many punch-in attempts. Please try again after ${minutes} minutes.`,
        429
      );
    }

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

    // Step 1: Validate accuracy (must be a valid number)
    if (typeof accuracy !== "number" || isNaN(accuracy)) {
      return apiError("Valid GPS accuracy value is required", 400);
    }

    // Step 2: Fake GPS / Mock Location Detection Check
    const suspiciousCheck = isSuspiciousLocation(accuracy);
    if (suspiciousCheck.isSuspicious) {
      return apiError(
        suspiciousCheck.reason || "Suspicious GPS location detected. Please turn off mock location apps.",
        400
      );
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

    // Reset rate limit on successful credentials match
    resetRateLimit(rateKey);

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
  } catch (error) {
    console.error("Error in /api/staff/scan:", error);
    return apiError("Internal server error. Please try again.", 500);
  }
}
