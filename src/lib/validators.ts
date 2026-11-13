import { STAFF_ROLES } from "./constants";
import { format, parseISO } from "date-fns";

/**
 * Check if mobile number is valid Indian number
 * Rules: 10 digits, starts with 6-9
 */
export function isValidMobile(mobile: string): boolean {
  if (!mobile) return false;
  // Clean spaces, hyphens, and optional +91 prefix
  const cleaned = mobile.replace(/[\s\-()]/g, "").replace(/^(\+91|91)/, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Check if password is valid
 * Rules: minimum 6 characters
 */
export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.trim().length >= 6;
}

/**
 * Generate next staff ID
 * Input: current staff count (e.g. 5)
 * Output: "EMP006"
 */
export function generateStaffId(currentCount: number): string {
  const nextNumber = Math.max(1, currentCount + 1);
  return `EMP${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Check if role is valid staff role
 */
export function isValidStaffRole(role: string): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * Format currency in INR
 * Example: 15000 → "₹15,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to readable format
 * Example: "2026-11-14" → "14 Nov 2026"
 */
export function formatDate(date: Date | string): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (isNaN(d.getTime())) {
      const fallback = new Date(date);
      return isNaN(fallback.getTime()) ? String(date) : format(fallback, "d MMM yyyy");
    }
    return format(d, "d MMM yyyy");
  } catch {
    return String(date);
  }
}
