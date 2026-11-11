"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, Users, ArrowUpRight, ShieldCheck } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  role: string;
  tag: string;
  image: string;
  aspectClass?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "lead-master",
    title: "High-Pressure Snow Foam Bath",
    role: "Gentle 2-bucket hand scrub with pH-neutral German foam",
    tag: "BAY 01 · FOAM WASH",
    image:
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "machine-polish",
    title: "Dual-Action Paint Correction",
    role: "Precision orbital machine compounding for swirl removal",
    tag: "BAY 02 · PAINT CORRECTION",
    image:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "ceramic-coating",
    title: "9H Nano-Ceramic Curing",
    role: "Hand-applied SiO2 crystal shield for hydrophobic gloss",
    tag: "BAY 03 · CERAMIC LAB",
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "interior-steam",
    title: "Interior Steam Extraction",
    role: "140°C upholstery sanitization and leather conditioning",
    tag: "BAY 04 · CABIN DETAILING",
    image:
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "quality-audit",
    title: "24-Point Inspection Squad",
    role: "Optical reflection audit under 5000K studio inspection LEDs",
    tag: "FINAL AUDIT · QUALITY ASSURANCE",
    image:
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=800&q=80",
  },
];

export default function StudioGallery() {
  const heroItem = GALLERY_ITEMS[0];
  const gridItems = GALLERY_ITEMS.slice(1);

  return (
    <section id="gallery" className="w-full py-20 sm:py-28 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-neon-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-xs font-semibold text-neon-blue uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5 text-neon-blue" />
            <span>Inside CleanPro Studio</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            Meet Our <span className="text-neon-blue">Master Craftsmen</span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Certified IDA detailers bringing showroom-grade precision to every panel, wheel, and interior seam.
          </p>
        </div>

        {/* 5-Photo Asymmetric Bento Collage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 1. Large Hero Photo on Left (Spans 5 cols, full height of 2 rows) */}
          <div className="lg:col-span-5 group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 hover:border-neon-blue/50 glass-panel transition-all duration-300 min-h-[380px] sm:min-h-[460px] lg:min-h-[560px] shadow-xl hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            <Image
              src={heroItem.image}
              alt={heroItem.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Top Tag Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-950/85 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-gray-200 group-hover:border-neon-blue/50 group-hover:text-neon-blue transition-colors">
                <Sparkles className="w-3 h-3 text-gold" />
                <span>{heroItem.tag}</span>
              </span>
            </div>

            {/* Bottom Gradient & Label Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8 z-10">
              <div className="space-y-1.5 transform transition-transform duration-300 group-hover:-translate-y-1">
                <span className="text-xs uppercase font-bold tracking-wider text-neon-blue inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Featured Bay Operation</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {heroItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                  {heroItem.role}
                </p>
              </div>
            </div>
          </div>

          {/* 2. 4 Smaller Photos in 2x2 arrangement on Right (Spans 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {gridItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 hover:border-neon-blue/50 glass-panel transition-all duration-300 h-[260px] sm:h-[270px] shadow-lg hover:shadow-[0_0_25px_rgba(0,212,255,0.2)]"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Top Tag Badge */}
                <div className="absolute top-3.5 left-3.5 z-20">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-charcoal-950/85 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-gray-300 group-hover:border-neon-blue/40 group-hover:text-neon-blue transition-colors">
                    {item.tag}
                  </span>
                </div>

                {/* Arrow Icon */}
                <div className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-full bg-charcoal-950/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-neon-blue group-hover:border-neon-blue/40 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>

                {/* Bottom Gradient & Label Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/95 via-charcoal-950/40 to-transparent flex flex-col justify-end p-5 z-10">
                  <div className="space-y-1 transform transition-transform duration-300 group-hover:-translate-y-1">
                    <h3 className="text-base font-heading font-bold text-white group-hover:text-neon-blue transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-300 line-clamp-1 leading-snug">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
