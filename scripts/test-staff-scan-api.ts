/**
 * Task 5: Test Script — scripts/test-staff-scan-api.ts
 *
 * Test Cases:
 * 1. Auto-login as admin -> Generate QR (30 days) -> Get token
 * 2. Valid token + valid staff + valid location (shop center) -> 200 OK, attendance created
 * 3. Invalid token -> 400 "Invalid QR"
 * 4. Out-of-range location (500m away) -> 400 "outside the shop area"
 * 5. Wrong password -> 401
 * 6. Duplicate (same staff, same day, second call) -> 400 "already marked"
 * 7. Cleanup: Delete test attendance + QR
 *
 * Usage:
 *   npx tsx scripts/test-staff-scan-api.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { STUDIO_COORDINATES } from "../src/lib/constants";
import { getDistanceInMeters } from "../src/lib/location";

const BASE_URL = process.env.BASE_URL || "https://localhost:3002";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cleanpro.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CleanProAdmin@2024!";

// Default staff fallback credentials
const STAFF_IDENTIFIER = "7878241818";
const STAFF_PASSWORD = "CleanProAdmin@2024!";

/**
 * Auto-login as admin via NextAuth API to obtain session cookie
 * (matches scripts/test-qr-api.ts pattern)
 */
async function getAdminSessionCookie(): Promise<string> {
  const cliCookie = process.argv[2];
  if (cliCookie && cliCookie.trim()) {
    console.log("[Auth] Using session cookie from CLI argument.");
    return cliCookie.trim();
  }

  if (process.env.TEST_SESSION_COOKIE && process.env.TEST_SESSION_COOKIE.trim()) {
    console.log("[Auth] Using session cookie from process.env.TEST_SESSION_COOKIE.");
    return process.env.TEST_SESSION_COOKIE.trim();
  }

  const envTestPath = path.join(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    const content = fs.readFileSync(envTestPath, "utf-8");
    const match = content.match(/TEST_SESSION_COOKIE=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      console.log("[Auth] Using session cookie from .env.test file.");
      return match[1].trim();
    }
  }

  console.log(`[Auth] Auto-authenticating as admin (${ADMIN_EMAIL})...`);
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!csrfRes.ok) {
    throw new Error(`Failed to fetch CSRF token from ${BASE_URL}/api/auth/csrf`);
  }

  const csrfData = (await csrfRes.json()) as { csrfToken: string };
  const rawCsrfCookies =
    csrfRes.headers.getSetCookie?.() || [csrfRes.headers.get("set-cookie") || ""];
  const csrfCookieHeader = rawCsrfCookies.map((c) => c.split(";")[0]).join("; ");

  const loginParams = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    redirect: "false",
    json: "true",
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials?`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookieHeader,
    },
    body: loginParams.toString(),
  });

  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const sessionTokenCookie = setCookies.find((c) => c.includes("next-auth.session-token"));

  if (!sessionTokenCookie) {
    throw new Error("Admin login failed: Could not retrieve next-auth.session-token from server.");
  }

  const cleanCookie = sessionTokenCookie.split(";")[0];
  console.log("[Auth] Successfully logged in! Admin session token acquired.\n");
  return cleanCookie;
}

async function runStaffScanTests() {
  console.log("==================================================================");
  console.log("  Task 5: Staff Scan & Attendance API End-to-End Tests");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  let generatedQRId = "";
  let activeToken = "";
  let createdAttendanceId = "";

  try {
    // ─── Case 1: Auto-login as admin → Generate QR (30 days) → Get token ───
    console.log("[Case 1] Auto-login as admin -> Generate QR (30 days) -> Get token...");
    const adminCookie = await getAdminSessionCookie();

    const qrRes = await fetch(`${BASE_URL}/api/admin/employees/attendance/qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ expiresInDays: 30 }),
    });

    const qrData = await qrRes.json();
    if (qrRes.status !== 201 || !qrData.data?.token || !qrData.data?.id) {
      throw new Error(`Failed to generate QR: ${JSON.stringify(qrData)}`);
    }

    generatedQRId = qrData.data.id;
    activeToken = qrData.data.token;
    console.log("✅ [Case 1 PASS] Generated Attendance QR via Admin API:");
    console.log("   QR ID:", generatedQRId);
    console.log("   Token:", activeToken);
    console.log("   Scan URL:", qrData.data.scanURL);

    // ─── Resolve Valid Staff & Clean Today's Attendance Baseline ───
    let staff = await prisma.staff.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ mobile: STAFF_IDENTIFIER }, { email: STAFF_IDENTIFIER }],
      },
    });

    if (!staff) {
      staff = await prisma.staff.findFirst({
        where: { status: "ACTIVE" },
      });
    }

    if (!staff) {
      throw new Error("No active staff member found in database for testing.");
    }

    // Determine correct password for staff
    let validStaffPassword = STAFF_PASSWORD;
    const isDefaultAdminMatch = await bcrypt.compare(STAFF_PASSWORD, staff.password);
    if (!isDefaultAdminMatch) {
      const isMobileMatch = await bcrypt.compare(staff.mobile, staff.password);
      if (isMobileMatch) {
        validStaffPassword = staff.mobile;
      }
    }

    const testStaffIdentifier = staff.mobile || staff.email;

    // Ensure clean state: delete today's attendance for this staff if exists
    const istString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayDate = new Date(`${istString}T00:00:00.000Z`);

    await prisma.attendance.deleteMany({
      where: {
        staffId: staff.id,
        date: todayDate,
      },
    });

    // ─── Case 2: Valid token + valid staff + valid location (shop center) → 200 OK, attendance created ───
    console.log("\n[Case 2] Valid token + valid staff + valid location (shop center) -> Expect 200 OK...");
    const punchRes = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: testStaffIdentifier,
        password: validStaffPassword,
        latitude: STUDIO_COORDINATES.lat,
        longitude: STUDIO_COORDINATES.lng,
        accuracy: 12,
      }),
    });

    let punchData = await punchRes.json();

    // If password mismatch, fallback retry with mobile
    if (punchRes.status === 401 && validStaffPassword !== staff.mobile) {
      validStaffPassword = staff.mobile;
      const retryRes = await fetch(`${BASE_URL}/api/staff/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: activeToken,
          identifier: testStaffIdentifier,
          password: validStaffPassword,
          latitude: STUDIO_COORDINATES.lat,
          longitude: STUDIO_COORDINATES.lng,
          accuracy: 12,
        }),
      });
      punchData = await retryRes.json();
    }

    if (punchRes.status !== 200 && !punchData.success) {
      throw new Error(`Case 2 Failed: Attendance not marked. ${JSON.stringify(punchData)}`);
    }

    createdAttendanceId = punchData.data?.attendance?.id;
    console.log("✅ [Case 2 PASS] Attendance marked successfully (200 OK)!");
    console.log("   Attendance ID:", createdAttendanceId);
    console.log("   Staff:", `${punchData.data?.staff?.name} (${punchData.data?.staff?.staffId})`);
    console.log("   Punch Status:", punchData.data?.attendance?.status);
    console.log("   Distance from shop:", punchData.data?.attendance?.distanceMeters, "meters");

    // ─── Case 3: Invalid token → 400 "Invalid QR" ───
    console.log("\n[Case 3] Invalid token -> Expect 400 \"Invalid QR\"...");
    const resInvalidToken = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "invalid-token-0000000000000000",
        identifier: testStaffIdentifier,
        password: validStaffPassword,
        latitude: STUDIO_COORDINATES.lat,
        longitude: STUDIO_COORDINATES.lng,
        accuracy: 12,
      }),
    });
    const dataInvalidToken = await resInvalidToken.json();
    console.log("-> Response status:", resInvalidToken.status, "Error:", dataInvalidToken.error);

    if (
      resInvalidToken.status === 400 &&
      dataInvalidToken.success === false &&
      dataInvalidToken.error?.includes("Invalid QR")
    ) {
      console.log("✅ [Case 3 PASS] Invalid token rejected with 400 \"Invalid QR\"");
    } else {
      throw new Error("Case 3 Failed: Expected 400 \"Invalid QR\" for invalid token");
    }

    // ─── Case 4: Out-of-range location (500m away) → 400 "outside the shop area" ───
    console.log("\n[Case 4] Out-of-range location (500m away) -> Expect 400 \"outside the shop area\"...");
    // Offset latitude by ~0.005 degrees (~555m away)
    const farLat = STUDIO_COORDINATES.lat + 0.005;
    const farLng = STUDIO_COORDINATES.lng;
    const computedDistance = getDistanceInMeters(
      STUDIO_COORDINATES.lat,
      STUDIO_COORDINATES.lng,
      farLat,
      farLng
    );
    console.log(`   Simulating punch at ~${computedDistance}m away from studio...`);

    const resFar = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: testStaffIdentifier,
        password: validStaffPassword,
        latitude: farLat,
        longitude: farLng,
        accuracy: 12,
      }),
    });
    const dataFar = await resFar.json();
    console.log("-> Response status:", resFar.status, "Error:", dataFar.error);

    if (resFar.status === 400 && dataFar.error?.includes("outside the shop area")) {
      console.log("✅ [Case 4 PASS] Out-of-range location rejected with 400 \"outside the shop area\"");
    } else {
      throw new Error("Case 4 Failed: Expected 400 \"outside the shop area\" for out-of-range location");
    }

    // ─── Case 5: Wrong password → 401 ───
    console.log("\n[Case 5] Wrong password -> Expect 401...");
    const resWrongPass = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: testStaffIdentifier,
        password: "incorrect_password_wrong_123",
        latitude: STUDIO_COORDINATES.lat,
        longitude: STUDIO_COORDINATES.lng,
        accuracy: 12,
      }),
    });
    const dataWrongPass = await resWrongPass.json();
    console.log("-> Response status:", resWrongPass.status, "Error:", dataWrongPass.error);

    if (resWrongPass.status === 401 && dataWrongPass.success === false) {
      console.log("✅ [Case 5 PASS] Wrong password rejected with 401 Unauthorized");
    } else {
      throw new Error("Case 5 Failed: Expected 401 for wrong password");
    }

    // ─── Case 6: Duplicate (same staff, same day, second call) → 400 "already marked" ───
    console.log("\n[Case 6] Duplicate (same staff, same day, second call) -> Expect 400 \"already marked\"...");
    const resDuplicate = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: testStaffIdentifier,
        password: validStaffPassword,
        latitude: STUDIO_COORDINATES.lat,
        longitude: STUDIO_COORDINATES.lng,
        accuracy: 12,
      }),
    });
    const dataDuplicate = await resDuplicate.json();
    console.log("-> Response status:", resDuplicate.status, "Error:", dataDuplicate.error);

    if (resDuplicate.status === 400 && dataDuplicate.error?.includes("already marked")) {
      console.log("✅ [Case 6 PASS] Duplicate attendance punch blocked with 400 \"already marked\"");
    } else {
      throw new Error("Case 6 Failed: Expected duplicate attendance block with \"already marked\"");
    }

    console.log("\n==================================================================");
    console.log("  ALL TESTS PASSED (6/6) — Phase 5 Test Cases Verified!");
    console.log("==================================================================\n");
  } finally {
    // ─── Case 7: Cleanup: Delete test attendance + QR ───
    console.log("[Cleanup] Case 7: Cleaning up test records from database...");
    if (createdAttendanceId) {
      await prisma.attendance
        .delete({ where: { id: createdAttendanceId } })
        .catch(() => null);
      console.log("-> Test attendance record deleted.");
    }

    if (generatedQRId) {
      await prisma.attendanceQR
        .delete({ where: { id: generatedQRId } })
        .catch(() => null);
      console.log("-> Generated test QR code deleted.");
    }
    await prisma.$disconnect();
    console.log("[Cleanup] Database connection closed.\n");
  }
}

runStaffScanTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Test Suite Failed:", err);
    process.exit(1);
  });
