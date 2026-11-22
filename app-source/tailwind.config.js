/* Marsa design tokens.
 * `cyan` is remapped to the Marsa brand teal and `slate` to teal-tinted neutrals,
 * so every existing utility class picks up the unified palette. `accent` = Marsa lime. */
const brand = { 50: '#eefaf6', 100: '#d5f2e9', 200: '#ace3d4', 300: '#76cdb7', 400: '#3fb39a', 500: '#1f9480', 600: '#14675a', 700: '#11574c', 800: '#0f473f', 900: '#0d3b35', 950: '#06231f' };
const neutral = { 50: '#f4f7f6', 100: '#e9efed', 200: '#d8e2df', 300: '#b9c9c4', 400: '#8aa19b', 500: '#5f7772', 600: '#465c58', 700: '#31433f', 800: '#1f2d2b', 900: '#142120', 950: '#0b1514' };
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { cyan: brand, slate: neutral, brand, accent: { DEFAULT: '#d6ee94', strong: '#c2e266', ink: '#163d32' } },
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'], mono: ['JetBrains Mono', 'Consolas', 'ui-monospace', 'monospace'] },
      boxShadow: { panel: '0 1px 2px rgb(0 0 0 / .06), 0 8px 24px -12px rgb(0 0 0 / .25)' },
    },
  },
  plugins: [],
};
