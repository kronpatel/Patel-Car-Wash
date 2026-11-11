import React from "react";
import Link from "next/link";
import { Calendar, Phone, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import Hero from "@/components/home/Hero";
import TrustBadges from "@/components/home/TrustBadges";
import LiveCounter from "@/components/home/LiveCounter";
import BeforeAfterSlider from "@/components/home/BeforeAfterSlider";
import Testimonials from "@/components/home/Testimonials";
import MapSection from "@/components/home/MapSection";
import { SHOP_CONFIG } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Trust Badges (5-Star, Eco, Certified, Scratch-Free) */}
      <TrustBadges />

      {/* 3. Live Activity & Booking Telemetry Counter */}
      <LiveCounter />

      {/* 4. Interactive Before/After Detailing Comparison Slider */}
      <BeforeAfterSlider />

      {/* 5. Customer Testimonials & Reviews */}
      <Testimonials />

      {/* Conversion Upsell CTA Banner */}
      <section className="py-16 relative overflow-hidden bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-xs font-semibold text-neon-blue mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Guaranteed Spotless Finish</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight mb-4">
            Ready to Give Your Vehicle the Care It Deserves?
          </h2>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Choose your vehicle type, select a convenient time slot, and leave the
            rest to our certified IDA master detailers. Pay at the studio after service.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto neon-glow-btn px-8 py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-neon-md"
            >
              <Calendar className="w-5 h-5" />
              <span>Book an Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={`tel:${SHOP_CONFIG.phone}`}
              className="w-full sm:w-auto glass-panel px-6 py-3.5 rounded-2xl text-sm font-semibold text-gray-200 hover:text-white border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-neon-blue" />
              <span>Speak with a Specialist</span>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No upfront payment required • Pay cash/UPI at counter</span>
          </div>
        </div>
      </section>

      {/* 6. Studio Map & Location Details */}
      <MapSection />
    </div>
  );
}
