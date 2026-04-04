/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryGlow: "#5cc8ff",
        cardBorder: "rgba(255, 255, 255, 0.22)",
      },
      boxShadow: {
        glow: "0 0 35px rgba(92, 200, 255, 0.28)",
        glass: "0 18px 40px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Sora", "sans-serif"],
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(15px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(92, 200, 255, 0.15)" },
          "50%": { boxShadow: "0 0 22px rgba(92, 200, 255, 0.35)" },
        },
      },
      animation: {
        floatIn: "floatIn 0.6s ease-out forwards",
        pulseGlow: "pulseGlow 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
