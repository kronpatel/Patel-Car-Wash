"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { SHOP_CONFIG } from "@/lib/constants";

export default function WhatsAppFloatingBtn() {
  const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);

  // Clean phone number for WhatsApp API link
  const rawNumber = SHOP_CONFIG.whatsappNumber.replace(/[^0-9]/g, "");
  const defaultMessage = encodeURIComponent(
    "Hi Patel car'spa & Detailing! I'd like to inquire about booking a luxury car wash or detailing service."
  );
  const waUrl = `https://wa.me/${rawNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 pointer-events-auto">
      {/* Friendly Chat Tooltip (collapsible) */}
      {!isTooltipDismissed && (
        <div className="hidden sm:flex items-center gap-2 glass-panel px-3.5 py-2 rounded-xl text-xs text-gray-200 border border-neon-blue/30 shadow-neon-sm animate-fade-in">
          <span>Need help? Chat with our team!</span>
          <button
            onClick={() => setIsTooltipDismissed(true)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss chat tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open WhatsApp live chat with Patel car'spa & Detailing"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
      >
        {/* Radar ping ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />

        <MessageCircle className="w-7 h-7 relative z-10 transition-transform group-hover:scale-110" />
      </a>
    </div>
  );
}
