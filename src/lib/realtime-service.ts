// Enhanced Real-time Service - GPS Tracking + Live Updates
// Single source of truth for all real-time communication
// ENHANCEMENT FIRST: Building upon existing Socket.IO infrastructure

import { socketManager } from './socket'
import type { Socket } from 'socket.io-client'

// Enhanced location tracking interfaces
export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  altitudeAccuracy?: number;
}

export interface LocationVerification {
  targetLat: number;
  targetLng: number;
  currentLat: number;
  currentLng: number;
  distance: number;
  withinThreshold: boolean;
  accuracy: number;
}

// Enhanced betting interfaces
export interface BetUpdate {
  commitmentId: string;
  betId: string;
  amount: string;
  prediction: 'success' | 'failure';
  odds: number;
  timestamp: number;
}

// Extended existing events with new GPS and betting events
export interface RealtimeEvents {
  // Existing events (preserved)
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

  // NEW: GPS tracking events
  'location:update': (data: LocationUpdate) => void
  'location:verified': (data: LocationVerification) => void
  'location:error': (data: { code: number; message: string; timestamp: number }) => void

  // NEW: Betting events
  'betting:update': (data: BetUpdate) => void
  'betting:placed': (data: { commitmentId: string; totalBets: number; totalAmount: string }) => void
}

