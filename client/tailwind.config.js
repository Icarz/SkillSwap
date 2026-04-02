/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:      "#0B2447",
        secondary:    "#19376D",
        accent:       "#576CBC",
        light:        "#A5D7E8",
        primaryRGB:   "rgb(11, 36, 71)",
        secondaryRGB: "rgb(25, 55, 109)",
        accentRGB:    "rgb(87, 108, 188)",
        lightRGB:     "rgb(165, 215, 232)",
      },
      backgroundImage: {
        app: "linear-gradient(to bottom right, #0B2447, #19376D, #576CBC, #A5D7E8)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glow:       "0 0 30px rgba(87, 108, 188, 0.35)",
        "glow-lg":  "0 0 60px rgba(87, 108, 188, 0.45)",
        "light-glow": "0 0 30px rgba(165, 215, 232, 0.4)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.7s ease-out both",
        "fade-in":    "fadeIn 0.6s ease-out both",
        "float":      "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-18px)" },
        },
      },
    },
  },
  plugins: [],
};
