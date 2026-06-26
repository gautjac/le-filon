/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Le Filon — a mine seam at lamplight. Dark earth, warm rock, a vein of gold.
        rock: {
          DEFAULT: "#171210", // deepest stone
          800: "#1f1813",
          700: "#2a2018",
          600: "#372a1f",
          500: "#4a3829",
          400: "#6b513b",
        },
        sand: {
          DEFAULT: "#ece1cf", // lit dust on the wall
          light: "#f6efe2",
          dim: "#d8c8ad",
          mute: "#b8a888",
        },
        // the precious-metal accents — the actual ore
        gold: {
          DEFAULT: "#e8b04b",
          bright: "#f2d27a",
          deep: "#c98f2c",
        },
        copper: "#c97a3a",
        oxide: "#9a5a3c", // rusty iron oxide
        malachite: "#3f7d63", // green ore — "maîtrisé"
        azurite: "#3b6ea5", // blue ore — links
        ember: "#cf5836", // due / overdue urgency
        bone: "#cdbfa6",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "Georgia", "serif"],
        body: ['"Spectral"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        seam: "0 1px 0 0 rgba(242,210,122,0.16), 0 18px 44px -22px rgba(0,0,0,0.75)",
        vein: "0 0 0 1px rgba(232,176,75,0.22), 0 14px 36px -18px rgba(0,0,0,0.7)",
        lift: "0 22px 60px -28px rgba(0,0,0,0.85)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glint: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,176,75,0.0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(232,176,75,0.10)" },
        },
      },
      animation: {
        riseIn: "riseIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        glint: "glint 1.2s ease-in-out infinite",
        pulseGold: "pulseGold 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
