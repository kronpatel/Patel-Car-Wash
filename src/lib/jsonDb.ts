import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { IUser, IBooking, ICoinTransaction, ICoupon, BookingStatus, PlanType, VehicleType } from "@/types";

export interface JsonDatabase {
  users: Array<IUser & { id: string }>;
  bookings: Array<IBooking & { id: string }>;
  coinTransactions: Array<ICoinTransaction & { id: string }>;
  coupons: Array<ICoupon & { id?: string }>;
  counters?: Record<string, number>;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

function getDefaultData(): JsonDatabase {
  const adminPasswordHash = bcrypt.hashSync("CleanProAdmin@2024!", 10);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: "admin-1",
        _id: "admin-1",
        name: "Admin",
        email: "admin@cleanpro.com",
        password: adminPasswordHash,
        phone: "+919624348480",
        role: "admin",
        cleanCoins: 0,
        referralCode: "ADMIN001",
        createdAt: now,
        updatedAt: now,
      },
    ],
    bookings: [],
    coinTransactions: [],
    coupons: [
      {
        id: "coupon-1",
        _id: "coupon-1",
        code: "FIRST50",
        discountAmount: 50,
        minOrderValue: 300,
        validFrom: now,
        validUntil: "2027-12-31T23:59:59.999Z",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "coupon-2",
        _id: "coupon-2",
        code: "WEEKEND10",
        discountPercent: 10,
        validFrom: now,
        validUntil: "2027-12-31T23:59:59.999Z",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    counters: {},
  };
}

/**
 * Reads database from local JSON file (creates and seeds if not existing)
 */
export function getDb(): JsonDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const defaultData = getDefaultData();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }

    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content) as JsonDatabase;

    if (!parsed.users) parsed.users = [];
    if (!parsed.bookings) parsed.bookings = [];
    if (!parsed.coinTransactions) parsed.coinTransactions = [];
    if (!parsed.coupons) parsed.coupons = [];
    if (!parsed.counters) parsed.counters = {};

    return parsed;
  } catch (error) {
    console.error("Error reading db.json:", error);
    return getDefaultData();
  }
}

/**
 * Saves database back to local JSON file
 */
export function saveDb(data: JsonDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving db.json:", error);
    throw new Error("Failed to write to local JSON database");
  }
}

// ─────────────────────────────────────────────────────────────
// USER OPERATIONS
// ─────────────────────────────────────────────────────────────

export function findUserByEmail(email: string) {
  const db = getDb();
  const normalized = email.toLowerCase().trim();
  return db.users.find((u) => u.email.toLowerCase().trim() === normalized) || null;
}

export function findUserById(id: string) {
  const db = getDb();
  return db.users.find((u) => u.id === id || u._id === id) || null;
}

export function findUserByPhone(phone: string) {
  const db = getDb();
  const normalized = phone.trim();
  return db.users.find((u) => u.phone.trim() === normalized) || null;
}

export function findUserByReferralCode(code: string) {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  return db.users.find((u) => u.referralCode?.trim().toUpperCase() === normalized) || null;
}

export function countUsers(filter?: { role?: string }): number {
  const db = getDb();
  if (filter?.role) {
    return db.users.filter((u) => u.role === filter.role).length;
  }
  return db.users.length;
}

