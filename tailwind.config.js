/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#facc15', // yellow-400
          dark: '#eab308', // yellow-500
        },
      },
    },
  },
  plugins: [],
};
