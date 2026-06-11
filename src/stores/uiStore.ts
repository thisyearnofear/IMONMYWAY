import { create } from 'zustand'

// Toasts are owned by UnifiedToast (React context mounted in the root
// layout). Don't add a `toasts` field here — see useAddToast() from
// @/components/unified/UnifiedToast for callers that previously used
// `useUIStore().addToast(...)`.

interface UIState {
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

  setMapFollowing: (following: boolean) => void
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  setOnline: (online: boolean) => void
  setConnected: (connected: boolean) => void
  updateNetworkMetrics: (metrics: Partial<UIState['networkMetrics']>) => void
  setCreatingSession: (loading: boolean) => void
  setLoadingSession: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
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
