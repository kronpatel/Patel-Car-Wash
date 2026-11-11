"use client";

import React from "react";
import Link from "next/link";
import { Check, Sparkles, Crown, ArrowRight, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface MembershipPlanItem {
  id: string;
  title: string;
  price: number;
  washesCount: number;
  validity: string;
  savingsPercent: string;
  popular?: boolean;
  features: string[];
}

interface MembershipCardProps {
  plan: MembershipPlanItem;
  className?: string;
}

export default function MembershipCard({ plan, className }: MembershipCardProps) {
  const isGold = plan.popular || plan.id === "gold-pass";

  return (
    <div
      className={`glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative border overflow-hidden ${
        isGold
          ? "border-gold/50 shadow-gold-sm hover:border-gold hover:shadow-gold-md bg-charcoal-850/80"
          : "border-white/10 hover:border-white/20 bg-charcoal-900/60"
      } ${className || ""}`}
    >
      {/* Top Banner Badge if Popular */}
      {isGold && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gold/15 text-gold-light border border-gold/40 shadow-gold-sm">
            <Crown className="w-3.5 h-3.5 text-gold" />
            <span>VIP Choice</span>
          </span>
        </div>
      )}

      <div>
        {/* Pass Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                isGold
                  ? "bg-gold/20 text-gold-light"
                  : "bg-neon-blue/20 text-neon-blue"
              }`}
            >
              {plan.savingsPercent}
            </span>
            <span className="text-xs text-gray-400">Valid {plan.validity}</span>
          </div>

          <h3 className="text-2xl font-heading font-extrabold text-white">
            {plan.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Includes {plan.washesCount} full service washes
          </p>
        </div>

        {/* Pricing Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-charcoal-800/60 border border-white/5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-heading font-black text-white">
              {formatINR(plan.price)}
            </span>
            <span className="text-xs text-gray-400">/ pass</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Just {formatINR(Math.round(plan.price / plan.washesCount))} per wash equivalent</span>
          </p>
        </div>

        {/* Features Checklist */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Pass Privileges:
          </p>
          <ul className="space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-gray-300"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isGold
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "bg-neon-blue/15 text-neon-blue border border-neon-blue/30"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-white/5">
        <Link
          href={`/book?membership=${encodeURIComponent(plan.title)}`}
          className={`w-full py-3.5 rounded-2xl font-heading font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
            isGold
              ? "gold-glow-btn text-charcoal-950"
              : "neon-glow-btn text-charcoal-950"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Get {plan.title}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
