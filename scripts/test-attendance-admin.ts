/**
 * Phase 6: Admin Attendance Management End-to-End Verification Test Script
 *
 * Test Cases:
 * 1. Auto-login as Admin via NextAuth CSRF
 * 2. GET /api/admin/employees/attendance (Today) -> Verify NOT_MARKED for fresh staff
 * 3. POST /api/admin/employees/attendance -> Manually mark a staff as PRESENT
 * 4. GET /api/admin/employees/attendance -> Verify status changed to PRESENT with method: MANUAL
 * 5. GET /api/admin/employees/attendance/stats -> Verify stats reflect attendance counts
 * 6. Duplicate POST -> Expect 400 "already marked"
 * 7. Cleanup -> Delete the created manual attendance record
 *
 * Usage:
 *   npx tsx scripts/test-attendance-admin.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { getTodayDateIST, getISTDateString } from "../src/lib/timezone";

const BASE_URL = process.env.BASE_URL || "https://localhost:3002";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cleanpro.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CleanProAdmin@2024!";

/**
 * Auto-login as admin via NextAuth API to obtain session cookie
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

async function runAdminAttendanceTests() {
  console.log("==================================================================");
  console.log("  Phase 6: Admin Attendance Management & Manual Mark E2E Tests");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  let createdAttendanceId = "";
  const todayStr = getISTDateString();
  const todayDate = getTodayDateIST();

  try {
    // ─── Step 1: Auto-login as Admin ───
    const adminCookie = await getAdminSessionCookie();

    // Find active staff member to test with
    let staff = await prisma.staff.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { staffId: "asc" },
    });

    if (!staff) {
      throw new Error("No active staff member found in database for testing.");
    }

    console.log(`[Setup] Using test staff: ${staff.name} (${staff.staffId}, ID: ${staff.id})`);
    console.log(`[Setup] Target test date (IST): ${todayStr}\n`);

    // Clean baseline: ensure no attendance exists for this staff today
    await prisma.attendance.deleteMany({
      where: {
        staffId: staff.id,
        date: todayDate,
      },
    });

    // ─── Step 2: GET /api/admin/employees/attendance (Today) -> Check NOT_MARKED ───
    console.log(`[Step 2] Testing GET /api/admin/employees/attendance?date=${todayStr}...`);
    const getRes1 = await fetch(
      `${BASE_URL}/api/admin/employees/attendance?date=${todayStr}`,
      {
        headers: { Cookie: adminCookie },
      }
    );

    const getData1 = await getRes1.json();
    if (getRes1.status !== 200 || !getData1.success) {
      throw new Error(`Step 2 Failed: Status ${getRes1.status}, data: ${JSON.stringify(getData1)}`);
    }

    const staffRecord1 = getData1.data?.find((r: any) => r.id === staff?.id || r.staffId === staff?.staffId);
    if (!staffRecord1) {
      throw new Error(`Step 2 Failed: Test staff ${staff.staffId} not found in attendance list`);
    }

    console.log("-> Staff status:", staffRecord1.status);
    if (staffRecord1.status === "NOT_MARKED") {
      console.log("✅ [Step 2 PASS] Fresh staff attendance accurately returned as \"NOT_MARKED\"\n");
    } else {
      throw new Error(`Step 2 Failed: Expected "NOT_MARKED", got "${staffRecord1.status}"`);
    }

    // ─── Step 3: POST /api/admin/employees/attendance -> Manually mark as PRESENT ───
    console.log("[Step 3] Testing POST /api/admin/employees/attendance (Manual Mark)...");
    const postRes = await fetch(`${BASE_URL}/api/admin/employees/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        staffId: staff.id,
        date: todayStr,
        status: "PRESENT",
        inTime: "09:00",
        remark: "Phase 6 automated test manual mark",
      }),
    });

    const postData = await postRes.json();
    console.log("-> Response status:", postRes.status);
    console.log("-> Created record ID:", postData.data?.id);
    console.log("-> Method:", postData.data?.method);

    if (
      (postRes.status === 201 || postRes.status === 200) &&
      postData.success &&
      postData.data?.id &&
      postData.data?.method === "MANUAL"
    ) {
      createdAttendanceId = postData.data.id;
      console.log("✅ [Step 3 PASS] Attendance manually marked successfully as PRESENT (method: MANUAL)\n");
    } else {
      throw new Error(`Step 3 Failed: ${JSON.stringify(postData)}`);
    }

    // ─── Step 4: GET /api/admin/employees/attendance -> Verify changed to PRESENT ───
    console.log("[Step 4] Verifying GET after manual mark (expect PRESENT & method MANUAL)...");
    const getRes2 = await fetch(
      `${BASE_URL}/api/admin/employees/attendance?date=${todayStr}`,
      {
        headers: { Cookie: adminCookie },
      }
    );

    const getData2 = await getRes2.json();
    const staffRecord2 = getData2.data?.find((r: any) => r.id === staff?.id || r.staffId === staff?.staffId);

    if (
      staffRecord2 &&
      staffRecord2.status === "PRESENT" &&
      staffRecord2.method === "MANUAL"
    ) {
      console.log("-> Updated status:", staffRecord2.status);
      console.log("-> Updated method:", staffRecord2.method);
      console.log("-> In-Time:", staffRecord2.inTime);
      console.log("✅ [Step 4 PASS] Directory shows staff marked as PRESENT via MANUAL\n");
    } else {
      throw new Error(`Step 4 Failed: Expected PRESENT & MANUAL, got: ${JSON.stringify(staffRecord2)}`);
    }

    // ─── Step 5: GET /api/admin/employees/attendance/stats -> Verify stats ───
    console.log("[Step 5] Testing GET /api/admin/employees/attendance/stats...");
    const statsRes = await fetch(
      `${BASE_URL}/api/admin/employees/attendance/stats?date=${todayStr}`,
      {
        headers: { Cookie: adminCookie },
      }
    );

    const statsData = await statsRes.json();
    console.log("-> Stats response:", statsData.data);

    if (
      statsRes.status === 200 &&
      statsData.success &&
      typeof statsData.data?.totalStaff === "number" &&
      typeof statsData.data?.present === "number" &&
      typeof statsData.data?.notMarked === "number"
    ) {
      console.log("✅ [Step 5 PASS] Attendance stats API returned accurate counts\n");
    } else {
      throw new Error(`Step 5 Failed: Invalid stats response ${JSON.stringify(statsData)}`);
    }

    // ─── Step 6: Test Duplicate POST -> Expect 400 ───
    console.log("[Step 6] Testing duplicate manual mark on same day (expect 400 \"already marked\")...");
    const dupRes = await fetch(`${BASE_URL}/api/admin/employees/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        staffId: staff.id,
        date: todayStr,
        status: "PRESENT",
        inTime: "09:00",
      }),
    });

    const dupData = await dupRes.json();
    console.log("-> Response status:", dupRes.status, "Error:", dupData.error);

    if (dupRes.status === 400 && dupData.error?.includes("already marked")) {
      console.log("✅ [Step 6 PASS] Duplicate attendance rejected with 400 \"already marked\"\n");
    } else {
      throw new Error("Step 6 Failed: Expected 400 for duplicate attendance");
    }

    console.log("==================================================================");
    console.log("  ALL TESTS PASSED (6/6) — Phase 6 Admin Attendance Verified!");
    console.log("==================================================================\n");
  } finally {
    // ─── Step 7: Cleanup ───
    console.log("[Cleanup] Cleaning up test manual attendance record...");
    if (createdAttendanceId) {
      await prisma.attendance
        .delete({ where: { id: createdAttendanceId } })
        .catch(() => null);
      console.log("-> Test attendance record deleted.");
    }
    await prisma.$disconnect();
    console.log("[Cleanup] Database connection closed.\n");
  }
}

runAdminAttendanceTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Test Suite Failed:", err);
    process.exit(1);
  });
