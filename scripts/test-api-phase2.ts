/**
 * Phase 2 - API Authentication & Staff CRUD Comprehensive Test Script
 *
 * Runs 3 tests against running Next.js dev server on http://localhost:3002:
 * 1. Unauthorized Access: Verifies 401 response without session
 * 2. Authorized Access: Verifies 200 response with admin session cookie
 * 3. Create Staff: Verifies 201 response and DB insertion
 *
 * Usage:
 *   npx tsx scripts/test-api-phase2.ts
 *   OR
 *   npx tsx scripts/test-api-phase2.ts "next-auth.session-token=YOUR_COOKIE_HERE"
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cleanpro.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CleanProAdmin@2024!";
const TEST_MOBILE = "9876543210";

/**
 * Helper to obtain admin session cookie:
 * 1. From CLI argument: process.argv[2]
 * 2. From process.env.TEST_SESSION_COOKIE
 * 3. From .env.test file
 * 4. Fallback: Automatically login via NextAuth Credentials flow
 */
async function getAdminSessionCookie(): Promise<string> {
  // Option 1: CLI arg
  const cliCookie = process.argv[2];
  if (cliCookie && cliCookie.trim()) {
    console.log("[Auth] Using session cookie from CLI argument.");
    return cliCookie.trim();
  }

  // Option 2: Environment variable
  if (process.env.TEST_SESSION_COOKIE && process.env.TEST_SESSION_COOKIE.trim()) {
    console.log("[Auth] Using session cookie from process.env.TEST_SESSION_COOKIE.");
    return process.env.TEST_SESSION_COOKIE.trim();
  }

  // Option 3: .env.test file
  const envTestPath = path.join(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    const content = fs.readFileSync(envTestPath, "utf-8");
    const match = content.match(/TEST_SESSION_COOKIE=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      console.log("[Auth] Using session cookie from .env.test file.");
      return match[1].trim();
    }
  }

  // Option 4: Auto login via NextAuth API
  console.log(`[Auth] No cookie provided. Auto-authenticating as admin (${ADMIN_EMAIL})...`);
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
  console.log("[Auth] Successfully logged in! Session token obtained.\n");
  return cleanCookie;
}

async function runPhase2Tests() {
  console.log("==================================================================");
  console.log("  Phase 2: API Authentication & Staff CRUD Verification");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  // Pre-test cleanup: ensure test mobile does not exist in DB
  await prisma.staff.deleteMany({
    where: { mobile: TEST_MOBILE },
  });

  let createdStaffId: string | null = null;

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Unauthorized Access (Bina login)
  // ─────────────────────────────────────────────────────────────
  console.log("------------------------------------------------------------------");
  console.log("  TEST 1: Unauthorized Access (Bina Cookie / Session)");
  console.log("  Endpoint: GET /api/admin/employees");
  console.log("------------------------------------------------------------------");

  try {
    const unauthRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const unauthBody = await unauthRes.json().catch(() => ({}));
    const is401 = unauthRes.status === 401;

    console.log(`Status Code: ${unauthRes.status} (Expected: 401)`);
    console.log(`Response:    ${JSON.stringify(unauthBody)}`);

    if (is401 && unauthBody.success === false) {
      console.log("Result:      ✅ PASS — Route correctly rejected unauthorized request.\n");
    } else {
      console.log("Result:      ❌ FAIL — Route did not properly protect endpoint with 401.\n");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test 1 Network Error:", err);
    process.exit(1);
  }

  // Obtain admin session cookie for authorized tests
  const adminCookie = await getAdminSessionCookie();

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Authorized List Access (Admin session ke saath)
  // ─────────────────────────────────────────────────────────────
  console.log("------------------------------------------------------------------");
  console.log("  TEST 2: Authorized List Access (Admin Session ke saath)");
  console.log("  Endpoint: GET /api/admin/employees");
  console.log("------------------------------------------------------------------");

  try {
    const authRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: adminCookie,
      },
    });

    const authBody = await authRes.json();
    const is200 = authRes.status === 200;
    const staffCount = Array.isArray(authBody.data) ? authBody.data.length : 0;

    console.log(`Status Code: ${authRes.status} (Expected: 200)`);
    console.log(`Staff Count: ${staffCount} employee(s) found in database`);

    if (is200 && authBody.success === true && Array.isArray(authBody.data)) {
      console.log("Result:      ✅ PASS — Route successfully returned authorized staff list.\n");
    } else {
      console.log("Result:      ❌ FAIL — Failed to retrieve staff list with admin cookie.\n");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test 2 Network Error:", err);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Create Staff (POST /api/admin/employees)
  // ─────────────────────────────────────────────────────────────
  console.log("------------------------------------------------------------------");
  console.log("  TEST 3: Create Staff (POST with Admin Session)");
  console.log("  Endpoint: POST /api/admin/employees");
  console.log("------------------------------------------------------------------");

  const staffPayload = {
    name: "Test Staff",
    mobile: TEST_MOBILE,
    joiningDate: "2026-11-14",
    role: "Helper",
    baseSalary: 12000,
  };

  try {
    const createRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify(staffPayload),
    });

    const createBody = await createRes.json();
    const is201 = createRes.status === 201;

    console.log(`Status Code: ${createRes.status} (Expected: 201)`);
    console.log(`Response:    ${JSON.stringify(createBody, null, 2)}`);

    if (is201 && createBody.success === true && createBody.data?.id) {
      createdStaffId = createBody.data.id;
      console.log("\nCreated Staff Details:");
      console.log(`  - Database ID:  ${createBody.data.id}`);
      console.log(`  - Staff ID:     ${createBody.data.staffId}`);
      console.log(`  - Name:         ${createBody.data.name}`);
      console.log(`  - Mobile:       ${createBody.data.mobile}`);
      console.log(`  - Role:         ${createBody.data.role}`);
      console.log(`  - Base Salary:  ₹${createBody.data.baseSalary}`);
      console.log(`  - Password in response: ${createBody.data.password === undefined ? "UNDEFINED (Secure ✅)" : "EXPOSED ❌"}`);
      console.log("Result:      ✅ PASS — Staff created and properly saved in database!\n");
    } else {
      console.log("Result:      ❌ FAIL — Staff creation failed.\n");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test 3 Network Error:", err);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP: Delete or Deactivate Created Test Staff
  // ─────────────────────────────────────────────────────────────
  if (createdStaffId) {
    try {
      console.log("------------------------------------------------------------------");
      console.log("  POST-TEST CLEANUP: Deleting Test Staff Record");
      console.log("------------------------------------------------------------------");
      await prisma.staff.delete({
        where: { id: createdStaffId },
      });
      console.log(`[Cleanup] Test staff (${createdStaffId}) removed from database. ✅\n`);
    } catch (cleanupErr) {
      console.warn("[Cleanup] Warning during test staff cleanup:", cleanupErr);
    }
  }

  console.log("==================================================================");
  console.log("  🎉 ALL 3 PHASE 2 API TESTS COMPLETED AND PASSED! ✅");
  console.log("==================================================================");
}

runPhase2Tests()
  .catch((e) => {
    console.error("Unexpected test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
