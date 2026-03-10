/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        universo: ["'Fontspring Demo Universo'", "'Arial Black'", "sans-serif"],
        sans: ["'Fontspring Demo Universo'", "'Universalis ADF Std'", "sans-serif"],
        helvetica: ["'Helvetica Neue Light'", "sans-serif"],
      },
      colors: {
        primary: "#4B98AF",
        secondary: "#164871",
        tertiary: "#608A9A",
      },
    },
  },
  plugins: [],
}
