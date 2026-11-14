import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Rate Limiting (Brute-Force Protection) ───
  // Apply to /api/staff/scan and /api/auth/callback/credentials (NextAuth Login)
  if (
    pathname.startsWith("/api/staff/scan") ||
    pathname.startsWith("/api/auth/callback/credentials")
  ) {
    const ip = getClientIp(req);
    const rateKey = `rate:${ip}:${pathname}`;
    const windowMs =
      typeof process !== "undefined" && process.env?.RATE_LIMIT_WINDOW_MS
        ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000
        : 15 * 60 * 1000;
    const rateLimit = checkRateLimit(rateKey, 5, windowMs); // 5 attempts per window per IP

    if (!rateLimit.success) {
      const minutes = Math.max(1, Math.ceil(rateLimit.retryAfter / 60));
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Please try again after ${minutes} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.retryAfter.toString(),
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token?.role as string | undefined) || "";

  // ─── Protect /staff (Except public attendance scan) ───
  // Only staff may enter protected staff routes. Customers/admins are bounced.
  if (pathname.startsWith("/staff")) {
    if (pathname.startsWith("/staff/attendance/scan")) {
      return NextResponse.next();
    }
    if (!token) {
      return NextResponse.redirect(
        new URL("/login?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    }
    if (role !== "staff") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ─── Protect /admin ───
  // Only admins may enter. Unauthenticated go to login; staff go to staff dashboard;
  // customers go to the customer dashboard.
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/login?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    }
    if (role === "staff") {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/staff/:path*",
    "/admin/:path*",
    "/api/staff/scan",
    "/api/auth/callback/:path*",
  ],
};
