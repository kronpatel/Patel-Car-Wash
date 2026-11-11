"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Car,
  QrCode,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { IBooking, BookingStatus } from "@/types";
import { formatINR, cn } from "@/lib/utils";
import { SHOP_CONFIG } from "@/lib/constants";

interface BookingCardProps {
  booking: IBooking;
  onStatusChange?: (updatedBooking: IBooking) => void;
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; pulse?: boolean }
> = {
  confirmed: {
    label: "Confirmed",
    bg: "bg-neon-blue/15 text-neon-blue border-neon-blue/30",
  },
  in_progress: {
    label: "In Progress (In Bay)",
    bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    pulse: true,
  },
  ready: {
    label: "Ready for Pickup",
    bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    pulse: true,
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export default function BookingCard({
  booking,
  onStatusChange,
}: BookingCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);

  const statusInfo = STATUS_CONFIG[booking.status] || {
    label: booking.status,
    bg: "bg-charcoal-800 text-gray-300 border-white/10",
  };

  const handleCancel = async () => {
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

      setConfirmCancelDialog(false);
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
    <>
      {/* QR Code Pass Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-neon-blue/30 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-charcoal-800 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-heading font-bold text-white">
              Bay Check-In Pass
            </h3>
            <p className="text-xs text-neon-blue font-mono">
              {booking.bookingId}
            </p>

            {booking.qrCode && (
              <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg">
                <Image
                  src={booking.qrCode}
                  alt={`QR Pass for ${booking.bookingId}`}
                  width={170}
                  height={170}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            )}

            <div className="text-xs text-gray-300 space-y-1">
              <p className="font-semibold text-white">
                {booking.vehicleType} • {booking.vehicleNumber}
              </p>
              <p className="text-gray-400">
                {booking.date} at {booking.timeSlot}
              </p>
              <p className="text-emerald-400 font-semibold pt-1">
                Pay at counter: {formatINR(booking.finalPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Booking Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-5 hover:border-white/20 transition-all">
        {/* Top Header: ID & Status Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              ID:
            </span>
            <span className="font-heading font-bold text-neon-blue text-base">
              {booking.bookingId}
            </span>
          </div>

          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5",
              statusInfo.bg
            )}
          >
            {statusInfo.pulse && (
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            )}
            <span>{statusInfo.label}</span>
          </span>
        </div>

        {/* Service & Vehicle Info */}
        <div className="space-y-2">
          <h4 className="text-lg font-heading font-bold text-white">
            {booking.service}
          </h4>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
            <span className="px-2.5 py-0.5 rounded-lg bg-charcoal-800 border border-white/5 font-medium">
              {booking.plan}
            </span>
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-gold" />
              <span>{booking.vehicleType}</span>
            </span>
            <span className="font-mono uppercase text-gray-400">
              {booking.vehicleNumber}
            </span>
          </div>
        </div>

        {/* Schedule & Timing */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-charcoal-850/80 border border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neon-blue shrink-0" />
            <div>
              <p className="text-gray-400 text-[10px] uppercase">Date</p>
              <p className="font-semibold text-white">{booking.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neon-blue shrink-0" />
            <div>
              <p className="text-gray-400 text-[10px] uppercase">Slot</p>
              <p className="font-semibold text-white">{booking.timeSlot}</p>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[11px] text-gray-400">Payable at Workshop</p>
            <p className="text-xl font-heading font-black text-white">
              {formatINR(booking.finalPrice)}
            </p>
          </div>

          {booking.coinsUsed > 0 && (
            <span className="text-xs text-gold font-medium">
              Saved with {booking.coinsUsed} Clean Coins
            </span>
          )}
        </div>

        {/* Actions Row */}
        <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {booking.qrCode && booking.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-neon-blue" />
                <span>Show QR Pass</span>
              </button>
            )}

            <a
              href={SHOP_CONFIG.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-gray-400 hover:text-white border border-white/10 transition-colors"
              title="Get directions to CleanPro Studio"
            >
              <Share2 className="w-4 h-4" />
            </a>
          </div>

          {/* Cancel button if booking is confirmed */}
          {booking.status === "confirmed" && (
            <div>
              {confirmCancelDialog ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-semibold flex items-center gap-1"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Confirm Cancel"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancelDialog(false)}
                    className="px-2.5 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancelDialog(true)}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )}
        </div>

        {cancelError && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{cancelError}</span>
          </p>
        )}
      </div>
    </>
  );
}
