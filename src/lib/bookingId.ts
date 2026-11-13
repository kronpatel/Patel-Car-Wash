import { prisma } from "./prisma";

export async function getNextBookingId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const countThisYear = await prisma.booking.count({
    where: { bookingId: { startsWith: `CW-${currentYear}-` } },
  });
  return `CW-${currentYear}-${String(countThisYear + 1).padStart(4, "0")}`;
}
