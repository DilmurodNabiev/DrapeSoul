/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf8f6',
          100: '#f3efe9',
          200: '#e5ddd2',
          300: '#d4c7b5',
          400: '#b8a48c',
          500: '#9c8468',
          600: '#8a7259',
          700: '#735d4a',
          800: '#5f4d3f',
          900: '#4f4136',
          950: '#2a221c',
        },
        gold: {
          50: '#fdf9f0',
          100: '#f9f0dc',
          200: '#f0ddb8',
          300: '#e4c48a',
          400: '#d4a853',
          500: '#c49a3c',
          600: '#a67c2e',
          700: '#856025',
          800: '#6d4f22',
          900: '#5a4120',
        },
        surface: {
          light: '#ffffff',
          dark: '#0a0a0a',
          card: { light: '#fafafa', dark: '#141414' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'ken-burns': 'kenBurns 12s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
