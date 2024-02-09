/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background-rgb))',
        general: {
          500: 'rgb(var(--general-500-rgb))',
          DEFAULT: 'rgb(var(--general-500-rgb))',
          200: 'rgb(var(--general-200-rgb))',
          100: 'rgb(var(--general-100-rgb))',
        },
        accent: 'rgb(var(--accent-rgb))',
        warning: 'rgb(var(--warning-rgb))',
        attention: 'rgb(var(--attention-rgb))',
        onlight: 'rgb(var(--on-light-rgb))',
        ondark: 'rgb(var(--on-dark-rgb))',
        disabled: {
          100: 'rgb(var(--disabled-100-rgb))',
          DEFAULT: 'rgb(var(--disabled-200-rgb))',
          200: 'rgb(var(--disabled-200-rgb))',
        },
        ondisabled: 'rgb(var(--on-disabled-rgb))',
      },
    },
  },
  plugins: [],
}
