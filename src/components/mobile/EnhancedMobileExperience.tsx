/**
 * Enhanced Mobile Experience - Mobile-First Optimizations
 * 
 * Provides touch-optimized interactions, gesture support, and mobile-specific
 * UI enhancements for improved mobile user experience.
 */

"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { useComponentExperience } from '@/lib/engines/unified-experience-engine'
import { useNetworkResilience } from '@/lib/engines/network-resilience-engine'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TouchGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onLongPress?: () => void
  threshold?: number
  preventScroll?: boolean
}

interface MobileOptimizationConfig {
  enableHaptics?: boolean
  enableGestures?: boolean
  optimizeForOneHand?: boolean
  enablePullToRefresh?: boolean
  enableSafeArea?: boolean
}

interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

// ============================================================================
// TOUCH GESTURE HOOK
// ============================================================================

export function useTouchGestures(config: TouchGestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    threshold = 50,
    preventScroll = false
  } = config

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const pinchStart = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress()
        // Haptic feedback for long press
        if ('vibrate' in navigator) {
          navigator.vibrate(100)
        }
      }, 500)
    }

    // Handle pinch start
    if (e.touches.length === 2 && onPinch) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      pinchStart.current = distance
    }
  }, [onLongPress, onPinch, preventScroll])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Clear long press timer on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Handle pinch
    if (e.touches.length === 2 && onPinch && pinchStart.current) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      const scale = distance / pinchStart.current
      onPinch(scale)
    }
  }, [onPinch])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!touchStart.current) return

    const touch = e.changedTouches[0]
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y
    const deltaTime = touchEnd.current.time - touchStart.current.time

    // Only process swipes that are fast enough and long enough
    if (deltaTime < 300 && (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight()
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft()
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown()
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        } else if (deltaY < -threshold && onSwipeUp) {
          onSwipeUp()
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      }
    }

    // Reset
    touchStart.current = null
    touchEnd.current = null
    pinchStart.current = null
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])

  const attachGestures = useCallback((element: HTMLElement | null) => {
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll])

  return { attachGestures }
}

// ============================================================================
// SAFE AREA HOOK
// ============================================================================

export function useSafeArea(): SafeAreaInsets {
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      // Get CSS environment variables for safe area
      const computedStyle = getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    window.addEventListener('orientationchange', updateSafeArea)

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}

// ============================================================================
// MOBILE OPTIMIZATION HOOK
// ============================================================================

export function useMobileOptimization(config: MobileOptimizationConfig = {}) {
  const {
    enableHaptics = true,
    enableGestures = true,
    optimizeForOneHand = true,
    enablePullToRefresh = false,
    enableSafeArea = true
  } = config

  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isOneHandMode, setIsOneHandMode] = useState(false)
  const safeArea = useSafeArea()

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isTouchDevice = 'ontouchstart' in window
      const isSmallScreen = window.innerWidth <= 768

      setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen))
    }

    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkMobile()
    checkOrientation()

    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!enableHaptics || !('vibrate' in navigator)) return

    const patterns = {
      light: [25],
      medium: [50],
      heavy: [100]
    }

    navigator.vibrate(patterns[type])
  }, [enableHaptics])

  const toggleOneHandMode = useCallback(() => {
    setIsOneHandMode(prev => !prev)
    triggerHaptic('light')
  }, [triggerHaptic])

  return {
    isMobile,
    orientation,
    isOneHandMode,
    safeArea: enableSafeArea ? safeArea : { top: 0, right: 0, bottom: 0, left: 0 },
    triggerHaptic,
    toggleOneHandMode,
    optimizeForOneHand,
    enablePullToRefresh
  }
}

