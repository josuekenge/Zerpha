/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
        },
        primarySoft: '#EFF6FF',
        surface: '#FFFFFF',
        background: '#F5F7FB',
        border: '#E2E8F0',
        text: '#0F172A',
        muted: '#64748B',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      backgroundImage: {
        'body-gradient': 'linear-gradient(to bottom, #FFFFFF 0%, #EFF6FF 100%)',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
