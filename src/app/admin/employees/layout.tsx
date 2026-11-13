"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminEmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/employees");
      return;
    }

    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-3xl glass-panel bg-charcoal-850/80 border border-white/10 shadow-2xl flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-neon-blue" />
          <p className="text-sm font-medium text-gray-300">
            Verifying Administrator Privileges...
          </p>
        </div>
      </div>
    );
  }

  // Unauthorized state (prevents flashing content before redirect)
  if (!session?.user || session.user.role !== "admin") {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="p-6 rounded-3xl glass-panel bg-charcoal-850/80 border border-red-500/20 shadow-2xl flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="w-10 h-10 text-red-400" />
          <h2 className="text-lg font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-gray-400 max-w-xs">
            Redirecting to authorized dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
