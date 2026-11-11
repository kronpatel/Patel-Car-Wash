"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ShieldCheck, Coins } from "lucide-react";
import { VehicleType, PlanType } from "@/types";
import { MEMBERSHIP_PLANS, LOYALTY_RULES } from "@/lib/constants";
import VehicleSelector from "@/components/pricing/VehicleSelector";
import PlanCard from "@/components/pricing/PlanCard";
import MembershipCard from "@/components/pricing/MembershipCard";
import TierVisualPreview from "@/components/pricing/TierVisualPreview";
import { cn } from "@/lib/utils";

const PLAN_NAMES: PlanType[] = [
  "Basic Wash",
  "Premium Wash",
  "Full Detailing",
];

const FAQS = [
  {
    question: "Why is the Basic Wash flat ₹399 for all vehicle categories?",
    answer:
      "Our founding principle is absolute transparency. A high-pressure snow foam wash, hand scrub, and streak-free exterior rinse takes our detailers a consistent 25–30 minutes, so we never charge SUV or Minibus owners extra for our essential wash.",
  },
  {
    question: "Do I need to pay online when booking an appointment?",
    answer:
      "No. Patel car'spa & Detailing operates on a 100% 'Pay After Wash' policy. You reserve your bay and time slot online for free, inspect your vehicle after service, and pay via Cash, UPI, or Card at the shop counter.",
  },
  {
    question: "How do Clean Coins loyalty points work?",
    answer: `Every ₹100 spent earns 10 Clean Coins automatically. Every 100 coins gives an instant ₹50 discount on future washes. Plus, invite friends to earn ${LOYALTY_RULES.REFERRAL_BONUS_COINS} bonus coins on their first visit.`,
  },
  {
    question: "What is your scratch-free guarantee?",
    answer:
      "We exclusively use the German two-bucket wash method with grit-guard filters and ultra-plush 800 GSM microfiber towels. No harsh nylon brushes or contaminated sponges ever touch your clear coat.",
  },
];

export default function PricingPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("Small Sedan");
  const [selectedTier, setSelectedTier] = useState<PlanType>("Full Detailing");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="w-full py-12 sm:py-20 bg-noir-900">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-10 text-left">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-[0.2em] text-noir-400">
            <span className="accent-dot accent-dot-cyan" />
            <span>Pricing Matrix · No Hidden Fees</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-semibold text-white tracking-tight mb-4">
            Deterministic Pricing Architecture
          </h1>

          <p className="text-xs sm:text-sm text-noir-300 max-w-xl font-sans leading-relaxed mb-6">
            Basic snow foam wash is strictly flat ₹399 across every vehicle class. Select your
            vehicle category below to evaluate tiered detailing rates.
          </p>

          {/* Client Core Guarantee Banner */}
          <div className="surface px-4 py-2.5 rounded border border-white/[0.08] inline-flex items-center gap-2 font-mono text-xs text-accent-cyan">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>MANDATE: BASIC WASH IS FLAT ₹399 FOR ALL VEHICLES</span>
          </div>
        </div>

        {/* Vehicle Selector Tabs */}
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-noir-500 mb-2">
            {"// SELECT VEHICLE CLASS"}
          </p>
          <VehicleSelector
            selected={selectedVehicle}
            onChange={setSelectedVehicle}
          />
        </div>

        {/* Material / Configuration Section (DRIFT Reference) */}
        <div className="mb-10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-noir-400 flex items-center gap-2">
              <span className="accent-dot accent-dot-cyan !w-1.5 !h-1.5" />
              <span>CONFIGURATION_PREVIEW · FINISH LEVEL</span>
            </div>

            {/* Tier Switcher Above Cards */}
            <div className="inline-flex items-center gap-1 p-1 rounded surface border border-white/[0.08] bg-noir-950">
              {PLAN_NAMES.map((name) => {
                const isSelected = selectedTier === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedTier(name)}
                    className={cn(
                      "px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors",
                      isSelected
                        ? "bg-[#00D4FF] text-noir-950 font-semibold"
                        : "text-noir-400 hover:text-white"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 16:9 Strip with Monospace FINISH Label & 300ms Transition */}
          <TierVisualPreview tier={selectedTier} />
        </div>

        {/* 3 Main Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-20">
          {PLAN_NAMES.map((planName) => (
            <PlanCard
              key={planName}
              planName={planName}
              selectedVehicle={selectedVehicle}
            />
          ))}
        </div>

        {/* Clean Coins Rewards Explainer Strip */}
        <div className="surface p-6 sm:p-8 rounded border border-white/[0.08] mb-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded border border-white/[0.08] bg-noir-950 flex items-center justify-center text-accent-gold shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-gold">
                  LOYALTY_LEDGER
                </span>
                <h3 className="text-lg font-heading font-semibold text-white">
                  Clean Coins Program
                </h3>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-mono text-xs">
              <div className="p-3.5 rounded border border-white/[0.06] bg-noir-950">
                <p className="text-[10px] text-noir-500 uppercase">ACCRUAL</p>
                <p className="text-sm font-bold text-white mt-0.5">₹100 = 10 Coins</p>
                <p className="text-[10px] text-noir-500 mt-1">Post-wash deposit</p>
              </div>

              <div className="p-3.5 rounded border border-white/[0.06] bg-noir-950">
                <p className="text-[10px] text-noir-500 uppercase">REDEMPTION</p>
                <p className="text-sm font-bold text-accent-gold mt-0.5">100 Coins = ₹50 OFF</p>
                <p className="text-[10px] text-noir-500 mt-1">Direct bill reduction</p>
              </div>

              <div className="p-3.5 rounded border border-white/[0.06] bg-noir-950">
                <p className="text-[10px] text-noir-500 uppercase">REFERRAL</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">+50 Bonus Coins</p>
                <p className="text-[10px] text-noir-500 mt-1">Mutual reward credit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Membership Passes Section */}
        <div className="mb-20">
          <div className="mb-8 text-left">
            <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-[0.2em] text-noir-400">
              <span className="accent-dot accent-dot-cyan" />
              <span>Recurring Passes · High Mileage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white tracking-tight">
              CleanPass Monthly Subscriptions
            </h2>
            <p className="text-xs sm:text-sm text-noir-400 mt-2 max-w-xl font-sans">
              Designed for daily commuters and fleet drivers. Priority queueing and up to 52% cost efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {MEMBERSHIP_PLANS.map((pass) => (
              <MembershipCard key={pass.id} plan={pass} />
            ))}
          </div>
        </div>

        {/* Compact FAQ Accordion Section */}
        <div className="max-w-3xl mb-16">
          <div className="mb-6 text-left">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-[0.2em] text-noir-400">
              <span className="accent-dot accent-dot-cyan" />
              <span>Reference · FAQ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-semibold text-white tracking-tight">
              Operational Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-white/[0.06] border-y border-white/[0.08]">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={index} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left flex items-center justify-between gap-4 font-mono text-xs sm:text-sm text-white hover:text-accent-cyan transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className="text-accent-cyan font-mono text-xs shrink-0">
                      {isOpen ? "[-]" : "[+]"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-2.5 text-xs sm:text-sm text-noir-300 leading-relaxed font-sans transition-all duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Booking Callout */}
        <div className="surface p-6 sm:p-8 rounded border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-white font-sans">
              Ready to lock in a bay appointment?
            </h4>
            <p className="text-xs text-noir-400 font-mono mt-0.5">
              {"// Instant WhatsApp dispatch. Pay at shop counter."}
            </p>
          </div>
          <Link href="/book" className="btn-primary !py-2.5 !px-5 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Bay Reservation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
