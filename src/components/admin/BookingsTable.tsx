"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Car,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Phone,
  MessageCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { IBooking, BookingStatus } from "@/types";
import { formatINR, cn } from "@/lib/utils";

interface BookingsTableProps {
  initialBookings: IBooking[];
  onStatsRefresh?: () => void;
}

const STATUS_TABS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All Bookings" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_progress", label: "In Progress" },
  { id: "ready", label: "Ready for Pickup" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsTable({
  initialBookings,
  onStatsRefresh,
}: BookingsTableProps) {
  const [bookings, setBookings] = useState<IBooking[]>(initialBookings);
  const [filterStatus, setFilterStatus] = useState<"all" | BookingStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fetchLatestBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (data.success && data.bookings) {
        setBookings(data.bookings);
        if (onStatsRefresh) onStatsRefresh();
      }
    } catch (e) {
      console.error("Failed to refresh bookings:", e);
    }
  };

  // Step 1: Mark Ready (Triggers WhatsApp notification #2)
  const handleMarkReady = async (booking: IBooking) => {
    setLoadingActionId(booking._id);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/bookings/${booking._id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ready" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionNotice({
          text: data.error || "Failed to mark ready",
          type: "error",
        });
      } else {
        setActionNotice({
          text: `Vehicle marked ready! WhatsApp alert sent to ${booking.customerName}.`,
          type: "success",
        });
        setBookings((prev) =>
          prev.map((b) => (b._id === booking._id ? data.booking : b))
        );
      }
    } catch {
      setActionNotice({ text: "Network error", type: "error" });
    } finally {
      setLoadingActionId(null);
    }
  };

  // Step 2: Mark Completed (Credits Clean Coins to customer)
  const handleMarkCompleted = async (booking: IBooking) => {
    setLoadingActionId(booking._id);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/bookings/${booking._id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "completed" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionNotice({
          text: data.error || "Failed to mark completed",
          type: "error",
        });
      } else {
        setActionNotice({
          text: `Booking ${booking.bookingId} completed! Credited ${data.earnedCoins || 0} Clean Coins to customer.`,
          type: "success",
        });
        setBookings((prev) =>
          prev.map((b) => (b._id === booking._id ? data.booking : b))
        );
      }
    } catch {
      setActionNotice({ text: "Network error", type: "error" });
    } finally {
      setLoadingActionId(null);
    }
  };

  // Move directly to In Progress
  const handleMoveToBay = async (booking: IBooking) => {
    setLoadingActionId(booking._id);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionNotice({
          text: data.error || "Failed to update status",
          type: "error",
        });
      } else {
        setActionNotice({
          text: `Job ${booking.bookingId} moved to active wash bay.`,
          type: "success",
        });
        setBookings((prev) =>
          prev.map((b) => (b._id === booking._id ? data.booking : b))
        );
      }
    } catch {
      setActionNotice({ text: "Network error", type: "error" });
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter =
      filterStatus === "all" ? true : b.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      q === "" ||
      b.bookingId.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q) ||
      b.vehicleNumber.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm ${
            actionNotice.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs hover:underline uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-panel border border-white/10 w-full lg:w-auto overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = filterStatus === tab.id;
            const count =
              tab.id === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-neon-blue text-charcoal-950 shadow-neon-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-charcoal-950/20 text-charcoal-950"
                      : "bg-charcoal-800 text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, customer, plate..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <button
            onClick={fetchLatestBookings}
            title="Refresh bookings list"
            className="p-2 rounded-xl glass-panel text-gray-300 hover:text-neon-blue border border-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300 border-collapse">
            <thead>
              <tr className="bg-charcoal-850/90 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10 text-[10px]">
                <th className="py-4 px-5">Booking ID &amp; Plan</th>
                <th className="py-4 px-5">Customer &amp; Contact</th>
                <th className="py-4 px-5">Vehicle &amp; Service</th>
                <th className="py-4 px-5">Schedule</th>
                <th className="py-4 px-5">Payable</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Owner Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const isActionLoading = loadingActionId === b._id;
                  const rawWaPhone = b.customerPhone.replace(/[^0-9]/g, "");

                  return (
                    <tr
                      key={b._id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Booking ID & Plan */}
                      <td className="py-4 px-5">
                        <p className="font-heading font-bold text-white text-sm">
                          {b.bookingId}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-charcoal-800 text-neon-blue border border-neon-blue/20">
                          {b.plan}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <p className="font-semibold text-white">
                          {b.customerName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                          <span>{b.customerPhone}</span>
                          <a
                            href={`https://wa.me/${rawWaPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Vehicle & Service */}
                      <td className="py-4 px-5">
                        <p className="font-semibold text-white">
                          {b.vehicleType}
                        </p>
                        <p className="font-mono uppercase text-gray-400 text-[11px]">
                          {b.vehicleNumber}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {b.service}
                        </p>
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-5">
                        <p className="font-medium text-white">{b.date}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          {b.timeSlot}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-5">
                        <p className="font-heading font-bold text-white text-sm">
                          {formatINR(b.finalPrice)}
                        </p>
                        {b.coinsUsed > 0 && (
                          <p className="text-[10px] text-gold">
                            -{b.coinsUsed} coins used
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500">Pay at shop</p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                            b.status === "confirmed" &&
                              "bg-neon-blue/15 text-neon-blue border-neon-blue/30",
                            b.status === "in_progress" &&
                              "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse",
                            b.status === "ready" &&
                              "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse",
                            b.status === "completed" &&
                              "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                            b.status === "cancelled" &&
                              "bg-red-500/10 text-red-400 border-red-500/20"
                          )}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === "confirmed" && (
                            <>
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleMoveToBay(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 text-white text-[11px] font-medium border border-white/10"
                              >
                                To Bay
                              </button>

                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleMarkReady(b)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1"
                              >
                                {isActionLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <span>Mark Ready</span>
                                    <MessageCircle className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </>
                          )}

                          {b.status === "in_progress" && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleMarkReady(b)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1"
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <span>Mark Ready</span>
                                  <MessageCircle className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}

                          {b.status === "ready" && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleMarkCompleted(b)}
                              className="neon-glow-btn px-3 py-1.5 rounded-lg text-charcoal-950 text-[11px] font-bold flex items-center gap-1 shadow-neon-sm"
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Completed &amp; Credit Coins</span>
                                </>
                              )}
                            </button>
                          )}

                          {b.status === "completed" && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 justify-end font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Paid &amp; Finalized</span>
                            </span>
                          )}

                          {b.status === "cancelled" && (
                            <span className="text-[11px] text-gray-500">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No bookings found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
