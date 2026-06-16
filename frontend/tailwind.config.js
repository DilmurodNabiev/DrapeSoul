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
        surface: {
          light: '#ffffff',
          dark: '#0f0f0f',
          card: { light: '#fafafa', dark: '#1a1a1a' },
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
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
