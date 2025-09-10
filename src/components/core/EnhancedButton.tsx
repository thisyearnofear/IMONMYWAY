/**
 * Enhanced Button Component - Core UI Component
 * 
 * Uses the Unified Experience Engine for consistent animations, loading states,
 * and user feedback across the application.
 */

"use client";

import { ButtonHTMLAttributes, forwardRef, useState, useCallback } from "react"
import { useComponentExperience } from "@/lib/engines/unified-experience-engine"
import { useErrorHandler } from "@/lib/engines/error-handling-engine"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  success?: boolean
  error?: boolean
  
  // Async operation support
  asyncOperation?: () => Promise<any>
  optimisticFeedback?: boolean
  
  // Enhanced UX features
  hapticFeedback?: boolean
  celebrateSuccess?: boolean
  
  // Loading states
  loadingText?: string
  successText?: string
  errorText?: string
  
  // Animation intensity
  animationIntensity?: 'subtle' | 'medium' | 'intense'
}

// ============================================================================
// ENHANCED BUTTON COMPONENT
// ============================================================================

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    success = false,
    error = false,
    asyncOperation,
    optimisticFeedback = true,
    hapticFeedback = true,
    celebrateSuccess = false,
    loadingText,
    successText,
    errorText,
    animationIntensity = 'medium',
    children,
    onClick,
    disabled,
    ...props
  }, ref) => {
    
    // ============================================================================
    // HOOKS & STATE
    // ============================================================================
    
    const {
      getAnimationClass,
      triggerCelebration,
      createLoadingState,
      success: notifySuccess,
      error: notifyError,
      buttonAnimation
    } = useComponentExperience('EnhancedButton')
    
    const { handleAsyncError } = useErrorHandler()
    
    const [internalState, setInternalState] = useState<{
      loading: boolean
      success: boolean
      error: boolean
    }>({
      loading: false,
      success: false,
      error: false
    })

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    
    const currentState = {
      loading: loading || internalState.loading,
      success: success || internalState.success,
      error: error || internalState.error
    }
    
    const isDisabled = disabled || currentState.loading
    
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    
    const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback on press
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      // If async operation is provided, handle it
      if (asyncOperation) {
        try {
          setInternalState(prev => ({ ...prev, loading: true, error: false }))
          
          // Show optimistic feedback immediately
          if (optimisticFeedback) {
            setInternalState(prev => ({ ...prev, success: true }))
          }
          
          const result = await handleAsyncError(
            asyncOperation,
            { component: 'EnhancedButton', action: 'async_operation' }
          )
          
          if (result !== null) {
            // Success
            setInternalState(prev => ({ ...prev, loading: false, success: true, error: false }))
            
            if (celebrateSuccess) {
              await triggerCelebration({
                type: 'success',
                intensity: animationIntensity,
                haptic: hapticFeedback
              })
            }
            
            if (successText) {
              notifySuccess(successText)
            }
            
            // Reset success state after delay
            setTimeout(() => {
              setInternalState(prev => ({ ...prev, success: false }))
            }, 2000)
          } else {
            // Error (already handled by handleAsyncError)
            setInternalState(prev => ({ ...prev, loading: false, success: false, error: true }))
            
            if (errorText) {
              notifyError(errorText)
            }
            
            // Reset error state after delay
            setTimeout(() => {
              setInternalState(prev => ({ ...prev, error: false }))
            }, 3000)
          }
        } catch (err) {
          setInternalState(prev => ({ ...prev, loading: false, success: false, error: true }))
          
          if (errorText) {
            notifyError(errorText)
          }
        }
      } else {
        // Regular click handler
        onClick?.(event)
      }
    }, [
      asyncOperation,
      optimisticFeedback,
      celebrateSuccess,
      hapticFeedback,
      animationIntensity,
      successText,
      errorText,
      onClick,
      handleAsyncError,
      triggerCelebration,
      notifySuccess,
      notifyError
    ])

    // ============================================================================
    // STYLES & CLASSES
    // ============================================================================
    
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
      outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    }
    
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg"
    }
    
    const stateStyles = {
      loading: "cursor-wait",
      success: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      error: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    }
    
    // ============================================================================
    // CONTENT RENDERING
    // ============================================================================
    
    const renderContent = () => {
      if (currentState.loading) {
        return (
          <div className="flex items-center space-x-2">
            <svg 
              className={cn(
                "animate-spin h-4 w-4",
                getAnimationClass('enter', 'subtle')
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
            <span>{loadingText || 'Loading...'}</span>
          </div>
        )
      }
      
      if (currentState.success && successText) {
        return (
          <div className={cn("flex items-center space-x-2", getAnimationClass('success', animationIntensity))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successText}</span>
          </div>
        )
      }
      
      if (currentState.error && errorText) {
        return (
          <div className={cn("flex items-center space-x-2", getAnimationClass('error', 'medium'))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{errorText}</span>
          </div>
        )
      }
      
      return children
    }

    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          currentState.loading && stateStyles.loading,
          currentState.success && stateStyles.success,
          currentState.error && stateStyles.error,
          buttonAnimation,
          !isDisabled && getAnimationClass('hover', animationIntensity),
          !isDisabled && getAnimationClass('press', 'medium'),
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {renderContent()}
      </button>
    )
  }
)

EnhancedButton.displayName = "EnhancedButton"

// ============================================================================
// SPECIALIZED BUTTON VARIANTS
// ============================================================================

export const AsyncButton = forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'asyncOperation'> & {
  operation: () => Promise<any>
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}>(({ operation, onSuccess, onError, ...props }, ref) => {
  const wrappedOperation = useCallback(async () => {
    try {
      const result = await operation()
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error as Error)
      throw error
    }
  }, [operation, onSuccess, onError])

  return (
    <EnhancedButton
      ref={ref}
      asyncOperation={wrappedOperation}
      optimisticFeedback={true}
      celebrateSuccess={true}
      {...props}
    />
  )
})

AsyncButton.displayName = "AsyncButton"

export const SubmitButton = forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'type' | 'variant'>>(
  (props, ref) => (
    <EnhancedButton
      ref={ref}
      type="submit"
      variant="primary"
      hapticFeedback={true}
      celebrateSuccess={true}
      loadingText="Submitting..."
      successText="Success!"
      errorText="Failed to submit"
      {...props}
    />
  )
)

SubmitButton.displayName = "SubmitButton"

export const CancelButton = forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => (
    <EnhancedButton
      ref={ref}
      variant="ghost"
      animationIntensity="subtle"
      {...props}
    />
  )
)

CancelButton.displayName = "CancelButton"

export const DestructiveButton = forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => (
    <EnhancedButton
      ref={ref}
      variant="destructive"
      hapticFeedback={true}
      animationIntensity="intense"
      {...props}
    />
  )
)

DestructiveButton.displayName = "DestructiveButton"