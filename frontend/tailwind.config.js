/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b4c8fb',
          400: '#8baaf7',
          500: '#638bf2',
          600: '#476eeb',
          700: '#3556d7',
          800: '#2c45ae',
          900: '#283c8a',
          950: '#192454',
        }
      }
    },
  },
  plugins: [],
}
