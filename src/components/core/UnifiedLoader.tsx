/**
 * Unified Loader Component - Consistent Loading States
 * 
 * Provides consistent loading indicators across the application with
 * performance-aware animations and contextual messaging.
 */

"use client";

import { useComponentExperience } from "@/lib/engines/unified-experience-engine"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface UnifiedLoaderProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots' | 'progress'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  context?: 'button' | 'page' | 'component' | 'data' | 'inline'
  message?: string
  progress?: number // 0-100 for progress type
  className?: string
  fullScreen?: boolean
  overlay?: boolean
  
  // Performance options
  reduceMotion?: boolean
  
  // Customization
  color?: 'blue' | 'gray' | 'green' | 'red' | 'purple'
  variant?: 'default' | 'minimal' | 'detailed'
}

// ============================================================================
// UNIFIED LOADER COMPONENT
// ============================================================================

export function UnifiedLoader({
  type = 'spinner',
  size = 'md',
  context = 'component',
  message,
  progress,
  className,
  fullScreen = false,
  overlay = false,
  reduceMotion = false,
  color = 'blue',
  variant = 'default'
}: UnifiedLoaderProps) {
  
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const {
    getLoadingAnimation,
    getAnimationClass,
    isReducedMotion,
    isLowPerformance
  } = useComponentExperience('UnifiedLoader')
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const shouldReduceMotion = reduceMotion || isReducedMotion || isLowPerformance
  const animationClass = getLoadingAnimation(context === 'inline' ? 'component' : context)
  
  // ============================================================================
  // STYLES
  // ============================================================================
  
  const sizeStyles = {
    sm: {
      spinner: 'h-4 w-4',
      container: 'text-sm',
      message: 'text-xs'
    },
    md: {
      spinner: 'h-6 w-6',
      container: 'text-base',
      message: 'text-sm'
    },
    lg: {
      spinner: 'h-8 w-8',
      container: 'text-lg',
      message: 'text-base'
    },
    xl: {
      spinner: 'h-12 w-12',
      container: 'text-xl',
      message: 'text-lg'
    }
  }
  
  const colorStyles = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  }
  
  // ============================================================================
  // LOADER COMPONENTS
  // ============================================================================
  
  const SpinnerLoader = () => (
    <svg
      className={cn(
        sizeStyles[size].spinner,
        colorStyles[color],
        shouldReduceMotion ? 'animate-pulse' : 'animate-spin'
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
  
  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full",
            size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-5 w-5',
            colorStyles[color].replace('text-', 'bg-'),
            shouldReduceMotion ? 'animate-pulse' : 'animate-bounce'
          )}
          style={{
            animationDelay: shouldReduceMotion ? '0ms' : `${i * 150}ms`,
            animationDuration: shouldReduceMotion ? '1s' : '0.6s'
          }}
        />
      ))}
    </div>
  )
  
  const PulseLoader = () => (
    <div
      className={cn(
        "rounded-lg bg-gray-200",
        sizeStyles[size].spinner,
        shouldReduceMotion ? 'opacity-50' : 'animate-pulse'
      )}
    />
  )
  
  const SkeletonLoader = () => (
    <div className="space-y-3">
      <div className={cn(
        "h-4 bg-gray-200 rounded",
        shouldReduceMotion ? 'opacity-50' : 'animate-pulse'
      )} />
      <div className={cn(
        "h-4 bg-gray-200 rounded w-5/6",
        shouldReduceMotion ? 'opacity-50' : 'animate-pulse'
      )} />
      <div className={cn(
        "h-4 bg-gray-200 rounded w-4/6",
        shouldReduceMotion ? 'opacity-50' : 'animate-pulse'
      )} />
    </div>
  )
  
  const ProgressLoader = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {message && (
          <span className={cn(sizeStyles[size].message, "text-gray-600")}>
            {message}
          </span>
        )}
        {progress !== undefined && (
          <span className={cn(sizeStyles[size].message, "text-gray-500")}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            colorStyles[color].replace('text-', 'bg-')
          )}
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  )
  
  // ============================================================================
  // RENDER LOADER TYPE
  // ============================================================================
  
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return <SpinnerLoader />
      case 'dots':
        return <DotsLoader />
      case 'pulse':
        return <PulseLoader />
      case 'skeleton':
        return <SkeletonLoader />
      case 'progress':
        return <ProgressLoader />
      default:
        return <SpinnerLoader />
    }
  }
  
  // ============================================================================
  // CONTAINER COMPONENT
  // ============================================================================
  
  const LoaderContainer = ({ children }: { children: React.ReactNode }) => {
    const baseClasses = cn(
      "flex items-center justify-center",
      sizeStyles[size].container,
      getAnimationClass('enter', 'subtle'),
      className
    )
    
    if (fullScreen) {
      return (
        <div className={cn(
          "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm",
          baseClasses
        )}>
          <div className="text-center space-y-4">
            {children}
            {message && variant !== 'minimal' && (
              <p className={cn(sizeStyles[size].message, "text-gray-600")}>
                {message}
              </p>
            )}
          </div>
        </div>
      )
    }
    
    if (overlay) {
      return (
        <div className={cn(
          "absolute inset-0 z-10 bg-white/80 backdrop-blur-sm",
          baseClasses
        )}>
          <div className="text-center space-y-2">
            {children}
            {message && variant !== 'minimal' && (
              <p className={cn(sizeStyles[size].message, "text-gray-600")}>
                {message}
              </p>
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div className={baseClasses}>
        <div className="text-center space-y-2">
          {children}
          {message && variant !== 'minimal' && type !== 'progress' && (
            <p className={cn(sizeStyles[size].message, "text-gray-600")}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <LoaderContainer>
      {renderLoader()}
    </LoaderContainer>
  )
}

// ============================================================================
// SPECIALIZED LOADER COMPONENTS
// ============================================================================

export function ButtonLoader({ size = 'sm', color = 'gray' }: Pick<UnifiedLoaderProps, 'size' | 'color'>) {
  return (
    <UnifiedLoader
      type="spinner"
      size={size}
      context="button"
      variant="minimal"
      color={color}
    />
  )
}

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <UnifiedLoader
      type="spinner"
      size="lg"
      context="page"
      message={message}
      fullScreen={true}
      variant="detailed"
    />
  )
}

export function ComponentLoader({ 
  message, 
  overlay = false 
}: { 
  message?: string
  overlay?: boolean 
}) {
  return (
    <UnifiedLoader
      type="spinner"
      size="md"
      context="component"
      message={message}
      overlay={overlay}
      variant="default"
    />
  )
}

export function DataLoader({ 
  type = 'skeleton',
  message = "Loading data..."
}: { 
  type?: 'skeleton' | 'dots'
  message?: string 
}) {
  return (
    <UnifiedLoader
      type={type}
      size="md"
      context="data"
      message={message}
      variant="default"
    />
  )
}

export function ProgressLoader({ 
  progress, 
  message = "Processing..." 
}: { 
  progress: number
  message?: string 
}) {
  return (
    <UnifiedLoader
      type="progress"
      size="md"
      context="component"
      message={message}
      progress={progress}
      variant="detailed"
    />
  )
}

export function InlineLoader({ 
  size = 'sm',
  color = 'blue'
}: Pick<UnifiedLoaderProps, 'size' | 'color'>) {
  return (
    <UnifiedLoader
      type="spinner"
      size={size}
      context="inline"
      variant="minimal"
      color={color}
      className="inline-flex"
    />
  )
}