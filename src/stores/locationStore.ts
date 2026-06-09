import { create } from 'zustand'
import type { LocationData } from '@/types'

interface LocationState {
  currentLocation: LocationData | null
  locationAccuracy: number | null
  isTracking: boolean

  setCurrentLocation: (location: LocationData) => void
  setLocationAccuracy: (accuracy: number) => void
  startTracking: () => void
  stopTracking: () => void
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  locationAccuracy: null,
  isTracking: false,

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setLocationAccuracy: (accuracy) => set({ locationAccuracy: accuracy }),
  startTracking: () => set({ isTracking: true }),
  stopTracking: () => set({ isTracking: false }),
}))

// Re-export split stores for backwards compatibility
export { useWalletStore } from './walletStore'
export { useSessionStore } from './sessionStore'
export type { StakeSession, Bettor } from './sessionStore'
