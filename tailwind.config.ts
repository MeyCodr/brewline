import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        brand: {
          1: 'var(--brand-1)',
          2: 'var(--brand-2)',
          tint: 'var(--brand-tint)',
          'tint-2': 'var(--brand-tint-2)',
          text: 'var(--brand-text)',
          shadow: 'var(--brand-shadow)',
        },
        canvas: {
          DEFAULT: 'var(--canvas)',
          2: 'var(--canvas-2)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
