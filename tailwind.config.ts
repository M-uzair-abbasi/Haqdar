import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1B4332", light: "#2D6A4F" },
        accent: "#D4AF37",
        danger: "#C1121F",
        warning: "#F59E0B",
        bg: "#FAFAF9",
        surface: "#FFFFFF",
        "text-main": "#0A0A0A",
        "text-muted": "#525252",
        border: "#E5E5E5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        urdu: ["Noto Nastaliq Urdu", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
