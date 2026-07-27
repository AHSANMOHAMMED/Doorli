/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        doorli: {
          primary: '#2563eb',
          dark: '#1e40af',
          navy: 'var(--doorli-navy)',
          'navy-mid': 'var(--doorli-navy-mid)',
          deep: 'var(--doorli-deep)',
          blue: 'var(--doorli-blue)',
          sky: 'var(--doorli-sky)',
          teal: 'var(--doorli-teal)',
          mint: 'var(--doorli-mint)',
          gold: 'var(--doorli-gold)',
          text: 'var(--doorli-text)',
          muted: 'var(--doorli-text-muted)',
          dim: '#6b86a6',
        },
      },
      fontFamily: {
        display: ['var(--font-doorli-display)', 'Syne', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
