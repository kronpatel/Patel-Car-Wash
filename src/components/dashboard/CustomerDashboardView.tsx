"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Coins,
  Gift,
  Copy,
  Check,
  Plus,
  Car,
  Clock,
  Sparkles,
  History,
} from "lucide-react";
import { IBooking, ICoinTransaction } from "@/types";
import { formatINR } from "@/lib/utils";
import { LOYALTY_RULES } from "@/lib/constants";
import HistoryRow from "./HistoryRow";
import CoinHistory from "./CoinHistory";

interface CustomerDashboardViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cleanCoins: number;
    referralCode: string;
  };
  initialBookings: IBooking[];
  initialTransactions: ICoinTransaction[];
}

export default function CustomerDashboardView({
  user,
  initialBookings,
  initialTransactions,
}: CustomerDashboardViewProps) {
  const [bookings, setBookings] = useState<IBooking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "coins">(
    "upcoming"
  );
  const [copiedReferral, setCopiedReferral] = useState(false);

  const upcomingBookings = bookings.filter((b) =>
    ["confirmed", "in_progress", "ready"].includes(b.status)
  );

  const pastBookings = bookings.filter((b) =>
    ["completed", "cancelled"].includes(b.status)
  );

  const rupeeWorth = Math.floor(
    user.cleanCoins * LOYALTY_RULES.COIN_REDEMPTION_VALUE
  );

  const handleCopyReferral = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const handleStatusChange = (updated: IBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === updated._id ? updated : b))
    );
  };

  return (
    <div className="space-y-10">
      {/* Top Banner: Greeting & Quick Booking CTA */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <span className="text-xs font-semibold text-neon-blue uppercase tracking-wider">
            Customer Workstation
          </span>
          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white">
            Hello, {user.name}
          </h1>
          <p className="text-sm text-gray-400">
            {user.email} • {user.phone}
          </p>
        </div>

        <Link
          href="/book"
          className="neon-glow-btn px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-neon-md relative z-10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Wash</span>
        </Link>
      </div>

      {/* KPI & Loyalty Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clean Coins Card */}
        <div className="glass-panel p-6 rounded-3xl border border-gold/30 bg-charcoal-850/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-gold">
              Loyalty Rewards
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-heading font-black text-white">
              {user.cleanCoins.toLocaleString("en-IN")}
            </span>
            <span className="text-base text-gold font-medium">Clean Coins</span>
          </div>

          <p className="text-xs text-gray-300">
            Worth <strong className="text-gold">{formatINR(rupeeWorth)}</strong>{" "}
            instant discount on your upcoming washes (100 coins = ₹50).
          </p>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Earning rate: 10 coins / ₹100 spent</span>
            <button
              onClick={() => setActiveTab("coins")}
              className="text-neon-blue hover:underline font-semibold"
            >
              View Statement
            </button>
          </div>
        </div>

        {/* Referral Program Card */}
        <div className="glass-panel p-6 rounded-3xl border border-neon-blue/30 bg-charcoal-850/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-neon-blue">
              Invite &amp; Earn
            </span>
            <div className="w-10 h-10 rounded-2xl bg-neon-blue/15 text-neon-blue border border-neon-blue/30 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-2 p-3 rounded-2xl bg-charcoal-900 border border-white/10">
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-semibold">
                Your Referral Code
              </p>
              <p className="text-lg font-mono font-bold text-white tracking-widest">
                {user.referralCode || "PATELSPA"}
              </p>
            </div>

            <button
              onClick={handleCopyReferral}
              className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-neon-blue hover:text-charcoal-950 text-xs font-semibold text-gray-200 transition-colors flex items-center gap-1.5 border border-white/10"
            >
              {copiedReferral ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-300">
            Share this code with friends. When they register, you both receive{" "}
            <span className="text-gold font-bold">50 Clean Coins</span>!
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "upcoming"
              ? "bg-neon-blue text-charcoal-950 shadow-neon-sm"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Active Bookings</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-950/20">
            {upcomingBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "history"
              ? "bg-neon-blue text-charcoal-950 shadow-neon-sm"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Wash History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-950/20">
            {pastBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("coins")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "coins"
              ? "bg-neon-blue text-charcoal-950 shadow-neon-sm"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Coins Statement</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "upcoming" && (
        <div className="space-y-6">
          {upcomingBookings.length > 0 ? (
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden divide-y divide-white/10 shadow-2xl">
              {/* Desktop Table/List Header */}
              <div className="hidden md:flex items-center justify-between gap-6 py-3 px-6 bg-charcoal-850/90 text-gray-400 font-mono text-[10px] uppercase tracking-wider font-semibold border-b border-white/10">
                <span className="flex-1">Service &amp; Vehicle</span>
                <span className="min-w-[210px] text-left">Schedule</span>
                <span className="min-w-[200px] flex items-center justify-between">
                  <span>Payable</span>
                  <span>Status</span>
                </span>
                <span className="min-w-[220px] text-right">Actions</span>
              </div>

              {upcomingBookings.map((b) => (
                <HistoryRow
                  key={b._id}
                  booking={b}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center border border-white/5 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-charcoal-800 text-neon-blue flex items-center justify-center mx-auto">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-heading font-bold text-white">
                No Active Bookings
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                You don&apos;t have any washes scheduled right now. Book an
                appointment online in under 60 seconds with zero upfront payment.
              </p>
              <Link
                href="/book"
                className="neon-glow-btn px-6 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <span>Book a Wash Bay</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          {pastBookings.length > 0 ? (
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden divide-y divide-white/10 shadow-2xl">
              {/* Desktop Table/List Header */}
              <div className="hidden md:flex items-center justify-between gap-6 py-3 px-6 bg-charcoal-850/90 text-gray-400 font-mono text-[10px] uppercase tracking-wider font-semibold border-b border-white/10">
                <span className="flex-1">Service &amp; Vehicle</span>
                <span className="min-w-[210px] text-left">Schedule</span>
                <span className="min-w-[200px] flex items-center justify-between">
                  <span>Amount</span>
                  <span>Status</span>
                </span>
                <span className="min-w-[220px] text-right">Actions</span>
              </div>

              {pastBookings.map((b) => (
                <HistoryRow
                  key={b._id}
                  booking={b}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center border border-white/5 space-y-3">
              <History className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-base font-heading font-bold text-white">
                No Past Wash Records
              </h3>
              <p className="text-xs text-gray-400">
                Completed and past appointments will be catalogued here for your
                records.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Coins Tab Panel */}
      {activeTab === "coins" && (
        <div className="space-y-6">
          <CoinHistory transactions={initialTransactions} />
        </div>
      )}
    </div>
  );
}
