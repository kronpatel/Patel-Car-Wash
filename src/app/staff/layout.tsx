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

  const isScanPage = pathname === "/staff/attendance/scan";

  useEffect(() => {
    // Exclude scan page from auth redirects
    if (isScanPage || status === "loading") return;

    // Protected staff sub-routes
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "staff") {
      if (session?.user?.role === "admin") {
        router.push("/admin/employees");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router, isScanPage]);

  // Immediately render public scan page without auth blocking/spinner
  if (isScanPage) {
    return <>{children}</>;
  }

  // Loading state for protected staff routes
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-950">
        <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  return <>{children}</>;
}
