'use client'

import { useRef, useEffect, MutableRefObject, useCallback } from 'react'
import { useHapticFeedback } from './useHapticFeedback'

interface SwipeGestureOptions {
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onTap?: () => void
  onLongPress?: () => void
  threshold?: number
  enableHaptic?: boolean
  longPressDelay?: number
}

export function useSwipeGesture<T extends HTMLElement = HTMLDivElement>(options: SwipeGestureOptions): MutableRefObject<T | null> {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onTap,
    onLongPress,
    threshold = 50,
    enableHaptic = true,
    longPressDelay = 500
  } = options

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const elementRef = useRef<T | null>(null)
  const { light, medium } = useHapticFeedback()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      // Set up long press timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress()
          if (enableHaptic) medium()
        }, longPressDelay)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Check for tap (small movement, quick touch)
      if (Math.max(absDeltaX, absDeltaY) < threshold && deltaTime < 300) {
        if (onTap) {
          onTap()
          if (enableHaptic) light()
        }
        touchStartRef.current = null
        return
      }

      // Determine if it's a horizontal or vertical swipe
      if (Math.max(absDeltaX, absDeltaY) < threshold) {
        touchStartRef.current = null
        return
      }

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
          if (enableHaptic) light()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
          if (enableHaptic) light()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
          if (enableHaptic) light()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
          if (enableHaptic) light()
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap, onLongPress, threshold, enableHaptic, longPressDelay, light, medium])

  return elementRef as MutableRefObject<T | null>
}