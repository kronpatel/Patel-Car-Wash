"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Sparkles, Droplets } from "lucide-react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Check if splash screen was already displayed during this browser session
    try {
      const splashShown = sessionStorage.getItem("cleanpro_splash_shown");

      if (!splashShown) {
        setIsVisible(true);
        // Auto fade-out after 2 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem("cleanpro_splash_shown", "true");
        }, 2000);

        return () => clearTimeout(timer);
      }
    } catch {
      // Handle private browsing or restricted storage modes gracefully
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("cleanpro_splash_shown", "true");
    } catch {
      // Ignore storage errors
    }
  };

  if (!hasMounted || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal-950 overflow-hidden"
        >
          {/* Dismiss / Skip button */}
          <button
            onClick={handleDismiss}
            className="absolute top-6 right-6 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-neon-blue/40 transition-colors z-20"
          >
            Skip
          </button>

          {/* Ambient Background Glows */}
          <div className="absolute w-96 h-96 rounded-full bg-neon-blue/15 blur-3xl -top-20 -left-20 pointer-events-none" />
          <div className="absolute w-96 h-96 rounded-full bg-gold/10 blur-3xl -bottom-20 -right-20 pointer-events-none" />

          {/* Floating Foam & Bubbles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: 400 + Math.random() * 200,
                  x: (i * 80) % 900,
                  opacity: 0,
                  scale: 0.5 + Math.random() * 0.7,
                }}
                animate={{
                  y: -100,
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 2.2 + (i % 3) * 0.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: (i * 0.12) % 1.5,
                }}
                className="absolute flex items-center justify-center rounded-full bg-neon-blue/20 backdrop-blur-xs border border-neon-blue/40 shadow-neon-sm"
                style={{
                  width: `${24 + (i % 5) * 8}px`,
                  height: `${24 + (i % 5) * 8}px`,
                }}
              >
                <Droplets className="w-3 h-3 text-neon-blue opacity-75" />
              </motion.div>
            ))}
          </div>

          {/* Brand Icon & Logo Container */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Car Silhouette with Sparkle Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-charcoal-850 border border-neon-blue/50 flex items-center justify-center shadow-neon-md relative">
                <Car className="w-12 h-12 text-neon-blue" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold/20 border border-gold flex items-center justify-center shadow-gold-sm"
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                </motion.div>
              </div>
            </motion.div>

            {/* Typography */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl font-heading font-extrabold tracking-tight text-white mb-2"
            >
              Clean<span className="text-neon-blue glow-text-neon">Pro</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-sm tracking-widest uppercase font-medium text-gray-400"
            >
              Luxury Detailing & Wash
            </motion.p>

            {/* Shimmer Progress Line */}
            <div className="w-48 h-1 bg-charcoal-800 rounded-full mt-6 overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-neon-blue to-transparent shadow-neon-sm"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
