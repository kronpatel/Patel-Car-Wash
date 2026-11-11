"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Coins,
  HelpCircle,
  Calendar,
  CheckCircle2,
  Gift,
  ArrowRight,
} from "lucide-react";
import { VehicleType, PlanType } from "@/types";
import { MEMBERSHIP_PLANS, LOYALTY_RULES } from "@/lib/constants";
import VehicleSelector from "@/components/pricing/VehicleSelector";
import PlanCard from "@/components/pricing/PlanCard";
import MembershipCard from "@/components/pricing/MembershipCard";

const PLAN_NAMES: PlanType[] = [
  "Basic Wash",
  "Premium Wash",
  "Full Detailing",
];

const FAQS = [
  {
    question: "Why is the Basic Wash ₹399 for all vehicle types?",
    answer:
      "Our client's founding principle is absolute transparency. A high-pressure snow foam wash, hand scrub, and streak-free exterior rinse takes our detailers a consistent 25–30 minutes, so we never charge SUV or Minibus owners extra for our essential wash.",
  },
  {
    question: "Do I need to pay online when booking an appointment?",
    answer:
      "No! CleanPro operates on a 100% 'Pay After Wash' policy. You reserve your bay and time slot online for free, inspect your vehicle after service, and pay via Cash, UPI, or Card at the shop counter.",
  },
  {
    question: "How do Clean Coins loyalty points work?",
    answer: `Every ₹100 you spend earns 10 Clean Coins automatically. Every 100 coins gives you an instant ₹50 discount on future washes. Plus, invite friends to earn ${LOYALTY_RULES.REFERRAL_BONUS_COINS} bonus coins on their first visit!`,
  },
  {
    question: "What is your scratch-free guarantee?",
    answer:
      "We exclusively use the German two-bucket wash method with grit-guard filters and ultra-plush 800 GSM microfiber towels. No harsh nylon brushes or contaminated sponges ever touch your clear coat.",
  },
];

export default function PricingPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("Small Sedan");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-xs font-semibold text-neon-blue mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>100% Transparent Rates • No Hidden Fees</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight mb-5">
            Honest Pricing for <br />
            <span className="text-neon-blue glow-text-neon">
              Exceptional Detailing
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6">
            Basic snow foam wash is flat ₹399 for every car. Select your vehicle
            category below to view exact tiered pricing for premium detailing.
          </p>

          {/* Client Core Guarantee Banner */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              Basic Wash is always ₹399 across Small Sedan, Pickup, SUV,
              Minibus, &amp; Bike!
            </span>
          </div>
        </div>

        {/* Vehicle Selector Tabs */}
        <div className="mb-14">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Select Your Vehicle Category:
          </p>
          <VehicleSelector
            selected={selectedVehicle}
            onChange={setSelectedVehicle}
          />
        </div>

        {/* 3 Main Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-24">
          {PLAN_NAMES.map((planName) => (
            <PlanCard
              key={planName}
              planName={planName}
              selectedVehicle={selectedVehicle}
            />
          ))}
        </div>

        {/* Clean Coins Rewards Explainer Strip */}
        <div className="glass-panel p-8 rounded-3xl border border-gold/30 bg-charcoal-850/80 mb-24 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0 shadow-gold-sm">
                <Coins className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  Loyalty Rewards
                </span>
                <h3 className="text-2xl font-heading font-extrabold text-white">
                  Clean Coins Program
                </h3>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-charcoal-900/60 border border-white/5">
                <p className="text-xs text-gray-400">Spend &amp; Earn</p>
                <p className="text-base font-bold text-white mt-1">
                  ₹100 = 10 Coins
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Credited immediately after wash
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-charcoal-900/60 border border-white/5">
                <p className="text-xs text-gray-400">Instant Redemption</p>
                <p className="text-base font-bold text-gold mt-1">
                  100 Coins = ₹50 OFF
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Applied directly at checkout
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-charcoal-900/60 border border-white/5">
                <p className="text-xs text-gray-400">Referral Reward</p>
                <p className="text-base font-bold text-emerald-400 mt-1">
                  50 Bonus Coins
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  For both you and your friend
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Membership Passes Section */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-semibold text-neon-blue px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 inline-block mb-3">
              Frequent Driver Savings
            </span>
            <h2 className="text-3xl font-heading font-extrabold text-white">
              CleanPass Monthly Memberships
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Drive a clean car every single week. Enjoy priority booking,
              complimentary doorstep delivery, and up to 52% savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {MEMBERSHIP_PLANS.map((pass) => (
              <MembershipCard key={pass.id} plan={pass} />
            ))}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs text-neon-blue font-semibold uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={index}
                  className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {faq.question}
                    </span>
                    <span className="text-neon-blue text-xl font-bold shrink-0">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Booking Callout */}
        <div className="mt-20 text-center">
          <Link
            href="/book"
            className="neon-glow-btn px-8 py-4 rounded-2xl font-bold text-base inline-flex items-center gap-2.5 shadow-neon-md"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Your Wash Bay Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Instant WhatsApp confirmation sent after booking. Pay at shop counter.
          </p>
        </div>
      </div>
    </div>
  );
}
