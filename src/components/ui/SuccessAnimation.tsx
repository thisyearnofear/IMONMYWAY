'use client'

import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  show: boolean
  message: string
  onComplete?: () => void
  duration?: number
}

export function SuccessAnimation({ 
  show, 
  message, 
  onComplete, 
  duration = 3000 
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 100)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(() => {
          setIsVisible(false)
          onComplete?.()
        }, 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete])

  if (!isVisible) return null

  return (
    <div className={`
      fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50
      transition-opacity duration-300
      ${isAnimating ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className={`
        bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl
        transition-all duration-500 transform
        ${isAnimating ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}
      `}>
        {/* Success Icon with Animation */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <div className={`
              text-4xl transition-all duration-700 transform
              ${isAnimating ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
            `}>
              ✅
            </div>
          </div>
          
          {/* Confetti Effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full
                  transition-all duration-1000 transform
                  ${isAnimating ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
                `}
                style={{
                  left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 40}%`,
                  top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 40}%`,
                  transitionDelay: `${i * 100}ms`,
                  transform: isAnimating 
                    ? `translate(${Math.cos(i * 45 * Math.PI / 180) * 100}px, ${Math.sin(i * 45 * Math.PI / 180) * 100}px) scale(0)`
                    : 'translate(0, 0) scale(1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Message */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Success!
        </h3>
        <p className="text-gray-600">
          {message}
        </p>
      </div>
    </div>
  )
}