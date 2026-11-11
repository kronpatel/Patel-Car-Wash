"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PlanType } from "@/types";

interface TierVisualPreviewProps {
  tier: PlanType | string;
  className?: string;
}

interface TierVisualConfig {
  finishLabel: string;
  specLabel: string;
  reflectivity: string;
  image: string;
  caption: string;
  accentDotClass: string;
}

const TIER_CONFIGS: Record<string, TierVisualConfig> = {
  "Basic Wash": {
    finishLabel: "FINISH: MATTE_CLEAN_RINSE",
    specLabel: "SPEC: 2_BUCKET_SCRATCH_SAFE",
    reflectivity: "REFLECTIVITY: 84.2% · PH_NEUTRAL",
    image:
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80",
    caption: "High-pressure snow foam soak lifting road film safely without swirl marks.",
    accentDotClass: "accent-dot-cyan",
  },
  "Premium Wash": {
    finishLabel: "FINISH: DEEP_GLOSS_SEALANT",
    specLabel: "SPEC: 30D_POLYMER_SHIELD",
    reflectivity: "REFLECTIVITY: 92.6% · WAX_SEAL",
    image:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
    caption: "Dual-action compounding with 30-day hydrophobic polymer gloss barrier.",
    accentDotClass: "accent-dot-emerald",
  },
  "Full Detailing": {
    finishLabel: "FINISH: 9H_CERAMIC_SHEEN",
    specLabel: "SPEC: 9H_NANO_SIO2_CRYSTAL",
    reflectivity: "REFLECTIVITY: 99.4% · MIRROR_GRADE",
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
    caption: "Multi-stage paint correction with hand-applied 9H nano-ceramic crystal guard.",
    accentDotClass: "accent-dot-gold",
  },
};

export default function TierVisualPreview({
  tier,
  className,
}: TierVisualPreviewProps) {
  const activeConfig = TIER_CONFIGS[tier] || TIER_CONFIGS["Basic Wash"];

  return (
    <div
      className={`surface rounded border border-white/[0.08] bg-[#060608] overflow-hidden ${
        className || ""
      }`}
    >
      {/* Monospace Telemetry Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.08] text-[11px] font-mono text-noir-400 bg-noir-950">
        <div className="flex items-center gap-2">
          <span className={`accent-dot !w-1.5 !h-1.5 ${activeConfig.accentDotClass}`} />
          <span className="text-white font-medium">{activeConfig.finishLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-noir-500">
          <code className="inline-code">{activeConfig.specLabel}</code>
        </div>
      </div>

      {/* 16:9 Visual Preview with 300ms Fade Transition */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-noir-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={tier}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={activeConfig.image}
              alt={activeConfig.finishLabel}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover contrast-115 grayscale-[0.15]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Subtle Hairline Technical Inset Frame */}
        <div className="absolute inset-0 border border-white/[0.06] pointer-events-none" />

        {/* Monospace Lower Telemetry Badge */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded bg-noir-950/90 border border-white/[0.1] text-[10px] font-mono text-noir-300">
          <span>{activeConfig.reflectivity}</span>
        </div>
      </div>

      {/* Caption Strip */}
      <div className="px-3.5 py-2.5 border-t border-white/[0.06] text-xs font-sans text-noir-400 flex items-center justify-between">
        <p className="truncate max-w-lg">{activeConfig.caption}</p>
        <span className="text-[10px] font-mono text-noir-500 shrink-0 ml-2">
          LIVE_PREVIEW_V1
        </span>
      </div>
    </div>
  );
}
