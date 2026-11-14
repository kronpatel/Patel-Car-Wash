process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/**
 * Phase 7: Salary, Advance Tracker & Reports End-to-End Test Script
 *
 * Test Cases:
 * 1. Auto-login as Admin via NextAuth CSRF
 * 2. Generate salary for a staff member -> Verify math & creation
 * 3. Duplicate salary generation for same month/year -> Expect 400
 * 4. Issue Advance -> Generate Salary with Advance Cut -> Verify Advance balance reduced
 * 5. Mark Salary as Paid (UPI) -> Verify paymentDate & paymentMode
 * 6. Attempt delete on paid salary -> Expect 400
 * 7. Unmark paid -> Delete salary -> Expect 200
 * 8. Cleanup -> Delete all test advances and salaries
 *
 * Usage:
 *   npx tsx scripts/test-salary-api.ts
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

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

async function runSalaryTests() {
  console.log("==================================================================");
  console.log("  Phase 7: Salary, Advance Tracker & Reports E2E Verification");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  const createdSalaryIds: string[] = [];
  const createdAdvanceIds: string[] = [];

  const testYear = 2026;
  const testMonth1 = 1;
  const testMonth2 = 2;

  try {
    const adminCookie = await getAdminSessionCookie();

    // 1. Resolve test staff
    const staff = await prisma.staff.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { staffId: "asc" },
    });

    if (!staff) {
      throw new Error("No active staff member found in database for testing.");
    }

    console.log(`[Setup] Using test staff: ${staff.name} (${staff.staffId}, Base: ₹${staff.baseSalary})`);

    // Clean any existing test records for test staff in test periods
    await prisma.salary.deleteMany({
      where: {
        staffId: staff.id,
        year: testYear,
        month: { in: [testMonth1, testMonth2] },
      },
    });

    // ─── Test 1: Generate Salary (Check calculation) ───
    console.log(`\n[Test 1] Testing Salary Generation for Month ${testMonth1}/${testYear}...`);
    const genRes1 = await fetch(`${BASE_URL}/api/admin/employees/salary/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        staffId: staff.id,
        month: testMonth1,
        year: testYear,
        bonus: 1000,
        deduction: 500,
        remark: "Test 1 salary generation",
      }),
    });

    const genData1 = await genRes1.json();
    console.log("-> Response status:", genRes1.status);
    console.log("-> Created Salary ID:", genData1.data?.id);
    console.log("-> Final Salary:", genData1.data?.finalSalary);

    if (genRes1.status === 201 && genData1.success && genData1.data?.id) {
      createdSalaryIds.push(genData1.data.id);
      const expectedFinal = Math.max(0, staff.baseSalary - 500 + 1000);
      if (Math.abs(genData1.data.finalSalary - expectedFinal) < 1) {
        console.log(`✅ [Test 1 PASS] Salary math accurate (Base ₹${staff.baseSalary} - Ded ₹500 + Bonus ₹1000 = ₹${expectedFinal})`);
      } else {
        throw new Error(`Test 1 Failed: Expected final salary ₹${expectedFinal}, got ₹${genData1.data.finalSalary}`);
      }
    } else {
      throw new Error(`Test 1 Failed: ${JSON.stringify(genData1)}`);
    }

    // ─── Test 2: Duplicate Salary Generation -> Expect 400 ───
    console.log(`\n[Test 2] Testing Duplicate Salary Generation for Month ${testMonth1}/${testYear} (Expect 400)...`);
    const dupRes = await fetch(`${BASE_URL}/api/admin/employees/salary/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        staffId: staff.id,
        month: testMonth1,
        year: testYear,
      }),
    });

    const dupData = await dupRes.json();
    console.log("-> Response status:", dupRes.status, "Error:", dupData.error);
    if (dupRes.status === 400 && dupData.error?.includes("already generated")) {
      console.log("✅ [Test 2 PASS] Duplicate salary rejected with 400 \"already generated\"");
    } else {
      throw new Error("Test 2 Failed: Expected 400 for duplicate salary");
    }

    // ─── Test 3: Issue Advance -> Generate Salary with Advance Cut -> Verify Balance Reduced ───
    console.log("\n[Test 3] Testing Advance Issue & Auto-Recovery in Salary...");
    const advanceAmount = 4000;
    const advanceCutAmount = 1500;

    const advRes = await fetch(`${BASE_URL}/api/admin/employees/advances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        staffId: staff.id,
        amountGiven: advanceAmount,
        reason: "Test Festival Advance",
      }),
    });

    const advData = await advRes.json();
    console.log("-> Created Advance ID:", advData.data?.id);
    console.log("-> Amount Given:", advData.data?.amountGiven);

    if (!advData.data?.id) {
      throw new Error(`Test 3 Failed: Could not create advance: ${JSON.stringify(advData)}`);
    }
    createdAdvanceIds.push(advData.data.id);

    // Now generate Month 2 salary with advanceCut = 1500
    console.log(`   Generating Month ${testMonth2} salary with Advance Cut = ₹${advanceCutAmount}...`);
    const genRes2 = await fetch(`${BASE_URL}/api/admin/employees/salary/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        staffId: staff.id,
        month: testMonth2,
        year: testYear,
        advanceCut: advanceCutAmount,
      }),
    });

    const genData2 = await genRes2.json();
    if (genRes2.status !== 201 || !genData2.data?.id) {
      throw new Error(`Test 3 Failed to generate salary: ${JSON.stringify(genData2)}`);
    }
    createdSalaryIds.push(genData2.data.id);

    // Verify the Advance record remaining balance in database
    const updatedAdv = await prisma.advance.findUnique({
      where: { id: advData.data.id },
    });

    console.log("-> Advance amount recovered:", updatedAdv?.amountRecovered);
    console.log("-> Advance remaining balance:", updatedAdv?.remainingBalance);

    if (
      updatedAdv &&
      updatedAdv.amountRecovered === advanceCutAmount &&
      updatedAdv.remainingBalance === advanceAmount - advanceCutAmount
    ) {
      console.log(`✅ [Test 3 PASS] Advance recovered accurately! (Remaining: ₹${updatedAdv.remainingBalance})`);
    } else {
      throw new Error(`Test 3 Failed: Advance balance not reduced correctly: ${JSON.stringify(updatedAdv)}`);
    }

    // ─── Test 4: Mark Salary as Paid -> Check Status ───
    console.log("\n[Test 4] Testing Mark Salary as Paid (via UPI)...");
    const payRes = await fetch(`${BASE_URL}/api/admin/employees/salary/${genData1.data.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        markPaid: true,
        paymentMode: "UPI",
      }),
    });

    const payData = await payRes.json();
    console.log("-> Payment Mode:", payData.data?.paymentMode);
    console.log("-> Payment Date:", payData.data?.paymentDate);

    if (
      payRes.status === 200 &&
      payData.data?.paymentMode === "UPI" &&
      payData.data?.paymentDate !== null
    ) {
      console.log("✅ [Test 4 PASS] Salary marked as PAID via UPI");
    } else {
      throw new Error(`Test 4 Failed: ${JSON.stringify(payData)}`);
    }

    // ─── Test 5: Attempt Delete on Paid Salary -> Expect 400 ───
    console.log("\n[Test 5] Attempting Delete on PAID Salary (Expect 400 Block)...");
    const delPaidRes = await fetch(`${BASE_URL}/api/admin/employees/salary/${genData1.data.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });

    const delPaidData = await delPaidRes.json();
    console.log("-> Response status:", delPaidRes.status, "Error:", delPaidData.error);
    if (delPaidRes.status === 400 && delPaidData.error?.includes("Cannot delete a paid salary")) {
      console.log("✅ [Test 5 PASS] Deletion of paid salary properly blocked with 400");
    } else {
      throw new Error("Test 5 Failed: Expected 400 when deleting paid salary");
    }

    // ─── Test 6: Unmark Paid -> Delete Unpaid Salary -> Expect 200 ───
    console.log("\n[Test 6] Unmarking Paid -> Deleting Salary record...");
    await fetch(`${BASE_URL}/api/admin/employees/salary/${genData1.data.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ unmarkPaid: true }),
    });

    const delUnpaidRes = await fetch(`${BASE_URL}/api/admin/employees/salary/${genData1.data.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });

    const delUnpaidData = await delUnpaidRes.json();
    console.log("-> Response status:", delUnpaidRes.status);
    if (delUnpaidRes.status === 200 && delUnpaidData.success) {
      console.log("✅ [Test 6 PASS] Unpaid salary record deleted successfully");
      const idx = createdSalaryIds.indexOf(genData1.data.id);
      if (idx !== -1) createdSalaryIds.splice(idx, 1);
    } else {
      throw new Error(`Test 6 Failed: ${JSON.stringify(delUnpaidData)}`);
    }

    console.log("\n==================================================================");
    console.log("  ALL TESTS PASSED (6/6) — Phase 7 Salary & Advance Verified!");
    console.log("==================================================================\n");
  } finally {
    console.log("[Cleanup] Cleaning up test records from database...");
    for (const sid of createdSalaryIds) {
      await prisma.salary.delete({ where: { id: sid } }).catch(() => null);
    }
    for (const aid of createdAdvanceIds) {
      await prisma.advance.delete({ where: { id: aid } }).catch(() => null);
    }
    await prisma.$disconnect();
    console.log("[Cleanup] Cleaned up test salaries and advances successfully.\n");
  }
}

runSalaryTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Test Suite Failed:", err);
    process.exit(1);
  });
