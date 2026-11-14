/**
 * Phase 4 - Attendance QR API & Helper Verification Test Script
 *
 * Usage:
 *   npx tsx scripts/test-qr-api.ts
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { validateQRToken } from "../src/lib/qr-helpers";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
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
  const rawCsrfCookies = csrfRes.headers.getSetCookie?.() || [csrfRes.headers.get("set-cookie") || ""];
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
    throw new Error("Login failed: Could not retrieve next-auth.session-token from server.");
  }

  const cleanCookie = sessionTokenCookie.split(";")[0];
  console.log("[Auth] Successfully logged in! Session token acquired.\n");
  return cleanCookie;
}

async function runQRTests() {
  console.log("==================================================================");
  console.log("  Phase 4: Attendance QR API & Validation Integration Tests");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  const createdTestIds: string[] = [];

  try {
    // 0. Auto authenticate
    const sessionCookie = await getAdminSessionCookie();

    // 1. Initial State: Deactivate any currently active QRs for a clean baseline test
    console.log("[Step 1] Preparing baseline state (deactivating existing active QRs)...");
    await prisma.attendanceQR.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const get1 = await fetch(`${BASE_URL}/api/admin/employees/attendance/qr`, {
      headers: { Cookie: sessionCookie },
    });
    const get1Data = await get1.json();
    console.log("-> GET baseline status:", get1.status);
    console.log("-> activeQR is null:", get1Data.data?.activeQR === null);
    if (get1.status === 200 && get1Data.data?.activeQR === null) {
      console.log("✅ [Step 1 PASS] Initial state has activeQR: null\n");
    } else {
      throw new Error("Step 1 Failed: Expected activeQR to be null");
    }

    // 2. Generate First QR: 30 days
    console.log("[Step 2] POST /api/admin/employees/attendance/qr (expiresInDays: 30)...");
    const post1 = await fetch(`${BASE_URL}/api/admin/employees/attendance/qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ expiresInDays: 30 }),
    });
    const post1Data = await post1.json();
    console.log("-> POST 1 status:", post1.status);
    console.log("-> Created QR ID:", post1Data.data?.id);
    console.log("-> Token length:", post1Data.data?.token?.length);
    console.log("-> QR Image data URL starts with:", post1Data.data?.qrImage?.slice(0, 25));

    if (
      post1.status === 201 &&
      post1Data.data?.id &&
      post1Data.data?.token &&
      post1Data.data?.qrImage?.startsWith("data:image/png;base64,")
    ) {
      createdTestIds.push(post1Data.data.id);
      console.log("✅ [Step 2 PASS] First QR (30 days) created successfully\n");
    } else {
      throw new Error("Step 2 Failed: Could not create first QR");
    }

    // 3. GET verify activeQR is present
    console.log("[Step 3] GET /api/admin/employees/attendance/qr (verify activeQR)...");
    const get2 = await fetch(`${BASE_URL}/api/admin/employees/attendance/qr`, {
      headers: { Cookie: sessionCookie },
    });
    const get2Data = await get2.json();
    console.log("-> GET 2 activeQR ID:", get2Data.data?.activeQR?.id);
    console.log("-> Days remaining:", get2Data.data?.activeQR?.daysRemaining);
    if (get2Data.data?.activeQR?.id === post1Data.data.id) {
      console.log("✅ [Step 3 PASS] activeQR accurately returned matching first QR\n");
    } else {
      throw new Error("Step 3 Failed: activeQR does not match created QR ID");
    }

    // 4. Generate Second QR: 7 days (should deactivate first QR)
    console.log("[Step 4] POST /api/admin/employees/attendance/qr (expiresInDays: 7)...");
    const post2 = await fetch(`${BASE_URL}/api/admin/employees/attendance/qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    const post2Data = await post2.json();
    console.log("-> POST 2 status:", post2.status);
    console.log("-> New QR ID:", post2Data.data?.id);
    console.log("-> Days remaining:", post2Data.data?.daysRemaining);

    if (post2.status === 201 && post2Data.data?.id) {
      createdTestIds.push(post2Data.data.id);
      console.log("✅ [Step 4 PASS] Second QR (7 days) created successfully\n");
    } else {
      throw new Error("Step 4 Failed: Could not create second QR");
    }

    // 5. GET verify history and active status
    console.log("[Step 5] GET /api/admin/employees/attendance/qr (verify history has 1 ACTIVE, 1 DEACTIVATED)...");
    const get3 = await fetch(`${BASE_URL}/api/admin/employees/attendance/qr`, {
      headers: { Cookie: sessionCookie },
    });
    const get3Data = await get3.json();
    const activeItem = get3Data.data?.activeQR;
    const historyList = get3Data.data?.history as any[];

    console.log("-> Current active token:", activeItem?.token?.slice(0, 10));
    const firstInHistory = historyList.find((h) => h.id === post1Data.data.id);
    const secondInHistory = historyList.find((h) => h.id === post2Data.data.id);

    console.log("-> First QR status in history:", firstInHistory?.status);
    console.log("-> Second QR status in history:", secondInHistory?.status);

    if (
      activeItem?.id === post2Data.data.id &&
      firstInHistory?.status === "DEACTIVATED" &&
      secondInHistory?.status === "ACTIVE"
    ) {
      console.log("✅ [Step 5 PASS] History accurately shows 1 ACTIVE and 1 DEACTIVATED QR\n");
    } else {
      throw new Error("Step 5 Failed: History statuses do not match expected states");
    }

    // 6. Test validateQRToken helper directly
    console.log("[Step 6] Testing validateQRToken() helper function directly...");
    const validateActive = await validateQRToken(post2Data.data.token);
    const validateDeactivated = await validateQRToken(post1Data.data.token);

    console.log("-> Validate active token:", validateActive.valid);
    console.log("-> Validate deactivated token:", validateDeactivated);

    if (
      validateActive.valid === true &&
      validateDeactivated.valid === false &&
      validateDeactivated.reason === "INACTIVE"
    ) {
      console.log("✅ [Step 6 PASS] validateQRToken correctly approves active QR and rejects deactivated QR\n");
    } else {
      throw new Error("Step 6 Failed: validateQRToken did not return expected validation results");
    }

    console.log("==================================================================");
    console.log("  ALL TESTS PASSED (6/6) — Phase 4 QR API 100% OPERATIONAL");
    console.log("==================================================================\n");
  } finally {
    // 7. Cleanup test records
    if (createdTestIds.length > 0) {
      console.log(`[Cleanup] Deleting ${createdTestIds.length} test QR records from DB...`);
      await prisma.attendanceQR.deleteMany({
        where: { id: { in: createdTestIds } },
      });
      console.log("[Cleanup] Test records cleaned up successfully.");
    }
    await prisma.$disconnect();
  }
}

runQRTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Test Suite Failed:", err);
    process.exit(1);
  });