// ============================================================================
// PULL TO REFRESH COMPONENT
// ============================================================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)

  const { triggerHaptic } = useMobileOptimization()

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing || window.scrollY > 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY.current)

    if (distance > 0) {
      e.preventDefault()
      setPullDistance(distance)
      
      if (distance > threshold && !canRefresh) {
        setCanRefresh(true)
        triggerHaptic('medium')
      } else if (distance <= threshold && canRefresh) {
        setCanRefresh(false)
      }
    }
  }, [isRefreshing, threshold, canRefresh, triggerHaptic])

  const handleTouchEnd = useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      triggerHaptic('heavy')
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setCanRefresh(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
      setCanRefresh(false)
    }
  }, [canRefresh, isRefreshing, onRefresh, triggerHaptic])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const refreshIndicatorOpacity = Math.min(pullDistance / threshold, 1)
  const refreshIndicatorScale = Math.min(pullDistance / threshold, 1)

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-transform duration-200"
        style={{
          transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`,
          opacity: refreshIndicatorOpacity
        }}
      >
        <div
          className={cn(
            'flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-lg',
            canRefresh ? 'text-green-600' : 'text-gray-600'
          )}
          style={{
            transform: `scale(${refreshIndicatorScale})`
          }}
        >
          <div
            className={cn(
              'w-5 h-5 border-2 border-current rounded-full',
              isRefreshing ? 'animate-spin border-t-transparent' : ''
            )}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// MOBILE OPTIMIZED CONTAINER
// ============================================================================

interface MobileContainerProps {
  children: ReactNode
  className?: string
  enableGestures?: boolean
  enableSafeArea?: boolean
  oneHandOptimized?: boolean
  gestureConfig?: TouchGestureConfig
}

export function MobileContainer({
  children,
  className,
  enableGestures = true,
  enableSafeArea = true,
  oneHandOptimized = false,
  gestureConfig = {}
}: MobileContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { attachGestures } = useTouchGestures(gestureConfig)
  const { isMobile, safeArea, isOneHandMode } = useMobileOptimization({
    enableSafeArea,
    optimizeForOneHand: oneHandOptimized
  })

  useEffect(() => {
    if (enableGestures && isMobile) {
      return attachGestures(containerRef.current)
    }
  }, [enableGestures, isMobile, attachGestures])

  const containerStyle = enableSafeArea ? {
    paddingTop: safeArea.top,
    paddingRight: safeArea.right,
    paddingBottom: safeArea.bottom,
    paddingLeft: safeArea.left
  } : {}

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative',
        isMobile && 'touch-manipulation',
        oneHandOptimized && isOneHandMode && 'transform transition-transform duration-300',
        className
      )}
      style={{
        ...containerStyle,
        ...(oneHandOptimized && isOneHandMode && {
          transform: 'translateY(25%)',
          transformOrigin: 'top'
        })
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// MOBILE OPTIMIZED BUTTON
// ============================================================================

interface MobileButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  hapticFeedback?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export function MobileButton({
  children,
  onClick,
  className,
  hapticFeedback = true,
  size = 'md',
  variant = 'primary'
}: MobileButtonProps) {
  const { triggerHaptic, isMobile } = useMobileOptimization()
  const { buttonAnimation } = useComponentExperience('MobileButton')

  const handleClick = useCallback(() => {
    if (hapticFeedback) {
      triggerHaptic('light')
    }
    onClick?.()
  }, [onClick, hapticFeedback, triggerHaptic])

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]', // Minimum 40px for touch targets
    md: 'px-6 py-3 text-base min-h-[44px]', // Minimum 44px for touch targets
    lg: 'px-8 py-4 text-lg min-h-[48px]' // Minimum 48px for touch targets
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'select-none', // Prevent text selection on mobile
        isMobile && 'active:scale-95', // Mobile-specific press animation
        sizeClasses[size],
        variantClasses[variant],
        buttonAnimation,
        className
      )}
    >
      {children}
    </button>
  )
}

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

interface MobileNavProps {
  items: Array<{
    id: string
    label: string
    icon: ReactNode
    onClick: () => void
    active?: boolean
  }>
  className?: string
}

export function MobileNav({ items, className }: MobileNavProps) {
  const { safeArea, triggerHaptic } = useMobileOptimization()

  const handleItemClick = useCallback((item: typeof items[0]) => {
    triggerHaptic('light')
    item.onClick()
  }, [triggerHaptic])

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50',
        className
      )}
      style={{ paddingBottom: safeArea.bottom }}
    >
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors duration-200',
              'min-w-[60px] min-h-[60px]', // Adequate touch target
              item.active
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

// ============================================================================
// EXPORT HOOKS AND COMPONENTS
// ============================================================================

// Hooks are already exported above