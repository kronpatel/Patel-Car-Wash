import { prisma } from "../src/lib/prisma";
import {
  generateQRToken,
  generateQRDataURL,
  buildScanURL,
  calculateExpiry,
  getActiveQR,
  validateQRToken,
  deactivateExpiredQRs,
} from "../src/lib/qr-helpers";

async function testAttendanceQRAPI() {
  console.log("=== Testing Attendance QR API Logic & DB operations ===");

  // 1. Initial cleanup
  await deactivateExpiredQRs();

  // 2. Simulate POST: Create QR for 15 days
  const expiresInDays = 15;
  await prisma.attendanceQR.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const token = generateQRToken();
  const expiresAt = calculateExpiry(expiresInDays);

  const createdQR = await prisma.attendanceQR.create({
    data: {
      token,
      isActive: true,
      expiresAt,
      expiresIn: expiresInDays,
      createdBy: "admin-1",
    },
  });

  console.log("✅ Created AttendanceQR record in DB:", {
    id: createdQR.id,
    token: createdQR.token,
    expiresIn: createdQR.expiresIn,
    isActive: createdQR.isActive,
  });

  // 3. Generate QR image & Scan URL
  const qrImage = await generateQRDataURL(createdQR.token);
  const scanURL = buildScanURL(createdQR.token);
  console.log("✅ Generated QR Data URL:", qrImage.slice(0, 30) + "... (Length: " + qrImage.length + ")");
  console.log("✅ Generated Scan URL:", scanURL);

  // 4. Validate Token
  const validation = await validateQRToken(token);
  if (validation.valid) {
    console.log("✅ Token validation passed! Active QR found:", validation.qr.token);
  } else {
    throw new Error("Validation failed: " + validation.reason);
  }

  // 5. Test Active QR retrieval
  const activeQR = await getActiveQR();
  if (activeQR && activeQR.token === token) {
    console.log("✅ getActiveQR() accurately returned newest active token!");
  } else {
    throw new Error("getActiveQR() did not match newly created token");
  }

  // 6. Test PATCH: Deactivate QR
  const deactivatedQR = await prisma.attendanceQR.update({
    where: { id: createdQR.id },
    data: { isActive: false },
  });
  console.log("✅ PATCH Deactivate QR: Success, isActive =", deactivatedQR.isActive);

  // 7. Test validation after deactivation
  const postDeactivateCheck = await validateQRToken(token);
  if (!postDeactivateCheck.valid && postDeactivateCheck.reason === "INACTIVE") {
    console.log("✅ validateQRToken on deactivated token returns reason: INACTIVE");
  } else {
    throw new Error("Expected INACTIVE reason but got: " + JSON.stringify(postDeactivateCheck));
  }

  // 8. Test DELETE: Delete inactive QR
  await prisma.attendanceQR.delete({
    where: { id: createdQR.id },
  });
  const deletedCheck = await prisma.attendanceQR.findUnique({
    where: { id: createdQR.id },
  });
  if (!deletedCheck) {
    console.log("✅ DELETE QR: Record successfully removed from database!");
  } else {
    throw new Error("Record was not deleted");
  }

  console.log("\n=== All Attendance QR API Tests (GET/POST/PATCH/DELETE) Passed Successfully! ===");
  process.exit(0);
}

testAttendanceQRAPI().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
