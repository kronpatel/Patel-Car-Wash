"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("cleanpro_theme") as
        | "dark"
        | "light"
        | null;

      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("light", savedTheme === "light");
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    } catch {
      // In case localStorage is blocked
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("cleanpro_theme", nextTheme);
    } catch {
      // Ignore storage errors
    }
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-charcoal-800/80 border border-white/10" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="w-9 h-9 rounded-xl flex items-center justify-center bg-charcoal-800/80 hover:bg-charcoal-750 text-gray-300 hover:text-white border border-white/10 transition-colors"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-gold transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-neon-blue transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
