'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function PremiumToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <PremiumToast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

interface ToastProps {
  toast: {
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }
  onClose: () => void
}

function PremiumToast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const variants = {
    success: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      icon: '✅',
      iconBg: 'bg-green-500/20',
      glow: 'shadow-green-500/20'
    },
    error: {
      bg: 'from-red-500/20 to-rose-500/20',
      border: 'border-red-500/30',
      icon: '❌',
      iconBg: 'bg-red-500/20',
      glow: 'shadow-red-500/20'
    },
    warning: {
      bg: 'from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-500/30',
      icon: '⚠️',
      iconBg: 'bg-yellow-500/20',
      glow: 'shadow-yellow-500/20'
    },
    info: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      icon: 'ℹ️',
      iconBg: 'bg-blue-500/20',
      glow: 'shadow-blue-500/20'
    }
  }

  const variant = variants[toast.type]

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-gold/15 to-violet/15 border border-gold/30 relative overflow-hidden rounded-xl',
        'flex items-center gap-4 p-4 rounded-2xl',
        'backdrop-blur-xl border',
        `bg-gradient-to-r ${variant.bg}`,
        variant.border,
        `shadow-xl ${variant.glow}`,
        'transform transition-all duration-500 ease-out',
        'animate-slide-in-right'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
        'bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10',
        variant.iconBg
      )}>
        <span className="text-lg">{variant.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm leading-relaxed">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 hover:bg-white/10 transition-colors flex items-center justify-center group"
      >
        <svg 
          className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-white/50 to-white/30 animate-progress-bar"
          style={{ animationDuration: '5000ms' }}
        />
      </div>
    </div>
  )
}

// Add the progress bar animation to your CSS
const progressBarStyles = `
@keyframes progress-bar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-progress-bar {
  animation: progress-bar linear forwards;
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 400ms cubic-bezier(0.25, 1, 0.5, 1);
}
`