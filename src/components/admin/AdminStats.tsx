"use client";

import React from "react";
import {
  Car,
  CheckCircle2,
  Clock,
  Banknote,
  Users,
  Coins,
  TrendingUp,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface AdminStatsProps {
  stats: {
    todayTotal: number;
    todayCompleted: number;
    pendingJobs: number;
    inProgressJobs: number;
    todayRevenue: number;
    totalRevenue: number;
    totalCustomers: number;
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const cards = [
    {
      label: "Today's Scheduled Washes",
      value: stats.todayTotal,
      subtext: `${stats.todayCompleted} completed so far`,
      icon: Car,
      accent: "text-neon-blue border-neon-blue/30 bg-neon-blue/10",
    },
    {
      label: "Today's Est. Revenue",
      value: formatINR(stats.todayRevenue),
      subtext: `Cumulative: ${formatINR(stats.totalRevenue)}`,
      icon: Banknote,
      accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
      label: "Pending & In-Bay Jobs",
      value: stats.pendingJobs + stats.inProgressJobs,
      subtext: `${stats.inProgressJobs} currently in wash bays`,
      icon: Clock,
      accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
    {
      label: "Registered Customers",
      value: stats.totalCustomers,
      subtext: "Loyalty program accounts",
      icon: Users,
      accent: "text-gold border-gold/30 bg-gold/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <div
            key={idx}
            className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                {card.label}
              </span>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${card.accent}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-heading font-black text-white tracking-tight">
                {card.value}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-neon-blue shrink-0" />
              <span>{card.subtext}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
