"use client";

import React from "react";
import Link from "next/link";
import {
  Droplets,
  Wind,
  Circle,
  Square,
  Sparkles,
  Shield,
  Armchair,
  Paintbrush,
  Bike,
  Clock,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { ServiceItem } from "@/types";
import { cn } from "@/lib/utils";

// Map string names from constants to Lucide Icon components
const ICON_MAP: Record<string, LucideIcon> = {
  Droplets,
  Wind,
  Circle,
  Square,
  Sparkles,
  Shield,
  Armchair,
  Paintbrush,
  Bike,
};

interface ServiceCardProps {
  service: ServiceItem;
  className?: string;
}

export default function ServiceCard({ service, className }: ServiceCardProps) {
  const IconComponent = ICON_MAP[service.iconName] || Sparkles;

  const categoryBadge = {
    wash: {
      label: "Basic Wash",
      bg: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
    },
    detailing: {
      label: "Luxury Detailing",
      bg: "bg-gold/10 text-gold-light border-gold/30",
    },
    bike: {
      label: "Two-Wheeler",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  }[service.category];

  // Pre-fill target URL for booking
  const bookUrl = `/book?service=${encodeURIComponent(service.title)}`;

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden border border-white/5",
        service.category === "detailing"
          ? "hover:border-gold/50 hover:shadow-gold-sm"
          : "hover:border-neon-blue/50 hover:shadow-neon-sm",
        className
      )}
    >
      {/* Top Ambient Glow on Hover */}
      <div
        className={cn(
          "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none",
          service.category === "detailing" ? "bg-gold" : "bg-neon-blue"
        )}
      />

      <div>
        {/* Card Header: Icon & Category Tag */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105",
              service.category === "detailing"
                ? "bg-gold/10 border-gold/30 text-gold shadow-gold-sm"
                : "bg-neon-blue/10 border-neon-blue/30 text-neon-blue shadow-neon-sm"
            )}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border",
              categoryBadge.bg
            )}
          >
            {categoryBadge.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          {service.description}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5 text-neon-blue" />
          <span>{service.duration}</span>
        </div>

        <Link
          href={bookUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-neon-blue hover:text-charcoal-950 text-white transition-all duration-200 border border-white/10"
        >
          <span>Book This</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
