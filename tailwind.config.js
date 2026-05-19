/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        zincBlack: '#030712',
        accentPurple: '#8b5cf6',
      }
    },
  },
  plugins: [],
}