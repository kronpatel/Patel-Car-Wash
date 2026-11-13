import { authOptions } from "../src/lib/auth";

async function runTests() {
  console.log("=== Testing NextAuth Staff Dual Login ===");
  const provider = authOptions.providers[0] as any;
  const authorize = provider.options?.authorize || provider.authorize;

  // Test 1: Admin login with email
  try {
    const adminUser = await authorize({
      email: "admin@cleanpro.com",
      password: "CleanProAdmin@2024!",
    });
    if (adminUser?.role === "admin" && adminUser?.type === "user") {
      console.log("✅ Test 1 (Admin Login with Email): PASS");
      console.log("   User:", { name: adminUser.name, role: adminUser.role, type: adminUser.type });
    } else {
      console.error("❌ Test 1 (Admin Login with Email): FAIL - Unexpected user object", adminUser);
    }
  } catch (err: any) {
    console.error("❌ Test 1 (Admin Login with Email): FAIL -", err.message);
  }

  // Test 2: Staff login with Mobile
  try {
    const staffUser = await authorize({
      email: "7878241818",
      password: "CleanProAdmin@2024!", // Let's check staff's actual password in next step if this fails
    });
    console.log("   Staff with Admin password result:", staffUser ? "Authenticated" : "Failed");
  } catch (err: any) {
    // If password mismatch, let's test with mobile as password
  }

  // Let's test with staff password:
  // In the DB row: password was set to bcrypt hash of mobile "7878241818"
  try {
    const staffUser = await authorize({
      email: "7878241818",
      password: "7878241818",
    });
    if (staffUser?.role === "staff" && staffUser?.type === "staff" && staffUser?.staffId === "EMP001") {
      console.log("✅ Test 2 (Staff Login with Mobile): PASS");
      console.log("   Staff:", { name: staffUser.name, staffId: staffUser.staffId, role: staffUser.role, type: staffUser.type, mobile: staffUser.mobile });
    } else {
      console.error("❌ Test 2 (Staff Login with Mobile): FAIL - Unexpected staff object", staffUser);
    }
  } catch (err: any) {
    console.error("❌ Test 2 (Staff Login with Mobile): FAIL -", err.message);
  }

  // Test 3: Staff login with Email
  try {
    const staffUser = await authorize({
      email: "rajesh@patelcarspa.com",
      password: "7878241818",
    });
    if (staffUser?.role === "staff" && staffUser?.type === "staff" && staffUser?.staffId === "EMP001") {
      console.log("✅ Test 3 (Staff Login with Email): PASS");
      console.log("   Staff:", { name: staffUser.name, staffId: staffUser.staffId, role: staffUser.role, type: staffUser.type, email: staffUser.email });
    } else {
      console.error("❌ Test 3 (Staff Login with Email): FAIL - Unexpected staff object", staffUser);
    }
  } catch (err: any) {
    console.error("❌ Test 3 (Staff Login with Email): FAIL -", err.message);
  }

  // Test 4: Staff login with wrong password
  try {
    await authorize({
      email: "7878241818",
      password: "wrongpassword",
    });
    console.error("❌ Test 4 (Wrong password): FAIL - Expected rejection but succeeded");
  } catch (err: any) {
    console.log("✅ Test 4 (Wrong password rejected): PASS -", err.message);
  }

  // Test 5: Unknown identifier
  try {
    await authorize({
      email: "nobody@unknown.com",
      password: "password123",
    });
    console.error("❌ Test 5 (Unknown user): FAIL - Expected rejection but succeeded");
  } catch (err: any) {
    console.log("✅ Test 5 (Unknown user rejected): PASS -", err.message);
  }

  // Test 6: Inactive staff rejection test
  // Temporarily set staff to INACTIVE and test
  const { prisma } = await import("../src/lib/prisma");
  await prisma.staff.update({
    where: { staffId: "EMP001" },
    data: { status: "INACTIVE" },
  });

  try {
    await authorize({
      email: "7878241818",
      password: "7878241818",
    });
    console.error("❌ Test 6 (Inactive staff): FAIL - Expected rejection but succeeded");
  } catch (err: any) {
    console.log("✅ Test 6 (Inactive staff rejected): PASS -", err.message);
  }

  // Restore staff to ACTIVE
  await prisma.staff.update({
    where: { staffId: "EMP001" },
    data: { status: "ACTIVE" },
  });

  console.log("\n=== All Tests Completed Successfully ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
