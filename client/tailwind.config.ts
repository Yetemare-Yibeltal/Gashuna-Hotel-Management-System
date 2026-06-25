// tailwind.config.ts
// Custom Tailwind CSS configuration for Gashuna Hotel.
// Defines brand colors, fonts, animations, and utilities
// used across every page and component in the frontend.

import type { Config } from 'tailwindcss';

const config: Config = {
  // Dark mode is controlled by a class on the html element
  darkMode: 'class',

  // Tell Tailwind where to look for class names
  // It scans these files and removes unused CSS in production
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {

      // ── Brand Colors ──────────────────────────────────
      colors: {
        // Gold — primary brand color used for buttons,
        // headings, borders, and highlighted elements
        gold: {
          DEFAULT: '#C9972A',
          light:   '#E8BA5A',
          dark:    '#9A7015',
          shine:   '#F5D077',
          pale:    '#FDF3DC',
        },

        // Navy — primary background color for dark sections
        navy: {
          DEFAULT: '#12253F',
          deep:    '#0B1A2E',
          light:   '#1C3556',
          lighter: '#2A4A73',
        },

        // Teal — secondary accent color
        teal: {
          DEFAULT: '#0E7A6E',
          light:   '#14A896',
          dark:    '#0A5C52',
        },

        // Cream — used for light backgrounds and cards
        cream: {
          DEFAULT: '#F8F3EA',
          dark:    '#EDE3D2',
        },

        // Status colors — used for room and booking status badges
        status: {
          available:   '#27ae60',
          occupied:    '#e74c3c',
          cleaning:    '#f39c12',
          maintenance: '#8e44ad',
          reserved:    '#2980b9',
        },
      },

      // ── Typography ────────────────────────────────────
      fontFamily: {
        // Playfair Display — elegant serif for headings
        display: ['"Playfair Display"', 'Georgia', 'serif'],

        // Nunito — clean sans-serif for body text
        body: ['Nunito', '"Segoe UI"', 'sans-serif'],

        // Noto Serif Ethiopic — for Amharic text
        amharic: ['"Noto Serif Ethiopic"', 'serif'],

        // JetBrains Mono — for code and booking references
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },

      // ── Font Sizes ────────────────────────────────────
      fontSize: {
        'hero': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.1' }],
      },

      // ── Background Gradients ──────────────────────────
      backgroundImage: {
        // Animated gold gradient used on buttons and text
        'grad-gold': 'linear-gradient(135deg, #C9972A 0%, #F5D077 50%, #C9972A 100%)',

        // Deep navy gradient for hero and dark sections
        'grad-hero': 'linear-gradient(160deg, #0B1A2E 0%, #0E2A45 40%, #0B3050 100%)',

        // Gold text gradient (used with bg-clip-text)
        'grad-text-gold': 'linear-gradient(90deg, #C9972A, #F5D077, #E8BA5A, #C9972A)',

        // Teal gradient for secondary buttons
        'grad-teal': 'linear-gradient(135deg, #0E7A6E, #14A896)',

        // Glass card gradient
        'grad-glass': 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },

      // ── Animations ────────────────────────────────────
      animation: {
        // Gold shimmer on buttons and gradient text
        'gradient-shimmer': 'gradientShimmer 4s ease infinite',

        // Floating effect on icons and 3D elements
        'float': 'float 4s ease-in-out infinite',

        // Fade in from below — used on page sections
        'fade-in-up': 'fadeInUp 0.7s ease-out both',

        // Fade in from above — used on navbar items
        'fade-in-down': 'fadeInDown 0.6s ease-out both',

        // Gold pulse glow — used on active badges
        'pulse-gold': 'pulseGold 2.5s ease-in-out infinite',

        // Skeleton loading shimmer
        'shimmer': 'shimmer 1.5s ease-in-out infinite',

        // Spin for loading spinners
        'spin-slow': 'spin 3s linear infinite',
      },

      // ── Keyframes ─────────────────────────────────────
      keyframes: {
        gradientShimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,151,42,0.5)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(201,151,42,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },

      // ── Box Shadows ───────────────────────────────────
      boxShadow: {
        // Gold glow shadow — used on primary buttons
        'gold':    '0 4px 20px rgba(201,151,42,0.35)',
        'gold-lg': '0 8px 40px rgba(201,151,42,0.45)',
        'gold-xl': '0 16px 60px rgba(201,151,42,0.55)',

        // Glass card shadow
        'glass':   '0 8px 32px rgba(0,0,0,0.4)',
        'glass-lg':'0 16px 48px rgba(0,0,0,0.5)',

        // Teal glow — used on secondary accent elements
        'teal':    '0 4px 20px rgba(14,122,110,0.4)',
      },

      // ── Border Radius ─────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // ── Backdrop Blur ─────────────────────────────────
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },

      // ── Z-Index ───────────────────────────────────────
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },
    },
  },

  plugins: [
    // Adds CSS animation utilities
    require('tailwindcss-animate'),
  ],
};

export default config;
