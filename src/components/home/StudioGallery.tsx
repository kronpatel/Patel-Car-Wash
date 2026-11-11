"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EngineeringDetail {
  id: string;
  step: string;
  code: string;
  title: string;
  caption: string;
  specs: string;
  image: string;
}

const DETAILS: EngineeringDetail[] = [
  {
    id: "step-foam",
    step: "01",
    code: "SNOW_FOAM",
    title: "pH-Neutral Pre-Wash Soak",
    caption: "High-pressure snow foam encapsulating abrasive dirt particles.",
    specs: "PRESSURE: 140 BAR · PH 7.0",
    image:
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "step-mitt",
    step: "02",
    code: "TWO_BUCKET",
    title: "800 GSM Microfiber Scrub",
    caption: "Dual-bucket rinse cycle with grit-guard filtration.",
    specs: "FIBER: 800 GSM · 0 SWIRLS",
    image:
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "step-polish",
    step: "03",
    code: "DA_COMPOUND",
    title: "Dual-Action Paint Leveling",
    caption: "Orbital machine compounding removing micro-scratches & haze.",
    specs: "ORBITAL DA · GERMAN COMPOUND",
    image:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "step-seal",
    step: "04",
    code: "CERAMIC_9H",
    title: "SiO2 Nano-Crystal Guard",
    caption: "Hand-applied ceramic shield yielding 108° water contact angle.",
    specs: "HARDNESS: 9H · SIO2 MATRIX",
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "step-inspection",
    step: "05",
    code: "OPTICAL_AUDIT",
    title: "5000K LED Surface Audit",
    caption: "24-point daylight LED reflection clearance prior to handover.",
    specs: "CRI > 95 · 24-POINT AUDIT",
    image:
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=800&q=80",
  },
];

export default function StudioGallery() {
  const [activeStep, setActiveStep] = useState<string>("step-foam");

  return (
    <section id="gallery" className="w-full py-16 sm:py-20 border-b border-white/[0.08] bg-noir-900">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Eyebrow & Title */}
        <div className="mb-10 text-left">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-[0.2em] text-noir-400">
            <span className="accent-dot accent-dot-cyan" />
            <span>Process Credibility · Engineering Details</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white tracking-tight">
            5-Stage Physical Execution Sequence
          </h2>
          <p className="text-xs sm:text-sm text-noir-400 mt-2 max-w-xl font-sans">
            A deterministic detailing sequence. Every vehicle passes through these 5 tightly audited stages.
          </p>
        </div>

        {/* Horizontal Scrolling Sequence of 5 Narrow Engineering Detail Columns */}
        <div className="overflow-x-auto pb-4 pt-1 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex lg:grid lg:grid-cols-5 gap-3.5 min-w-[850px] lg:min-w-0">
            {DETAILS.map((item) => {
              const isActive = activeStep === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveStep(item.id)}
                  onClick={() => setActiveStep(item.id)}
                  className={cn(
                    "flex-1 flex flex-col justify-between p-3 rounded-none border transition-colors cursor-pointer bg-noir-950",
                    isActive
                      ? "border-accent-cyan"
                      : "border-white/[0.08] hover:border-white/[0.18]"
                  )}
                >
                  <div>
                    {/* Step Monospace Index Bar */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-noir-400 mb-2.5 pb-2 border-b border-white/[0.06]">
                      <span className="text-white font-semibold">{item.step}</span>
                      <span className={cn("text-[10px]", isActive ? "text-accent-cyan" : "text-noir-500")}>
                        {item.code}
                      </span>
                    </div>

                    {/* Tight Crop Image — Razor Sharp, No Rounded Corners, No Shadows */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-noir-900 border border-white/[0.06] mb-3">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 1024px) 200px, 18vw"
                        className={cn(
                          "object-cover transition-all duration-300",
                          isActive
                            ? "contrast-115 grayscale-0 scale-102"
                            : "contrast-105 grayscale-[0.35]"
                        )}
                      />
                    </div>

                    {/* Technical Title & 1-Line Description */}
                    <h3 className="font-sans font-semibold text-white text-xs mb-1 leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-sans text-[11px] text-noir-400 leading-relaxed">
                      {item.caption}
                    </p>
                  </div>

                  {/* Monospace Technical Metric Tag */}
                  <div className="mt-4 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-noir-500">
                    <code className="inline-code w-full block truncate">
                      {item.specs}
                    </code>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monospace Sequence Footnote */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-noir-500">
          <span>{"// HOVER TO INSPECT ACTIVE STAGE"}</span>
          <span className="text-accent-cyan">SEQUENCE: 01 ➔ 02 ➔ 03 ➔ 04 ➔ 05</span>
        </div>
      </div>
    </section>
  );
}
