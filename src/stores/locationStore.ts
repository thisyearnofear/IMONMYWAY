import { create } from 'zustand'
import type { LocationData, SharingSession, Destination } from '@/types'

interface LocationState {
  // Current user location
  currentLocation: LocationData | null
  locationAccuracy: number | null
  isTracking: boolean
  
  // Sharing session
  sharingSession: SharingSession | null
  isSharing: boolean
  
  // Watched session (when viewing someone else)
  watchedSession: SharingSession | null
  isWatching: boolean
  
  // Speed/Pace state
  selectedPace: number
  
  // Actions
  setCurrentLocation: (location: LocationData) => void
  setLocationAccuracy: (accuracy: number) => void
  startTracking: () => void
  stopTracking: () => void
  setSelectedPace: (pace: number) => void
  
  setSharingSession: (session: SharingSession) => void
  updateSharingSession: (updates: Partial<SharingSession>) => void
  clearSharingSession: () => void
  
  setWatchedSession: (session: SharingSession) => void
  updateWatchedSession: (updates: Partial<SharingSession>) => void
  clearWatchedSession: () => void
  
  setDestination: (destination: Destination) => void
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Initial state
  currentLocation: null,
  locationAccuracy: null,
  isTracking: false,
  selectedPace: 8, // Default running pace
  
  sharingSession: null,
  isSharing: false,
  
  watchedSession: null,
  isWatching: false,
  
  // Actions
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  setLocationAccuracy: (accuracy) => set({ locationAccuracy: accuracy }),
  
  startTracking: () => set({ isTracking: true }),
  
  stopTracking: () => set({ isTracking: false }),
  
  setSharingSession: (session) => set({ 
    sharingSession: session, 
    isSharing: true 
  }),
  
  updateSharingSession: (updates) => set((state) => ({
    sharingSession: state.sharingSession 
      ? { ...state.sharingSession, ...updates }
      : null
  })),
  
  clearSharingSession: () => set({ 
    sharingSession: null, 
    isSharing: false 
  }),
  
  setWatchedSession: (session) => set({ 
    watchedSession: session, 
    isWatching: true 
  }),
  
  updateWatchedSession: (updates) => set((state) => ({
    watchedSession: state.watchedSession 
      ? { ...state.watchedSession, ...updates }
      : null
  })),
  
  clearWatchedSession: () => set({ 
    watchedSession: null, 
    isWatching: false 
  }),
  
  setDestination: (destination) => {
    const { sharingSession } = get()
    if (sharingSession) {
      set((state) => ({
        sharingSession: {
          ...state.sharingSession!,
          destination
        }
      }))
    }
  },

  setSelectedPace: (pace) => set({ selectedPace: pace })
}))