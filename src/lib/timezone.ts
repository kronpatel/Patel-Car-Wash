/**
 * Timezone utilities for Indian Standard Time (IST - Asia/Kolkata)
 * Ensures 100% accurate time calculation and comparison across local development,
 * CI/CD pipelines, Docker containers, and UTC cloud hosting environments (Vercel, AWS, etc.).
 */

import { LATE_MARK_TIME } from "./constants";

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Get hours, minutes, and total minutes of a given Date in IST timezone.
 * Uses Intl.DateTimeFormat with Asia/Kolkata for deterministic results regardless of system timezone.
 */
export function getCurrentISTTime(date: Date = new Date()): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  timeString: string;
} {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minutes = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

  const displayFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    timeString: displayFormatter.format(date),
  };
}

/**
 * Parse a "HH:MM" 24-hour time string into total minutes from midnight (0 to 1439).
 * E.g. "09:30" => 9 * 60 + 30 = 570.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) {
    return 570; // fallback to 09:30 (570 mins)
  }
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

/**
 * Determine attendance status ("PRESENT" | "LATE") based on punch-in time in IST.
 * If current time <= late mark time -> "PRESENT", else -> "LATE".
 */
export function getAttendanceStatus(
  currentMinutes: number,
  lateMarkTime: string = LATE_MARK_TIME
): "PRESENT" | "LATE" {
  const lateMarkMinutes = parseTimeToMinutes(lateMarkTime);
  return currentMinutes <= lateMarkMinutes ? "PRESENT" : "LATE";
}

/**
 * Check if a given Date is after the late mark threshold in IST.
 */
export function isLatePunchIn(
  currentTime: Date = new Date(),
  lateMarkTimeStr: string = LATE_MARK_TIME
): boolean {
  const { totalMinutes } = getCurrentISTTime(currentTime);
  const lateMarkMinutes = parseTimeToMinutes(lateMarkTimeStr);
  return totalMinutes > lateMarkMinutes;
}

/**
 * Get normalized start of day (00:00:00.000Z) corresponding to the calendar date in IST.
 * This guarantees that Prisma `staffId_date` unique constraint works identically
 * whether punched at 12:01 AM IST or 11:59 PM IST.
 */
export function getTodayDateIST(date: Date = new Date()): Date {
  const istDateString = date.toLocaleDateString("en-CA", {
    timeZone: IST_TIMEZONE,
  }); // Returns YYYY-MM-DD
  return new Date(`${istDateString}T00:00:00.000Z`);
}

/**
 * Format a Date object to IST 12-hour time string (e.g. "09:15 AM").
 */
export function formatISTTime(
  date: Date = new Date(),
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }
): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    ...options,
  }).format(date);
}

/**
 * Format a Date object to IST date string (e.g. "14 Nov 2026").
 */
export function formatISTDate(
  date: Date = new Date(),
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    ...options,
  }).format(date);
}
