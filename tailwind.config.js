/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#C7416C',
          dark: '#3B1F2B',
          light: '#FDC8D5',
        },
        instructor: {
          DEFAULT: '#005f73',
          light: '#0a9396',
          lighter: '#94d2bd',
          dark: '#003d4a',
          bg: '#e9f5f7',
        },
        school: {
          DEFAULT: '#b45309',
          light: '#d97706',
          lighter: '#fde68a',
          dark: '#713f12',
          bg: '#fffbeb',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #DA447D 0%, #DA447D 100%)',
      }
    },
  },
  plugins: [],
};