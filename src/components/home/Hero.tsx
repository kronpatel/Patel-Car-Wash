"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Calendar,
  Play,
  Shield,
  Zap,
  Star,
  Headphones,
  Sparkles,
} from "lucide-react";

// Dynamically import Three.js 3D Canvas component with transparent borderless loading fallback
const CarModel = dynamic(() => import("./CarModel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] md:min-h-[520px] lg:min-h-[580px] xl:min-h-[640px] flex items-center justify-center bg-transparent border-0 shadow-none">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-[#E50914] animate-spin" />
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">
          Loading 3D Porsche...
        </span>
      </div>
    </div>
  ),
});

const HERO_FEATURES = [
  {
    icon: Shield,
    title: "100% Safe & Reliable",
    desc: "Scratch-safe 2-bucket wash",
  },
  {
    icon: Zap,
    title: "Fast Service",
    desc: "25-min express bays",
  },
  {
    icon: Star,
    title: "Expert Care",
    desc: "IDA-certified detailers",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    desc: "Dedicated WhatsApp dispatch",
  },
];

export default function Hero() {
  return (
    <section className="w-full relative overflow-hidden bg-[#0A0A0C] border-b border-white/10 pt-3 sm:pt-5 pb-0">
      {/* ====================================================================
          Ambient Neon Garage Atmosphere (Red & Cyan Glows)
          ==================================================================== */}
      {/* Crimson-Red Ambient Glow behind the 3D Car */}
      <div className="absolute -right-16 lg:right-[-14vw] top-1/2 -translate-y-1/2 w-[420px] sm:w-[550px] lg:w-[680px] h-[420px] sm:h-[550px] lg:h-[680px] bg-[#E50914]/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Cyan Rim Glow on the Far Left */}
      <div className="absolute -left-36 top-1/4 w-[360px] h-[360px] bg-[#00D4FF]/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Subtle Technical Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Main Split Content: Left (Text/Branding in front) | Right/Back (3D Car Model) */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 relative md:min-h-[460px] lg:min-h-[540px] xl:min-h-[600px] flex flex-col md:flex-row md:items-center">

        {/* ================================================================
            LEFT: Exact Same Text & Branding Layout (Layered in FRONT via z-20)
            ================================================================ */}
        <div className="w-full md:max-w-xl flex flex-col items-center md:items-start text-center md:text-left relative z-20 py-2 sm:py-3 lg:py-4 pointer-events-auto">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-[#E50914]/40 text-[#ff4d4f] text-xs font-mono uppercase tracking-widest mb-3.5 shadow-[0_0_15px_rgba(229,9,20,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E50914] animate-pulse" />
            <span>Premium Car Care Services</span>
          </motion.div>

          {/* CRUCIAL CENTERPIECE: SHOP LOGO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="w-full relative flex justify-center md:justify-start"
          >
            {/* The logo itself — aspect ratio matches the SVG viewBox (23500x7900 ≈ 2.97:1) */}
            <div className="relative">
              <Image
                src="/logo/logo.svg"
                alt="Patel Car'spa & Detailing Studio"
                width={500}
                height={168}
                priority
                className="w-[300px] max-w-full md:w-[450px] lg:w-[500px] h-auto object-contain select-none drop-shadow-[0_0_1px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Sleek Widened Sub-headline
            <p className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-[0.38em] text-gray-300 font-semibold mt-3 pl-1">
              Car&apos;spa &amp; Detailing Studio
            </p> */}
          </motion.div>

          {/* Sub-headline: Drive Clean. Shine Bright. */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight mt-4 sm:mt-5"
          >
            Drive Clean.{" "}
            <span
              className="text-[#E50914] italic"
              style={{
                textShadow: "0 0 15px rgba(229, 9, 20, 0.5)",
              }}
            >
              Shine Bright.
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-sm sm:text-base text-gray-400 font-sans leading-relaxed max-w-xl mt-2.5 mb-6 sm:mb-7"
          >
            Professional car spa, detailing and protection services to keep your
            ride looking brand new. Flat ₹399 express wash across all vehicle
            categories with zero upfront payment.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto"
          >
            {/* Primary CTA: Solid Neon Red */}
            <Link
              href="/book"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#E50914] hover:bg-[#c70811] text-white font-mono uppercase tracking-wider font-bold text-xs sm:text-sm px-7 py-3.5 rounded transition-all duration-200 shadow-[0_0_30px_rgba(229,9,20,0.45)] hover:shadow-[0_0_45px_rgba(229,9,20,0.7)] hover:scale-[1.02]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>

            {/* Secondary CTA: Outline with Play Icon */}
            <a
              href="#gallery"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border border-white/20 hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 hover:text-white font-mono uppercase tracking-wider text-xs sm:text-sm px-6 py-3.5 rounded transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914]" />
              <span>Watch Our Work</span>
            </a>
          </motion.div>
        </div>

        {/* ================================================================
            RIGHT / BACK: 3D Car Model (Positioned on the Right Side)
            ================================================================ */}
        <div className="w-full h-[300px] relative md:absolute md:right-[-14vw] xl:right-[-11vw] 2xl:right-[-8vw] md:top-1/2 md:-translate-y-1/2 md:w-[70vw] md:max-w-[1200px] md:h-[520px] lg:h-[580px] xl:h-[640px] z-0 overflow-visible bg-transparent border-0 shadow-none pointer-events-auto">
          <CarModel />

          {/* Monospace Interactive Drag Hint */}
          <div className="absolute bottom-2 right-6 z-10 flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-gray-400 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping" />
            <span>DRAG TO ROTATE 3D PORSCHE</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          Bottom Features Strip (Tucked cleanly right below the Hero content)
          ==================================================================== */}
      <div className="w-full border-t border-white/10 bg-black/60 relative z-20 mt-2 sm:mt-4">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-3 sm:py-3.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {HERO_FEATURES.map((item, idx) => {
              const IconComponent = item.icon;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-1 group hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center shrink-0 text-[#E50914] group-hover:scale-105 transition-transform">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate font-sans">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate font-mono mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
