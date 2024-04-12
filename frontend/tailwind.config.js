/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mplus: ['"Playfair Display"', ...defaultTheme.fontFamily.sans]
      }
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#372C2E",
          "secondary": "#D0AB7C",
          "accent": "#F1EFDB",
          "neutral": "#563727",
          "base-100": "#ffffff",
        },
      },
      "nord",
      "retro",
    ],
  },
  plugins: [require("daisyui")],
}

