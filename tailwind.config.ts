import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        '7xl': '80rem',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        surface: 'var(--surface)',
        // Timepiece color palette
        gold: {
          50: '#fffdf8',
          100: '#fef9e7',
          200: '#fde1af',
          300: '#fbc977',
          400: '#f7b14d',
          500: '#EAC46C', // Primary gold sand
          600: '#d4a541',
          700: '#af8730',
          800: '#8e6d25',
          900: '#75591d',
        },
        violet: {
          50: '#f8f4ff',
          100: '#ebe0ff',
          200: '#d9c2ff',
          300: '#c29bff',
          400: '#a76cff',
          500: '#6E2BF2', // Primary deep violet
          600: '#5a1ed9',
          700: '#4a16b8',
          800: '#3c1291',
          900: '#321075',
        },
        graphite: {
          50: '#f7f7f8',
          100: '#ebebee',
          200: '#d5d5d7',
          300: '#b4b4b8',
          400: '#919198',
          500: '#0C0C0E', // Primary graphite black
          600: '#2c2c30',
          700: '#232327',
          800: '#1c1c20',
          900: '#17171a',
        },
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
        // Timepiece animations
        'sand-flow': 'sandFlow 3s ease-in-out infinite',
        'sand-fall': 'sandFall 2s linear infinite',
        'pendulum': 'pendulum 3s ease-in-out infinite',
        'clock-rotate': 'clockRotate 60s linear infinite',
        'gear-interlock': 'gearInterlock 4s ease-in-out infinite',
        'time-drift': 'timeDrift 4s ease-in-out infinite',
        'reverse-time': 'reverseTime 0.5s ease-out',
        'tick': 'tick 0.1s ease-in',
        'mechanical-bounce': 'mechanicalBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
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
        // Timepiece keyframes
        sandFlow: {
          '0%': { height: '0', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { height: '100%', opacity: '0' },
        },
        sandFall: {
          '0%': { transform: 'translateY(-40px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(120px) rotate(360deg)', opacity: '0' },
        },
        pendulum: {
          '0%, 100%': { transform: 'rotate(-30deg)' },
          '50%': { transform: 'rotate(30deg)' },
        },
        clockRotate: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        gearInterlock: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(5deg)' },
          '75%': { transform: 'rotate(-5deg)' },
        },
        timeDrift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(5px, -5px)' },
          '50%': { transform: 'translate(0, 5px)' },
          '75%': { transform: 'translate(-5px, 0)' },
        },
        reverseTime: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-20px) scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'translateY(-40px) scale(0.5)', opacity: '0' },
        },
        tick: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-2px)' },
        },
        mechanicalBounce: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0, -5px, 0)' },
          '70%': { transform: 'translate3d(0, -3px, 0)' },
          '90%': { transform: 'translate3d(0, -1px, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config