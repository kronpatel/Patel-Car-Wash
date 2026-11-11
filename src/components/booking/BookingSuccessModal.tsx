"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  QrCode,
  ArrowRight,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { IBooking } from "@/types";
import { PAYMENT_CONFIG, SHOP_CONFIG } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

interface BookingSuccessModalProps {
  booking: IBooking;
  onClose?: () => void;
}

export default function BookingSuccessModal({
  booking,
  onClose,
}: BookingSuccessModalProps) {
  useEffect(() => {
    // Fire celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#00D4FF", "#FFC107", "#FFFFFF"],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-neon-blue/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Dismiss Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-charcoal-800 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Success Icon Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Booking Confirmed!
          </h2>
          <p className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Confirmation sent to your WhatsApp</span>
          </p>
        </div>

        {/* Booking Pass Card */}
        <div className="p-5 rounded-2xl bg-charcoal-850/90 border border-white/10 space-y-4 mb-6">
          {/* Booking ID & Service */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400">
                Booking ID
              </p>
              <p className="text-lg font-heading font-bold text-neon-blue">
                {booking.bookingId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-gray-400">
                Plan
              </p>
              <p className="text-sm font-semibold text-white">
                {booking.plan}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-semibold text-white">{booking.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400">Time Slot</p>
                <p className="font-semibold text-white">{booking.timeSlot}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 col-span-2">
              <Car className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-400">Vehicle</p>
                <p className="font-semibold text-white">
                  {booking.vehicleType} • {booking.vehicleNumber}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Presentation */}
          {booking.qrCode && (
            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-300 font-semibold">
                  <QrCode className="w-3.5 h-3.5 text-neon-blue" />
                  Staff Check-In Pass
                </span>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Show this pass upon arrival at our bay entrance.
                </p>
              </div>
              <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-md">
                <Image
                  src={booking.qrCode}
                  alt="Booking Pass QR Code"
                  width={80}
                  height={80}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Price & Pay at Counter Notice */}
          <div className="pt-3 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 font-medium">Amount to Pay</span>
              <span className="text-xl font-heading font-extrabold text-white">
                {formatINR(booking.finalPrice)}
              </span>
            </div>

            {/* User required copy snippet */}
            <p className="text-sm text-gray-400">
              💵 {PAYMENT_CONFIG.note}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href="/dashboard"
            className="w-full neon-glow-btn py-3.5 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2"
          >
            <span>Track Booking in Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={SHOP_CONFIG.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-charcoal-800 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-neon-blue" />
            <span>Get Directions to Workshop</span>
          </a>
        </div>
      </div>
    </div>
  );
}
