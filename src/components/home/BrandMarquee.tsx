"use client";

import React from "react";

const BRANDS = [
  "TATA MOTORS",
  "MAHINDRA",
  "MARUTI SUZUKI",
  "FORCE MOTORS",
  "ASHOK LEYLAND",
  "OLA ELECTRIC",
];

// Repeat list to guarantee unbroken infinite coverage across all viewport widths
const MARQUEE_ITEMS = [...BRANDS, ...BRANDS];

export default function BrandMarquee() {
  return (
    <section
      aria-label="Serviced Vehicle Brands"
      className="w-full bg-[#0B0B0D] border-y border-white/10 py-4 sm:py-6 overflow-hidden select-none relative group"
    >
      {/* Subtle edge fade overlays for seamless edge-to-edge cinematic blending */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#0B0B0D] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#0B0B0D] to-transparent z-10 pointer-events-none" />

      {/* Marquee Flex Container */}
      <div className="flex w-max items-center">
        {/* Track 1 */}
        <div className="flex shrink-0 items-center animate-marquee group-hover:[animation-play-state:paused]">
          {MARQUEE_ITEMS.map((brand, idx) => (
            <div key={`track-1-${idx}`} className="flex items-center">
              <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white hover:text-neon-blue transition-colors px-4 sm:px-6">
                {brand}
              </span>
              <span
                className="text-neon-blue font-mono text-xl sm:text-2xl md:text-3xl select-none px-2 sm:px-4"
                aria-hidden="true"
              >
                *
              </span>
            </div>
          ))}
        </div>

        {/* Track 2 (Identical clone for seamless 100% loop) */}
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center animate-marquee group-hover:[animation-play-state:paused]"
        >
          {MARQUEE_ITEMS.map((brand, idx) => (
            <div key={`track-2-${idx}`} className="flex items-center">
              <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white hover:text-neon-blue transition-colors px-4 sm:px-6">
                {brand}
              </span>
              <span
                className="text-neon-blue font-mono text-xl sm:text-2xl md:text-3xl select-none px-2 sm:px-4"
                aria-hidden="true"
              >
                *
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
