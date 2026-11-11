"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    try {
      const splashShown = sessionStorage.getItem("patel_splash_shown");

      if (!splashShown) {
        setIsVisible(true);

        // Fast & snappy: auto dismiss after 1.1 seconds so Hero is never blocked
        const timer = setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem("patel_splash_shown", "true");
        }, 1100);

        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("patel_splash_shown", "true");
    } catch {
      // Ignore storage errors in private/incognito modes
    }
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="patel-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
          transition={{ duration: 0.25 }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal-950/98 backdrop-blur-xl select-none cursor-pointer overflow-hidden"
          title="Click anywhere to skip"
        >
          {/* Subtle Ambient Background Glows (GPU Accelerated, No lag) */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-neon-blue/15 blur-[120px] -top-24 -left-24 pointer-events-none" />
          <div className="absolute w-[450px] h-[450px] rounded-full bg-gold/10 blur-[120px] -bottom-24 -right-24 pointer-events-none" />

          {/* Quick Skip Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute top-6 right-6 text-xs text-gray-400 hover:text-white px-3.5 py-1.5 rounded-full border border-white/10 hover:border-neon-blue/40 bg-white/5 transition-all z-20 flex items-center gap-1.5"
          >
            <span>Skip</span>
            <ArrowRight className="w-3 h-3 text-neon-blue" />
          </button>

          {/* Brand Presentation Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.04, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center px-6 text-center max-w-md pointer-events-none"
          >
            {/* Official Studio Logo */}
            <div className="relative mb-6 drop-shadow-[0_0_25px_rgba(0,210,255,0.25)]">
              <Image
                src="/logo/logo.png"
                alt="Patel car'spa & Detailing"
                width={260}
                height={95}
                priority
                className="object-contain h-16 sm:h-20 w-auto"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gold/20 border border-gold/60 flex items-center justify-center shadow-gold-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold" />
              </motion.div>
            </div>

            {/* Sub-tagline */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="text-xs sm:text-sm tracking-widest uppercase font-semibold text-gray-300 mb-6"
            >
              Gujarat&apos;s Luxury Auto Spa &amp; Detailing
            </motion.p>

            {/* Snappy Progress Shimmer Line */}
            <div className="w-48 sm:w-56 h-1 bg-charcoal-800 rounded-full overflow-hidden relative border border-white/5">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.95, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-neon-blue via-cyan-300 to-gold shadow-neon-sm"
              />
            </div>

            <p className="text-[11px] text-gray-500 mt-4">
              Tap anywhere to enter
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
