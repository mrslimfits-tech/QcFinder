/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // CSS custom properties (app/globals.css) flip per-theme; every
        // component keeps using these same class names (bg-paper,
        // text-ink, border-line, bg-surface, ...) in both modes — no
        // dark: variants needed throughout the app for the base palette.
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        slate: {
          muted: "rgb(var(--color-muted) / <alpha-value>)"
        },
        verified: {
          DEFAULT: "rgb(var(--color-verified) / <alpha-value>)",
          soft: "rgb(var(--color-verified-soft) / <alpha-value>)"
        },
        flag: {
          DEFAULT: "rgb(var(--color-flag) / <alpha-value>)",
          soft: "rgb(var(--color-flag-soft) / <alpha-value>)"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      backgroundImage: {
        scanline:
          "repeating-linear-gradient(180deg, rgba(15,110,92,0.06) 0px, rgba(15,110,92,0.06) 1px, transparent 1px, transparent 3px)"
      },
      keyframes: {
        scan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 120px" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        scan: "scan 3s linear infinite",
        rise: "rise 0.35s ease-out"
      }
    }
  },
  plugins: []
};
