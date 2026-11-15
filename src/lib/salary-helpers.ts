import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface AutoSalaryCalculation {
  staffId: string;
  staffName: string;
  staffCode: string;
  role: string;
  month: number;
  year: number;
  baseSalary: number;
  presentDays: number; // full present + late
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  totalAttendedDays: number; // present + (halfDays * 0.5)
  dailyWage: number;
  deduction: number;
  pendingAdvance: number;
  netEstimatedSalary: number;
}

export interface SalaryOverrides {
  advanceCut?: number;
  bonus?: number;
  deduction?: number;
  remark?: string;
  paymentMode?: "CASH" | "UPI" | "BANK";
  markPaid?: boolean;
}

/**
 * 1. Calculate automated salary breakdown based on attendance and open advances
 * Business Rules:
 * - Month base = 30 days
 * - Daily wage = baseSalary / 30
 * - LATE counts as full PRESENT
 * - HALF_DAY = 0.5 deduction (0.5 * dailyWage)
 * - ABSENT = 1 full day deduction (1 * dailyWage)
 */
export async function calculateAutoSalary(
  staffId: string,
  month: number,
  year: number
): Promise<AutoSalaryCalculation> {
  // Find staff
  const staff = await prisma.staff.findFirst({
    where: {
      OR: [{ id: staffId }, { staffId: staffId }],
    },
  });

  if (!staff) {
    throw new Error(`Staff not found with ID ${staffId}`);
  }

  // Month date range (1 to end of month)
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Fetch all attendance for this staff in this month
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

  let presentCount = 0;
  let absentCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;

  for (const a of attendances) {
    if (a.status === "PRESENT" || a.status === "LATE") {
      presentCount += 1;
    } else if (a.status === "HALF_DAY") {
      halfDayCount += 1;
    } else if (a.status === "ABSENT") {
      absentCount += 1;
    } else if (a.status === "LEAVE") {
      leaveCount += 1;
    }
  }

  const baseSalary = staff.baseSalary || 0;
  const dailyWage = Math.round((baseSalary / 30) * 100) / 100;

  // Auto deduction: absent days + half-day deductions
  const autoDeduction =
    Math.round((absentCount * dailyWage + halfDayCount * 0.5 * dailyWage) * 100) / 100;

  const totalAttendedDays = presentCount + halfDayCount * 0.5;

  // Fetch pending advance balance (OPEN advances)
  const openAdvances = await prisma.advance.findMany({
    where: {
      staffId: staff.id,
      status: "OPEN",
    },
    select: { remainingBalance: true },
  });

  const pendingAdvance = openAdvances.reduce(
    (sum, adv) => sum + (adv.remainingBalance || 0),
    0
  );

  const netEstimatedSalary = Math.max(
    0,
    Math.round((baseSalary - autoDeduction) * 100) / 100
  );

  return {
    staffId: staff.id,
    staffName: staff.name,
    staffCode: staff.staffId,
    role: staff.role,
    month,
    year,
    baseSalary,
    presentDays: presentCount,
    absentDays: absentCount,
    halfDays: halfDayCount,
    leaveDays: leaveCount,
    totalAttendedDays,
    dailyWage,
    deduction: autoDeduction,
    pendingAdvance: Math.round(pendingAdvance * 100) / 100,
    netEstimatedSalary,
  };
}

/**
 * 2. Recover advance by deducting from OPEN advances (oldest first)
 * Updates advance amountRecovered, remainingBalance and marks CLOSED if fully recovered.
 * Supports executing inside an atomic transaction when tx client is passed.
 */
export async function recoverAdvance(
  staffId: string,
  amount: number,
  tx?: PrismaExecutor
): Promise<{ recoveredTotal: number; closedCount: number }> {
  if (amount <= 0) {
    return { recoveredTotal: 0, closedCount: 0 };
  }

  const client = tx || prisma;

  // Find OPEN advances ordered by date ascending (oldest first)
  const openAdvances = await client.advance.findMany({
    where: {
      staffId,
      status: "OPEN",
    },
    orderBy: {
      date: "asc",
    },
  });

  let remainingToDeduct = amount;
  let recoveredTotal = 0;
  let closedCount = 0;

  for (const adv of openAdvances) {
    if (remainingToDeduct <= 0) break;

    const deduct = Math.min(adv.remainingBalance, remainingToDeduct);
    const newRecovered = Math.round((adv.amountRecovered + deduct) * 100) / 100;
    const newRemaining = Math.round((adv.remainingBalance - deduct) * 100) / 100;
    const isClosed = newRemaining <= 0;

    await client.advance.update({
      where: { id: adv.id },
      data: {
        amountRecovered: newRecovered,
        remainingBalance: Math.max(0, newRemaining),
        status: isClosed ? "CLOSED" : "OPEN",
      },
    });

    remainingToDeduct -= deduct;
    recoveredTotal += deduct;
    if (isClosed) closedCount++;
  }

  return {
    recoveredTotal: Math.round(recoveredTotal * 100) / 100,
    closedCount,
  };
}

/**
 * 3. Generate salary record in database with optional manual overrides.
 * Executes both advance recovery and salary creation inside an atomic prisma.$transaction
 * to ensure that any failure during salary creation automatically rolls back the advance deduction.
 */
export async function generateSalaryRecord(
  staffId: string,
  month: number,
  year: number,
  overrides?: SalaryOverrides
) {
  const autoSalary = await calculateAutoSalary(staffId, month, year);

  const advanceCut = Math.max(0, overrides?.advanceCut ?? 0);
  const bonus = Math.max(0, overrides?.bonus ?? 0);
  const deduction =
    overrides?.deduction !== undefined ? Math.max(0, overrides.deduction) : autoSalary.deduction;

  // Formula: Final Salary = Base Salary - Deduction - Advance Cut + Bonus
  const finalSalary = Math.max(
    0,
    Math.round((autoSalary.baseSalary - deduction - advanceCut + bonus) * 100) / 100
  );

  const isManual =
    Boolean(overrides) &&
    (overrides?.advanceCut !== undefined ||
      overrides?.bonus !== undefined ||
      overrides?.deduction !== undefined);

  // Atomic execution: Wrap advance deduction and salary slip creation in a single transaction
  const salary = await prisma.$transaction(async (tx) => {
    // If advance cut applied, deduct from OPEN advances inside the transaction
    if (advanceCut > 0) {
      await recoverAdvance(autoSalary.staffId, advanceCut, tx);
    }

    const createdSalary = await tx.salary.create({
      data: {
        staffId: autoSalary.staffId,
        month,
        year,
        baseSalary: autoSalary.baseSalary,
        presentDays: Math.round(autoSalary.totalAttendedDays),
        absentDays: autoSalary.absentDays,
        advanceCut,
        deduction,
        bonus,
        finalSalary,
        paymentDate: overrides?.markPaid ? new Date() : null,
        paymentMode: overrides?.markPaid ? overrides.paymentMode || "CASH" : null,
        isManual,
        remark: overrides?.remark?.trim() || null,
      },
      include: {
        staff: {
          select: {
            id: true,
            staffId: true,
            name: true,
            role: true,
            photo: true,
            mobile: true,
          },
        },
      },
    });

    return createdSalary;
  });

  return salary;
}
