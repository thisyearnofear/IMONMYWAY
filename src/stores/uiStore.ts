import { create } from 'zustand'
import { 
  StakeRecommendation, 
  ReputationPrediction, 
  OptimizedRoute, 
  AchievementPrediction,
  BettingOdds 
} from '@/lib/ai-service'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface AIState {
  // AI feature enablement
  aiFeaturesEnabled: boolean
  aiProcessing: boolean
  
  // AI predictions cache
  stakeRecommendations: Record<string, StakeRecommendation>
  reputationPredictions: Record<string, ReputationPrediction & { timestamp?: number }>
  routeOptimizations: Record<string, OptimizedRoute>
  achievementPredictions: Record<string, AchievementPrediction & { timestamp?: number }>
  bettingOdds: Record<string, BettingOdds>
  
  // AI performance metrics
  aiPerformanceMetrics: {
    predictionAccuracy: number
    responseTime: number
    modelConfidence: number
  }
  
  // AI settings
  aiSettings: {
    enablePredictions: boolean
    enablePersonalization: boolean
    enableSmartDefaults: boolean
    privacyMode: boolean
  }
}

interface UIState {
  // Toast notifications
  toasts: Toast[]
  
  // Map state
  isMapFollowing: boolean
  mapCenter: [number, number] | null
  mapZoom: number
  
  // Network status (consolidated)
  isOnline: boolean
  isConnected: boolean
  contractAddress: string
  networkMetrics: {
    lastTxSpeed: number | null
    isOnSomnia: boolean
  }
  
  // Loading states
  isCreatingSession: boolean
  isLoadingSession: boolean
  
  // AI state (enhanced)
  aiState: AIState
  
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  setMapFollowing: (following: boolean) => void
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  
  setOnline: (online: boolean) => void
  setConnected: (connected: boolean) => void
  updateNetworkMetrics: (metrics: Partial<UIState['networkMetrics']>) => void
  
  setCreatingSession: (loading: boolean) => void
  setLoadingSession: (loading: boolean) => void
  
  // AI-related actions (enhanced)
  updateAIState: (aiStateUpdate: Partial<AIState>) => void
  setAIProcessing: (processing: boolean) => void
  setStakeRecommendation: (key: string, recommendation: StakeRecommendation) => void
  setReputationPrediction: (userId: string, prediction: ReputationPrediction) => void
  setRouteOptimization: (key: string, route: OptimizedRoute) => void
  setAchievementPrediction: (userId: string, prediction: AchievementPrediction) => void
  setBettingOdds: (key: string, odds: BettingOdds) => void
  updateAISettings: (settings: Partial<AIState['aiSettings']>) => void
  updateAIPerformanceMetrics: (metrics: Partial<AIState['aiPerformanceMetrics']>) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  toasts: [],
  
  isMapFollowing: true,
  mapCenter: null,
  mapZoom: 13,
  
  isOnline: true,
  isConnected: false,
  contractAddress: '0xE93ECD999526BBBaCd35FA808E6F590BB1017246',
  networkMetrics: {
    lastTxSpeed: null,
    isOnSomnia: false,
  },
  
  isCreatingSession: false,
  isLoadingSession: false,
  
  // Enhanced AI state
  aiState: {
    aiFeaturesEnabled: true,
    aiProcessing: false,
    stakeRecommendations: {},
    reputationPredictions: {},
    routeOptimizations: {},
    achievementPredictions: {},
    bettingOdds: {},
    aiPerformanceMetrics: {
      predictionAccuracy: 0.85,
      responseTime: 0.5,
      modelConfidence: 0.8
    },
    aiSettings: {
      enablePredictions: true,
      enablePersonalization: true,
      enableSmartDefaults: true,
      privacyMode: false
    }
  },
  
  // Actions
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),
  
  clearToasts: () => set({ toasts: [] }),
  
  setMapFollowing: (following) => set({ isMapFollowing: following }),
  
  setMapCenter: (center) => set({ mapCenter: center }),
  
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  
  setOnline: (online) => set({ isOnline: online }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  updateNetworkMetrics: (metrics) => set(state => ({
    networkMetrics: { ...state.networkMetrics, ...metrics }
  })),
  
  setCreatingSession: (loading) => set({ isCreatingSession: loading }),
  
  setLoadingSession: (loading) => set({ isLoadingSession: loading }),
  
  // Enhanced AI-related actions
  updateAIState: (aiStateUpdate) => set(state => ({
    aiState: { ...state.aiState, ...aiStateUpdate }
  })),
  
  setAIProcessing: (processing) => set(state => ({
    aiState: { 
      ...state.aiState, 
      aiProcessing: processing 
    }
  })),
  
  setStakeRecommendation: (key, recommendation) => set(state => ({
    aiState: { 
      ...state.aiState,
      stakeRecommendations: {
        ...state.aiState.stakeRecommendations,
        [key]: recommendation
      }
    }
  })),
  
  setReputationPrediction: (userId, prediction) => set(state => ({
    aiState: { 
      ...state.aiState,
      reputationPredictions: {
        ...state.aiState.reputationPredictions,
        [userId]: prediction
      }
    }
  })),
  
  setRouteOptimization: (key, route) => set(state => ({
    aiState: { 
      ...state.aiState,
      routeOptimizations: {
        ...state.aiState.routeOptimizations,
        [key]: route
      }
    }
  })),
  
  setAchievementPrediction: (userId, prediction) => set(state => ({
    aiState: { 
      ...state.aiState,
      achievementPredictions: {
        ...state.aiState.achievementPredictions,
        [userId]: prediction
      }
    }
  })),
  
  setBettingOdds: (key, odds) => set(state => ({
    aiState: { 
      ...state.aiState,
      bettingOdds: {
        ...state.aiState.bettingOdds,
        [key]: odds
      }
    }
  })),
  
  updateAISettings: (settings) => set(state => ({
    aiState: { 
      ...state.aiState,
      aiSettings: { ...state.aiState.aiSettings, ...settings }
    }
  })),
  
  updateAIPerformanceMetrics: (metrics) => set(state => ({
    aiState: { 
      ...state.aiState,
      aiPerformanceMetrics: { ...state.aiState.aiPerformanceMetrics, ...metrics }
    }
  }))
}))