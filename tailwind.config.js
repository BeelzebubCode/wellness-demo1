/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ✅ ใช้ CSS Variables จาก tenants.css
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',

        card: 'rgb(var(--card) / <alpha-value>)',
        'card-fg': 'rgb(var(--card-fg) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          50: 'rgb(var(--primary) / 0.06)',
          100: 'rgb(var(--primary) / 0.10)',
          200: 'rgb(var(--primary) / 0.16)',
          300: 'rgb(var(--primary) / 0.22)',
          400: 'rgb(var(--primary) / 0.30)',
          500: 'rgb(var(--primary) / 1)',
          600: 'rgb(var(--primary-600) / 1)',
          700: 'rgb(var(--primary-600) / 1)', // ถ้ายังไม่แยก var 700 ก็ใช้ 600 ไปก่อน
        },

        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        },

        ring: 'rgb(var(--ring) / <alpha-value>)',

        // ✅ gradient tokens (เอาไว้ทำพื้นหลังแบบ tenant)
        'bg-grad-1': 'rgb(var(--bg-grad-1) / <alpha-value>)',
        'bg-grad-2': 'rgb(var(--bg-grad-2) / <alpha-value>)',

        // คงไว้ได้ถ้าอยากมี background paper
        background: {
          DEFAULT: '#FAFAFA',
          paper: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Sarabun', 'IBM Plex Sans Thai', 'sans-serif'],
        heading: ['IBM Plex Sans Thai', 'Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
