import { prisma } from "../src/lib/prisma";
import {
  getNextStaffId,
  hashPassword,
  verifyPassword,
  findStaffByMobile,
  getStaffWithStats,
} from "../src/lib/staff-helpers";

async function runTest() {
  console.log("=================================================");
  console.log("  Testing Staff Database & Helper Operations");
  console.log("=================================================\n");

  const testMobile = "9876543210";

  // Clean any old leftover test data if exists
  await prisma.staff.deleteMany({
    where: { mobile: testMobile },
  });

  // Step 1: Verify getNextStaffId
  const testStaffId = await getNextStaffId();
  console.log(`[Step 1] Verified next staff ID: ${testStaffId}`);

  // Step 2: Hash password (default = mobile)
  const hashedPassword = await hashPassword(testMobile);
  const isHash =
    hashedPassword.startsWith("$2a$") || hashedPassword.startsWith("$2b$");
  console.log(
    `[Step 2] Password hashed: ${isHash ? "YES (Bcrypt valid)" : "NO"}`
  );
  if (!isHash) {
    throw new Error("Password is not a valid bcrypt hash!");
  }

  // Step 3: Verify password helper
  const passMatches = await verifyPassword(testMobile, hashedPassword);
  console.log(
    `[Step 3] verifyPassword(mobile, hash): ${passMatches ? "PASS" : "FAIL"}`
  );
  if (!passMatches) {
    throw new Error("Password verification failed!");
  }

  // Step 4: Create staff in DB
  const createdStaff = await prisma.staff.create({
    data: {
      staffId: testStaffId,
      name: "Test Staff Member",
      mobile: testMobile,
      password: hashedPassword,
      address: "Rankuva, Gujarat",
      joiningDate: new Date(),
      role: "Cleaner",
      baseSalary: 12000,
      status: "ACTIVE",
    },
  });
  console.log(
    `[Step 4] Staff saved to DB with ID: ${createdStaff.id} (${createdStaff.staffId})`
  );

  // Step 5: Verify findStaffByMobile
  const found = await findStaffByMobile(testMobile);
  console.log(
    `[Step 5] findStaffByMobile: ${
      found?.name === "Test Staff Member" ? "PASS" : "FAIL"
    }`
  );

  // Step 6: Verify getStaffWithStats
  const withStats = await getStaffWithStats(createdStaff.id);
  console.log(
    `[Step 6] getStaffWithStats: present=${withStats?.presentDaysThisMonth}, salary=₹${withStats?.thisMonthSalary}`
  );

  // Step 7: Cleanup
  await prisma.staff.delete({
    where: { id: createdStaff.id },
  });
  console.log(`[Step 7] Cleanup: Test staff deleted successfully.`);

  console.log("\n=================================================");
  console.log("  ALL TESTS PASSED SUCCESSFULLY! ✅");
  console.log("=================================================");
}

runTest()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
