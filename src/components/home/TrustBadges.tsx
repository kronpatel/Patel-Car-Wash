"use client";

import React from "react";
import { Star, Leaf, Award, ShieldCheck, Sparkles } from "lucide-react";
import { TRUST_BADGES } from "@/lib/constants";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  Leaf,
  Award,
  ShieldCheck,
};

export default function TrustBadges() {
  return (
    <section className="py-14 sm:py-20 relative z-10 border-y border-white/5 bg-charcoal-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-xs font-semibold text-neon-blue uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>The CleanPro Quality Standard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Why Discerning Automobile Owners Choose Us
          </h2>
        </div>

        {/* 4 Trust Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_BADGES.map((badge, idx) => {
            const IconComponent = ICON_MAP[badge.iconName] || ShieldCheck;

            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col justify-between group transition-all duration-300"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-charcoal-850 border border-neon-blue/30 text-neon-blue flex items-center justify-center mb-5 group-hover:border-neon-blue group-hover:scale-110 group-hover:shadow-neon-sm transition-all">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">
                    {badge.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-medium text-neon-blue/80">
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
