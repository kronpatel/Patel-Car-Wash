"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/staff/login";

  useEffect(() => {
    if (status === "loading") return;

    // Login page handling: don't block unauthenticated staff from logging in
    if (isLoginPage) {
      if (status === "authenticated" && session?.user?.role === "staff") {
        router.push("/staff/dashboard");
      }
      return;
    }

    // Protected staff sub-routes
    if (status === "unauthenticated") {
      router.push("/staff/login");
    } else if (session?.user?.role !== "staff") {
      if (session?.user?.role === "admin") {
        router.push("/admin/employees");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router, isLoginPage]);

  if (status === "loading" && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-950">
        <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  return <>{children}</>;
}
