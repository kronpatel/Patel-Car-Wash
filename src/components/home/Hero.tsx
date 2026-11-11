"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Droplets,
  CheckCircle2,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="w-full relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16 sm:py-24">
      {/* Ambient Luxury Background Lights stretching full viewport */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-neon-blue/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-[700px] h-[700px] bg-neon-blue/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle Background Grid Pattern spanning full bleed */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none w-full"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-neon-blue/30 text-xs sm:text-sm text-neon-blue mb-6 shadow-neon-sm"
          >
            <Sparkles className="w-4 h-4 text-gold animate-pulse" />
            <span className="font-medium tracking-wide">
              Patel car&apos;spa &amp; Detailing — Gurugram&apos;s #1 Luxury Auto Spa &amp; Ceramic Studio
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-white tracking-tight leading-[1.1] mb-6"
          >
            Showroom-Grade Shine.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-cyan-300 to-neon-blue glow-text-neon">
              Zero Swirls.
            </span>{" "}
            Pure Luxury.
          </motion.h1>

          {/* Subtitle with Key Value Props */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-gray-300 max-w-2xl leading-relaxed mb-8"
          >
            Experience German-standard snow foam baths, interior steam
            sanitization, and 9H nano-ceramic protection. Flat ₹399 basic wash
            for all vehicles. Pay at the shop after 100% satisfaction.
          </motion.p>

          {/* Trust Value Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300 mb-9"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>₹399 Same Price Any Car</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-neon-blue" />
              <span>100% Scratch-Safe Microfiber</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              <span>Pay After Wash</span>
            </span>
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/book"
              className="w-full sm:w-auto neon-glow-btn px-8 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 shadow-neon-md"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Appointment Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto glass-panel px-7 py-4 rounded-2xl text-base font-semibold text-gray-200 hover:text-white border border-white/10 hover:border-neon-blue/40 flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            >
              <Droplets className="w-5 h-5 text-neon-blue" />
              <span>View Transparent Pricing</span>
            </Link>
          </motion.div>

          {/* Social Proof Stats Floating Strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-14 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl lg:max-w-5xl"
          >
            {/* Stat 1 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-gold text-gold" />
              </div>
              <div>
                <p className="text-xl font-heading font-extrabold text-white">
                  4.9 / 5.0
                </p>
                <p className="text-xs text-gray-400">1,200+ Google Reviews</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-neon-blue/15 text-neon-blue flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-heading font-extrabold text-white">
                  25 Mins
                </p>
                <p className="text-xs text-gray-400">Express Foam Turnaround</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="col-span-2 sm:col-span-1 glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3.5 text-left justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-heading font-extrabold text-white">
                  100% Guaranteed
                </p>
                <p className="text-xs text-gray-400">Scratch-Safe Hand Wash</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
