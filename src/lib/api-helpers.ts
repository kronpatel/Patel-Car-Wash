import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidMobile, isValidStaffRole, isValidEmail } from "@/lib/validators";
import type { StaffStatus } from "@/types/staff";

/**
 * Standard API response wrapper - 200 OK
 */
export function apiSuccess<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

/**
 * Standard API response wrapper - 201 Created
 */
export function apiCreated<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message }, { status: 201 });
}

/**
 * Standard API error response wrapper
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Check if request is from admin
 * Returns NextAuth session or null
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export interface StaffValidationResult {
  valid: boolean;
  error?: string;
  data?: {
    name?: string;
    email?: string;
    mobile?: string;
    address?: string | null;
    joiningDate?: Date;
    role?: string;
    photo?: string | null;
    baseSalary?: number;
    status?: StaffStatus;
  };
}

/**
 * Validate staff input (used by POST and PUT)
 * Returns { valid: true, data: sanitizedData } or { valid: false, error: string }
 */
export function validateStaffInput(
  input: Record<string, unknown>,
  isUpdate: boolean = false
): StaffValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Invalid request payload" };
  }

  const { name, email, mobile, address, joiningDate, role, photo, baseSalary, status } = input;
  const sanitized: StaffValidationResult["data"] = {};

  // 1. Name validation
  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return { valid: false, error: "Name must be at least 2 characters long." };
    }
    sanitized.name = name.trim();
  }

  // 2. Email validation
  if (!isUpdate || email !== undefined) {
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return { valid: false, error: "Please enter a valid email address" };
    }
    sanitized.email = email.trim().toLowerCase();
  }

  // 3. Mobile validation
  if (!isUpdate || mobile !== undefined) {
    if (!mobile || typeof mobile !== "string" || !isValidMobile(mobile)) {
      return { valid: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }
    sanitized.mobile = mobile.replace(/[\s\-()]/g, "").replace(/^(\+91|91)/, "");
  }

  // 3. Address
  if (address !== undefined) {
    sanitized.address = typeof address === "string" ? address.trim() : null;
  }

  // 4. Joining Date validation
  if (!isUpdate || joiningDate !== undefined) {
    if (!joiningDate) {
      return { valid: false, error: "Joining date is required." };
    }
    const parsedDate = new Date(joiningDate as string | number | Date);
    if (isNaN(parsedDate.getTime())) {
      return { valid: false, error: "Invalid joining date format." };
    }
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (parsedDate > endOfToday) {
      return { valid: false, error: "Joining date cannot be in the future." };
    }
    sanitized.joiningDate = parsedDate;
  }

  // 5. Role validation
  if (!isUpdate || role !== undefined) {
    if (!role || typeof role !== "string" || !isValidStaffRole(role)) {
      return { valid: false, error: `Invalid staff role: ${role}` };
    }
    sanitized.role = role.trim();
  }

  // 6. Photo
  if (photo !== undefined) {
    sanitized.photo = typeof photo === "string" && photo ? photo : null;
  }

  // 7. Base Salary validation
  if (!isUpdate || baseSalary !== undefined) {
    const numSalary = Number(baseSalary);
    if (isNaN(numSalary) || numSalary < 0) {
      return { valid: false, error: "Base salary must be a positive number." };
    }
    sanitized.baseSalary = numSalary;
  }

  // 8. Status validation (only on update)
  if (status !== undefined) {
    const validStatuses: StaffStatus[] = ["ACTIVE", "INACTIVE", "ON_LEAVE"];
    if (!validStatuses.includes(status as StaffStatus)) {
      return { valid: false, error: `Invalid status: ${status}` };
    }
    sanitized.status = status as StaffStatus;
  }

  return { valid: true, data: sanitized };
}
