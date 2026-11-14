/**
 * Task 4: Test Script — scripts/test-fake-gps.ts
 *
 * Verifies Mock GPS / Fake Location Detection on POST /api/staff/scan:
 * 1. Valid Token + Valid Staff + Valid Location (accuracy: 10m) -> Expect 200 OK (Attendance marked).
 * 2. Valid Token + Valid Staff + Fake Accuracy (accuracy: 0m) -> Expect 400 Bad Request ("Fake GPS detected").
 * 3. Valid Token + Valid Staff + Poor Accuracy (accuracy: 150m) -> Expect 400 Bad Request ("GPS accuracy is too low").
 * 4. Test Cleanup: Delete test attendance record & reset rate limiter.
 *
 * Usage:
 *   npx tsx scripts/test-fake-gps.ts
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../src/lib/prisma";
import { SHOP_LOCATION } from "../src/lib/constants";
import { resetRateLimit } from "../src/lib/rate-limiter";

const BASE_URL = process.env.BASE_URL || "https://localhost:3002";

let testsPassed = 0;
let testsTotal = 0;

function assert(condition: boolean, message: string) {
  testsTotal++;
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  testsPassed++;
  console.log(`  ✅ [PASS] ${message}`);
}

async function isServerRunning(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

async function runFakeGPSTests() {
  console.log("\n=======================================================");
  console.log(" 🛰️  PHASE 8.3 — TASK 4: MOCK GPS API VERIFICATION");
  console.log("=======================================================");
  console.log(` Target Server: ${BASE_URL}\n`);

  const serverOnline = await isServerRunning(BASE_URL);
  if (!serverOnline) {
    console.error(`❌ Server is not reachable at ${BASE_URL}.`);
    console.error(`👉 Please start the Next.js server first: 'npm run dev'`);
    process.exit(1);
  }

  let createdTestQRId: string | null = null;
  let createdAttendanceId: string | null = null;
  let activeToken = "";
  let staffIdentifier = "";
  let staffPassword = "";
  let testStaffId = "";

  try {
    // ─── Setup 1: Resolve or Create an Active QR Token ───
    console.log("[Setup] Checking active attendance QR token in database...");
    const existingQR = await prisma.attendanceQR.findFirst({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingQR) {
      activeToken = existingQR.token;
      console.log(`[Setup] Using existing active QR token: ${activeToken.substring(0, 10)}...`);
    } else {
      const generatedToken = crypto.randomBytes(16).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newQR = await prisma.attendanceQR.create({
        data: {
          token: generatedToken,
          expiresAt: expiry,
          expiresIn: 1,
          isActive: true,
        },
      });
      activeToken = newQR.token;
      createdTestQRId = newQR.id;
      console.log(`[Setup] Created temporary test QR token: ${activeToken}`);
    }

    // ─── Setup 2: Resolve Valid Staff Credentials ───
    console.log("[Setup] Finding an active staff member...");
    let staff = await prisma.staff.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ mobile: "7878241818" }, { email: "rajeshpatel@gmail.com" }],
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

    testStaffId = staff.id;
    staffIdentifier = staff.mobile || staff.email;

    // Check whether password matches default admin password or mobile number
    const isCleanProMatch = await bcrypt.compare("CleanProAdmin@2024!", staff.password);
    const isMobileMatch = await bcrypt.compare(staff.mobile, staff.password);

    if (isCleanProMatch) {
      staffPassword = "CleanProAdmin@2024!";
    } else if (isMobileMatch) {
      staffPassword = staff.mobile;
    } else {
      // Fallback: temporarily set known password for test
      const hashed = await bcrypt.hash("CleanProAdmin@2024!", 10);
      await prisma.staff.update({
        where: { id: staff.id },
        data: { password: hashed },
      });
      staffPassword = "CleanProAdmin@2024!";
    }

    console.log(`[Setup] Using staff: ${staff.name} (${staffIdentifier})\n`);

    // ─── Setup 3: Pre-Test Cleanup (Clean today's attendance & reset rate limits) ───
    const istString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayDate = new Date(`${istString}T00:00:00.000Z`);

    await prisma.attendance.deleteMany({
      where: {
        staffId: testStaffId,
        date: todayDate,
      },
    });

    // Reset rate limiter keys for 127.0.0.1
    resetRateLimit("rate:127.0.0.1:/api/staff/scan");
    resetRateLimit("api:staff-scan:127.0.0.1");

    // ─── Test 1: Valid Token + Valid Staff + Valid Location (accuracy: 10m) ───
    console.log("--- Test 1: Valid Location (accuracy: 10m) -> Expect 200 OK ---");
    const test1Res = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: staffIdentifier,
        password: staffPassword,
        latitude: SHOP_LOCATION.latitude,
        longitude: SHOP_LOCATION.longitude,
        accuracy: 10,
      }),
    });

    const test1Data = await test1Res.json();
    console.log(`  Response Status: ${test1Res.status} (${test1Res.statusText})`);
    console.log(`  Response Body:`, test1Data);

    assert(test1Res.status === 200, "Valid location with accuracy: 10m returned HTTP 200 OK");
    assert(test1Data.success === true, "Attendance API responded with success: true");

    if (test1Data.data?.attendance?.id) {
      createdAttendanceId = test1Data.data.attendance.id;
    }

    // ─── Test 2: Valid Token + Valid Staff + Fake Accuracy (accuracy: 0m) ───
    console.log("\n--- Test 2: Fake Accuracy (accuracy: 0) -> Expect 400 Bad Request ---");
    const test2Res = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: staffIdentifier,
        password: staffPassword,
        latitude: SHOP_LOCATION.latitude,
        longitude: SHOP_LOCATION.longitude,
        accuracy: 0,
      }),
    });

    const test2Data = await test2Res.json();
    console.log(`  Response Status: ${test2Res.status} (${test2Res.statusText})`);
    console.log(`  Response Body:`, test2Data);

    assert(test2Res.status === 400, "Fake accuracy (0m) returned HTTP 400 Bad Request");
    assert(test2Data.success === false, "API rejected request with success: false");
    assert(
      typeof test2Data.error === "string" && test2Data.error.includes("Fake GPS detected"),
      `Error message correctly identifies 'Fake GPS detected' (got: "${test2Data.error}")`
    );

    // ─── Test 3: Valid Token + Valid Staff + Poor Accuracy (accuracy: 150m) ───
    console.log("\n--- Test 3: Poor Accuracy (accuracy: 150m) -> Expect 400 Bad Request ---");
    const test3Res = await fetch(`${BASE_URL}/api/staff/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        identifier: staffIdentifier,
        password: staffPassword,
        latitude: SHOP_LOCATION.latitude,
        longitude: SHOP_LOCATION.longitude,
        accuracy: 150,
      }),
    });

    const test3Data = await test3Res.json();
    console.log(`  Response Status: ${test3Res.status} (${test3Res.statusText})`);
    console.log(`  Response Body:`, test3Data);

    assert(test3Res.status === 400, "Poor accuracy (150m) returned HTTP 400 Bad Request");
    assert(test3Data.success === false, "API rejected request with success: false");
    assert(
      typeof test3Data.error === "string" && test3Data.error.includes("GPS accuracy is too low"),
      `Error message correctly identifies 'GPS accuracy is too low' (got: "${test3Data.error}")`
    );

    console.log("\n=======================================================");
    console.log(` 🎉 ALL TESTS PASSED: ${testsPassed}/${testsTotal} passed successfully!`);
    console.log("=======================================================\n");
  } catch (err: any) {
    console.error("\n❌ Test execution failed with error:", err?.message || err);
    throw err;
  } finally {
    // ─── 4. Test Cleanup ───
    console.log("[Cleanup] Cleaning up test artifacts...");

    if (createdAttendanceId) {
      await prisma.attendance.deleteMany({
        where: { id: createdAttendanceId },
      });
      console.log(`  🧹 Deleted created test attendance record (ID: ${createdAttendanceId})`);
    } else if (testStaffId) {
      const istString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const todayDate = new Date(`${istString}T00:00:00.000Z`);
      await prisma.attendance.deleteMany({
        where: { staffId: testStaffId, date: todayDate },
      });
      console.log(`  🧹 Cleaned today's attendance for staff: ${testStaffId}`);
    }

    if (createdTestQRId) {
      await prisma.attendanceQR.delete({
        where: { id: createdTestQRId },
      });
      console.log(`  🧹 Deleted temporary test QR token (ID: ${createdTestQRId})`);
    }

    resetRateLimit("rate:127.0.0.1:/api/staff/scan");
    resetRateLimit("api:staff-scan:127.0.0.1");

    await prisma.$disconnect();
    console.log("  🧹 Prisma disconnected & rate limiters reset.\n");
  }
}

runFakeGPSTests().catch(() => {
  process.exit(1);
});
