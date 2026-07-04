/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        doorli: {
          primary: '#2563eb',
          dark: '#1e40af',
        },
      },
    },
  },
  plugins: [],
};
