import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        rpg: {
          void: "#07080c",
          surface: {
            DEFAULT: "#0d0f18",
            subtle: "#131724",
            card: "#181e2e",
            elevated: "#21283d",
            border: "#28314a",
          },
          gold: {
            DEFAULT: "#d4af37",
            light: "#f9e076",
            dark: "#997d19",
            glow: "rgba(212, 175, 55, 0.25)",
          },
          mana: {
            DEFAULT: "#00d2ff",
            light: "#80e5ff",
            dark: "#008db3",
            glow: "rgba(0, 210, 255, 0.25)",
          },
          health: {
            DEFAULT: "#e53e3e",
            light: "#fc8181",
            dark: "#9b2c2c",
            glow: "rgba(229, 62, 62, 0.25)",
          },
          xp: {
            DEFAULT: "#a855f7",
            light: "#c084fc",
            dark: "#7e22ce",
            glow: "rgba(168, 85, 247, 0.25)",
          },
          rarity: {
            common: "#94a3b8",
            uncommon: "#22c55e",
            rare: "#00d2ff",
            epic: "#a855f7",
            legendary: "#f59e0b",
            mythic: "#f43f5e",
          },
        },
      },
      boxShadow: {
        "gold-glow": "0 0 20px -3px rgba(212, 175, 55, 0.35)",
        "mana-glow": "0 0 20px -3px rgba(0, 210, 255, 0.35)",
        "xp-glow": "0 0 20px -3px rgba(168, 85, 247, 0.35)",
        "health-glow": "0 0 20px -3px rgba(229, 62, 62, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
