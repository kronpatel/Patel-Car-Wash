import { prisma } from "./prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

/**
 * Generate next sequential Booking ID: CW-YYYY-XXXX
 * Queries recent bookings for the current year to extract the maximum sequence number and increment it.
 * This prevents duplicate key collisions (P2002) after record deletions or concurrent requests.
 *
 * Example:
 * If bookings CW-2026-0001, CW-2026-0002, CW-2026-0005 exist (and 0003, 0004 were deleted),
 * the next generated ID will be CW-2026-0006.
 */
export async function getNextBookingId(tx?: PrismaExecutor): Promise<string> {
  const client = tx || prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `CW-${currentYear}-`;

  const recentBookings = await client.booking.findMany({
    where: { bookingId: { startsWith: prefix } },
    orderBy: { bookingId: "desc" },
    take: 10,
    select: { bookingId: true },
  });

  let maxNum = 0;
  for (const b of recentBookings) {
    const parts = b.bookingId.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}
