/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores oficiais extraídas do Assistente COLIH
        primary: {
          DEFAULT: '#1F619E',
          hover: '#184E7F',
          light: '#EAF2F8',
          dark: '#143E66',
        },
        assistente: {
          blue: '#1F619E',
          blueHover: '#184E7F',
          blueLight: '#EAF2F8',
          bg: '#FAF9FD',
          card: '#FFFFFF',
          cardHeader: '#DDE5EE',
          inputBg: '#F4F3F7',
          border: '#E2E8F0',
        },
        brand: {
          50: '#F0F6FA',
          100: '#E0EEF6',
          200: '#BAE0FD',
          300: '#7CC7FB',
          400: '#36ABF6',
          500: '#1F619E',
          600: '#1F619E',
          700: '#184E7F',
          800: '#143E66',
          900: '#0E2E4D',
          950: '#071A2E',
        },
      },
    },
  },
  plugins: [],
}
