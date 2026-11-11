"use client";

import React from "react";
import { Coins, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOYALTY_RULES } from "@/lib/constants";

interface CoinBadgeProps {
  coins: number;
  className?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function CoinBadge({
  coins = 0,
  className,
  showValue = false,
  size = "md",
}: CoinBadgeProps) {
  // 100 coins = ₹50 (0.5 rupee per coin)
  const rupeeWorth = Math.floor(coins * LOYALTY_RULES.COIN_REDEMPTION_VALUE);

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2.5",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      title={`Loyalty balance: ${coins} Clean Coins = ₹${rupeeWorth} off washes`}
      className={cn(
        "inline-flex items-center font-medium rounded-full bg-gold/10 border border-gold/30 text-gold-light hover:border-gold/60 transition-all shadow-gold-sm",
        sizeClasses[size],
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <Coins className={cn("text-gold", iconSizes[size])} />
        <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-gold animate-pulse" />
      </div>
      <span className="font-heading font-semibold text-white tracking-wide">
        {coins.toLocaleString("en-IN")}{" "}
        <span className="text-gold font-normal">Coins</span>
      </span>
      {showValue && (
        <span className="text-xs text-gold/80 pl-1 border-l border-gold/20 font-mono">
          (₹{rupeeWorth})
        </span>
      )}
    </div>
  );
}
