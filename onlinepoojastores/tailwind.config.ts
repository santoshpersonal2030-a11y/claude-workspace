import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette
        burgundy: {
          DEFAULT: '#8b3a3a', // primary
          dark: '#6b2a2a',    // hover
        },
        gold: {
          DEFAULT: '#e0b455', // accent
          soft: '#f4e3c1',
        },
        cream: '#fffaf5',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
