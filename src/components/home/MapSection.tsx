"use client";

import React from "react";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { SHOP_CONFIG } from "@/lib/constants";

export default function MapSection() {
  return (
    <section id="location" className="w-full py-20 relative">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest font-semibold text-neon-blue px-3.5 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 inline-block mb-3">
            Visit Our Studio
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            Find Us in <span className="text-neon-blue">Gujarat</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Conveniently located with spacious wash bays, professional equipment, and an air-conditioned customer lounge.
          </p>
        </div>

        {/* Location Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Shop Information Card */}
          <div className="lg:col-span-5 flex flex-col justify-between glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Open Today — Walk-ins Welcome</span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 text-neon-blue flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Studio Address
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    {SHOP_CONFIG.address}
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Operating Hours
                  </h4>
                  <p className="text-sm text-gray-300">
                    {SHOP_CONFIG.hours}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sunday express slots available
                  </p>
                </div>
              </div>

              {/* Phone / Booking Inquiry */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 text-neon-blue flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Helpline &amp; WhatsApp
                  </h4>
                  <a
                    href={`tel:${SHOP_CONFIG.phone}`}
                    className="text-sm font-semibold text-neon-blue hover:underline"
                  >
                    {SHOP_CONFIG.phone}
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Immediate support for slot bookings
                  </p>
                </div>
              </div>

              {/* Lounge Perk */}
              <div className="p-4 rounded-2xl bg-charcoal-850 border border-white/5 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
                <p className="text-xs text-gray-300">
                  Free high-speed WiFi, artisanal coffee &amp; live bay video feed in our lounge while you wait.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <a
                href={SHOP_CONFIG.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 neon-glow-btn py-3.5 px-4 rounded-2xl text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-neon-sm hover:scale-105 transition-all text-charcoal-950"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>

              <a
                href={`tel:${SHOP_CONFIG.phone}`}
                className="py-3.5 px-5 rounded-2xl bg-charcoal-800 hover:bg-white/10 text-white text-sm font-medium border border-white/10 text-center flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-neon-blue" />
                <span>Call Shop</span>
              </a>
            </div>
          </div>

          {/* Embedded Google Maps Container */}
          <div className="lg:col-span-7 glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-xl h-[360px] sm:h-[450px] lg:h-[500px] relative">
            <iframe
              src={SHOP_CONFIG.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Patel Car Wash And Spa Location Map"
              className="w-full h-full grayscale-[0.3] contrast-125"
            />

            {/* Direct Google Maps Link Button */}
            <a
              href={SHOP_CONFIG.placeLink || SHOP_CONFIG.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in Google Maps"
              className="absolute top-4 right-4 glass-panel px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/20 hover:border-neon-blue shadow-lg flex items-center gap-1.5 transition-colors backdrop-blur-md"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-neon-blue" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
