import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gadaa: {
          bg: "#0B0B0B",
          cream: "#FFF8E7",
          ochre: "#D98E32",
          indigo: "#1A237E",
          teal: "#0F4C3A",
          sand: "#E8DCC6",
          rust: "#8C3B1F",
          bark: "#2C1810",
          leaf: "#2E7D32",
          leafLight: "#66BB6A",
          noise: "#B71C1C",
        },
        // hero tokens resolve to CSS vars so [data-paper] can flip them wholesale
        hero: {
          ground: "var(--hero-ground)",
          ink: "var(--hero-ink)",
          dim: "var(--hero-dim)",
          faint: "var(--hero-faint)",
          hair: "var(--hero-hair)",
          accent: "var(--hero-accent)",
          cream: "#FFF8E7",
          ember: "#FF4F38",
        }
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        ui: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        micro: "0.3em",
        wide2: "0.45em",
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        fracture: "fracture 0.15s steps(2) infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fracture: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(1px, -1px)" },
          "100%": { transform: "translate(-1px, 1px)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
