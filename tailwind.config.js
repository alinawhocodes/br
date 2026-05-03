/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#f9f6ef',
          100: '#f1ead9',
          200: '#e7d9b8',
        },
        terracotta: {
          500: '#c65f3c',
          600: '#ab4f30',
        },
        forest: {
          600: '#2f6d54',
          700: '#265945',
        },
        ink: {
          800: '#1f2a37',
          900: '#17202b',
        },
      },
      boxShadow: {
        card: '0 20px 40px rgba(23, 32, 43, 0.08)',
      },
      backgroundImage: {
        grain:
          'radial-gradient(circle at top left, rgba(198, 95, 60, 0.14), transparent 35%), radial-gradient(circle at bottom right, rgba(47, 109, 84, 0.14), transparent 30%)',
      },
    },
  },
  plugins: [],
};
