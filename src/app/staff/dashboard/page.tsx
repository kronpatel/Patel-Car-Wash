"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, User, Shield, Phone, Mail, Sparkles, Loader2 } from "lucide-react";

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
      </div>
    );
  }

  const staffUser = session?.user;

  return (
    <div className="min-h-screen bg-charcoal-950 p-6 md:p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-heading">
              Staff Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Patel Car&apos;spa & Detailing Studio • Employee Portal
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-charcoal-850 border border-white/10 shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue font-bold text-xl">
                  {staffUser?.name ? staffUser.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Welcome back, {staffUser?.name || "Staff Member"}!
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
                      <Shield className="w-3 h-3" />
                      {staffUser?.role?.toUpperCase() || "STAFF"}
                    </span>
                    {staffUser?.staffId && (
                      <span className="text-xs text-gray-400 font-mono">
                        ID: {staffUser.staffId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Logged In
              </div>
            </div>

            {/* Profile Quick Info */}
            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Email:</span>
                <span className="text-white font-medium">{staffUser?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Mobile:</span>
                <span className="text-white font-medium">{staffUser?.phone || staffUser?.mobile || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Under Construction Notice */}
          <div className="p-6 rounded-2xl bg-charcoal-900/60 border border-white/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Upcoming Modules in Development
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Attendance QR scanning (with 100m geo-fence validation), monthly salary slip reviews, and advance deduction logs will be live in Phase 4.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
