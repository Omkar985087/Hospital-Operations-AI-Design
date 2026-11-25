/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          teal: '#0F766E',
          'teal-hover': '#115E59',
          'teal-light': '#CCFBF1',
          navy: '#0F172A',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        elevated: '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};

