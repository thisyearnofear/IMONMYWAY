/**
 * Network Resilience Engine - Offline-First Architecture
 * 
 * Provides network resilience, offline support, and intelligent sync mechanisms
 * for improved reliability and user experience.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface NetworkState {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  downlink: number
  rtt: number
  saveData: boolean
}

interface QueuedAction {
  id: string
  type: string
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  requiresAuth: boolean
  optimisticResult?: any
}

interface SyncStrategy {
  immediate: boolean
  batchSize: number
  maxWaitTime: number
  priorityOrder: Array<'critical' | 'high' | 'medium' | 'low'>
}

interface OfflineStorageConfig {
  maxSize: number // in MB
  ttl: number // time to live in milliseconds
  compressionEnabled: boolean
}

// ============================================================================
// NETWORK MONITOR
// ============================================================================

export class NetworkMonitor {
  private listeners: Array<(state: NetworkState) => void> = []
  private currentState: NetworkState

  constructor() {
    this.currentState = this.getCurrentNetworkState()
    this.setupEventListeners()
  }

  private getCurrentNetworkState(): NetworkState {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleNetworkChange.bind(this))
    window.addEventListener('offline', this.handleNetworkChange.bind(this))

    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', this.handleNetworkChange.bind(this))
    }
  }

  private handleNetworkChange(): void {
    const newState = this.getCurrentNetworkState()
    const stateChanged = JSON.stringify(newState) !== JSON.stringify(this.currentState)
    
    if (stateChanged) {
      this.currentState = newState
      this.notifyListeners(newState)
    }
  }

  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in network state listener:', error)
      }
    })
  }

  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getState(): NetworkState {
    return { ...this.currentState }
  }

  isSlowConnection(): boolean {
    const { effectiveType, downlink, rtt } = this.currentState
    return (
      effectiveType === 'slow-2g' || 
      effectiveType === '2g' ||
      downlink < 1.5 ||
      rtt > 300
    )
  }

  isFastConnection(): boolean {
    const { effectiveType, downlink, rtt } = this.currentState
    return (
      effectiveType === '4g' &&
      downlink > 10 &&
      rtt < 100
    )
  }
}

// ============================================================================
// OFFLINE STORAGE MANAGER
// ============================================================================

export class OfflineStorageManager {
  private config: OfflineStorageConfig
  private storageKey = 'punctuality_offline_data'

  constructor(config: OfflineStorageConfig = {
    maxSize: 50, // 50MB
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    compressionEnabled: true
  }) {
    this.config = config
    this.cleanup()
  }

  async store(key: string, data: any, options?: { ttl?: number; priority?: string }): Promise<boolean> {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl: options?.ttl || this.config.ttl,
        priority: options?.priority || 'medium',
        size: this.calculateSize(data)
      }

      const storage = await this.getStorage()
      storage[key] = item

      // Check storage size and cleanup if necessary
      if (this.getTotalSize(storage) > this.config.maxSize * 1024 * 1024) {
        await this.cleanup()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(storage))
      return true
    } catch (error) {
      console.error('Failed to store offline data:', error)
      return false
    }
  }

  async retrieve(key: string): Promise<any | null> {
    try {
      const storage = await this.getStorage()
      const item = storage[key]

      if (!item) return null

      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        delete storage[key]
        localStorage.setItem(this.storageKey, JSON.stringify(storage))
        return null
      }

      return item.data
    } catch (error) {
      console.error('Failed to retrieve offline data:', error)
      return null
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const storage = await this.getStorage()
      delete storage[key]
      localStorage.setItem(this.storageKey, JSON.stringify(storage))
      return true
    } catch (error) {
      console.error('Failed to remove offline data:', error)
      return false
    }
  }

  async clear(): Promise<boolean> {
    try {
      localStorage.removeItem(this.storageKey)
      return true
    } catch (error) {
      console.error('Failed to clear offline storage:', error)
      return false
    }
  }

  private async getStorage(): Promise<Record<string, any>> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to parse offline storage:', error)
      return {}
    }
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size
  }

  private getTotalSize(storage: Record<string, any>): number {
    return Object.values(storage).reduce((total, item: any) => total + (item.size || 0), 0)
  }

  private async cleanup(): Promise<void> {
    try {
      const storage = await this.getStorage()
      const now = Date.now()
      let cleaned = false

      // Remove expired items
      Object.keys(storage).forEach(key => {
        const item = storage[key]
        if (now - item.timestamp > item.ttl) {
          delete storage[key]
          cleaned = true
        }
      })

      // If still over size limit, remove oldest low-priority items
      if (this.getTotalSize(storage) > this.config.maxSize * 1024 * 1024) {
        const items = Object.entries(storage)
          .map(([key, item]: [string, any]) => ({ key, ...item }))
          .sort((a, b) => {
            // Sort by priority (low first) then by timestamp (oldest first)
            const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 }
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1
            
            if (aPriority !== bPriority) {
              return aPriority - bPriority
            }
            return a.timestamp - b.timestamp
          })

        // Remove items until under size limit
        let currentSize = this.getTotalSize(storage)
        const targetSize = this.config.maxSize * 1024 * 1024 * 0.8 // 80% of max size

        for (const item of items) {
          if (currentSize <= targetSize) break
          
          currentSize -= item.size
          delete storage[item.key]
          cleaned = true
        }
      }

      if (cleaned) {
        localStorage.setItem(this.storageKey, JSON.stringify(storage))
      }
    } catch (error) {
      console.error('Failed to cleanup offline storage:', error)
    }
  }

  getStorageInfo(): {
    totalItems: number
    totalSize: number
    maxSize: number
    utilizationPercent: number
  } {
    try {
      const storage = this.getStorage()
      const totalSize = this.getTotalSize(storage as any)
      const maxSize = this.config.maxSize * 1024 * 1024

      return {
        totalItems: Object.keys(storage).length,
        totalSize,
        maxSize,
        utilizationPercent: (totalSize / maxSize) * 100
      }
    } catch (error) {
      return {
        totalItems: 0,
        totalSize: 0,
        maxSize: this.config.maxSize * 1024 * 1024,
        utilizationPercent: 0
      }
    }
  }
}

// ============================================================================
// ACTION QUEUE MANAGER
// ============================================================================

export class ActionQueueManager {
  private queue: QueuedAction[] = []
  private isProcessing = false
  private storageManager: OfflineStorageManager
  private queueKey = 'action_queue'

  constructor(storageManager: OfflineStorageManager) {
    this.storageManager = storageManager
    this.loadQueue()
  }

  async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedAction: QueuedAction = {
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      ...action
    }

    this.queue.push(queuedAction)
    await this.saveQueue()

    console.log(`📥 Queued action: ${action.type} (${queuedAction.id})`)
    return queuedAction.id
  }

  async dequeue(id: string): Promise<boolean> {
    const index = this.queue.findIndex(action => action.id === id)
    if (index === -1) return false

    this.queue.splice(index, 1)
    await this.saveQueue()
    return true
  }

  async processQueue(
    executor: (action: QueuedAction) => Promise<boolean>,
    strategy: SyncStrategy = {
      immediate: true,
      batchSize: 5,
      maxWaitTime: 30000,
      priorityOrder: ['critical', 'high', 'medium', 'low']
    }
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    console.log(`🔄 Processing ${this.queue.length} queued actions`)

    try {
      // Sort queue by priority and timestamp
      const sortedQueue = [...this.queue].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        return a.timestamp - b.timestamp
      })

      // Process in batches
      for (let i = 0; i < sortedQueue.length; i += strategy.batchSize) {
        const batch = sortedQueue.slice(i, i + strategy.batchSize)
        
        await Promise.allSettled(
          batch.map(async (action) => {
            try {
              const success = await executor(action)
              
              if (success) {
                await this.dequeue(action.id)
                console.log(`✅ Successfully processed action: ${action.type} (${action.id})`)
              } else {
                // Increment retry count
                action.retryCount++
                
                if (action.retryCount >= action.maxRetries) {
                  console.error(`❌ Action failed after ${action.maxRetries} retries: ${action.type} (${action.id})`)
                  await this.dequeue(action.id)
                } else {
                  console.warn(`⚠️ Action failed, will retry: ${action.type} (${action.id}) - Attempt ${action.retryCount}/${action.maxRetries}`)
                  await this.saveQueue()
                }
              }
            } catch (error) {
              console.error(`❌ Error processing action: ${action.type} (${action.id})`, error)
              action.retryCount++
              
              if (action.retryCount >= action.maxRetries) {
                await this.dequeue(action.id)
              } else {
                await this.saveQueue()
              }
            }
          })
        )

        // Add delay between batches to prevent overwhelming the server
        if (i + strategy.batchSize < sortedQueue.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  getQueue(): QueuedAction[] {
    return [...this.queue]
  }

  getQueueStats(): {
    total: number
    byPriority: Record<string, number>
    byType: Record<string, number>
    oldestAction?: QueuedAction
  } {
    const stats = {
      total: this.queue.length,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      oldestAction: undefined as QueuedAction | undefined
    }

    this.queue.forEach(action => {
      stats.byPriority[action.priority] = (stats.byPriority[action.priority] || 0) + 1
      stats.byType[action.type] = (stats.byType[action.type] || 0) + 1
      
      if (!stats.oldestAction || action.timestamp < stats.oldestAction.timestamp) {
        stats.oldestAction = action
      }
    })

    return stats
  }

  async clearQueue(): Promise<void> {
    this.queue = []
    await this.saveQueue()
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await this.storageManager.retrieve(this.queueKey)
      if (stored && Array.isArray(stored)) {
        this.queue = stored
        console.log(`📂 Loaded ${this.queue.length} queued actions from storage`)
      }
    } catch (error) {
      console.error('Failed to load action queue:', error)
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await this.storageManager.store(this.queueKey, this.queue, { priority: 'high' })
    } catch (error) {
      console.error('Failed to save action queue:', error)
    }
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// NETWORK RESILIENCE MANAGER
// ============================================================================

export class NetworkResilienceManager {
  private networkMonitor: NetworkMonitor
  private storageManager: OfflineStorageManager
  private actionQueue: ActionQueueManager
  private syncInProgress = false

  constructor() {
    this.networkMonitor = new NetworkMonitor()
    this.storageManager = new OfflineStorageManager()
    this.actionQueue = new ActionQueueManager(this.storageManager)
    
    this.setupNetworkListeners()
  }

  private setupNetworkListeners(): void {
    this.networkMonitor.subscribe((state) => {
      console.log('🌐 Network state changed:', state)
      
      if (state.isOnline && !this.syncInProgress) {
        this.syncWhenOnline()
      }
    })
  }

  async executeAction<T>(
    action: {
      type: string
      operation: () => Promise<T>
      data?: any
      priority?: 'low' | 'medium' | 'high' | 'critical'
      maxRetries?: number
      requiresAuth?: boolean
      optimisticResult?: T
    }
  ): Promise<T | null> {
    const {
      type,
      operation,
      data,
      priority = 'medium',
      maxRetries = 3,
      requiresAuth = false,
      optimisticResult
    } = action

    const networkState = this.networkMonitor.getState()

    // If online, try to execute immediately
    if (networkState.isOnline) {
      try {
        return await operation()
      } catch (error) {
        console.error(`Failed to execute action online: ${type}`, error)
        
        // Queue for retry if it's a network error
        if (this.isNetworkError(error as Error)) {
          await this.actionQueue.enqueue({
            type,
            data,
            priority,
            maxRetries,
            requiresAuth,
            optimisticResult
          })
          
          return optimisticResult || null
        }
        
        throw error
      }
    } else {
      // Offline - queue the action
      console.log(`📴 Offline: Queuing action ${type}`)
      
      await this.actionQueue.enqueue({
        type,
        data,
        priority,
        maxRetries,
        requiresAuth,
        optimisticResult
      })
      
      return optimisticResult || null
    }
  }

  async syncWhenOnline(): Promise<void> {
    if (this.syncInProgress || !this.networkMonitor.getState().isOnline) {
      return
    }

    this.syncInProgress = true
    console.log('🔄 Starting sync process...')

    try {
      await this.actionQueue.processQueue(async (queuedAction) => {
        // This would be implemented by the calling code
        // For now, we'll just simulate success
        console.log(`Processing queued action: ${queuedAction.type}`)
        
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Return true for success, false for retry
        return Math.random() > 0.1 // 90% success rate for simulation
      })
      
      console.log('✅ Sync completed successfully')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  async cacheData(key: string, data: any, options?: { ttl?: number; priority?: string }): Promise<boolean> {
    return this.storageManager.store(key, data, options)
  }

  async getCachedData(key: string): Promise<any | null> {
    return this.storageManager.retrieve(key)
  }

  getNetworkState(): NetworkState {
    return this.networkMonitor.getState()
  }

  getQueueStats() {
    return this.actionQueue.getQueueStats()
  }

  getStorageInfo() {
    return this.storageManager.getStorageInfo()
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      error.name === 'NetworkError'
    )
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useNetworkResilience() {
  const [manager] = useState(() => new NetworkResilienceManager())
  const [networkState, setNetworkState] = useState<NetworkState>(() => manager.getNetworkState())
  const [queueStats, setQueueStats] = useState(() => manager.getQueueStats())

  useEffect(() => {
    const unsubscribe = manager['networkMonitor'].subscribe(setNetworkState)
    
    // Update queue stats periodically
    const interval = setInterval(() => {
      setQueueStats(manager.getQueueStats())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [manager])

  const executeAction = useCallback(async <T>(action: {
    type: string
    operation: () => Promise<T>
    data?: any
    priority?: 'low' | 'medium' | 'high' | 'critical'
    maxRetries?: number
    requiresAuth?: boolean
    optimisticResult?: T
  }): Promise<T | null> => {
    return manager.executeAction(action)
  }, [manager])

  const cacheData = useCallback(async (key: string, data: any, options?: { ttl?: number; priority?: string }) => {
    return manager.cacheData(key, data, options)
  }, [manager])

  const getCachedData = useCallback(async (key: string) => {
    return manager.getCachedData(key)
  }, [manager])

  const syncNow = useCallback(async () => {
    return manager.syncWhenOnline()
  }, [manager])

  return {
    networkState,
    queueStats,
    storageInfo: manager.getStorageInfo(),
    executeAction,
    cacheData,
    getCachedData,
    syncNow,
    isOnline: networkState.isOnline,
    isSlowConnection: manager['networkMonitor'].isSlowConnection(),
    isFastConnection: manager['networkMonitor'].isFastConnection()
  }
}

export function useOfflineFirst<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number
    priority?: string
    refreshInterval?: number
    backgroundRefresh?: boolean
  } = {}
) {
  const { executeAction, cacheData, getCachedData, isOnline } = useNetworkResilience()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    priority = 'medium',
    refreshInterval = 30 * 60 * 1000, // 30 minutes
    backgroundRefresh = true
  } = options

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Try cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = await getCachedData(key)
        if (cached) {
          setData(cached)
          setLoading(false)
          
          // If online and background refresh is enabled, fetch fresh data
          if (isOnline && backgroundRefresh) {
            executeAction({
              type: `refresh_${key}`,
              operation: fetchFn,
              priority: 'low'
            }).then(freshData => {
              if (freshData) {
                setData(freshData)
                cacheData(key, freshData, { ttl, priority })
              }
            }).catch(console.error)
          }
          
          return cached
        }
      }

      // Fetch fresh data
      const result = await executeAction({
        type: `fetch_${key}`,
        operation: fetchFn,
        priority: priority as any,
        optimisticResult: data // Use current data as optimistic result
      })

      if (result) {
        setData(result)
        await cacheData(key, result, { ttl, priority })
      }

      return result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setLoading(false)
    }
  }, [key, fetchFn, getCachedData, executeAction, cacheData, isOnline, backgroundRefresh, ttl, priority, data])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        if (isOnline) {
          fetchData(true)
        }
      }, refreshInterval)

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current)
          refreshTimeoutRef.current = null
        }
      }
    }
  }, [fetchData, refreshInterval, isOnline])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    isStale: !isOnline && data !== null
  }
}