import { useState, useCallback, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

interface LoadingConfig {
  minDuration?: number // Minimum loading time to prevent flashing
  timeout?: number // Maximum loading time before showing error
  showProgress?: boolean // Show progress indicator
  optimistic?: boolean // Show success state immediately, revert on error
}

interface LoadingState {
  isLoading: boolean
  progress: number
  error: string | null
  isOptimistic: boolean
}

interface LoadingActions {
  start: (message?: string) => void
  setProgress: (progress: number) => void
  success: (message?: string) => void
  error: (message: string) => void
  reset: () => void
}

export function useLoadingState(config: LoadingConfig = {}): [LoadingState, LoadingActions] {
  const {
    minDuration = 300,
    timeout = 30000,
    showProgress = false,
    optimistic = false
  } = config

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    error: null,
    isOptimistic: false
  })

  const { addToast } = useUIStore()
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const minDurationRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback((message?: string) => {
    startTimeRef.current = Date.now()
    
    setState({
      isLoading: true,
      progress: 0,
      error: null,
      isOptimistic: optimistic
    })

    if (message) {
      addToast({
        type: 'info',
        message,
        duration: 2000
      })
    }

    // Set timeout for maximum loading time
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        error('Operation timed out. Please try again.')
      }, timeout)
    }
  }, [optimistic, timeout, addToast])

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress))
    }))
  }, [])

  const success = useCallback((message?: string) => {
    const elapsed = Date.now() - startTimeRef.current
    const remainingTime = Math.max(0, minDuration - elapsed)

    const completeSuccess = () => {
      setState({
        isLoading: false,
        progress: 100,
        error: null,
        isOptimistic: false
      })

      if (message) {
        addToast({
          type: 'success',
          message,
          duration: 3000
        })
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    if (remainingTime > 0) {
      minDurationRef.current = setTimeout(completeSuccess, remainingTime)
    } else {
      completeSuccess()
    }
  }, [minDuration, addToast])

  const error = useCallback((message: string) => {
    setState({
      isLoading: false,
      progress: 0,
      error: message,
      isOptimistic: false
    })

    addToast({
      type: 'error',
      message,
      duration: 5000
    })

    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (minDurationRef.current) {
      clearTimeout(minDurationRef.current)
      minDurationRef.current = null
    }
  }, [addToast])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      error: null,
      isOptimistic: false
    })

    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (minDurationRef.current) {
      clearTimeout(minDurationRef.current)
      minDurationRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (minDurationRef.current) {
        clearTimeout(minDurationRef.current)
        minDurationRef.current = null
      }
    }
  }, [])

  return [
    state,
    { start, setProgress, success, error, reset }
  ]
}

// Specialized hooks for common loading scenarios
export function useAsyncOperation<T = any>(config: LoadingConfig = {}) {
  const [loadingState, loadingActions] = useLoadingState(config)

  const execute = useCallback(async (
    operation: () => Promise<T>,
    messages?: {
      start?: string
      success?: string
      error?: string
    }
  ): Promise<T | null> => {
    try {
      loadingActions.start(messages?.start)
      const result = await operation()
      loadingActions.success(messages?.success)
      return result
    } catch (err: any) {
      const errorMessage = messages?.error || err.message || 'Operation failed'
      loadingActions.error(errorMessage)
      return null
    }
  }, [loadingActions])

  return {
    ...loadingState,
    execute,
    ...loadingActions
  }
}

// Hook for form submissions with validation
export function useFormSubmission<T = any>(config: LoadingConfig = {}) {
  const [loadingState, loadingActions] = useLoadingState({
    ...config,
    minDuration: 500 // Slightly longer for form feedback
  })

  const submit = useCallback(async (
    submitFn: () => Promise<T>,
    options?: {
      validate?: () => boolean | string
      onSuccess?: (result: T) => void
      onError?: (error: string) => void
      messages?: {
        start?: string
        success?: string
        error?: string
      }
    }
  ): Promise<boolean> => {
    // Validation
    if (options?.validate) {
      const validation = options.validate()
      if (validation !== true) {
        const errorMessage = typeof validation === 'string' ? validation : 'Validation failed'
        loadingActions.error(errorMessage)
        options?.onError?.(errorMessage)
        return false
      }
    }

    try {
      loadingActions.start(options?.messages?.start || 'Submitting...')
      const result = await submitFn()
      loadingActions.success(options?.messages?.success || 'Success!')
      options?.onSuccess?.(result)
      return true
    } catch (err: any) {
      const errorMessage = options?.messages?.error || err.message || 'Submission failed'
      loadingActions.error(errorMessage)
      options?.onError?.(errorMessage)
      return false
    }
  }, [loadingActions])

  return {
    ...loadingState,
    submit,
    ...loadingActions
  }
}

// Hook for optimistic updates (like betting)
export function useOptimisticUpdate<T = any>() {
  const [loadingState, loadingActions] = useLoadingState({ optimistic: true })
  const [optimisticData, setOptimisticData] = useState<T | null>(null)

  const executeOptimistic = useCallback(async (
    optimisticValue: T,
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: string) => void
      revertOnError?: boolean
    }
  ): Promise<T | null> => {
    // Immediately show optimistic state
    setOptimisticData(optimisticValue)
    loadingActions.start()

    try {
      const result = await operation()
      setOptimisticData(result)
      loadingActions.success()
      options?.onSuccess?.(result)
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Operation failed'
      
      if (options?.revertOnError !== false) {
        setOptimisticData(null) // Revert optimistic state
      }
      
      loadingActions.error(errorMessage)
      options?.onError?.(errorMessage)
      return null
    }
  }, [loadingActions])

  const reset = useCallback(() => {
    setOptimisticData(null)
    loadingActions.reset()
  }, [loadingActions])

  return {
    ...loadingState,
    optimisticData,
    executeOptimistic,
    reset
  }
}