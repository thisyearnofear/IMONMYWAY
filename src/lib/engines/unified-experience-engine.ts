/**
 * Unified Experience Engine - Single Source of Truth for UX Systems
 * 
 * Consolidates animation, loading, and notification logic into one cohesive system
 * following the DRY principle and Core Principles compliance.
 */

import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  reduce?: boolean
}

interface CelebrationConfig {
  type: 'success' | 'achievement' | 'bet_won' | 'commitment_fulfilled'
  intensity: 'subtle' | 'medium' | 'intense'
  haptic?: boolean
  sound?: boolean
}

interface LoadingConfig {
  minDuration?: number
  timeout?: number
  showProgress?: boolean
  optimistic?: boolean
}

interface LoadingState {
  isLoading: boolean
  progress: number
  error: string | null
  isOptimistic: boolean
}

interface NotificationConfig {
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
  haptic?: boolean
  celebration?: boolean
}

interface ContextualNotification {
  context: 'betting' | 'commitment' | 'location' | 'wallet' | 'achievement'
  event: string
  data?: any
}

// ============================================================================
// UNIFIED EXPERIENCE ENGINE
// ============================================================================

export class UnifiedExperienceEngine {
  private performanceMetrics: any
  private prefersReducedMotion: boolean
  private addToast: (toast: any) => void

  constructor(performanceMetrics: any, prefersReducedMotion: boolean, addToast: (toast: any) => void) {
    this.performanceMetrics = performanceMetrics
    this.prefersReducedMotion = prefersReducedMotion
    this.addToast = addToast
  }

  // ============================================================================
  // ANIMATION SYSTEM
  // ============================================================================

  getOptimizedConfig(config: AnimationConfig): AnimationConfig {
    const shouldReduce = this.prefersReducedMotion || this.performanceMetrics.isLowPerformance || config.reduce

    if (shouldReduce) {
      return {
        ...config,
        duration: Math.min(config.duration * 0.3, 150),
        easing: 'ease-out',
        delay: 0
      }
    }

    return config
  }

  getAnimationClass(
    type: 'enter' | 'exit' | 'hover' | 'press' | 'success' | 'error',
    intensity: 'subtle' | 'medium' | 'intense' = 'medium'
  ): string {
    const shouldReduce = this.prefersReducedMotion || this.performanceMetrics.isLowPerformance

    const animations = {
      enter: {
        subtle: shouldReduce ? 'animate-fade-in' : 'animate-slide-up',
        medium: shouldReduce ? 'animate-fade-in' : 'animate-slide-up animate-scale-in',
        intense: shouldReduce ? 'animate-fade-in' : 'animate-slide-up animate-scale-in animate-glow'
      },
      exit: {
        subtle: 'animate-fade-out',
        medium: shouldReduce ? 'animate-fade-out' : 'animate-slide-down',
        intense: shouldReduce ? 'animate-fade-out' : 'animate-slide-down animate-scale-out'
      },
      hover: {
        subtle: shouldReduce ? '' : 'hover:scale-102 transition-transform',
        medium: shouldReduce ? 'hover:opacity-90' : 'hover-lift hover:scale-105',
        intense: shouldReduce ? 'hover:opacity-80' : 'hover-lift hover:scale-110 hover:shadow-xl'
      },
      press: {
        subtle: 'active:scale-98',
        medium: shouldReduce ? 'active:scale-95' : 'btn-press',
        intense: shouldReduce ? 'active:scale-90' : 'btn-press active:scale-90'
      },
      success: {
        subtle: shouldReduce ? 'animate-pulse' : 'animate-bounce-gentle',
        medium: shouldReduce ? 'animate-pulse' : 'animate-success-pulse',
        intense: shouldReduce ? 'animate-pulse' : 'animate-celebration'
      },
      error: {
        subtle: shouldReduce ? 'animate-pulse' : 'animate-shake',
        medium: shouldReduce ? 'animate-pulse' : 'animate-shake animate-error-glow',
        intense: shouldReduce ? 'animate-pulse' : 'animate-shake animate-error-glow animate-error-bounce'
      }
    }

    return animations[type][intensity]
  }

