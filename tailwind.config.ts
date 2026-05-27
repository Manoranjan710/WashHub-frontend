import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Sea Escape palette
        aqua: {
          50:  '#e0f9fc',
          100: '#b3f0f5',
          200: '#80e5ee',
          300: '#4ddbe7',
          400: '#26d3e2',
          500: '#00b4cc', // Aqua Wave
          600: '#009db3',
          700: '#008799',
          800: '#007080',
          900: '#005a66',
        },
        deepsea: {
          50:  '#e0eef2',
          100: '#b3d5dd',
          200: '#80bac6',
          300: '#4d9faf',
          400: '#268b9e',
          500: '#006b7f',
          600: '#005f73', // Deep Sea
          700: '#004d5e',
          800: '#003b48',
          900: '#002932',
        },
        arctic: {
          50:  '#f0fbfd',
          100: '#c5edf5', // Arctic Breeze
          200: '#9de2ee',
          300: '#70d6e6',
          400: '#45cadd',
          500: '#1abdd3',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'toast-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0)   scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.22s ease-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;
