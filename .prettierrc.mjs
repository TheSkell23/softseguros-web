/** @type {import("prettier").Config} */
export default {
  singleQuote: true,
  printWidth: 100,
  // prettier-plugin-tailwindcss debe ir el último (README del plugin).
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/styles/global.css',
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};
