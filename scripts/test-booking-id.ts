import { prisma } from "../src/lib/prisma";
import { getNextBookingId } from "../src/lib/bookingId";

async function runTest() {
  console.log("=================================================");
  console.log("  Testing BUG-003: Booking ID Generation Fix");
  console.log("=================================================");

  const currentYear = new Date().getFullYear();
  const testPrefix = `CW-${currentYear}-`;

  // 1. Get next booking ID currently
  const initialNextId = await getNextBookingId();
  console.log(`[Test 1] Next booking ID from clean state: ${initialNextId}`);
  if (!initialNextId.startsWith(testPrefix)) {
    throw new Error(`Expected ID starting with ${testPrefix}, got ${initialNextId}`);
  }

  // Find or create a test customer user
  let testUser = await prisma.user.findFirst({ where: { email: "test-booking-id@cleanpro.com" } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Test Booking ID User",
        email: "test-booking-id@cleanpro.com",
        password: "hash",
        phone: "9999999999",
        referralCode: "TBID99",
      },
    });
  }

  // 2. Simulate synthetic high-numbered bookings to test deletion gap:
  // Create CW-YYYY-9001 and CW-YYYY-9003 (with 9002 missing / deleted)
  const id9001 = `CW-${currentYear}-9001`;
  const id9003 = `CW-${currentYear}-9003`;

  // Clean up any leftovers first
  await prisma.booking.deleteMany({
    where: { bookingId: { in: [id9001, id9003, `CW-${currentYear}-9004`] } },
  });

  console.log(`[Test 2] Creating synthetic bookings: ${id9001} and ${id9003} (simulating 9002 was deleted)...`);
  await prisma.booking.create({
    data: {
      bookingId: id9001,
      userId: testUser.id,
      customerName: testUser.name,
      customerPhone: testUser.phone,
      customerEmail: testUser.email,
      service: "Test Wash",
      plan: "Basic Wash",
      vehicleType: "Small Sedan",
      vehicleNumber: "GJ01AB1234",
      date: "2026-11-15",
      timeSlot: "10:00 AM - 11:00 AM",
      basePrice: 399,
      finalPrice: 399,
    },
  });

  await prisma.booking.create({
    data: {
      bookingId: id9003,
      userId: testUser.id,
      customerName: testUser.name,
      customerPhone: testUser.phone,
      customerEmail: testUser.email,
      service: "Test Wash",
      plan: "Basic Wash",
      vehicleType: "Small Sedan",
      vehicleNumber: "GJ01AB1234",
      date: "2026-11-15",
      timeSlot: "11:00 AM - 12:00 PM",
      basePrice: 399,
      finalPrice: 399,
    },
  });

  // 3. Test what getNextBookingId produces:
  // With the old count+1 logic, if only 2 bookings existed, count would be 2, generating CW-YYYY-0003 or colliding.
  // With the new logic, it must see 9003 as max and generate CW-YYYY-9004!
  const generatedId = await getNextBookingId();
  console.log(`[Test 3] Generated ID after gap: ${generatedId}`);

  const expectedId = `CW-${currentYear}-9004`;
  if (generatedId === expectedId) {
    console.log(`✅ SUCCESS: Correctly allocated next sequence ${generatedId} avoiding gap collision!`);
  } else {
    throw new Error(`❌ FAIL: Expected ${expectedId}, but got ${generatedId}`);
  }

  // 4. Cleanup test data
  console.log(`[Test 4] Cleaning up test records...`);
  await prisma.booking.deleteMany({
    where: { bookingId: { in: [id9001, id9003] } },
  });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log("=================================================");
  console.log("  ALL TESTS PASSED: BUG-003 VERIFIED FIXED! 🚀");
  console.log("=================================================");
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
