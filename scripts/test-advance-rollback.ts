import { prisma } from "../src/lib/prisma";
import { generateSalaryRecord } from "../src/lib/salary-helpers";

async function runRollbackTest() {
  console.log("====================================================================");
  console.log("  Testing BUG-004: Advance Recovery Transaction Rollback Verification");
  console.log("====================================================================");

  // 1. Find or create a test staff member
  let staff = await prisma.staff.findFirst({ where: { staffId: "EMP_TEST_RB" } });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        staffId: "EMP_TEST_RB",
        name: "Rollback Test Staff",
        email: "test-rb@cleanpro.com",
        mobile: "9898989898",
        password: "hash",
        joiningDate: new Date(),
        role: "Helper",
        baseSalary: 15000,
        status: "ACTIVE",
      },
    });
  }

  const testMonth = 11;
  const testYear = 2026;

  // Clean any existing test advances & salaries
  await prisma.salary.deleteMany({ where: { staffId: staff.id } });
  await prisma.advance.deleteMany({ where: { staffId: staff.id } });

  // 2. Create an advance of ₹5,000
  const initialAdvanceAmount = 5000;
  const advance = await prisma.advance.create({
    data: {
      staffId: staff.id,
      amountGiven: initialAdvanceAmount,
      remainingBalance: initialAdvanceAmount,
      amountRecovered: 0,
      reason: "Rollback Test Loan",
      status: "OPEN",
    },
  });
  console.log(`[Step 1] Created test advance: ID=${advance.id}, Balance=₹${advance.remainingBalance}`);

  // 3. Successfully generate salary with ₹2,000 advance cut
  console.log("[Step 2] Generating normal salary with ₹2,000 advance cut...");
  const salary = await generateSalaryRecord(staff.id, testMonth, testYear, {
    advanceCut: 2000,
  });
  console.log(`-> Generated Salary ID=${salary.id}, advanceCut=₹${salary.advanceCut}`);

  const advanceAfterNormal = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance after successful cut: ₹${advanceAfterNormal?.remainingBalance} (Expected 3000)`);
  if (advanceAfterNormal?.remainingBalance !== 3000) {
    throw new Error(`Expected advance balance 3000, got ${advanceAfterNormal?.remainingBalance}`);
  }
  console.log("✅ Normal advance recovery working properly.");

  // 4. Test Atomic Rollback on Failure:
  // Now attempt to generate salary for the EXACT SAME month/year (duplicate key error on @@unique([staffId, month, year]))
  // with an additional ₹1,500 advance cut.
  // Because salary.create will throw P2002, the transaction MUST roll back the advance cut!
  console.log("\n[Step 3] Testing Failure & Rollback Scenario:");
  console.log("   Attempting duplicate salary for same month/year with ₹1,500 advance cut...");
  let errorCaught = false;

  try {
    await generateSalaryRecord(staff.id, testMonth, testYear, {
      advanceCut: 1500,
    });
  } catch (err: any) {
    errorCaught = true;
    console.log(`-> Expected error caught during salary.create: ${err?.code || err?.message}`);
  }

  if (!errorCaught) {
    throw new Error("Expected salary creation to throw a duplicate constraint error, but it did not!");
  }

  // Check advance balance: It MUST STILL BE ₹3000 (NOT ₹1500)!
  const advanceAfterFailure = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance after failed transaction: ₹${advanceAfterFailure?.remainingBalance}`);

  if (advanceAfterFailure?.remainingBalance === 3000) {
    console.log("✅ SUCCESS: Transaction rollback verified! Advance balance was NOT corrupted!");
  } else {
    throw new Error(
      `❌ FAIL: Advance balance was mutated to ₹${advanceAfterFailure?.remainingBalance} without salary creation!`
    );
  }

  // 5. Cleanup test data
  console.log("\n[Step 4] Cleaning up test records...");
  await prisma.salary.deleteMany({ where: { staffId: staff.id } });
  await prisma.advance.deleteMany({ where: { staffId: staff.id } });
  await prisma.staff.delete({ where: { id: staff.id } });

  console.log("====================================================================");
  console.log("  ALL TESTS PASSED: BUG-004 VERIFIED FIXED & ROLLED BACK ATOMICALLY! 🚀");
  console.log("====================================================================");
  await prisma.$disconnect();
}

runRollbackTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
