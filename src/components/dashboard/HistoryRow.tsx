"use client";

import React, { useState } from "react";
import {
  Calendar,
  QrCode,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { IBooking, BookingStatus } from "@/types";
import { formatINR, cn } from "@/lib/utils";

interface HistoryRowProps {
  booking: IBooking;
  onStatusChange?: (updatedBooking: IBooking) => void;
  onShowQrPass: (booking: IBooking) => void;
}

// Minimal Status Configuration: Colored dot + font-mono text, NO heavy background pills
const STATUS_MAP: Record<
  BookingStatus,
  { label: string; dotClass: string; textClass: string; pulse?: boolean }
> = {
  confirmed: {
    label: "Confirmed",
    dotClass: "bg-neon-blue",
    textClass: "text-neon-blue",
  },
  in_progress: {
    label: "In Progress",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    pulse: true,
  },
  ready: {
    label: "Ready for Pickup",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-400",
    pulse: true,
  },
  completed: {
    label: "Completed",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-300",
  },
  cancelled: {
    label: "Cancelled",
    dotClass: "bg-red-400",
    textClass: "text-red-400",
  },
};

function StatusIndicator({ status }: { status: BookingStatus }) {
  const cfg = STATUS_MAP[status] || {
    label: status,
    dotClass: "bg-gray-400",
    textClass: "text-gray-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono font-medium shrink-0",
        cfg.textClass
      )}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              cfg.dotClass
            )}
          />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", cfg.dotClass)}
        />
      </span>
      <span>{cfg.label}</span>
    </div>
  );
}

export default function HistoryRow({
  booking,
  onStatusChange,
  onShowQrPass,
}: HistoryRowProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const isCancelled = booking.status === "cancelled";
  const isCancellable = booking.status === "confirmed";
  const hasQrPass = Boolean(booking.qrCode) && !isCancelled;

  const handleCancelClick = () => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      handleCancelBooking();
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    setCancelError("");

    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.error || "Failed to cancel booking");
        setIsCancelling(false);
        return;
      }

      if (onStatusChange && data.booking) {
        onStatusChange(data.booking);
      }
    } catch {
      setCancelError("Network error while cancelling");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="py-4 px-4 sm:px-6 hover:bg-white/[0.02] transition-colors">
      {/* DESKTOP ROW (md and up) */}
      <div className="hidden md:flex items-center justify-between gap-6">
        {/* Left Section: Service Name + Booking ID & Vehicle Number (monospace) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-bold text-white text-base truncate">
              {booking.service}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-charcoal-800 border border-white/10 text-gray-400">
              {booking.plan}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-1">
            <span className="text-neon-blue font-semibold">
              {booking.bookingId}
            </span>
            <span className="text-gray-600">•</span>
            <span className="uppercase text-gray-300">
              {booking.vehicleNumber}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">{booking.vehicleType}</span>
          </div>
        </div>

        {/* Middle Section: Date and Time Slot */}
        <div className="shrink-0 min-w-[210px] text-left">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span>{booking.date}</span>
            <span className="text-gray-600">|</span>
            <span>{booking.timeSlot}</span>
          </div>
        </div>

        {/* Right Section: Price & Minimal Status Badge */}
        <div className="shrink-0 flex items-center gap-5 min-w-[200px] justify-between">
          <span className="font-mono font-bold text-white text-base">
            {formatINR(booking.finalPrice)}
          </span>
          <StatusIndicator status={booking.status} />
        </div>

        {/* Action: Buttons aligned to the far right */}
        <div className="shrink-0 flex items-center justify-end gap-2 min-w-[220px]">
          {isCancellable && (
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancelClick}
              className="px-3 py-1.5 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Cancel this appointment"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Cancel Booking</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onShowQrPass(booking)}
            className="px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-gray-200 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-neon-blue" />
            <span>{hasQrPass ? "Show QR Pass" : "View Details"}</span>
          </button>
        </div>
      </div>

      {/* MOBILE ROW (< md) */}
      <div className="flex md:hidden flex-col gap-2.5">
        {/* Top: Service Name + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-heading font-bold text-white text-sm truncate">
              {booking.service}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 mt-0.5">
              <span className="text-neon-blue font-semibold">
                {booking.bookingId}
              </span>
              <span className="text-gray-600">•</span>
              <span>{booking.plan}</span>
            </div>
          </div>
          <StatusIndicator status={booking.status} />
        </div>

        {/* Middle: Date, Time, and Vehicle Number */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-300">
          <span>{booking.date}</span>
          <span className="text-gray-600">|</span>
          <span>{booking.timeSlot}</span>
          <span className="text-gray-600">•</span>
          <span className="uppercase text-gray-200">
            {booking.vehicleNumber}
          </span>
        </div>

        {/* Bottom: Price and View Details + Cancel buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div>
            <p className="text-[10px] uppercase font-mono text-gray-500">
              Payable
            </p>
            <p className="font-mono font-bold text-white text-sm">
              {formatINR(booking.finalPrice)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCancellable && (
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelClick}
                className="px-2.5 py-1.5 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}

            <button
              type="button"
              onClick={() => onShowQrPass(booking)}
              className="px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-gray-200 text-xs font-medium flex items-center gap-1.5 border border-white/10"
            >
              <QrCode className="w-3.5 h-3.5 text-neon-blue" />
              <span>{hasQrPass ? "Show QR Pass" : "View Details"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Cancel Error if failed */}
      {cancelError && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}
    </div>
  );
}
