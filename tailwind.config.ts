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
      "3xl": "1920px",
    },
    extend: {
      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
        "10xl": "112.5rem",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // OWASP Noir Cool Near-Black Palette
        noir: {
          950: "#060608",
          900: "#0B0B0D", // Primary Canvas Background
          850: "#111114", // Surface Level 1 (Panels, Cards)
          800: "#16161A", // Surface Level 2 (Elevated, Inputs)
          750: "#1C1C21", // Surface Level 3 (Borders, Active Rows)
          700: "#24242B",
          600: "#363640",
          500: "#525260",
          400: "#757585",
          300: "#A1A1B0",
          200: "#D1D1DB",
          100: "#EDEDF2",
        },
        // Backward-compatible alias mapping charcoal -> noir
        charcoal: {
          950: "#060608",
          900: "#0B0B0D",
          850: "#111114",
          800: "#16161A",
          750: "#1C1C21",
          700: "#24242B",
          600: "#363640",
          500: "#525260",
          400: "#757585",
        },
        // Noir Accents (used with extreme restraint)
        accent: {
          cyan: "#00D4FF", // Primary CTA, active nav, status dots
          DEFAULT: "#00D4FF",
          gold: "#FFC107", // Loyalty / Coins / Ceramic callout dot only
        },
        // Backward-compatible aliases for neon & gold
        neon: {
          blue: "#00D4FF",
          DEFAULT: "#00D4FF",
          hover: "#00B8DE",
          glow: "transparent",
          subtle: "rgba(0, 212, 255, 0.08)",
        },
        gold: {
          DEFAULT: "#FFC107",
          light: "#FFE082",
          dark: "#D97706",
          glow: "transparent",
          subtle: "rgba(255, 193, 7, 0.08)",
        },
        pureBlack: "#000000",
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-poppins)", "var(--font-inter)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        terminal: "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        "neon-sm": "none",
        "neon-md": "none",
        "neon-lg": "none",
        "gold-sm": "none",
        "gold-md": "none",
        "glass-card": "none",
        "glass-hover": "none",
      },
      borderRadius: {
        terminal: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
