"use client";

import React from "react";
import Link from "next/link";
import { Check, Sparkles, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { PlanType, VehicleType } from "@/types";
import { PRICING_MATRIX } from "@/lib/constants";
import { calculatePlanPrice, formatINR, cn } from "@/lib/utils";

interface PlanCardProps {
  planName: PlanType;
  selectedVehicle: VehicleType;
  className?: string;
}

export default function PlanCard({
  planName,
  selectedVehicle,
  className,
}: PlanCardProps) {
  const plan = PRICING_MATRIX[planName];
  if (!plan) return null;

  // Calculate price with client's rule enforced
  const price = calculatePlanPrice(planName, selectedVehicle);
  const isBasic = planName === "Basic Wash";
  const isPremium = planName === "Premium Wash";
  const isDetailing = planName === "Full Detailing";

  const bookingHref = `/book?plan=${encodeURIComponent(
    planName
  )}&vehicle=${encodeURIComponent(selectedVehicle)}`;

  return (
    <div
      className={cn(
        "glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative border overflow-hidden",
        isDetailing
          ? "border-gold/40 shadow-gold-sm hover:border-gold hover:shadow-gold-md"
          : isPremium
          ? "border-neon-blue/40 shadow-neon-sm hover:border-neon-blue hover:shadow-neon-md"
          : "border-white/10 hover:border-white/30",
        className
      )}
    >
      {/* Top Banner Badge if Popular / Luxury */}
      {plan.badge && (
        <div className="absolute top-4 right-4">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm",
              isDetailing
                ? "bg-gold/15 text-gold-light border-gold/40 shadow-gold-sm"
                : "bg-neon-blue/15 text-neon-blue border-neon-blue/40 shadow-neon-sm"
            )}
          >
            <Sparkles className="w-3 h-3" />
            {plan.badge}
          </span>
        </div>
      )}

      <div>
        {/* Plan Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-heading font-extrabold text-white mb-2">
            {plan.name}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed min-h-[40px]">
            {plan.tagline}
          </p>
        </div>

        {/* Pricing Display */}
        <div className="mb-6 p-4 rounded-2xl bg-charcoal-850/80 border border-white/5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-heading font-black text-white">
              {formatINR(price)}
            </span>
            <span className="text-xs text-gray-400 font-medium">/ wash</span>
          </div>

          {/* Client's rule banner for Basic Wash */}
          {isBasic ? (
            <p className="text-[11px] font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Same flat price for all vehicle types!</span>
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-2">
              Rate tuned for:{" "}
              <span className="text-white font-medium">{selectedVehicle}</span>
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5 text-neon-blue" />
            <span>Turnaround: {plan.turnaround}</span>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Included Services:
          </p>
          <ul className="space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    isDetailing
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "bg-neon-blue/15 text-neon-blue border border-neon-blue/30"
                  )}
                >
                  <Check className="w-3 h-3" />
                </div>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-white/5">
        <Link
          href={bookingHref}
          className={cn(
            "w-full py-3.5 rounded-2xl font-heading font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-md",
            isDetailing
              ? "gold-glow-btn text-charcoal-950"
              : isPremium
              ? "neon-glow-btn text-charcoal-950"
              : "bg-charcoal-800 hover:bg-white/10 text-white border border-white/10"
          )}
        >
          <span>Book This Plan</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
