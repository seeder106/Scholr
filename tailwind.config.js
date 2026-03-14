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
        primary:    '#1F3A8A',
        secondary:  '#10B981',
        accent:     '#FBBF24',
        background: '#F3F4F6',
        card:       '#FFFFFF',
        'text-primary':   '#111827',
        'text-secondary': '#6B7280',
        'btn-bg':         '#1F3A8A',
        'btn-hover':      '#1E40AF',
        success:  '#10B981',
        warning:  '#F59E0B',
        error:    '#EF4444',
        border:   '#E5E7EB',
        /* Dark mode tokens */
        'dark-bg':   '#0F172A',
        'dark-card': '#1E293B',
        'dark-text': '#F9FAFB',
        'dark-primary': '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
}
