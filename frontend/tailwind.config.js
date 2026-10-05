/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070A0F', // Primary ultra dark background
          800: '#0B0F17', // Main app background
          700: '#111726', // Sidebar & Header
          600: '#161C28', // Cards & Container background
          500: '#1F293D', // Card hover / subcontainers
          400: '#2A364F', // Borders & dividers
        },
        brand: {
          cyan: '#00F0FF',
          blue: '#3B82F6',
          indigo: '#6366F1',
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
