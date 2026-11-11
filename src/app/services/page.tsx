import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Calendar, ShieldCheck, ArrowRight, Droplets, CheckCircle2 } from "lucide-react";
import ServicesGrid from "@/components/services/ServicesGrid";

export const metadata: Metadata = {
  title: "Car Wash & Detailing Services",
  description:
    "Explore our complete range of premium automotive treatments: pH-neutral snow foam wash, interior steam extraction, paint correction & 9H ceramic coating in Gurugram.",
};

const PROCESS_STEPS = [
  {
    step: "01",
    title: "pH-Neutral Snow Foam Soak",
    description:
      "Thick foam bath encapsulates and softens abrasive road grime, brake dust, and bug splatter before any mitt touches the vehicle.",
  },
  {
    step: "02",
    title: "2-Bucket Grit-Guard Hand Wash",
    description:
      "Plush 800 GSM microfiber mitts with dedicated rinse and soap buckets ensure zero dirt is dragged across the clear coat.",
  },
  {
    step: "03",
    title: "Paint Correction & Polish",
    description:
      "Dual-action orbital polishers and German compound eliminate swirl marks, light scratches, and oxidation to restore mirror clarity.",
  },
  {
    step: "04",
    title: "Hydrophobic Seal & Inspection",
    description:
      "Ceramic or SiO2 sealant applied for 90-day water-beading protection, followed by a 24-point studio inspection under LED lights.",
  },
];

export default function ServicesPage() {
  return (
    <div className="w-full py-12 sm:py-20">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-xs font-semibold text-neon-blue mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Comprehensive Treatment Menu</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight mb-6">
            Precision Treatments for <br />
            <span className="text-neon-blue glow-text-neon">Every Surface</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            From our flat ₹399 express snow foam wash to multi-stage paint
            correction and ceramic shields. All treatments include pay-at-shop
            convenience and our scratch-free guarantee.
          </p>
        </div>

        {/* Interactive Services Filter & Grid */}
        <ServicesGrid />

        {/* 4-Stage Precision Process Walkthrough */}
        <div className="mt-24 pt-20 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-semibold text-gold px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/20 inline-block mb-3">
              Standard Operating Procedure
            </span>
            <h2 className="text-3xl font-heading font-extrabold text-white">
              Our 4-Stage Scratch-Safe Protocol
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Why luxury vehicle owners trust CleanPro with their most prized
              possessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((proc) => (
              <div
                key={proc.step}
                className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-neon-blue/40 transition-colors"
              >
                <div className="text-4xl font-heading font-black text-white/10 group-hover:text-neon-blue/20 transition-colors mb-4">
                  {proc.step}
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  {proc.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {proc.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Booking Callout Banner */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl glass-panel border border-neon-blue/30 relative overflow-hidden text-center">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-neon-blue/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              Ready to Book Your Treatment?
            </h3>
            <p className="text-sm sm:text-base text-gray-300">
              Slots fill up fast for weekends. Reserve your bay online now in under
              60 seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/book"
                className="w-full sm:w-auto neon-glow-btn px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-neon-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto glass-panel px-6 py-3.5 rounded-2xl text-sm font-semibold text-gray-200 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
              >
                <span>Compare Pricing Packages</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
