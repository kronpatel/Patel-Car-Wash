import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const role = (token?.role as string | undefined) || "";

  // ─── Protect /staff/dashboard ───
  // Only staff may enter. Customers/admins are bounced to their own dashboard.
  if (pathname.startsWith("/staff/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
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
  matcher: ["/staff/dashboard/:path*", "/admin/:path*"],
};
