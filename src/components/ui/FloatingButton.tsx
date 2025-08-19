'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FloatingButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  size?: 'md' | 'lg'
}

export function FloatingButton({
  children,
  onClick,
  className,
  variant = 'primary',
  position = 'bottom-right',
  size = 'md'
}: FloatingButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg hover:shadow-xl'
  }

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  }

  const sizes = {
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 rounded-full transition-all duration-300 ease-out',
        'hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300',
        'flex items-center justify-center',
        'safe-area-bottom', // Respect safe areas
        variants[variant],
        positions[position],
        sizes[size],
        className
      )}
      style={{
        bottom: position.includes('bottom') ? 'calc(1.5rem + env(safe-area-inset-bottom))' : undefined
      }}
    >
      {children}
    </button>
  )
}