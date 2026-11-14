import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accentColor?: "blue" | "green" | "yellow" | "gold" | "purple";
  subtext?: string;
  className?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  accentColor = "blue",
  subtext,
  className,
}: StatsCardProps) {
  const colorMap = {
    blue: {
      border: "border-neon-blue/30 hover:border-neon-blue/60",
      iconBg: "bg-neon-blue/10 text-neon-blue",
      glow: "shadow-[0_0_20px_rgba(0,240,255,0.08)]",
    },
    green: {
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.08)]",
    },
    yellow: {
      border: "border-amber-500/30 hover:border-amber-500/60",
      iconBg: "bg-amber-500/10 text-amber-400",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.08)]",
    },
    gold: {
      border: "border-gold/30 hover:border-gold/60",
      iconBg: "bg-gold/15 text-gold",
      glow: "shadow-[0_0_20px_rgba(212,175,55,0.1)]",
    },
    purple: {
      border: "border-purple-500/30 hover:border-purple-500/60",
      iconBg: "bg-purple-500/10 text-purple-400",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.08)]",
    },
  };

  const style = colorMap[accentColor] || colorMap.blue;

  return (
    <div
      className={cn(
        "glass-panel p-5 sm:p-6 rounded-2xl border bg-charcoal-850/80 transition-all duration-300 hover:-translate-y-1",
        style.border,
        style.glow,
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-gray-400/80 pt-0.5">{subtext}</p>
          )}
        </div>
        <div className={cn("p-3 sm:p-3.5 rounded-xl shrink-0", style.iconBg)}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
