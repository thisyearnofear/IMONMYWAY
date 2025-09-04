import { create } from 'zustand'
import type { LocationData, SharingSession, Destination } from '@/types'

// Enhanced types for Web3 integration
export interface StakeSession extends SharingSession {
  stakeAmount: bigint
  commitmentId: string | null
  contractAddress: string | null
  bettors: Bettor[]
  reputationScore: number
  isStaked: boolean
}

export interface Bettor {
  address: string
  amount: bigint
  bettingFor: boolean
  timestamp: number
}

interface LocationState {
  // Current user location
  currentLocation: LocationData | null
  locationAccuracy: number | null
  isTracking: boolean
  
  // Enhanced sharing session with staking
  sharingSession: StakeSession | null
  isSharing: boolean
  
  // Watched session (when viewing someone else)
  watchedSession: StakeSession | null
  isWatching: boolean
  
  // Speed/Pace state
  selectedPace: number
  
  // Web3 wallet state
  walletAddress: string | null
  isWalletConnected: boolean
  userReputationScore: number
  
  // Actions
  setCurrentLocation: (location: LocationData) => void
  setLocationAccuracy: (accuracy: number) => void
  startTracking: () => void
  stopTracking: () => void
  setSelectedPace: (pace: number) => void
  
  // Enhanced session management with staking
  setSharingSession: (session: StakeSession) => void
  updateSharingSession: (updates: Partial<StakeSession>) => void
  clearSharingSession: () => void
  
  setWatchedSession: (session: StakeSession) => void
  updateWatchedSession: (updates: Partial<StakeSession>) => void
  clearWatchedSession: () => void
  
  setDestination: (destination: Destination) => void
  
  // Web3 actions
  setWalletAddress: (address: string | null) => void
  setWalletConnected: (connected: boolean) => void
  setUserReputationScore: (score: number) => void
  
  // Staking actions
  setStakeAmount: (amount: bigint) => void
  setCommitmentId: (id: string) => void
  addBettor: (bettor: Bettor) => void
  setStaked: (staked: boolean) => void
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Initial state
  currentLocation: null,
  locationAccuracy: null,
  isTracking: false,
  selectedPace: 8, // Default running pace
  
  // Enhanced session state
  sharingSession: null,
  isSharing: false,
  
  watchedSession: null,
  isWatching: false,
  
  // Web3 state
  walletAddress: null,
  isWalletConnected: false,
  userReputationScore: 7500, // 75% initial reputation
  
  // Actions
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  setLocationAccuracy: (accuracy) => set({ locationAccuracy: accuracy }),
  
  startTracking: () => set({ isTracking: true }),
  
  stopTracking: () => set({ isTracking: false }),
  
  // Enhanced session management
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
  
  // Web3 actions
  setWalletAddress: (address) => set({ walletAddress: address }),
  
  setWalletConnected: (connected) => set({ isWalletConnected: connected }),
  
  setUserReputationScore: (score) => set({ userReputationScore: score }),
  
  // Staking actions
  setStakeAmount: (amount) => set((state) => ({
    sharingSession: state.sharingSession 
      ? { ...state.sharingSession, stakeAmount: amount, isStaked: amount > 0n }
      : null
  })),
  
  setCommitmentId: (id) => set((state) => ({
    sharingSession: state.sharingSession 
      ? { ...state.sharingSession, commitmentId: id }
      : null
  })),
  
  addBettor: (bettor) => set((state) => ({
    sharingSession: state.sharingSession 
      ? { 
          ...state.sharingSession, 
          bettors: [...state.sharingSession.bettors, bettor]
        }
      : null
  })),
  
  setStaked: (staked) => set((state) => ({
    sharingSession: state.sharingSession 
      ? { ...state.sharingSession, isStaked: staked }
      : null
  })),
  
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