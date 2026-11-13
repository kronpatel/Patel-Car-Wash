import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { StaffWithStats, StaffStatus } from "@/types/staff";

/**
 * Generate next unique Staff ID
 * Reads current max staff count / IDs from DB
 * Returns formatted ID: "EMP001", "EMP002"...
 * Handles edge case: no staff exists → "EMP001"
 */
export async function getNextStaffId(): Promise<string> {
  const staffList = await prisma.staff.findMany({
    select: { staffId: true },
  });

  if (staffList.length === 0) {
    return "EMP001";
  }

  let maxNum = 0;
  for (const s of staffList) {
    const match = s.staffId.match(/EMP(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `EMP${String(nextNum).padStart(3, "0")}`;
}

/**
 * Hash password using bcryptjs
 * Salt rounds: 10
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if mobile number already exists in staff table
 * Returns staff record if exists, null otherwise
 */
export async function findStaffByMobile(mobile: string) {
  const cleanMobile = mobile.replace(/[\s\-()]/g, "").replace(/^(\+91|91)/, "");
  return prisma.staff.findFirst({
    where: {
      OR: [
        { mobile },
        { mobile: cleanMobile },
        { mobile: `+91${cleanMobile}` },
      ],
    },
  });
}

/**
 * Check if staff ID already exists
 */
export async function findStaffByStaffId(staffId: string) {
  return prisma.staff.findUnique({
    where: { staffId: staffId.trim().toUpperCase() },
  });
}

/**
 * Get staff with computed stats (present/absent days this month, pending advance, this month salary)
 * Input: staffId (can be Staff primary key 'id' or formatted 'staffId')
 * Uses current month/year
 */
export async function getStaffWithStats(staffIdOrId: string): Promise<StaffWithStats | null> {
  const staff = await prisma.staff.findFirst({
    where: {
      OR: [{ id: staffIdOrId }, { staffId: staffIdOrId }],
    },
  });

  if (!staff) return null;

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const startOfMonth = new Date(currentYear, now.getMonth(), 1);
  const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Attendance stats for this month
  const attendances = await prisma.attendance.findMany({
    where: {
      staffId: staff.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: { status: true },
  });

  // Business Rule: LATE is also counted as PRESENT
  let presentDays = 0;
  let absentDays = 0;

  for (const a of attendances) {
    if (a.status === "PRESENT" || a.status === "LATE") {
      presentDays += 1;
    } else if (a.status === "HALF_DAY") {
      presentDays += 0.5;
    } else if (a.status === "ABSENT") {
      absentDays += 1;
    }
  }

  // 2. Pending advance total
  const pendingAdvances = await prisma.advance.findMany({
    where: {
      staffId: staff.id,
      status: "OPEN",
    },
    select: { remainingBalance: true },
  });

  const totalPendingAdvance = pendingAdvances.reduce(
    (sum, adv) => sum + (adv.remainingBalance || 0),
    0
  );

  // 3. This month salary
  const salaryRecord = await prisma.salary.findUnique({
    where: {
      staffId_month_year: {
        staffId: staff.id,
        month: currentMonth,
        year: currentYear,
      },
    },
    select: { finalSalary: true },
  });

  const thisMonthSalary = salaryRecord
    ? salaryRecord.finalSalary
    : staff.baseSalary;

  return {
    ...staff,
    presentDaysThisMonth: presentDays,
    absentDaysThisMonth: absentDays,
    totalPendingAdvance,
    thisMonthSalary,
  };
}

/**
 * Get all staff with optional filters
 * Filters: role, status, search (name/mobile/staffId)
 * Returns array with stats
 */
export async function getAllStaffWithStats(filters?: {
  role?: string;
  status?: string;
  search?: string;
}): Promise<StaffWithStats[]> {
  const where: Record<string, unknown> = {};

  if (filters?.role && filters.role !== "all") {
    where.role = filters.role;
  }

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status as StaffStatus;
  }

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term } },
      { mobile: { contains: term } },
      { staffId: { contains: term } },
    ];
  }

  const staffList = await prisma.staff.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (staffList.length === 0) return [];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, now.getMonth(), 1);
  const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const staffIds = staffList.map((s) => s.id);

  // Batch query 1: Attendances this month
  const allAttendances = await prisma.attendance.findMany({
    where: {
      staffId: { in: staffIds },
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { staffId: true, status: true },
  });

  // Batch query 2: Open advances
  const allAdvances = await prisma.advance.findMany({
    where: {
      staffId: { in: staffIds },
      status: "OPEN",
    },
    select: { staffId: true, remainingBalance: true },
  });

  // Batch query 3: Salaries for this month
  const allSalaries = await prisma.salary.findMany({
    where: {
      staffId: { in: staffIds },
      month: currentMonth,
      year: currentYear,
    },
    select: { staffId: true, finalSalary: true },
  });

  // Aggregate stats per staffId
  const attendanceMap = new Map<string, { present: number; absent: number }>();
  for (const a of allAttendances) {
    const cur = attendanceMap.get(a.staffId) || { present: 0, absent: 0 };
    if (a.status === "PRESENT" || a.status === "LATE") {
      cur.present += 1;
    } else if (a.status === "HALF_DAY") {
      cur.present += 0.5;
    } else if (a.status === "ABSENT") {
      cur.absent += 1;
    }
    attendanceMap.set(a.staffId, cur);
  }

  const advanceMap = new Map<string, number>();
  for (const adv of allAdvances) {
    const cur = advanceMap.get(adv.staffId) || 0;
    advanceMap.set(adv.staffId, cur + (adv.remainingBalance || 0));
  }

  const salaryMap = new Map<string, number>();
  for (const sal of allSalaries) {
    salaryMap.set(sal.staffId, sal.finalSalary);
  }

  return staffList.map((s) => {
    const att = attendanceMap.get(s.id) || { present: 0, absent: 0 };
    const adv = advanceMap.get(s.id) || 0;
    const sal = salaryMap.has(s.id) ? salaryMap.get(s.id)! : s.baseSalary;

    return {
      ...s,
      presentDaysThisMonth: att.present,
      absentDaysThisMonth: att.absent,
      totalPendingAdvance: adv,
      thisMonthSalary: sal,
    };
  });
}