export function createUser(userData: {
  name: string;
  email: string;
  password?: string;
  phone: string;
  role?: "customer" | "admin";
  cleanCoins?: number;
  referralCode?: string;
  referredBy?: string | null;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newUser: IUser & { id: string } = {
    id,
    _id: id,
    name: userData.name.trim(),
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    phone: userData.phone.trim(),
    role: userData.role || "customer",
    cleanCoins: userData.cleanCoins ?? 0,
    referralCode: userData.referralCode || "",
    referredBy: userData.referredBy || null,
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export function updateUser(id: string, updates: Partial<IUser>) {
  const db = getDb();
  const index = db.users.findIndex((u) => u.id === id || u._id === id);
  if (index === -1) return null;

  const current = db.users[index];
  const updatedUser: IUser & { id: string } = {
    ...current,
    ...updates,
    id: current.id,
    _id: current._id || current.id,
    updatedAt: new Date().toISOString(),
  };

  db.users[index] = updatedUser;
  saveDb(db);
  return updatedUser;
}

// ─────────────────────────────────────────────────────────────
// BOOKING OPERATIONS
// ─────────────────────────────────────────────────────────────

export function getNextBookingId(): string {
  const db = getDb();
  const currentYear = new Date().getFullYear();
  const counterKey = `booking_${currentYear}`;

  if (!db.counters) {
    db.counters = {};
  }

  const currentSeq = db.counters[counterKey] || 0;
  const nextSeq = currentSeq + 1;
  db.counters[counterKey] = nextSeq;
  saveDb(db);

  const seqNumber = nextSeq.toString().padStart(4, "0");
  return `CW-${currentYear}-${seqNumber}`;
}

export function getBookings(filter?: {
  userId?: string;
  status?: string;
  date?: string;
}): Array<IBooking & { id: string }> {
  const db = getDb();
  let list = [...db.bookings];

  if (filter?.userId) {
    list = list.filter((b) => {
      const uId = typeof b.userId === "string" ? b.userId : b.userId?._id;
      return uId === filter.userId;
    });
  }

  if (filter?.status) {
    list = list.filter((b) => b.status === filter.status);
  }

  if (filter?.date) {
    list = list.filter((b) => b.date === filter.date);
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export function findBookingById(id: string): (IBooking & { id: string }) | null {
  const db = getDb();
  return (
    db.bookings.find(
      (b) => b.id === id || b._id === id || b.bookingId === id
    ) || null
  );
}

export function countBookingsInSlot(
  date: string,
  timeSlot: string,
  statuses: BookingStatus[] = ["confirmed", "in_progress", "ready"]
): number {
  const db = getDb();
  return db.bookings.filter(
    (b) => b.date === date && b.timeSlot === timeSlot && statuses.includes(b.status)
  ).length;
}

export function createBooking(data: {
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  plan: PlanType;
  vehicleType: VehicleType;
  vehicleNumber: string;
  date: string;
  timeSlot: string;
  address?: string;
  notes?: string;
  basePrice: number;
  coinsUsed: number;
  discount: number;
  finalPrice: number;
  status?: BookingStatus;
  qrCode?: string;
}): IBooking & { id: string } {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `booking_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const bookingId = getNextBookingId();

  const newBooking: IBooking & { id: string } = {
    id,
    _id: id,
    bookingId,
    userId: data.userId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    service: data.service,
    plan: data.plan,
    vehicleType: data.vehicleType,
    vehicleNumber: data.vehicleNumber.toUpperCase().trim(),
    date: data.date,
    timeSlot: data.timeSlot,
    address: data.address?.trim() || "",
    notes: data.notes?.trim() || "",
    basePrice: data.basePrice,
    coinsUsed: data.coinsUsed || 0,
    discount: data.discount || 0,
    finalPrice: data.finalPrice,
    status: data.status || "confirmed",
    qrCode: data.qrCode,
    whatsappSent: {
      bookingConfirmed: false,
      ready: false,
      reminder: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  db.bookings.unshift(newBooking);
  saveDb(db);
  return newBooking;
}

export function updateBooking(
  id: string,
  updates: Partial<IBooking>
): (IBooking & { id: string }) | null {
  const db = getDb();
  const index = db.bookings.findIndex(
    (b) => b.id === id || b._id === id || b.bookingId === id
  );

  if (index === -1) return null;

  const current = db.bookings[index];
  const updatedBooking: IBooking & { id: string } = {
    ...current,
    ...updates,
    id: current.id,
    _id: current._id || current.id,
    whatsappSent: {
      ...current.whatsappSent,
      ...(updates.whatsappSent || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  db.bookings[index] = updatedBooking;
  saveDb(db);
  return updatedBooking;
}

export function deleteBooking(id: string): boolean {
  const db = getDb();
  const initialLength = db.bookings.length;
  db.bookings = db.bookings.filter(
    (b) => b.id !== id && b._id !== id && b.bookingId !== id
  );

  if (db.bookings.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// COIN TRANSACTIONS
// ─────────────────────────────────────────────────────────────

export function createCoinTransaction(data: {
  userId: string;
  type: "earned" | "redeemed";
  amount: number;
  reason: string;
  bookingId?: string | null;
}): ICoinTransaction & { id: string } {
  const db = getDb();
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newTx: ICoinTransaction & { id: string } = {
    id,
    _id: id,
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    reason: data.reason,
    bookingId: data.bookingId || null,
    createdAt: now,
  };

  db.coinTransactions.unshift(newTx);
  saveDb(db);
  return newTx;
}

export function getCoinTransactionsByUserId(
  userId: string,
  limit = 50
): Array<ICoinTransaction & { id: string }> {
  const db = getDb();
  return db.coinTransactions
    .filter((tx) => tx.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────
// COUPON OPERATIONS
// ─────────────────────────────────────────────────────────────

export function findCouponByCode(code: string): ICoupon | null {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  return db.coupons.find((c) => c.code.trim().toUpperCase() === normalized) || null;
}
