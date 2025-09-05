import { useCallback } from 'react'

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Check if haptic feedback is supported
    if (!navigator.vibrate) return

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [20, 10, 20], // Double tap
      warning: [30, 10, 30, 10, 30], // Triple tap
      error: [50, 20, 50, 20, 50] // Strong triple tap
    }

    navigator.vibrate(patterns[type])
  }, [])

  const success = useCallback(() => triggerHaptic('success'), [triggerHaptic])
  const warning = useCallback(() => triggerHaptic('warning'), [triggerHaptic])
  const error = useCallback(() => triggerHaptic('error'), [triggerHaptic])
  const light = useCallback(() => triggerHaptic('light'), [triggerHaptic])
  const medium = useCallback(() => triggerHaptic('medium'), [triggerHaptic])
  const heavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic])

  return {
    triggerHaptic,
    success,
    warning,
    error,
    light,
    medium,
    heavy
  }
}