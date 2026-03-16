import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080a12",
        surface: "#0e1120",
        accent: "#7c3aed",
        "accent-cyan": "#06b6d4",
        "accent-rose": "#f43f5e",
        danger: "#f43f5e",
        success: "#10b981",
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,58,237,0.35), 0 0 24px rgba(124,58,237,0.4)",
        "glow-cyan": "0 0 0 1px rgba(6,182,212,0.35), 0 0 24px rgba(6,182,212,0.35)",
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
        criticalPulse: "criticalPulse 1.2s ease-in-out infinite",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        criticalPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

