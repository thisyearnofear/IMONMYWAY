// Real-time Service — local event bus for optimistic UI updates
// Somnia reactivity (WebSocket) handles on-chain events; this handles local triggers

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export interface RealtimeEvents {
  'leaderboard:update': (data: {
    walletAddress: string
    reputationScore: number
    sessionCompleted: boolean
    success: boolean
  }) => void

  'profile:update': (data: {
    walletAddress: string
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

  'achievement:unlocked': (data: {
    walletAddress: string
    achievement: {
      id: string
      title: string
      icon: string
    }
  }) => void

  'reputation:changed': (data: {
    walletAddress: string
    oldScore: number
    newScore: number
    reason: string
  }) => void

  'session:completed': (data: {
    walletAddress: string
    sessionId: string
    success: boolean
    stats: {
      pace?: number
      distance?: number
      duration?: number
    }
  }) => void
}

class RealtimeService {
  private listeners: Map<string, Set<Function>> = new Map()

  on<K extends keyof RealtimeEvents>(event: K, callback: RealtimeEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  triggerSessionCompletion(data: {
    walletAddress: string
    sessionId: string
    success: boolean
    pace?: number
    distance?: number
    duration?: number
    accuracy?: number
  }): void {
    this.trigger('session:completed', {
      walletAddress: data.walletAddress,
      sessionId: data.sessionId,
      success: data.success,
      stats: { pace: data.pace, distance: data.distance, duration: data.duration }
    })

    this.trigger('leaderboard:update', {
      walletAddress: data.walletAddress,
      reputationScore: 0,
      sessionCompleted: true,
      success: data.success
    })

    this.trigger('profile:update', {
      walletAddress: data.walletAddress,
      sessionData: { success: data.success, pace: data.pace, distance: data.distance, accuracy: data.accuracy },
      newStats: { totalSessions: 0, successRate: 0, currentStreak: 0 }
    })
  }

  triggerReputationChange(data: {
    walletAddress: string
    oldScore: number
    newScore: number
    reason: string
  }): void {
    this.trigger('reputation:changed', data)
  }

  triggerAchievementUnlock(data: {
    walletAddress: string
    achievement: { id: string; title: string; icon: string }
  }): void {
    this.trigger('achievement:unlocked', data)
  }

  isRealtimeConnected(): boolean {
    return true
  }

  private trigger<K extends keyof RealtimeEvents>(
    event: K,
    data: Parameters<RealtimeEvents[K]>[0]
  ): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          (callback as RealtimeEvents[K])(data as any)
        } catch (error) {
          console.error(`Error in real-time listener for ${event}:`, error)
        }
      })
    }
  }
}

export const realtimeService = new RealtimeService()