class EnhancedRealtimeService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false

  // GPS tracking state
  private locationWatchId: number | null = null
  private lastLocationUpdate: LocationUpdate | null = null
  private locationHistory: LocationUpdate[] = []
  private maxHistorySize = 100
  private isTracking = false
  private trackingStartTime: number | null = null

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
   * Enhanced disconnect with GPS cleanup
   */
  disconnect(): void {
    // Stop GPS tracking
    this.stopLocationTracking()

    // Clear location data
    this.locationHistory = []
    this.lastLocationUpdate = null

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
      console.log('🔌 Enhanced real-time service disconnected')
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

  // ============================================================================
  // NEW: GPS TRACKING METHODS (ENHANCEMENT FIRST)
  // ============================================================================

  /**
   * Start high-accuracy GPS tracking
   */
  async startLocationTracking(userId: string, commitmentId?: string): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported by this browser');
    }

    // Request permission first
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        throw new Error('Location permission denied. Please enable location access.');
      }
    } catch (error) {
      console.warn('Permission API not supported, proceeding with geolocation request');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000
    };

    this.isTracking = true;
    this.trackingStartTime = Date.now();

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationUpdate: LocationUpdate = {
          userId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined
        };

        this.lastLocationUpdate = locationUpdate;

        // Add to history
        this.locationHistory.push(locationUpdate);
        if (this.locationHistory.length > this.maxHistorySize) {
          this.locationHistory.shift();
        }

        // Emit to server and local listeners
        this.emit('location:update', locationUpdate);

        // Also emit to server with commitment context
        if (this.socket && this.isConnected) {
          this.socket.emit('location-update', {
            ...locationUpdate,
            commitmentId,
            trackingDuration: this.trackingStartTime ? Date.now() - this.trackingStartTime : 0
          });
        }

        console.log('📍 Location updated:', {
          lat: locationUpdate.latitude.toFixed(6),
          lng: locationUpdate.longitude.toFixed(6),
          accuracy: `${locationUpdate.accuracy}m`,
          speed: locationUpdate.speed ? `${locationUpdate.speed}m/s` : 'unknown'
        });
      },
      (error) => {
        console.error('❌ Location error:', error);
        this.handleLocationError(error);
      },
      options
    );

    console.log('📍 GPS tracking started');
  }

  /**
   * Stop GPS tracking
   */
  stopLocationTracking(): void {
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }

    this.isTracking = false;
    this.trackingStartTime = null;

    // Notify server
    if (this.socket && this.isConnected) {
      this.socket.emit('location-tracking-stopped', {
        timestamp: Date.now(),
        totalUpdates: this.locationHistory.length
      });
    }

    console.log('📍 GPS tracking stopped');
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentPosition(): Promise<LocationUpdate> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationUpdate: LocationUpdate = {
            userId: 'current-user',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined
          };
          resolve(locationUpdate);
        },
        (error) => {
          this.handleLocationError(error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  }

  /**
   * Verify location against target
   */
  verifyLocation(targetLat: number, targetLng: number, threshold: number = 100): LocationVerification | null {
    if (!this.lastLocationUpdate) return null;

    const distance = this.calculateDistance(
      this.lastLocationUpdate.latitude,
      this.lastLocationUpdate.longitude,
      targetLat,
      targetLng
    );

    const verification: LocationVerification = {
      targetLat,
      targetLng,
      currentLat: this.lastLocationUpdate.latitude,
      currentLng: this.lastLocationUpdate.longitude,
      distance,
      withinThreshold: distance <= threshold,
      accuracy: this.lastLocationUpdate.accuracy
    };

    // Emit verification result
    this.emit('location:verified', verification);

    // Send to server
    if (this.socket && this.isConnected) {
      this.socket.emit('verify-location', verification);
    }

    return verification;
  }

  /**
   * Get location tracking status
   */
  getLocationStatus() {
    return {
      isTracking: this.isTracking,
      lastUpdate: this.lastLocationUpdate,
      historySize: this.locationHistory.length,
      trackingDuration: this.trackingStartTime ? Date.now() - this.trackingStartTime : 0
    };
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationUpdate[] {
    return [...this.locationHistory];
  }

  // ============================================================================
  // NEW: BETTING METHODS (ENHANCEMENT FIRST)
  // ============================================================================

  /**
   * Subscribe to betting updates for a commitment
   */
  subscribeToBettingUpdates(commitmentId: string, callback: (update: BetUpdate) => void): () => void {
    console.log(`📊 Subscribing to betting updates for commitment: ${commitmentId}`);

    // Subscribe to server events
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe-betting', { commitmentId });
    }

    // Subscribe to local events
    return this.on('betting:update', (data) => {
      if (data.commitmentId === commitmentId) {
        callback(data);
      }
    });
  }

  /**
   * Unsubscribe from betting updates
   */
  unsubscribeFromBettingUpdates(commitmentId: string): void {
    console.log(`📊 Unsubscribing from betting updates for commitment: ${commitmentId}`);

    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe-betting', { commitmentId });
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private handleLocationError(error: GeolocationPositionError): void {
    let errorMessage = 'Location tracking failed';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please check your GPS/network connection.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
    }

    // Emit error event
    this.emit('location:error', {
      code: error.code,
      message: errorMessage,
      timestamp: Date.now()
    });

    // Send to server for logging
    if (this.socket && this.isConnected) {
      this.socket.emit('location-error', {
        code: error.code,
        message: errorMessage,
        timestamp: Date.now()
      });
    }

    throw new Error(errorMessage);
  }

  private resumeLocationTracking(): void {
    if (this.isTracking && this.lastLocationUpdate) {
      this.startLocationTracking(this.lastLocationUpdate.userId);
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Set up enhanced event listeners for incoming real-time updates
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Existing event listeners (preserved)
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

    // NEW: GPS tracking event listeners
    this.socket.on('location-verified', (data) => {
      console.log('📍 Received location verification:', data)
      this.triggerLocalListeners('location:verified', data)
    })

    // NEW: Betting event listeners
    this.socket.on('betting-update', (data) => {
      console.log('🎲 Received betting update:', data)
      this.triggerLocalListeners('betting:update', data)
    })

    this.socket.on('betting-placed', (data) => {
      console.log('💰 Received bet placed:', data)
      this.triggerLocalListeners('betting:placed', data)
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
export const realtimeService = new EnhancedRealtimeService()

// Auto-connect when imported (with error handling)
if (typeof window !== 'undefined') {
  realtimeService.connect().catch(error => {
    console.warn('⚠️ Real-time service failed to auto-connect:', error)
  })
}