import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#e6f7f5',
          100: '#b3e5df',
          500: '#0E8A7D',
          700: '#0a6b60',
          900: '#06453d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
