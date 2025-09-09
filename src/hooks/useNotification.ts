import { useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAnimation } from './useAnimation'

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

export function useNotification() {
  const { addToast } = useUIStore()
  const { triggerCelebration } = useAnimation()

  // Enhanced notification with context awareness
  const notify = useCallback((config: NotificationConfig) => {
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
    addToast({
      type: type === 'achievement' ? 'success' : type,
      message: title ? `${title}: ${message}` : message,
      duration: persistent ? 0 : duration
    })

    // Trigger celebration for special events
    if (celebration || type === 'achievement') {
      const celebrationType = type === 'achievement' ? 'achievement' : 'success'
      triggerCelebration({
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
  }, [addToast, triggerCelebration])

  // Context-aware notifications with smart defaults
  const notifyContext = useCallback((config: ContextualNotification) => {
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

    const messageConfig = contextualMessages[context]?.[event]
    if (messageConfig) {
      notify(messageConfig)
    } else {
      // Fallback for unknown events
      notify({
        message: `${context}: ${event}`,
        type: 'info'
      })
    }
  }, [notify])

  // Quick notification methods for common scenarios
  const success = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    notify({ message, type: 'success', haptic: true, ...options })
  }, [notify])

  const error = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    notify({ message, type: 'error', haptic: true, persistent: true, ...options })
  }, [notify])

  const warning = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    notify({ message, type: 'warning', haptic: true, ...options })
  }, [notify])

  const info = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    notify({ message, type: 'info', ...options })
  }, [notify])

  const achievement = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    notify({ 
      message, 
      type: 'achievement', 
      celebration: true, 
      haptic: true, 
      persistent: true,
      ...options 
    })
  }, [notify])

  // Smart notifications based on user context
  const smartNotify = useCallback((
    baseMessage: string,
    context?: {
      userReputation?: number
      isFirstTime?: boolean
      hasActiveCommitments?: boolean
      recentActivity?: string[]
    }
  ) => {
    let enhancedMessage = baseMessage

    // Personalize based on context
    if (context?.isFirstTime) {
      enhancedMessage = `Welcome! ${baseMessage}`
    } else if (context?.userReputation && context.userReputation > 8000) {
      enhancedMessage = `⭐ ${baseMessage} (High reputation user)`
    }

    // Add helpful tips for new users
    if (context?.isFirstTime && context?.hasActiveCommitments === false) {
      enhancedMessage += ' Tip: Start with small stakes to build your reputation!'
    }

    notify({
      message: enhancedMessage,
      type: 'info',
      duration: context?.isFirstTime ? 8000 : undefined
    })
  }, [notify])

  return {
    notify,
    notifyContext,
    success,
    error,
    warning,
    info,
    achievement,
    smartNotify
  }
}

// Hook for component-specific notifications
export function useComponentNotification(componentName: string) {
  const { notifyContext, error, success } = useNotification()

  const notifyError = useCallback((message: string, details?: any) => {
    console.error(`[${componentName}] Error:`, message, details)
    error(`${componentName}: ${message}`)
  }, [componentName, error])

  const notifySuccess = useCallback((message: string) => {
    success(`${componentName}: ${message}`)
  }, [componentName, success])

  const notifyContextual = useCallback((event: string, data?: any) => {
    // Map component names to contexts
    const contextMap: Record<string, string> = {
      'BetCard': 'betting',
      'StakeInput': 'commitment',
      'WalletOnboarding': 'wallet',
      'MapContainer': 'location',
      'AchievementDisplay': 'achievement'
    }

    const context = contextMap[componentName] || 'info'
    notifyContext({ context: context as any, event, data })
  }, [componentName, notifyContext])

  return {
    notifyError,
    notifySuccess,
    notifyContextual
  }
}