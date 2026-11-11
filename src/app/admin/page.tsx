import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBookings, countUsers } from "@/lib/jsonDb";
import AdminStats from "@/components/admin/AdminStats";
import BookingsTable from "@/components/admin/BookingsTable";
import { ShieldAlert, Sparkles, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Operations Workstation",
  description: "CleanPro Studio owner management terminal for live bay appointments, customer status & revenue.",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  // Strict Admin Role Guard
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const todayStr = new Date().toLocaleDateString("en-CA");

  // 1. Compute Admin KPI Telemetry
  const todayBookings = getBookings({ date: todayStr });
  const allBookings = getBookings();
  const totalCustomers = countUsers({ role: "customer" });

  const todayTotal = todayBookings.length;
  const todayCompleted = todayBookings.filter((b) => b.status === "completed").length;
  const pendingJobs = allBookings.filter((b) => b.status === "confirmed").length;
  const inProgressJobs = allBookings.filter((b) => b.status === "in_progress").length;

  const todayRevenue = todayBookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

  const totalRevenue = allBookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

  const stats = {
    todayTotal,
    todayCompleted,
    pendingJobs,
    inProgressJobs,
    todayRevenue,
    totalRevenue,
    totalCustomers,
  };

  const initialBookings = allBookings;

  return (
    <div className="w-full py-10 sm:py-16">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-10">
        {/* Operations Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gold/30 bg-charcoal-850/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Owner Operations Station</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white">
              Studio Command Center
            </h1>
            <p className="text-sm text-gray-400">
              Logged in as Master Administrator ({session.user.name})
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-charcoal-900 border border-white/10 text-xs text-gray-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Bay 1, 2, 3 Active • Live Auto-Sync</span>
          </div>
        </div>

        {/* Real-time KPI Stats Cards */}
        <AdminStats stats={stats} />

        {/* Interactive Bookings Dispatcher Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              <span>Appointment Dispatcher</span>
            </h2>
            <span className="text-xs text-gray-400">
              Total Recorded Jobs: {allBookings.length}
            </span>
          </div>

          <BookingsTable initialBookings={initialBookings} />
        </div>
      </div>
    </div>
  );
}
