// Real-time Service - Handles live updates for leaderboard and profile
// Leverages existing Socket.IO infrastructure

import { socketManager } from './socket'
import type { Socket } from 'socket.io-client'

export interface RealtimeEvents {
  // Leaderboard updates
  'leaderboard:update': (data: { 
    walletAddress: string
    reputationScore: number
    sessionCompleted: boolean
    success: boolean
  }) => void
  
  // Profile updates
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
  
  // Achievement unlocks
  'achievement:unlocked': (data: {
    walletAddress: string
    achievement: {
      id: string
      title: string
      icon: string
    }
  }) => void
  
  // Reputation changes
  'reputation:changed': (data: {
    walletAddress: string
    oldScore: number
    newScore: number
    reason: string
  }) => void
  
  // Session events
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
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false

  /**
   * Initialize real-time connection
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = socketManager.connect()
        
        this.socket.on('connect', () => {
          console.log('🔗 Real-time service connected')
          this.isConnected = true
          resolve()
        })

        this.socket.on('disconnect', () => {
          console.log('🔌 Real-time service disconnected')
          this.isConnected = false
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Real-time connection error:', error)
          reject(error)
        })

        // Set up event listeners for real-time updates
        this.setupEventListeners()

      } catch (error) {
        console.error('❌ Failed to initialize real-time service:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from real-time service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
      console.log('🔌 Real-time service disconnected')
    }
  }

  /**
   * Subscribe to real-time events
   */
  on<K extends keyof RealtimeEvents>(event: K, callback: RealtimeEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
      }
    }
  }

  /**
   * Emit real-time events (for triggering updates)
   */
  emit<K extends keyof RealtimeEvents>(event: K, data: Parameters<RealtimeEvents[K]>[0]): void {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot emit event - not connected to real-time service')
      return
    }

    // Emit to server
    this.socket.emit(event, data)
    
    // Also trigger local listeners immediately for optimistic updates
    this.triggerLocalListeners(event, data)
  }

  /**
   * Trigger session completion (main entry point for real-time updates)
   */
  triggerSessionCompletion(sessionData: {
    walletAddress: string
    sessionId: string
    success: boolean
    pace?: number
    distance?: number
    duration?: number
    accuracy?: number
  }): void {
    console.log('📊 Triggering session completion updates...', sessionData)

    // Emit session completion event
    this.emit('session:completed', {
      walletAddress: sessionData.walletAddress,
      sessionId: sessionData.sessionId,
      success: sessionData.success,
      stats: {
        pace: sessionData.pace,
        distance: sessionData.distance,
        duration: sessionData.duration
      }
    })

    // Trigger leaderboard update
    this.emit('leaderboard:update', {
      walletAddress: sessionData.walletAddress,
      reputationScore: 0, // Will be calculated server-side
      sessionCompleted: true,
      success: sessionData.success
    })

    // Trigger profile update
    this.emit('profile:update', {
      walletAddress: sessionData.walletAddress,
      sessionData: {
        success: sessionData.success,
        pace: sessionData.pace,
        distance: sessionData.distance,
        accuracy: sessionData.accuracy
      },
      newStats: {
        totalSessions: 0, // Will be calculated server-side
        successRate: 0,
        currentStreak: 0
      }
    })
  }

  /**
   * Trigger reputation change
   */
  triggerReputationChange(data: {
    walletAddress: string
    oldScore: number
    newScore: number
    reason: string
  }): void {
    console.log('⭐ Triggering reputation change...', data)
    this.emit('reputation:changed', data)
  }

  /**
   * Trigger achievement unlock
   */
  triggerAchievementUnlock(data: {
    walletAddress: string
    achievement: {
      id: string
      title: string
      icon: string
    }
  }): void {
    console.log('🏆 Triggering achievement unlock...', data)
    this.emit('achievement:unlocked', data)
  }

  /**
   * Check if connected
   */
  isRealtimeConnected(): boolean {
    return this.isConnected
  }

  /**
   * Set up event listeners for incoming real-time updates
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Listen for server-side real-time events
    this.socket.on('leaderboard:update', (data) => {
      console.log('📊 Received leaderboard update:', data)
      this.triggerLocalListeners('leaderboard:update', data)
    })

    this.socket.on('profile:update', (data) => {
      console.log('👤 Received profile update:', data)
      this.triggerLocalListeners('profile:update', data)
    })

    this.socket.on('achievement:unlocked', (data) => {
      console.log('🏆 Received achievement unlock:', data)
      this.triggerLocalListeners('achievement:unlocked', data)
    })

    this.socket.on('reputation:changed', (data) => {
      console.log('⭐ Received reputation change:', data)
      this.triggerLocalListeners('reputation:changed', data)
    })

    this.socket.on('session:completed', (data) => {
      console.log('✅ Received session completion:', data)
      this.triggerLocalListeners('session:completed', data)
    })
  }

  /**
   * Trigger local event listeners
   */
  private triggerLocalListeners<K extends keyof RealtimeEvents>(
    event: K, 
    data: Parameters<RealtimeEvents[K]>[0]
  ): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          (callback as RealtimeEvents[K])(data as any)
        } catch (error) {
          console.error(`❌ Error in real-time listener for ${event}:`, error)
        }
      })
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService()

// Auto-connect when imported (with error handling)
if (typeof window !== 'undefined') {
  realtimeService.connect().catch(error => {
    console.warn('⚠️ Real-time service failed to auto-connect:', error)
  })
}