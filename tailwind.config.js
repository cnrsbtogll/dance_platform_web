/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#ED3D81',
          dark: '#3B1F2B',
          light: '#FDC8D5',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ED3D81 0%, #E91E63 100%)',
      }
    },
  },
  plugins: [],
};