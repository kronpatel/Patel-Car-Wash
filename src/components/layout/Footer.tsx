import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Banknote,
} from "lucide-react";
import { SHOP_CONFIG, PAYMENT_CONFIG } from "@/lib/constants";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const rawWhatsApp = SHOP_CONFIG.whatsappNumber.replace(/[^0-9]/g, "");

  return (
    // STRICT CLIENT REQUIREMENT: Footer MUST be PURE BLACK (#000000)
    <footer className="w-full bg-black border-t border-charcoal-800 text-gray-400 relative z-20">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Info & Mission */}
          <div className="space-y-4">
            <Link href="/" className="inline-block group bg-transparent">
              <Image
                src="/logo/logo.svg"
                alt="Patel Car'spa & Detailing Studio"
                width={220}
                height={80}
                className="object-contain h-11 sm:h-12 w-auto max-w-[200px] sm:max-w-[240px] drop-shadow-[0_0_1px_rgba(255,255,255,0.7)] transition-transform group-hover:scale-105"
              />
            </Link>

            <p className="text-sm leading-relaxed text-gray-400">
              Gujarat&apos;s premier luxury auto spa &amp; detailing studio.
              Delivering high-pressure snow foam baths, interior steam
              sanitization, and 9H nano-ceramic protection with zero compromise.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://wa.me/${rawWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Patel Car'spa & Detailing Studio on WhatsApp"
                className="w-9 h-9 rounded-xl bg-charcoal-900 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border border-white/10 flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Patel Car'spa & Detailing Studio on Instagram"
                className="w-9 h-9 rounded-xl bg-charcoal-900 hover:bg-pink-500/20 text-gray-300 hover:text-pink-400 border border-white/10 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Patel Car'spa & Detailing Studio on Facebook"
                className="w-9 h-9 rounded-xl bg-charcoal-900 hover:bg-blue-500/20 text-gray-300 hover:text-blue-400 border border-white/10 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-white font-heading font-semibold text-base mb-4 tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/services"
                  className="hover:text-neon-blue transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/60" />
                  All Services & Detailing
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-neon-blue transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/60" />
                  Transparent Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="hover:text-neon-blue transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/60" />
                  Book an Appointment
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-neon-blue transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/60" />
                  Customer Loyalty & Coins
                </Link>
              </li>
              <li>
                <Link
                  href="/#location"
                  className="hover:text-neon-blue transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/60" />
                  Shop Location & Directions
                </Link>
              </li>
            </ul>
          </div>

          {/* Workshop Contact Details */}
          <div>
            <h3 className="text-white font-heading font-semibold text-base mb-4 tracking-wide">
              Studio Location
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
                <span className="leading-snug">{SHOP_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-neon-blue shrink-0" />
                <a
                  href={`tel:${SHOP_CONFIG.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {SHOP_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-neon-blue shrink-0" />
                <a
                  href={`mailto:${SHOP_CONFIG.email}`}
                  className="hover:text-white transition-colors"
                >
                  {SHOP_CONFIG.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <span>{SHOP_CONFIG.hours}</span>
              </li>
            </ul>
          </div>

          {/* Payment & Trust Info */}
          <div>
            <h3 className="text-white font-heading font-semibold text-base mb-4 tracking-wide">
              Payment & Assurance
            </h3>
            <div className="p-4 rounded-2xl bg-charcoal-900 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-white text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pay After Wash</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {PAYMENT_CONFIG.note}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-300">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-800 border border-white/5">
                  <Banknote className="w-3 h-3 text-emerald-400" />
                  Cash
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-800 border border-white/5">
                  <CreditCard className="w-3 h-3 text-neon-blue" />
                  UPI / Cards
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-charcoal-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {currentYear} Patel Car&apos;spa &amp; Detailing Studio. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with pride for automobile enthusiasts.
          </p>
        </div>
      </div>
    </footer>
  );
}
