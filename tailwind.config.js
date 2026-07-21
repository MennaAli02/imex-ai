/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#a5f3fc',
          500: '#0891B2',
          700: '#0E7490',
        },
      },
    },
  },
  plugins: [],
}
