/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1b17",
        muted: "#6f6a5f",
        paper: "#f4f1ea",
        panel: "#fbfaf6",
        soft: "#ece8dd",
        line: "#e2ddd0",
        focus: "#e4d4ac",
        danger: { DEFAULT: "#a3331f", bg: "#f6e9e4", border: "#e3c4b9" },
        warn: { DEFAULT: "#946317", bg: "#f6efdf" },
        ok: { DEFAULT: "#2f6b4f", bg: "#e7f0e9" },
      },
      fontFamily: {
        serif: ["Lora", "serif"],
        sans: ["'Spline Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 180ms ease-out",
      },
    },
  },
  plugins: [],
};
