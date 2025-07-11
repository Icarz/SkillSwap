/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0B2447",
        secondary: "#19376D",
        accent: "#576CBC",
        light: "#A5D7E8",
        primaryRGB: "rgb(11, 36, 71)",
        secondaryRGB: "rgb(25, 55, 109)",
        accentRGB: "rgb(87, 108, 188)",
        lightRGB: "rgb(165, 215, 232)",
      },
      backgroundImage: {
        app: "linear-gradient(to bottom right, #0B2447, #19376D, #576CBC, #A5D7E8)",
      },
    },
  },
  plugins: [],
};
