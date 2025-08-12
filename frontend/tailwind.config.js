/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    // Allow dynamic Tailwind tokens like bg-blue-800, text-blue-800, border-blue-800, including hover variants
    {
      pattern: /(bg|text|border)-(red|rose|pink|fuchsia|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|stone|neutral|zinc|gray|slate)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus']
    }
  ],
  plugins: [],
}