  async triggerCelebration(config: CelebrationConfig): Promise<void> {
    const { type, intensity, haptic = true, sound = false } = config

    // Skip intense celebrations on low-performance devices
    if (this.performanceMetrics.isLowPerformance && intensity === 'intense') {
      return this.triggerCelebration({ ...config, intensity: 'medium' })
    }

    // Haptic feedback
    if (haptic && 'vibrate' in navigator && !this.prefersReducedMotion) {
      const patterns = {
        subtle: [50],
        medium: [100, 50, 100],
        intense: [200, 100, 200, 100, 200]
      }
      navigator.vibrate(patterns[intensity])
    }

    // Visual celebration
    const celebrationElement = document.createElement('div')
    celebrationElement.className = `
      fixed inset-0 pointer-events-none z-[9999] 
      ${this.getAnimationClass('success', intensity)}
    `

    const celebrationContent = {
      success: '🎉',
      achievement: '🏆',
      bet_won: '💰',
      commitment_fulfilled: '✅'
    }

    celebrationElement.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-8xl animate-bounce-gentle">
          ${celebrationContent[type]}
        </div>
      </div>
    `

    document.body.appendChild(celebrationElement)

    // Remove after animation
    setTimeout(() => {
      if (document.body.contains(celebrationElement)) {
        document.body.removeChild(celebrationElement)
      }
    }, intensity === 'intense' ? 3000 : intensity === 'medium' ? 2000 : 1000)

    // Sound feedback (future enhancement)
    if (sound) {
      console.log(`🔊 Playing ${type} sound`)
    }
  }

  getStaggeredDelay(index: number, baseDelay: number = 100): number {
    if (this.prefersReducedMotion || this.performanceMetrics.isLowPerformance) return 0
    return index * Math.min(baseDelay, 50)
  }

  getLoadingAnimation(context: 'button' | 'page' | 'component' | 'data'): string {
    const animations = {
      button: this.performanceMetrics.isLowPerformance ? 'animate-pulse' : 'animate-spin',
      page: this.performanceMetrics.isLowPerformance ? 'animate-pulse' : 'animate-skeleton-wave',
      component: this.performanceMetrics.isLowPerformance ? 'animate-pulse' : 'animate-fade-in',
      data: this.performanceMetrics.isLowPerformance ? 'animate-pulse' : 'animate-skeleton-shimmer'
    }
    return animations[context]
  }

  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================

  notify(config: NotificationConfig): void {
    const {
      title,
      message,
      type,
      duration,
      action,
      persistent = false,
      haptic = false,
      celebration = false
    } = config

    // Add toast notification
    this.addToast({
      type: type === 'achievement' ? 'success' : type,
      message: title ? `${title}: ${message}` : message,
      duration: persistent ? 0 : duration
    })

    // Trigger celebration for special events
    if (celebration || type === 'achievement') {
      const celebrationType = type === 'achievement' ? 'achievement' : 'success'
      this.triggerCelebration({
        type: celebrationType,
        intensity: 'medium',
        haptic
      })
    }

    // Haptic feedback for important notifications
    if (haptic && 'vibrate' in navigator) {
      const patterns = {
        success: [100],
        error: [200, 100, 200],
        warning: [150],
        info: [50],
        achievement: [200, 100, 200, 100, 200]
      }
      navigator.vibrate(patterns[type] || [100])
    }
  }

  notifyContext(config: ContextualNotification): void {
    const { context, event, data } = config

    const contextualMessages = {
      betting: {
        bet_placed: {
          title: '🎲 Bet Placed',
          message: `${data?.amount} STT ${data?.bettingFor ? 'FOR' : 'AGAINST'} success`,
          type: 'success' as const,
          haptic: true
        },
        bet_won: {
          title: '🎉 You Won!',
          message: `Congratulations! You won ${data?.winnings} STT`,
          type: 'achievement' as const,
          celebration: true,
          haptic: true
        },
        bet_lost: {
          title: '😔 Bet Lost',
          message: `Better luck next time! Lost ${data?.amount} STT`,
          type: 'warning' as const,
          haptic: true
        }
      },
      commitment: {
        created: {
          title: '✅ Commitment Created',
          message: `Staked ${data?.amount} STT on your punctuality`,
          type: 'success' as const,
          haptic: true
        },
        fulfilled_success: {
          title: '🎯 On Time!',
          message: `Commitment fulfilled! You earned ${data?.reward} STT`,
          type: 'achievement' as const,
          celebration: true,
          haptic: true
        },
        fulfilled_late: {
          title: '⏰ Arrived Late',
          message: `Commitment failed. Stake of ${data?.stake} STT forfeited`,
          type: 'error' as const,
          haptic: true
        },
        approaching_deadline: {
          title: '🏃‍♂️ Hurry Up!',
          message: `${data?.timeLeft} minutes left to reach your destination`,
          type: 'warning' as const,
          haptic: true
        }
      },
      location: {
        permission_granted: {
          title: '📍 Location Access',
          message: 'Location tracking enabled successfully',
          type: 'success' as const
        },
        permission_denied: {
          title: '❌ Location Required',
          message: 'Please enable location access to continue',
          type: 'error' as const,
          persistent: true
        },
        accuracy_poor: {
          title: '⚠️ Poor GPS Signal',
          message: `Location accuracy: ±${data?.accuracy}m. Move to open area for better signal`,
          type: 'warning' as const
        },
        tracking_started: {
          title: '🎯 Tracking Started',
          message: 'Your location is now being shared',
          type: 'info' as const
        }
      },
      wallet: {
        connected: {
          title: '🔗 Wallet Connected',
          message: `Connected to ${data?.address?.slice(0, 6)}...${data?.address?.slice(-4)}`,
          type: 'success' as const,
          haptic: true
        },
        disconnected: {
          title: '🔌 Wallet Disconnected',
          message: 'Wallet connection lost',
          type: 'warning' as const
        },
        network_switched: {
          title: '🌐 Network Switched',
          message: `Switched to ${data?.networkName}`,
          type: 'info' as const
        },
        transaction_pending: {
          title: '⏳ Transaction Pending',
          message: 'Your transaction is being processed...',
          type: 'info' as const
        },
        transaction_confirmed: {
          title: '✅ Transaction Confirmed',
          message: 'Your transaction was successful',
          type: 'success' as const,
          haptic: true
        }
      },
      achievement: {
        unlocked: {
          title: '🏆 Achievement Unlocked!',
          message: data?.achievement?.name || 'New achievement earned',
          type: 'achievement' as const,
          celebration: true,
          haptic: true,
          persistent: true
        },
        streak_milestone: {
          title: '🔥 Streak Milestone!',
          message: `${data?.streak} day streak achieved!`,
          type: 'achievement' as const,
          celebration: true,
          haptic: true
        },
        reputation_increase: {
          title: '⭐ Reputation Up!',
          message: `Your reputation increased to ${data?.newScore}%`,
          type: 'success' as const,
          haptic: true
        }
      }
    }

    const contextMessages = contextualMessages[context] as any
    const messageConfig = contextMessages?.[event]
    if (messageConfig) {
      this.notify(messageConfig)
    } else {
      // Fallback for unknown events
      this.notify({
        message: `${context}: ${event}`,
        type: 'info'
      })
    }
  }

  // Quick notification methods
  success(message: string, options?: Partial<NotificationConfig>): void {
    this.notify({ message, type: 'success', haptic: true, ...options })
  }

  error(message: string, options?: Partial<NotificationConfig>): void {
    this.notify({ message, type: 'error', haptic: true, persistent: true, ...options })
  }

  warning(message: string, options?: Partial<NotificationConfig>): void {
    this.notify({ message, type: 'warning', haptic: true, ...options })
  }

  info(message: string, options?: Partial<NotificationConfig>): void {
    this.notify({ message, type: 'info', ...options })
  }

  achievement(message: string, options?: Partial<NotificationConfig>): void {
    this.notify({
      message,
      type: 'achievement',
      celebration: true,
      haptic: true,
      persistent: true,
      ...options
    })
  }
}

// ============================================================================
// UNIFIED LOADING MANAGER
// ============================================================================

export class UnifiedLoadingManager {
  private activeStates = new Map<string, LoadingState>()
  private timeouts = new Map<string, NodeJS.Timeout>()
  private startTimes = new Map<string, number>()

  createLoadingState(id: string, config: LoadingConfig = {}): {
    state: LoadingState
    actions: {
      start: (message?: string) => void
      setProgress: (progress: number) => void
      success: (message?: string) => void
      error: (message: string) => void
      reset: () => void
    }
  } {
    const {
      minDuration = 300,
      timeout = 30000,
      showProgress = false,
      optimistic = false
    } = config

    const initialState: LoadingState = {
      isLoading: false,
      progress: 0,
      error: null,
      isOptimistic: false
    }

    this.activeStates.set(id, initialState)

    const actions = {
      start: (message?: string) => {
        this.startTimes.set(id, Date.now())

        const newState: LoadingState = {
          isLoading: true,
          progress: 0,
          error: null,
          isOptimistic: optimistic
        }

        this.activeStates.set(id, newState)

        // Set timeout for maximum loading time
        if (timeout > 0) {
          const timeoutId = setTimeout(() => {
            actions.error('Operation timed out. Please try again.')
          }, timeout)
          this.timeouts.set(`${id}_timeout`, timeoutId)
        }
      },

      setProgress: (progress: number) => {
        const currentState = this.activeStates.get(id)
        if (currentState) {
          this.activeStates.set(id, {
            ...currentState,
            progress: Math.max(0, Math.min(100, progress))
          })
        }
      },

      success: (message?: string) => {
        const startTime = this.startTimes.get(id) || Date.now()
        const elapsed = Date.now() - startTime
        const remainingTime = Math.max(0, minDuration - elapsed)

        const completeSuccess = () => {
          const newState: LoadingState = {
            isLoading: false,
            progress: 100,
            error: null,
            isOptimistic: false
          }

          this.activeStates.set(id, newState)

          // Clear timeout
          const timeoutId = this.timeouts.get(`${id}_timeout`)
          if (timeoutId) {
            clearTimeout(timeoutId)
            this.timeouts.delete(`${id}_timeout`)
          }
        }

        if (remainingTime > 0) {
          const minDurationId = setTimeout(completeSuccess, remainingTime)
          this.timeouts.set(`${id}_minDuration`, minDurationId)
        } else {
          completeSuccess()
        }
      },

      error: (message: string) => {
        const newState: LoadingState = {
          isLoading: false,
          progress: 0,
          error: message,
          isOptimistic: false
        }

        this.activeStates.set(id, newState)

        // Clear timeouts
        const timeoutId = this.timeouts.get(`${id}_timeout`)
        const minDurationId = this.timeouts.get(`${id}_minDuration`)

        if (timeoutId) {
          clearTimeout(timeoutId)
          this.timeouts.delete(`${id}_timeout`)
        }
        if (minDurationId) {
          clearTimeout(minDurationId)
          this.timeouts.delete(`${id}_minDuration`)
        }
      },

      reset: () => {
        this.activeStates.set(id, initialState)

        // Clear timeouts
        const timeoutId = this.timeouts.get(`${id}_timeout`)
        const minDurationId = this.timeouts.get(`${id}_minDuration`)

        if (timeoutId) {
          clearTimeout(timeoutId)
          this.timeouts.delete(`${id}_timeout`)
        }
        if (minDurationId) {
          clearTimeout(minDurationId)
          this.timeouts.delete(`${id}_minDuration`)
        }
      }
    }

    return {
      state: this.activeStates.get(id)!,
      actions
    }
  }

  getState(id: string): LoadingState | undefined {
    return this.activeStates.get(id)
  }

  cleanup(id: string): void {
    this.activeStates.delete(id)
    this.startTimes.delete(id)

    // Clear any associated timeouts
    const timeoutId = this.timeouts.get(`${id}_timeout`)
    const minDurationId = this.timeouts.get(`${id}_minDuration`)

    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(`${id}_timeout`)
    }
    if (minDurationId) {
      clearTimeout(minDurationId)
      this.timeouts.delete(`${id}_minDuration`)
    }
  }
}

// ============================================================================
// REACT HOOKS FOR UNIFIED SYSTEM
// ============================================================================

export function useUnifiedExperience() {
  const { addToast } = useUIStore()
  const metrics = { isLowPerformance: false, fps: 60 } // Simple mock

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const engine = useMemo(() =>
    new UnifiedExperienceEngine(metrics, prefersReducedMotion, addToast),
    [metrics, prefersReducedMotion, addToast]
  )

  const loadingManager = useMemo(() => new UnifiedLoadingManager(), [])

  return {
    // Animation system
    getAnimationClass: engine.getAnimationClass.bind(engine),
    triggerCelebration: engine.triggerCelebration.bind(engine),
    getStaggeredDelay: engine.getStaggeredDelay.bind(engine),
    getLoadingAnimation: engine.getLoadingAnimation.bind(engine),

    // Notification system
    notify: engine.notify.bind(engine),
    notifyContext: engine.notifyContext.bind(engine),
    success: engine.success.bind(engine),
    error: engine.error.bind(engine),
    warning: engine.warning.bind(engine),
    info: engine.info.bind(engine),
    achievement: engine.achievement.bind(engine),

    // Loading system
    createLoadingState: loadingManager.createLoadingState.bind(loadingManager),
    getLoadingState: loadingManager.getState.bind(loadingManager),
    cleanupLoadingState: loadingManager.cleanup.bind(loadingManager),

    // Performance info
    isReducedMotion: prefersReducedMotion,
    isLowPerformance: metrics.isLowPerformance,
    fps: metrics.fps
  }
}

// Component-specific hook
export function useComponentExperience(componentName: string) {
  const unified = useUnifiedExperience()

  const notifyError = useCallback((message: string, details?: any) => {
    console.error(`[${componentName}] Error:`, message, details)
    unified.error(`${componentName}: ${message}`)
  }, [componentName, unified])

  const notifySuccess = useCallback((message: string) => {
    unified.success(`${componentName}: ${message}`)
  }, [componentName, unified])

  const notifyContextual = useCallback((event: string, data?: any) => {
    // Map component names to contexts
    const contextMap: Record<string, string> = {
      'BetCard': 'betting',
      'StakeInput': 'commitment',
      'SmartStakeInput': 'commitment',
      'WalletOnboarding': 'wallet',
      'MapContainer': 'location',
      'AchievementDisplay': 'achievement',
      'UnifiedBettingInterface': 'betting'
    }

    const context = contextMap[componentName] || 'info'
    unified.notifyContext({ context: context as any, event, data })
  }, [componentName, unified])

  // Component-specific animations
  const enterAnimation = unified.getAnimationClass('enter', 'medium')
  const hoverAnimation = unified.getAnimationClass('hover', 'subtle')
  const pressAnimation = unified.getAnimationClass('press', 'medium')

  return {
    ...unified,
    notifyError,
    notifySuccess,
    notifyContextual,
    // Pre-configured animations for common component patterns
    cardAnimation: `${enterAnimation} ${hoverAnimation}`,
    buttonAnimation: `${hoverAnimation} ${pressAnimation}`,
    listItemAnimation: (index: number) =>
      `${enterAnimation} ${hoverAnimation}`,
    successAnimation: () => unified.getAnimationClass('success', 'medium')
  }
}