"use client";

import React from "react";
import { Star, CheckCircle2, Car, Quote, MessageSquare } from "lucide-react";
import { TESTIMONIALS } from "@/lib/constants";

export default function Testimonials() {
  return (
    <section className="w-full py-20 sm:py-28 relative overflow-hidden bg-charcoal-950/70 border-t border-white/5">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[600px] bg-neon-blue/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-xs font-semibold text-gold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span>Customer Praise</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            Loved by Owners of <span className="text-neon-blue">Luxury Vehicles</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Read authentic feedback from drivers who trust CleanPro with their
            daily rides, supercars, and superbikes.
          </p>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between relative group transition-all duration-300"
            >
              {/* Decorative Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5 group-hover:text-neon-blue/10 transition-colors pointer-events-none" />

              <div>
                {/* 5-Star Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-gold text-gold drop-shadow-[0_0_6px_rgba(255,193,7,0.4)]"
                    />
                  ))}
                </div>

                {/* Testimonial Quote */}
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed italic mb-6">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>

              {/* Author & Vehicle Metadata */}
              <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <span title="Verified Customer">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-neon-blue mt-0.5 font-medium">
                    <Car className="w-3 h-3" />
                    <span>{item.vehicle}</span>
                  </div>
                </div>

                <span className="text-[11px] text-gray-500 font-medium">
                  {item.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Footer Pill */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-panel border border-white/10 text-xs sm:text-sm text-gray-300 shadow-md">
            <MessageSquare className="w-4 h-4 text-neon-blue" />
            <span>Over 1,200+ 5-Star reviews on Google & Justdial across NCR</span>
          </div>
        </div>
      </div>
    </section>
  );
}
