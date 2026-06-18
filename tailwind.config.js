/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: '#4CAF50',
        secondary: '#FF9800',
        tertiary: '#FFD64F',

        // Grayscale
        'gray-dark': '#1C1C1C',
        'gray-medium': '#8B8B8E',
        'gray-light': '#7F7F7F',
      },
    },
  },
  plugins: [],
}