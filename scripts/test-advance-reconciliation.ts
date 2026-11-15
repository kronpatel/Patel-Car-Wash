import { prisma } from "../src/lib/prisma";
import { generateSalaryRecord, revertAdvance, recoverAdvance } from "../src/lib/salary-helpers";

async function runTest() {
  console.log("=========================================================================");
  console.log("  Testing BUG-005: Advance Reconciliation on Salary Delete & Edit");
  console.log("=========================================================================");

  // 1. Setup test staff
  let staff = await prisma.staff.findFirst({ where: { staffId: "EMP_RECON_TEST" } });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        staffId: "EMP_RECON_TEST",
        name: "Reconciliation Test Staff",
        email: "test-recon@cleanpro.com",
        mobile: "9797979797",
        password: "hash",
        joiningDate: new Date(),
        role: "Helper",
        baseSalary: 18000,
        status: "ACTIVE",
      },
    });
  }

  // Clean any old records
  await prisma.salary.deleteMany({ where: { staffId: staff.id } });
  await prisma.advance.deleteMany({ where: { staffId: staff.id } });

  // 2. Issue an advance of ₹6,000
  const advance = await prisma.advance.create({
    data: {
      staffId: staff.id,
      amountGiven: 6000,
      remainingBalance: 6000,
      amountRecovered: 0,
      reason: "Advance for reconciliation test",
      status: "OPEN",
    },
  });
  console.log(`[Setup] Created advance ID=${advance.id}, Balance=₹${advance.remainingBalance}`);

  // 3. Generate salary for Month 1 with advanceCut = ₹2,500
  console.log("\n[Test 1] Generating salary with ₹2,500 advance cut...");
  const salary1 = await generateSalaryRecord(staff.id, 1, 2026, { advanceCut: 2500 });
  console.log(`-> Salary created: ID=${salary1.id}, advanceCut=₹${salary1.advanceCut}`);

  let advCheck = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance: ₹${advCheck?.remainingBalance} (Expected 3500)`);
  if (advCheck?.remainingBalance !== 3500 || advCheck?.amountRecovered !== 2500) {
    throw new Error(`Expected balance 3500 and recovered 2500, got ${JSON.stringify(advCheck)}`);
  }
  console.log("✅ Advance deduction verified.");

  // 4. Test DELETE reconciliation:
  // Revert advance when deleting salary1 (as implemented in DELETE endpoint)
  console.log("\n[Test 2] Simulating Salary Deletion (Advance Restoration)...");
  await prisma.$transaction(async (tx) => {
    if (salary1.advanceCut > 0) {
      await revertAdvance(salary1.staffId, salary1.advanceCut, tx);
    }
    await tx.salary.delete({ where: { id: salary1.id } });
  });

  advCheck = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance after DELETE: ₹${advCheck?.remainingBalance} (Expected 6000), Status=${advCheck?.status}`);
  if (advCheck?.remainingBalance !== 6000 || advCheck?.amountRecovered !== 0 || advCheck?.status !== "OPEN") {
    throw new Error(`DELETE reconciliation failed! Advance was not fully restored: ${JSON.stringify(advCheck)}`);
  }
  console.log("✅ SUCCESS: Salary deletion fully restored advance balance to ₹6,000!");

  // 5. Test PUT reconciliation (Edit advanceCut):
  // Step 5a: Generate salary with ₹4,000 cut -> Balance becomes ₹2,000
  console.log("\n[Test 3] Generating salary with ₹4,000 cut...");
  const salary2 = await generateSalaryRecord(staff.id, 2, 2026, { advanceCut: 4000 });
  advCheck = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance: ₹${advCheck?.remainingBalance} (Expected 2000)`);

  // Step 5b: Simulate PUT reducing advanceCut from ₹4,000 to ₹1,500 (delta = -2500)
  console.log("   Simulating PUT reducing advanceCut from ₹4,000 to ₹1,500 (delta = -2500)...");
  const newAdvanceCut = 1500;
  const advanceDelta = Math.round((newAdvanceCut - salary2.advanceCut) * 100) / 100;

  await prisma.$transaction(async (tx) => {
    if (advanceDelta > 0) {
      await recoverAdvance(salary2.staffId, advanceDelta, tx);
    } else if (advanceDelta < 0) {
      await revertAdvance(salary2.staffId, Math.abs(advanceDelta), tx);
    }
    await tx.salary.update({
      where: { id: salary2.id },
      data: { advanceCut: newAdvanceCut },
    });
  });

  advCheck = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance after reducing cut: ₹${advCheck?.remainingBalance} (Expected 4500)`);
  if (advCheck?.remainingBalance !== 4500 || advCheck?.amountRecovered !== 1500) {
    throw new Error(`PUT delta < 0 reconciliation failed: ${JSON.stringify(advCheck)}`);
  }
  console.log("✅ SUCCESS: Reducing advanceCut correctly refunded ₹2,500 back to advance!");

  // Step 5c: Simulate PUT increasing advanceCut from ₹1,500 to ₹3,000 (delta = +1500)
  console.log("   Simulating PUT increasing advanceCut from ₹1,500 to ₹3,000 (delta = +1500)...");
  const newAdvanceCutUp = 3000;
  const advanceDeltaUp = Math.round((newAdvanceCutUp - newAdvanceCut) * 100) / 100;

  await prisma.$transaction(async (tx) => {
    if (advanceDeltaUp > 0) {
      await recoverAdvance(salary2.staffId, advanceDeltaUp, tx);
    } else if (advanceDeltaUp < 0) {
      await revertAdvance(salary2.staffId, Math.abs(advanceDeltaUp), tx);
    }
    await tx.salary.update({
      where: { id: salary2.id },
      data: { advanceCut: newAdvanceCutUp },
    });
  });

  advCheck = await prisma.advance.findUnique({ where: { id: advance.id } });
  console.log(`-> Advance Balance after increasing cut: ₹${advCheck?.remainingBalance} (Expected 3000)`);
  if (advCheck?.remainingBalance !== 3000 || advCheck?.amountRecovered !== 3000) {
    throw new Error(`PUT delta > 0 reconciliation failed: ${JSON.stringify(advCheck)}`);
  }
  console.log("✅ SUCCESS: Increasing advanceCut correctly deducted additional ₹1,500 from advance!");

  // 6. Cleanup
  console.log("\n[Cleanup] Cleaning up test records...");
  await prisma.salary.deleteMany({ where: { staffId: staff.id } });
  await prisma.advance.deleteMany({ where: { staffId: staff.id } });
  await prisma.staff.delete({ where: { id: staff.id } });

  console.log("=========================================================================");
  console.log("  ALL TESTS PASSED: BUG-005 VERIFIED FIXED & FULLY RECONCILED! 🚀");
  console.log("=========================================================================");
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
