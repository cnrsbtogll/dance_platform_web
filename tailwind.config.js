/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E63946', // New Red Accent
          soft: '#F28482', // Soft Red
          darkAccent: '#9B2226', // Dark Red
          secondary: '#005F73', // Deep teal blue
          text: '#0F172A', // Slate 900
          lightText: '#475569', // Slate 600
          bg: '#F8FAFC', // Slate 50
          bgAlt: '#F1F5F9', // Slate 100
          card: '#FFFFFF',
          border: '#E2E8F0',
          dark: {
            bg: '#0F172A', // Slate 900
            card: '#1E293B', // Slate 800
          },
          // Legacy mappings
          pink: '#E63946',
          darkPink: '#9B2226',
          lightPink: '#F28482',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 3px rgba(0, 0, 0, 0.02)',
        'premium-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #E63946 0%, #F28482 100%)',
        'soft-gradient': 'linear-gradient(135deg, #FFF0F5 0%, #F0F9FF 100%)',
      }
    },
  },
  plugins: [],
};