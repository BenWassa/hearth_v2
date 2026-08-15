/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      // Backed by the --safe-* custom properties in src/index.css, which read
      // env(safe-area-inset-*). Lets JSX write pt-safe-t / pb-safe-b / h-safe-t
      // instead of inline style objects.
      spacing: {
        'safe-t': 'var(--safe-top)',
        'safe-r': 'var(--safe-right)',
        'safe-b': 'var(--safe-bottom)',
        'safe-l': 'var(--safe-left)',
      },
      colors: {
        shell: 'var(--shell-bg)',
      },
    },
  },
  plugins: [],
};
