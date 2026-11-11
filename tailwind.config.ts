import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1440px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Dark Luxury Theme Palette
        charcoal: {
          950: "#0A0A0C",
          900: "#0F0F12", // Primary Dark Background
          850: "#141418", // Dark Card Elevated
          800: "#1A1A21", // Surface Level 1
          750: "#22222C", // Surface Level 2 / Border Accent
          700: "#2C2C39",
          600: "#444457",
          500: "#606078",
          400: "#8686A3",
        },
        // Neon Cyan / Blue
        neon: {
          blue: "#00D4FF",
          DEFAULT: "#00D4FF",
          hover: "#00B8DE",
          glow: "rgba(0, 212, 255, 0.45)",
          subtle: "rgba(0, 212, 255, 0.12)",
        },
        // Gold / Yellow Luxury Accents
        gold: {
          DEFAULT: "#FFC107",
          light: "#FFE082",
          dark: "#FFA000",
          glow: "rgba(255, 193, 7, 0.4)",
          subtle: "rgba(255, 193, 7, 0.12)",
        },
        // Pure Black (Special requirement for Footer & Deep Contrast)
        pureBlack: "#000000",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        "neon-sm": "0 0 10px rgba(0, 212, 255, 0.25)",
        "neon-md": "0 0 20px rgba(0, 212, 255, 0.35)",
        "neon-lg": "0 0 35px rgba(0, 212, 255, 0.5)",
        "gold-sm": "0 0 10px rgba(255, 193, 7, 0.25)",
        "gold-md": "0 0 22px rgba(255, 193, 7, 0.38)",
        "glass-card": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-hover": "0 12px 40px 0 rgba(0, 212, 255, 0.2)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "float-bubble": "floatBubble 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "shimmer": "shimmer 2.2s infinite linear",
        "foam-expand": "foamExpand 1.5s ease-out forwards",
      },
      keyframes: {
        floatBubble: {
          "0%, 100%": { transform: "translateY(0px) scale(1)", opacity: "0.8" },
          "50%": { transform: "translateY(-14px) scale(1.08)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(0, 212, 255, 0.25)",
            borderColor: "rgba(0, 212, 255, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(0, 212, 255, 0.55)",
            borderColor: "rgba(0, 212, 255, 0.8)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        foamExpand: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
