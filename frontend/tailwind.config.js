/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['SF Mono', 'Roboto Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        /* ── Brand: Deep Indigo ── */
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        /* ── Accent: Calming Teal ── */
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        /* ── Canvas: Slate ── */
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        /* ── Semantic ── */
        success: {
          light:   '#f0fdf4',
          DEFAULT: '#22c55e',
          dark:    '#16a34a',
        },
        warning: {
          light:   '#fffbeb',
          DEFAULT: '#f59e0b',
          dark:    '#d97706',
        },
        danger: {
          light:   '#fef2f2',
          DEFAULT: '#ef4444',
          dark:    '#dc2626',
        },
        info: {
          light:   '#eff6ff',
          DEFAULT: '#3b82f6',
          dark:    '#2563eb',
        },
        /* ── Legacy aliases (backward compat) ── */
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        health: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        /* Soft micro-elevation — no harsh gray outlines */
        'card':       '0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 8px 28px rgba(15, 23, 42, 0.10), 0 4px 10px rgba(15, 23, 42, 0.05)',
        'soft':       '0 2px 8px rgba(15, 23, 42, 0.06)',
        'soft-md':    '0 4px 12px rgba(15, 23, 42, 0.07)',
        'soft-lg':    '0 8px 24px rgba(15, 23, 42, 0.08)',
        'soft-xl':    '0 16px 40px rgba(15, 23, 42, 0.10)',
        'brand':      '0 4px 16px rgba(79, 70, 229, 0.22)',
        'accent':     '0 4px 16px rgba(20, 184, 166, 0.22)',
        'glow-brand': '0 0 0 3px rgba(79, 70, 229, 0.18)',
        'glow-teal':  '0 0 0 3px rgba(20, 184, 166, 0.18)',
        'emergency':  '0 0 0 3px rgba(220, 38, 38, 0.15), 0 4px 20px rgba(220, 38, 38, 0.12)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        'gradient-teal':    'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
        'gradient-hero':    'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #14b8a6 100%)',
        'gradient-card':    'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        /* Legacy */
        'gradient-health':   'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'gradient-primary':  'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
        'gradient-fresh':    'linear-gradient(135deg, #6366f1 0%, #14b8a6 50%, #22c55e 100%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out',
        'fade-in-up':    'fadeInUp 0.4s ease-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'slide-in-right':'slideInRight 0.4s ease-out',
        'scale-in':      'scaleIn 0.3s ease-out',
        'pulse-soft':    'pulseSoft 2.4s ease-in-out infinite',
        'pulse-brand':   'pulseBrand 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'breathe':       'breathe 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp:     { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(-14px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseSoft:    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.65' } },
        pulseBrand:   { '0%, 100%': { boxShadow: '0 0 0 0 rgba(79, 70, 229, 0.3)' }, '50%': { boxShadow: '0 0 0 8px rgba(79, 70, 229, 0)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        breathe:      { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
