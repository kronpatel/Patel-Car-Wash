"use client";

import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Car, Coins, ShieldCheck, Flame, Radio } from "lucide-react";

interface CounterItem {
  id: string;
  label: string;
  target: number;
  suffix: string;
  prefix?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const STATS_DATA: CounterItem[] = [
  {
    id: "cars-week",
    label: "Cars Washed This Week",
    target: 47,
    suffix: "",
    description: "Across all 4 wash bays in Gujarat",
    icon: Car,
    accentColor: "text-neon-blue border-neon-blue/40 bg-neon-blue/10",
  },
  {
    id: "ceramic-jobs",
    label: "Ceramic Coatings Applied",
    target: 128,
    suffix: "+",
    description: "9H nano-SiO2 3-year warranty protection",
    icon: ShieldCheck,
    accentColor: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  },
  {
    id: "clean-coins",
    label: "Clean Coins Rewarded",
    target: 28400,
    suffix: "+",
    description: "Redeemed for instant discounts by members",
    icon: Coins,
    accentColor: "text-gold border-gold/40 bg-gold/10",
  },
  {
    id: "turnaround-mins",
    label: "Avg. Turnaround Time",
    target: 26,
    suffix: " min",
    description: "Express high-pressure snow foam wash",
    icon: Flame,
    accentColor: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  },
];

function CountUpNumber({
  target,
  duration = 1.8,
}: {
  target: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = target;
    const totalFrames = 60 * duration;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easedProgress * end);

      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
}

export default function LiveCounter() {
  return (
    <section className="w-full py-16 sm:py-24 relative overflow-hidden">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Live Banner Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE WORKSHOP TELEMETRY</span>
            </div>
            <span className="hidden md:inline-block text-xs text-gray-400">
              Updated 5 minutes ago
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Radio className="w-4 h-4 text-neon-blue animate-pulse" />
            <span>Bay 1 & Bay 2 in service • 3 slots available today</span>
          </div>
        </div>

        {/* 4 Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_DATA.map((item, idx) => {
            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                    {item.label}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.accentColor}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>

                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
                    <CountUpNumber target={item.target} />
                  </span>
                  <span className="text-xl sm:text-2xl font-heading font-bold text-neon-blue">
                    {item.suffix}
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
