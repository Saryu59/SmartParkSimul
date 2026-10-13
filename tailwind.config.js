/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8F6',
        surface: '#FFFFFF',
        charcoal: {
          50: '#F7F8F6',
          100: '#ECEEEB',
          200: '#E2E6E2',
          300: '#CDD2CD',
          400: '#8A968F',
          500: '#5E6962',
          600: '#46514A',
          700: '#343E37',
          800: '#28322B',
          900: '#202923',
          950: '#141A16',
        },
        forest: {
          50: '#F0F7F4',
          100: '#E1EFE8',
          200: '#C3DFD3',
          300: '#9BCCB7',
          400: '#52A782',
          500: '#176B4D', // Primary forest green
          600: '#135C42',
          700: '#0F4D37',
          800: '#0C3D2C',
          900: '#082E21',
          950: '#041B13',
        },
        slot: {
          available: '#176B4D',
          'available-bg': '#EBF5F0',
          'available-border': '#C6E2D6',
          occupied: '#DC2626',
          'occupied-bg': '#FEF2F2',
          'occupied-border': '#FECACA',
          reserved: '#D97706',
          'reserved-bg': '#FEF3C7',
          'reserved-border': '#FDE68A',
          offline: '#64748B',
          'offline-bg': '#F1F5F9',
          'offline-border': '#E2E8F0',
          maintenance: '#475569',
          'maintenance-bg': '#F8FAFC',
          'maintenance-border': '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(32, 41, 35, 0.04)',
        'subtle': '0 1px 3px rgba(32, 41, 35, 0.05), 0 1px 2px rgba(32, 41, 35, 0.03)',
        'card': '0 1px 3px rgba(32, 41, 35, 0.04), 0 8px 16px -8px rgba(32, 41, 35, 0.03)',
        'elevated': '0 10px 25px -5px rgba(32, 41, 35, 0.08), 0 8px 10px -6px rgba(32, 41, 35, 0.04)',
      }
    },
  },
  plugins: [],
}
