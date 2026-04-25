/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0ea5e9', dark: '#0369a1', light: '#e0f2fe' },
        success: '#16a34a',
        danger: '#dc2626'
      }
    }
  },
  plugins: []
};
