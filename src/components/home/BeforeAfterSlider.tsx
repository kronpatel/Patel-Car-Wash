"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Sparkles, ChevronsLeftRight, Droplets, ShieldCheck } from "lucide-react";

export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    handleMove(clientX);
  };

  return (
    <section id="gallery" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-xs font-semibold text-gold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Interactive Transformation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            See the <span className="text-neon-blue">CleanPro Difference</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Drag the slider to compare our 3-stage paint correction and ceramic
            coating results against dull, swirled factory clear coat.
          </p>
        </div>

        {/* Interactive Comparison Container */}
        <div className="max-w-5xl mx-auto">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
            }}
            onTouchEnd={() => setIsDragging(false)}
            className="relative h-[380px] sm:h-[500px] rounded-3xl overflow-hidden glass-panel border border-white/10 select-none cursor-ew-resize shadow-2xl"
          >
            {/* "AFTER" Layer (Full Background) */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80"
                alt="After CleanPro Paint Correction & Ceramic Coating"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-center"
              />
              {/* After Badge */}
              <div className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-charcoal-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AFTER: 9H Ceramic Mirror Polish</span>
              </div>
            </div>

            {/* "BEFORE" Layer (Clipped cleanly via CSS clipPath to sliderPosition %) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden z-10 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <Image
                src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=80"
                alt="Before Detailing - Mud & Swirl Marks"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-center grayscale-[0.2] brightness-90"
              />
              {/* Before Badge */}
              <div className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-charcoal-950/85 backdrop-blur-md border border-red-500/40 text-red-400 text-xs font-semibold shadow-lg">
                <Droplets className="w-3.5 h-3.5" />
                <span>BEFORE: Swirls & Road Grime</span>
              </div>
            </div>

            {/* Slider Dividing Bar */}
            <div
              className="absolute top-0 bottom-0 z-30 w-1 bg-gradient-to-b from-neon-blue via-white to-neon-blue shadow-[0_0_15px_rgba(0,212,255,0.8)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Central Circular Drag Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-charcoal-950 border-2 border-neon-blue flex items-center justify-center shadow-neon-md text-neon-blue">
                <ChevronsLeftRight className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons & Accessible Range Input */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <p className="text-xs text-gray-400">
              Drag anywhere across the photo to inspect clear coat gloss & swirl
              removal.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Jump to:</span>
              <button
                type="button"
                onClick={() => setSliderPosition(25)}
                className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setSliderPosition(50)}
                className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 border border-white/10 text-xs text-neon-blue transition-colors font-semibold"
              >
                50% (Split)
              </button>
              <button
                type="button"
                onClick={() => setSliderPosition(75)}
                className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-750 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
              >
                75%
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
