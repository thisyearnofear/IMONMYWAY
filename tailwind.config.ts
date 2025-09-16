import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        surface: 'var(--surface)',
      },
      boxShadow: {
        '3xl': 'var(--depth-4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 600ms ease-out forwards',
        'slide-up': 'slideUp 600ms ease-out forwards',
        'scale-in': 'scaleIn 400ms ease-out forwards',
        'gradient-x': 'gradient-x 3s ease infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'hero-text': 'hero-text 1.2s ease-out 0.3s both',
        'subtitle': 'subtitle 0.8s ease-out 0.8s both',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        fadeIn: {
          to: { opacity: '1' },
        },
        slideUp: {
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'gradient-x': {
          '0%, 100%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'left center',
          },
          '50%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'right center',
          },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'hero-text': {
          '0%': { opacity: '0', transform: 'translateY(50px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        subtitle: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config