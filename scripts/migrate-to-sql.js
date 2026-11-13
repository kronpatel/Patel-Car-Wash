/**
 * ============================================================================
 * Patel Car'spa & Detailing Studio - JSON to MySQL Migration Script
 * ============================================================================
 * Run: node scripts/migrate-to-sql.js
 *
 * Reads: data/db.json
 * Writes: MySQL Database configured in DATABASE_URL
 * Strategy: Idempotent upserts (safe to run multiple times without duplicates)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const DB_FILE = path.join(process.cwd(), "data", "db.json");

async function main() {
  console.log("============================================================");
  console.log("  Patel Car'spa - Starting JSON -> MySQL Migration");
  console.log("============================================================");

  if (!fs.existsSync(DB_FILE)) {
    console.error(`[Error] Could not find JSON database at: ${DB_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_FILE, "utf-8");
  const data = JSON.parse(raw);

  const users = data.users || [];
  const bookings = data.bookings || [];
  const coinTxs = data.coinTransactions || [];
  const promoCodes = data.promoCodes || [];
  const promoUsages = data.promoCodeUsages || [];

  console.log(`[Read] Found in db.json:`);
  console.log(`  - Users:             ${users.length}`);
  console.log(`  - Promo Codes:       ${promoCodes.length}`);
  console.log(`  - Bookings:          ${bookings.length}`);
  console.log(`  - Coin Transactions: ${coinTxs.length}`);
  console.log(`  - Promo Usages:      ${promoUsages.length}`);
  console.log("");

  // ─────────────────────────────────────────────────────────────
  // 1. MIGRATE USERS
  // ─────────────────────────────────────────────────────────────
  console.log("Step 1/5: Migrating Users...");
  let userCount = 0;
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase().trim() },
      update: {
        name: u.name,
        phone: u.phone,
        password: u.password,
        role: u.role === "admin" ? "admin" : "customer",
        cleanCoins: Number(u.cleanCoins) || 0,
        referralCode: u.referralCode || `REF${Math.floor(1000 + Math.random() * 9000)}`,
        referredBy: u.referredBy || null,
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      },
      create: {
        id: u.id || u._id,
        name: u.name,
        email: u.email.toLowerCase().trim(),
        password: u.password,
        phone: u.phone,
        role: u.role === "admin" ? "admin" : "customer",
        cleanCoins: Number(u.cleanCoins) || 0,
        referralCode: u.referralCode || `REF${Math.floor(1000 + Math.random() * 9000)}`,
        referredBy: u.referredBy || null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      },
    });
    userCount++;
  }
  console.log(`  ✔ Successfully synced ${userCount} users.`);

  // ─────────────────────────────────────────────────────────────
  // 2. MIGRATE PROMO CODES
  // ─────────────────────────────────────────────────────────────
  console.log("\nStep 2/5: Migrating Promo Codes...");
  let promoCount = 0;
  for (const p of promoCodes) {
    const cleanCode = p.code.trim().toUpperCase();
    await prisma.promoCode.upsert({
      where: { code: cleanCode },
      update: {
        discountType: p.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
        discountValue: Number(p.discountValue) || 0,
        minBookingAmount: p.minBookingAmount ? Number(p.minBookingAmount) : null,
        expiryDate: new Date(p.expiryDate),
        isActive: p.isActive ?? true,
        usageLimitPerUser: Number(p.usageLimitPerUser) || 1,
        totalUsageLimit: p.totalUsageLimit ? Number(p.totalUsageLimit) : null,
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      },
      create: {
        id: p.id || p._id,
        code: cleanCode,
        discountType: p.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
        discountValue: Number(p.discountValue) || 0,
        minBookingAmount: p.minBookingAmount ? Number(p.minBookingAmount) : null,
        expiryDate: new Date(p.expiryDate),
        isActive: p.isActive ?? true,
        usageLimitPerUser: Number(p.usageLimitPerUser) || 1,
        totalUsageLimit: p.totalUsageLimit ? Number(p.totalUsageLimit) : null,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      },
    });
    promoCount++;
  }
  console.log(`  ✔ Successfully synced ${promoCount} promo codes.`);

  // ─────────────────────────────────────────────────────────────
  // 3. MIGRATE BOOKINGS
  // ─────────────────────────────────────────────────────────────
  console.log("\nStep 3/5: Migrating Bookings...");
  let bookingCount = 0;
  const usedBookingIds = new Set();
  let seq = 1;

  for (const b of bookings) {
    const userId = typeof b.userId === "string" ? b.userId : b.userId?._id;

    // Verify user exists before linking
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      console.warn(`  [Warning] Skipping booking ${b.id}: User ${userId} not found.`);
      continue;
    }

    // Ensure unique bookingId even if test data had duplicates
    let targetBookingId = b.bookingId || `CW-2026-0001`;
    if (usedBookingIds.has(targetBookingId)) {
      targetBookingId = `CW-2026-${String(seq).padStart(4, "0")}`;
    }
    while (usedBookingIds.has(targetBookingId)) {
      seq++;
      targetBookingId = `CW-2026-${String(seq).padStart(4, "0")}`;
    }
    usedBookingIds.add(targetBookingId);
    seq++;

    const wa = b.whatsappSent || {};

    await prisma.booking.upsert({
      where: { id: b.id || b._id },
      update: {
        bookingId: targetBookingId,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        service: b.service,
        plan: b.plan,
        vehicleType: b.vehicleType,
        vehicleNumber: b.vehicleNumber,
        date: b.date,
        timeSlot: b.timeSlot,
        address: b.address || null,
        notes: b.notes || null,
        basePrice: Number(b.basePrice) || 0,
        coinsUsed: Number(b.coinsUsed) || 0,
        discount: Number(b.discount) || 0,
        finalPrice: Number(b.finalPrice) || 0,
        status: b.status || "confirmed",
        qrCode: b.qrCode || null,
        whatsappConfirmed: Boolean(wa.bookingConfirmed),
        whatsappReady: Boolean(wa.ready),
        whatsappReminder: Boolean(wa.reminder),
        updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      },
      create: {
        id: b.id || b._id,
        bookingId: targetBookingId,
        userId: userExists.id,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        service: b.service,
        plan: b.plan,
        vehicleType: b.vehicleType,
        vehicleNumber: b.vehicleNumber,
        date: b.date,
        timeSlot: b.timeSlot,
        address: b.address || null,
        notes: b.notes || null,
        basePrice: Number(b.basePrice) || 0,
        coinsUsed: Number(b.coinsUsed) || 0,
        discount: Number(b.discount) || 0,
        finalPrice: Number(b.finalPrice) || 0,
        status: b.status || "confirmed",
        qrCode: b.qrCode || null,
        whatsappConfirmed: Boolean(wa.bookingConfirmed),
        whatsappReady: Boolean(wa.ready),
        whatsappReminder: Boolean(wa.reminder),
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      },
    });
    bookingCount++;
  }
  console.log(`  ✔ Successfully synced ${bookingCount} bookings.`);

  // ─────────────────────────────────────────────────────────────
  // 4. MIGRATE COIN TRANSACTIONS
  // ─────────────────────────────────────────────────────────────
  console.log("\nStep 4/5: Migrating Coin Transactions...");
  let coinCount = 0;
  for (const tx of coinTxs) {
    const txId = tx.id || tx._id;
    const existing = await prisma.coinTransaction.findUnique({
      where: { id: txId },
    });

    if (existing) continue;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: tx.userId },
    });
    if (!userExists) continue;

    // Check if booking exists (if linked)
    let validBookingId = null;
    if (tx.bookingId) {
      const bExists = await prisma.booking.findFirst({
        where: { OR: [{ id: tx.bookingId }, { bookingId: tx.bookingId }] },
      });
      if (bExists) validBookingId = bExists.id;
    }

    await prisma.coinTransaction.create({
      data: {
        id: txId,
        userId: userExists.id,
        type: tx.type === "redeemed" ? "redeemed" : "earned",
        amount: Number(tx.amount) || 0,
        reason: tx.reason || "Loyalty transaction",
        bookingId: validBookingId,
        createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
      },
    });
    coinCount++;
  }
  console.log(`  ✔ Successfully synced ${coinCount} coin transactions.`);

  // ─────────────────────────────────────────────────────────────
  // 5. MIGRATE PROMO CODE USAGES
  // ─────────────────────────────────────────────────────────────
  console.log("\nStep 5/5: Migrating Promo Code Usages...");
  let usageCount = 0;
  for (const pu of promoUsages) {
    const usageId = pu.id || pu._id;
    const existing = await prisma.promoCodeUsage.findUnique({
      where: { id: usageId },
    });
    if (existing) continue;

    const promo = await prisma.promoCode.findFirst({
      where: { OR: [{ id: pu.promoCodeId }, { code: pu.promoCode?.toUpperCase() }] },
    });
    const user = await prisma.user.findUnique({
      where: { id: pu.userId },
    });

    // Look up booking by exact ID first to prevent collision on legacy bookingRefs
    let booking = await prisma.booking.findUnique({
      where: { id: pu.bookingId },
    });
    if (!booking && pu.bookingRef) {
      booking = await prisma.booking.findFirst({
        where: { bookingId: pu.bookingRef },
      });
    }

    if (!promo || !user || !booking) continue;

    // Check if this booking already has an associated promo usage
    const existingBookingUsage = await prisma.promoCodeUsage.findUnique({
      where: { bookingId: booking.id },
    });
    if (existingBookingUsage) continue;

    await prisma.promoCodeUsage.create({
      data: {
        id: usageId,
        promoCodeId: promo.id,
        promoCode: promo.code,
        userId: user.id,
        userName: user.name,
        bookingId: booking.id,
        bookingRef: booking.bookingId,
        usedAt: pu.usedAt ? new Date(pu.usedAt) : new Date(),
      },
    });
    usageCount++;
  }
  console.log(`  ✔ Successfully synced ${usageCount} promo usage audit records.`);

  console.log("\n============================================================");
  console.log("  Migration completed successfully!");
  console.log("============================================================");
}

main()
  .catch((e) => {
    console.error("\n[Fatal Error during migration]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
