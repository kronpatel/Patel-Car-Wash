"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface CollectionVehicle {
  id: string;
  name: string;
  code: string;
  classTag: string;
  startingPrice: string;
  image: string;
}

const VEHICLE_TILES: CollectionVehicle[] = [
  {
    id: "sedan",
    name: "Small Sedan",
    code: "CLASS_01",
    classTag: "SEDAN / COUPE",
    startingPrice: "₹399.00",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "suv",
    name: "SUV",
    code: "CLASS_02",
    classTag: "SUV / 4X4",
    startingPrice: "₹399.00",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pickup",
    name: "Pickup",
    code: "CLASS_03",
    classTag: "PICKUP TRUCK",
    startingPrice: "₹399.00",
    image:
      "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "minibus",
    name: "Minibus",
    code: "CLASS_04",
    classTag: "MINIBUS / VAN",
    startingPrice: "₹399.00",
    image:
      "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "bike",
    name: "Bike",
    code: "CLASS_05",
    classTag: "MOTO / SUPERBIKE",
    startingPrice: "₹399.00",
    image:
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
  },
];

export default function TrustBadges() {
  return (
    <section className="w-full py-16 sm:py-20 border-b border-white/[0.08] bg-noir-900">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Eyebrow & Title */}
        <div className="mb-10 text-left">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-[0.2em] text-noir-400">
            <span className="accent-dot accent-dot-cyan" />
            <span>Fleet Collection · Vehicle Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white tracking-tight">
            Engineered Across All 5 Chassis Categories
          </h2>
          <p className="text-xs sm:text-sm text-noir-400 mt-2 max-w-xl font-sans">
            Basic snow foam wash is strictly flat ₹399 across all 5 classes. Select any vehicle to inspect tiered detailing rates.
          </p>
        </div>

        {/* Collection Strip: Row of Tall, Narrow Product Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {VEHICLE_TILES.map((tile) => (
            <Link
              key={tile.id}
              href={`/pricing?vehicle=${encodeURIComponent(tile.name)}`}
              className="group relative flex flex-col justify-between aspect-[3/5] border border-white/[0.08] hover:border-accent-cyan transition-colors overflow-hidden bg-noir-950 p-3.5"
            >
              {/* Top Header in Monospace */}
              <div className="flex items-center justify-between text-[11px] font-mono text-noir-400 z-10">
                <span className="text-noir-500">{tile.code}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-noir-500 group-hover:text-accent-cyan transition-colors" />
              </div>

              {/* Tight Silhouette Crop Image */}
              <div className="absolute inset-x-0 top-9 bottom-16 overflow-hidden">
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover contrast-120 grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-103 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-transparent to-transparent opacity-80" />
              </div>

              {/* Bottom Labeling in Clean Monospace */}
              <div className="z-10 pt-2 border-t border-white/[0.06]">
                <span className="font-mono text-[10px] text-accent-cyan block tracking-wider uppercase">
                  {tile.classTag}
                </span>
                <span className="font-sans text-sm font-semibold text-white block mt-0.5">
                  {tile.name}
                </span>
                <span className="font-mono text-[11px] text-noir-400 block mt-1">
                  FROM {tile.startingPrice}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Monospace Footnote Row: 4 Trust Badges with Dots */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-y-2.5 gap-x-6 text-xs font-mono text-noir-400">
          <div className="flex items-center gap-2">
            <span className="accent-dot accent-dot-cyan !w-1.5 !h-1.5" />
            <span className="text-white">IDA_CERTIFIED</span>
            <span className="text-noir-500">· German paint standards</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="accent-dot accent-dot-emerald !w-1.5 !h-1.5" />
            <span className="text-white">100%_SCRATCH_FREE</span>
            <span className="text-noir-500">· 800 GSM plush mitts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="accent-dot accent-dot-cyan !w-1.5 !h-1.5" />
            <span className="text-white">ECO_CHEMISTRY</span>
            <span className="text-noir-500">· pH 7.0 biodegradable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="accent-dot accent-dot-gold !w-1.5 !h-1.5" />
            <span className="text-white">5_STAR_RATED</span>
            <span className="text-noir-500">· 1,200+ verified audits</span>
          </div>
        </div>
      </div>
    </section>
  );
}
