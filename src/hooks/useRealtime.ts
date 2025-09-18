// Real-time Hook - React hook for real-time updates
import { useEffect, useCallback, useRef } from 'react'
import { realtimeService, type RealtimeEvents } from '@/lib/realtime-service'

/**
 * Hook for subscribing to real-time events
 */
export function useRealtime<K extends keyof RealtimeEvents>(
  event: K,
  callback: RealtimeEvents[K],
  deps: React.DependencyList = []
) {
  useEffect(() => {
    // Subscribe to event
    const unsubscribe = realtimeService.on(event, callback)

    // Cleanup on unmount
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, callback, ...deps])
}

/**
 * Hook for leaderboard real-time updates
 */
export function useLeaderboardRealtime(
  onUpdate: (data: {
    walletAddress: string
    reputationScore: number
    sessionCompleted: boolean
    success: boolean
  }) => void,
  currentUserAddress?: string
) {
  const handleUpdate = useCallback((data: Parameters<typeof onUpdate>[0]) => {
    console.log('📊 Leaderboard real-time update:', data)
    onUpdate(data)
  }, [onUpdate])

  useRealtime('leaderboard:update', handleUpdate, [currentUserAddress])

  // Also listen for reputation changes that affect leaderboard
  useRealtime('reputation:changed', (data) => {
    console.log('⭐ Reputation change affecting leaderboard:', data)
    handleUpdate({
      walletAddress: data.walletAddress,
      reputationScore: data.newScore,
      sessionCompleted: false,
      success: true
    })
  }, [currentUserAddress])
}

/**
 * Hook for profile real-time updates
 */
export function useProfileRealtime(
  walletAddress: string | undefined,
  onUpdate: (data: {
    sessionData: {
      success: boolean
      pace?: number
      distance?: number
      accuracy?: number
    }
    newStats: {
      totalSessions: number
      successRate: number
      currentStreak: number
    }
  }) => void
) {
  const handleProfileUpdate = useCallback((data: Parameters<RealtimeEvents['profile:update']>[0]) => {
    // Only process updates for the current user
    if (walletAddress && data.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
      console.log('👤 Profile real-time update for current user:', data)
      onUpdate({
        sessionData: data.sessionData,
        newStats: data.newStats
      })
    }
  }, [walletAddress, onUpdate])

  useRealtime('profile:update', handleProfileUpdate, [walletAddress])

  // Listen for achievement unlocks
  const handleAchievementUnlock = useCallback((data: Parameters<RealtimeEvents['achievement:unlocked']>[0]) => {
    if (walletAddress && data.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
      console.log('🏆 Achievement unlocked for current user:', data)
      // Could trigger a toast notification or profile refresh
    }
  }, [walletAddress])

  useRealtime('achievement:unlocked', handleAchievementUnlock, [walletAddress])
}

/**
 * Hook for reputation changes
 */
export function useReputationRealtime(
  walletAddress: string | undefined,
  onReputationChange: (data: {
    oldScore: number
    newScore: number
    reason: string
  }) => void
) {
  const handleReputationChange = useCallback((data: Parameters<RealtimeEvents['reputation:changed']>[0]) => {
    // Only process updates for the current user
    if (walletAddress && data.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
      console.log('⭐ Reputation change for current user:', data)
      onReputationChange({
        oldScore: data.oldScore,
        newScore: data.newScore,
        reason: data.reason
      })
    }
  }, [walletAddress, onReputationChange])

  useRealtime('reputation:changed', handleReputationChange, [walletAddress])
}

/**
 * Hook to trigger real-time events (for components that generate events)
 */
export function useRealtimeTrigger() {
  const triggerSessionCompletion = useCallback((sessionData: {
    walletAddress: string
    sessionId: string
    success: boolean
    pace?: number
    distance?: number
    duration?: number
    accuracy?: number
  }) => {
    realtimeService.triggerSessionCompletion(sessionData)
  }, [])

  const triggerReputationChange = useCallback((data: {
    walletAddress: string
    oldScore: number
    newScore: number
    reason: string
  }) => {
    realtimeService.triggerReputationChange(data)
  }, [])

  const triggerAchievementUnlock = useCallback((data: {
    walletAddress: string
    achievement: {
      id: string
      title: string
      icon: string
    }
  }) => {
    realtimeService.triggerAchievementUnlock(data)
  }, [])

  const isConnected = useCallback(() => {
    return realtimeService.isRealtimeConnected()
  }, [])

  return {
    triggerSessionCompletion,
    triggerReputationChange,
    triggerAchievementUnlock,
    isConnected
  }
}