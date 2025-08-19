'use client'

import { useState, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
}

export function BottomSheet({ isOpen, onClose, children, title, className }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)

  const swipeRef = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 100
  })

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={swipeRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out',
          'max-h-[85vh] overflow-hidden',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {/* Swipe Indicator */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-2 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-4rem)] pb-safe">
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}