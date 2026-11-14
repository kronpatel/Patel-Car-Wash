import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import type { AttendanceQR } from "@prisma/client";

/**
 * Generate a unique secure token (crypto-random)
 * Length: 32 chars hex
 */
export function generateQRToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Build the full scan URL for a token
 * Uses NEXT_PUBLIC_BASE_URL or falls back to http://localhost:3002
 * Example: `${baseUrl}/staff/attendance/scan?token=${token}`
 */
export function buildScanURL(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3002";
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/staff/attendance/scan?token=${encodeURIComponent(token)}`;
}

/**
 * Generate QR code as Data URL (base64 PNG)
 * Input: token or full URL
 * Output: "data:image/png;base64,..." string
 * Options: error correction H, width 400, dark color #0ea5e9 (neon blue), light #0a0a0a (dark theme bg)
 */
export async function generateQRDataURL(token: string): Promise<string> {
  const payload = token.startsWith("http://") || token.startsWith("https://")
    ? token
    : buildScanURL(token);

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    width: 400,
    margin: 2,
    color: {
      dark: "#0ea5e9", // neon blue
      light: "#0a0a0a", // dark theme bg
    },
  });
}

/**
 * Calculate expiry date from days
 * Input: days (e.g. 30)
 * Output: Date object (current time + days)
 */
export function calculateExpiry(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get currently active QR (latest active + not expired)
 * Returns AttendanceQR or null
 */
export async function getActiveQR(): Promise<AttendanceQR | null> {
  return prisma.attendanceQR.findFirst({
    where: {
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Validate QR token
 * Returns:
 * - { valid: true, qr: AttendanceQR }
 * - { valid: false, reason: "NOT_FOUND" | "INACTIVE" | "EXPIRED" }
 */
export async function validateQRToken(
  token: string
): Promise<
  | { valid: true; qr: AttendanceQR }
  | { valid: false; reason: "NOT_FOUND" | "INACTIVE" | "EXPIRED" }
> {
  const qr = await prisma.attendanceQR.findUnique({
    where: { token },
  });

  if (!qr) {
    return { valid: false, reason: "NOT_FOUND" };
  }

  if (!qr.isActive) {
    return { valid: false, reason: "INACTIVE" };
  }

  if (qr.expiresAt < new Date()) {
    // Auto-mark as inactive if found expired
    await prisma.attendanceQR.update({
      where: { id: qr.id },
      data: { isActive: false },
    }).catch(() => null);

    return { valid: false, reason: "EXPIRED" };
  }

  return { valid: true, qr };
}

/**
 * Auto-deactivate expired QRs (background cleanup)
 * Call this before generating new QR
 * Returns count of deactivated
 */
export async function deactivateExpiredQRs(): Promise<number> {
  const result = await prisma.attendanceQR.updateMany({
    where: {
      isActive: true,
      expiresAt: {
        lte: new Date(),
      },
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
}
