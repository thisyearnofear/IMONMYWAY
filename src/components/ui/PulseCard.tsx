'use client'

import { useState } from 'react'

interface PulseCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  pulseOnHover?: boolean
  glowEffect?: boolean
}

export function PulseCard({ 
  children, 
  className = '', 
  hoverEffect = true,
  pulseOnHover = false,
  glowEffect = false
}: PulseCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        relative bg-white rounded-lg shadow-md border border-gray-200
        transition-all duration-300 transform
        ${hoverEffect ? 'hover:shadow-lg hover:-translate-y-1' : ''}
        ${pulseOnHover && isHovered ? 'animate-pulse' : ''}
        ${glowEffect && isHovered ? 'shadow-blue-500/25 shadow-xl' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      {glowEffect && (
        <div className={`
          absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-0
          transition-opacity duration-300 -z-10 blur-xl
          ${isHovered ? 'opacity-20' : 'opacity-0'}
        `} />
      )}
      
      {children}
    </div>
  )
}