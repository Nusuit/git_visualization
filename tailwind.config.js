/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/renderer/index.html",
    "./app/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          100: '#1e1e1e',
          200: '#2d2d2d',
          300: '#3e3e3e',
          400: '#4e4e4e',
        },
        light: {
          100: '#ffffff',
          200: '#f5f5f5',
          300: '#e5e5e5',
          400: '#d4d4d4',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

