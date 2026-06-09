import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface UIState {
  toasts: Toast[]
  isMapFollowing: boolean
  mapCenter: [number, number] | null
  mapZoom: number
  isOnline: boolean
  isConnected: boolean
  networkMetrics: {
    lastTxSpeed: number | null
    isOnSomnia: boolean
  }
  isCreatingSession: boolean
  isLoadingSession: boolean

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
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  isMapFollowing: true,
  mapCenter: null,
  mapZoom: 13,
  isOnline: true,
  isConnected: false,
  networkMetrics: {
    lastTxSpeed: null,
    isOnSomnia: false,
  },
  isCreatingSession: false,
  isLoadingSession: false,

  addToast: (toast) => {
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11)
    const newToast = { ...toast, id }

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))

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
}))
