/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#DA447D',
          dark: '#3B1F2B',
          light: '#FDC8D5',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #DA447D 0%, #DA447D 100%)',
      }
    },
  },
  plugins: [],
};