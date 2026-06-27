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
        gold: {
          light: '#F5D061',
          DEFAULT: '#D4AF37',
          dark: '#AA7C11',
          bg: '#1A1608',
          glow: 'rgba(212, 175, 55, 0.15)',
        },
        dark: {
          bg: '#050505',
          card: '#0D0D0E',
          surface: '#141416',
          border: 'rgba(255, 255, 255, 0.06)',
          text: '#A1A1AA',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'gold': '0 0 15px rgba(212, 175, 55, 0.15)',
        'gold-lg': '0 0 30px rgba(212, 175, 55, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F5D061 0%, #D4AF37 50%, #AA7C11 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0B 0%, #050505 100%)',
      }
    },
  },
  plugins: [],
}
