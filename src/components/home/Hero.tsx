"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="w-full border-b border-white/[0.08] bg-noir-900 py-12 sm:py-20 lg:py-24">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Eyebrow + Strong Headline + CTAs */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            {/* Monospace Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-[0.2em] text-noir-400"
            >
              <span className="accent-dot accent-dot-cyan" />
              <span>Patel car&apos;spa · Rankuva, Gujarat</span>
            </motion.div>

            {/* Short, Confident Headline — One Strong Line */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="text-3xl sm:text-5xl lg:text-5.5xl font-heading font-semibold text-white tracking-tight leading-[1.08] mb-4"
            >
              Showroom finish.
              <br />
              <span className="text-white">Zero swirls.</span>
            </motion.h1>

            {/* Single Line of Subcopy */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-xs sm:text-sm text-noir-300 max-w-md font-sans leading-relaxed mb-7"
            >
              German snow foam wash, interior steam extraction, and 9H nano-ceramic protection.
              Flat ₹399 express wash for every vehicle class with 100% pay-at-shop policy.
            </motion.p>

            {/* Two Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <Link href="/book" className="btn-primary">
                <span>Book Bay Reservation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link href="/pricing" className="btn-outline">
                <span>View Pricing Matrix</span>
              </Link>
            </motion.div>

            {/* Monospace Metric Footnotes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="pt-5 border-t border-white/[0.08] w-full flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-noir-400"
            >
              <div className="flex items-center gap-1.5">
                <span className="accent-dot accent-dot-cyan !w-1.5 !h-1.5" />
                <span className="text-white">₹399.00</span>
                <span className="text-[11px] text-noir-500">FLAT_BASIC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="accent-dot accent-dot-emerald !w-1.5 !h-1.5" />
                <span className="text-white">0 UPFRONT</span>
                <span className="text-[11px] text-noir-500">PAY_AT_SHOP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-noir-500">TURNAROUND:</span>
                <span className="text-white">25-30M</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Cinematic Hero Product Shot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="lg:col-span-7 w-full"
          >
            <div className="surface rounded border border-white/[0.1] bg-[#060608] overflow-hidden relative group">
              {/* Monospace Product Telemetry Top Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-noir-950/90 border-b border-white/[0.08] text-[11px] font-mono text-noir-400">
                <div className="flex items-center gap-2">
                  <span className="accent-dot accent-dot-cyan !w-1.5 !h-1.5" />
                  <span className="text-white font-medium">HERO_OBJECT: 992_GT3_TOURING</span>
                </div>
                <div className="flex items-center gap-3 text-noir-500">
                  <span>BAY: 01_HYDRO</span>
                  <span className="text-noir-700">|</span>
                  <span className="text-emerald-400">● 140_BAR_ACTIVE</span>
                </div>
              </div>

              {/* Cinematic Product Container — Brightest Object on Screen */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-noir-950">
                {!videoError ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoError(true)}
                    poster="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1600&q=85"
                    className="w-full h-full object-cover contrast-110 saturate-[0.95]"
                  >
                    <source
                      src="https://assets.mixkit.co/videos/preview/mixkit-car-getting-washed-with-soap-in-a-car-wash-41712-large.mp4"
                      type="video/mp4"
                    />
                  </video>
                ) : (
                  <Image
                    src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1600&q=85"
                    alt="Vehicle undergoing precision snow foam wash"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover contrast-110 saturate-[0.95]"
                  />
                )}

                {/* Subtle Technical Frame Overlay */}
                <div className="absolute inset-0 border border-white/[0.06] pointer-events-none" />

                {/* Monospace Live Telemetry Lower Badge */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded bg-noir-950/90 border border-white/[0.1] text-[10px] font-mono text-noir-300">
                  <span className="text-accent-cyan">[SURFACE_SCAN]</span>
                  <span>HYDROPHOBIC_BEADING: 108° CONTACT_ANGLE</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
