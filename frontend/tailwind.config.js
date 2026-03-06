/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Neutrals (Tailwind gray scale) ─────────────────── */
        surface: {
          DEFAULT: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
        },
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
        'text-body': '#4b5563',
        'text-muted': '#9ca3af',
        'text-dark': '#1f2937',     // gray-800
        'text-label': '#374151',    // gray-700
        'border-default': '#e5e7eb',
        'border-muted': '#d1d5db',

        /* ── Brand / Primary — Rose/Magenta ─────────────────── */
        brand: {
          DEFAULT: '#9b2c5e',
          light: '#fdf2f8',
          100: '#fbcfe8',
          200: '#f3a8cc',
          300: '#f472b6',
          400: '#e0789c',
          500: '#c0507e',
          dark: '#7e2350',
          darker: '#6d1f3e',
        },

        /* ── Accent — Coral/Orange ──────────────────────────── */
        coral: {
          DEFAULT: '#f26a4f',
          light: '#fa7c54',
          hover: '#e05a40',
          dark: '#ee3a04',
          soft: '#ff8c6b',
        },

        /* ── Semantic — Danger/Error (Red) ──────────────────── */
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          DEFAULT: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },

        /* ── Semantic — Success (Green) ─────────────────────── */
        success: {
          50: '#ecfdf5',
          100: '#dcfce7',
          200: '#d1fae5',
          300: '#6ee7b7',
          DEFAULT: '#22c55e',
          600: '#059669',
          700: '#16a34a',
          800: '#166534',
          900: '#065f46',
        },

        /* ── Semantic — Warning (Amber/Yellow) ──────────────── */
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fef08a',
          300: '#fcd34d',
          DEFAULT: '#f59e0b',
          800: '#92400e',
          'yellow-800': '#854d0e',
        },

        /* ── Semantic — Info (Blue) ─────────────────────────── */
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          DEFAULT: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },

        /* ── Accent — Orange ────────────────────────────────── */
        orange: {
          50: '#fff7ed',
          200: '#fed7aa',
          800: '#9a3412',
        },

        /* ── Accent — Purple/Violet ─────────────────────────── */
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          300: '#c4b5fd',
          600: '#7c3aed',
          800: '#5b21b6',
        },

        /* ── Accent — Cyan/Teal ─────────────────────────────── */
        cyan: {
          50: '#ecfeff',
          800: '#155e75',
        },

        /* ── Soft pink (DynamicBookCover) ───────────────────── */
        'soft-pink': '#fecfef',

        /* ── Misc ───────────────────────────────────────────── */
        'app-bg': '#f5f6f8',
      },

      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.05)',
        'elevated': '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
        'focus-blue': '0 0 0 3px rgba(37, 99, 235, 0.15)',
        'focus-brand': '0 0 0 3px rgba(155, 44, 94, 0.12)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.15)',
      },

      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
