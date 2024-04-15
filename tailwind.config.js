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
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        general: {
          500: 'rgb(var(--general-500-rgb) / <alpha-value>)',
          DEFAULT: 'rgb(var(--general-500-rgb) / <alpha-value>)',
          200: 'rgb(var(--general-200-rgb) / <alpha-value>)',
          100: 'rgb(var(--general-100-rgb) / <alpha-value>)',
        },
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        attention: 'rgb(var(--attention-rgb) / <alpha-value>)',
        onlight: 'rgb(var(--on-light-rgb) / <alpha-value>)',
        ondark: 'rgb(var(--on-dark-rgb) / <alpha-value>)',
        onwarning: 'rgb(var(--on-warning-rgb) / <alpha-value>)',
        disabled: {
          100: 'rgb(var(--disabled-100-rgb) / <alpha-value>)',
          DEFAULT: 'rgb(var(--disabled-200-rgb) / <alpha-value>)',
          200: 'rgb(var(--disabled-200-rgb) / <alpha-value>)',
        },
        ondisabled: 'rgb(var(--on-disabled-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
