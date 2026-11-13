"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Download, QrCode, Car, Ban, Calendar, Clock, ShieldAlert } from "lucide-react";
import { IBooking } from "@/types";
import { formatINR } from "@/lib/utils";

interface QrPassModalProps {
  booking: IBooking | null;
  onClose: () => void;
}

export default function QrPassModal({ booking, onClose }: QrPassModalProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure portal only mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key while modal is active
  useEffect(() => {
    if (!booking) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [booking, onClose]);

  if (!mounted || !booking) return null;

  const isCancelled = booking.status === "cancelled";

  // Trigger download of the base64 QR code image (only for valid passes)
  const handleDownloadQr = () => {
    if (!booking.qrCode) return;
    const link = document.createElement("a");
    link.href = booking.qrCode;
    link.download = `PatelCarSpa-QR-${booking.bookingId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 sm:p-6 bg-[#111114] border border-white/10 shadow-2xl relative text-center space-y-3.5 my-auto max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Title + Close Button */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 text-left">
          <div className="min-w-0 flex-1 pr-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-widest font-semibold block ${
                isCancelled ? "text-red-400" : "text-neon-blue"
              }`}
            >
              {isCancelled ? "Cancelled Appointment" : "Express Bay Pass"}
            </span>
            <h3 className="text-base sm:text-lg font-heading font-bold text-white tracking-tight truncate mt-0.5">
              {booking.service}
            </h3>
            <p className="font-mono text-xs text-gray-400 mt-0.5">
              ID: <span className="text-white font-semibold">{booking.bookingId}</span> • {booking.plan}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Modal"
            className="w-8 h-8 rounded-full bg-charcoal-800 hover:bg-charcoal-700 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CASE A: CANCELLED BOOKING (NO QR CODE, DETAILS ONLY)
            ───────────────────────────────────────────────────────────── */}
        {isCancelled ? (
          <>
            {/* Cancelled Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-red-300 text-xs sm:text-sm">
                  Booking Cancelled
                </p>
                <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                  QR check-in pass is void. No payment required.
                </p>
              </div>
            </div>

            {/* Structured Details Grid */}
            <div className="p-3.5 rounded-2xl bg-charcoal-850/80 border border-white/5 space-y-2 text-xs font-mono text-left">
              <div className="flex items-center justify-between text-gray-300">
                <span className="text-gray-500">Vehicle</span>
                <span className="text-white font-semibold uppercase">
                  {booking.vehicleType} ({booking.vehicleNumber})
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <span className="text-gray-500">Date</span>
                <span className="text-white">{booking.date}</span>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <span className="text-gray-500">Slot</span>
                <span className="text-white">{booking.timeSlot}</span>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <span className="text-gray-500">Status</span>
                <span className="inline-flex items-center gap-1.5 text-red-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>Cancelled</span>
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-400">
                  {formatINR(booking.finalPrice)} (Void)
                </span>
              </div>
            </div>

            {/* Action: Single Close Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-gray-200 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              CASE B: VALID / ACTIVE / COMPLETED BOOKING (WITH QR CODE)
              ───────────────────────────────────────────────────────────── */
          <>
            {/* Vehicle Badge */}
            <div className="inline-flex items-center justify-center gap-1.5 text-xs font-mono text-gray-300 uppercase px-3 py-1 rounded-full bg-charcoal-850 border border-white/5">
              <Car className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>{booking.vehicleType}</span>
              <span className="text-gray-600">•</span>
              <span className="font-bold text-white">{booking.vehicleNumber}</span>
            </div>

            {/* Large Centered QR Code (Optimized size so no scroll occurs) */}
            {booking.qrCode ? (
              <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-2xl border-4 border-charcoal-800">
                <Image
                  src={booking.qrCode}
                  alt={`QR Pass for ${booking.bookingId}`}
                  width={154}
                  height={154}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-44 h-44 mx-auto rounded-2xl bg-charcoal-850 border border-white/10 flex flex-col items-center justify-center gap-2 text-gray-400">
                <QrCode className="w-9 h-9 text-gray-600" />
                <span className="text-xs font-mono">No QR code generated</span>
              </div>
            )}

            {/* Scan Instruction */}
            <p className="text-xs font-mono text-gray-400 leading-relaxed max-w-[260px] mx-auto">
              Scan at the studio counter for check-in.
            </p>

            {/* Schedule & Price Mini Bar */}
            <div className="py-2.5 px-3 rounded-2xl bg-charcoal-850/80 border border-white/5 flex items-center justify-between text-xs font-mono">
              <div className="text-left text-gray-400">
                <p className="text-[10px] uppercase text-gray-500">Schedule</p>
                <p className="text-gray-200">
                  {booking.date} | {booking.timeSlot.split(" - ")[0]}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase text-gray-500">Pay at Counter</p>
                <p className="font-heading font-black text-neon-blue text-sm">
                  {formatINR(booking.finalPrice)}
                </p>
              </div>
            </div>

            {/* Action Buttons: Download QR & Close */}
            <div className="pt-1 flex items-center gap-2.5">
              {booking.qrCode && (
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-gray-200 hover:text-white border border-white/10 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-neon-blue" />
                  <span>Download QR</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
