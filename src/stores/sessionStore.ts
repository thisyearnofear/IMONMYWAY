import { create } from 'zustand'
import type { SharingSession, Destination } from '@/types'

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

interface SessionState {
  sharingSession: StakeSession | null
  isSharing: boolean
  watchedSession: StakeSession | null
  isWatching: boolean
  selectedPace: number

  setSharingSession: (session: StakeSession) => void
  updateSharingSession: (updates: Partial<StakeSession>) => void
  clearSharingSession: () => void
  setWatchedSession: (session: StakeSession) => void
  updateWatchedSession: (updates: Partial<StakeSession>) => void
  clearWatchedSession: () => void
  setDestination: (destination: Destination) => void
  setSelectedPace: (pace: number) => void
  setStakeAmount: (amount: bigint) => void
  setCommitmentId: (id: string) => void
  addBettor: (bettor: Bettor) => void
  setStaked: (staked: boolean) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sharingSession: null,
  isSharing: false,
  watchedSession: null,
  isWatching: false,
  selectedPace: 8,

  setSharingSession: (session) => set({ sharingSession: session, isSharing: true }),

  updateSharingSession: (updates) => set((state) => ({
    sharingSession: state.sharingSession
      ? { ...state.sharingSession, ...updates }
      : null
  })),

  clearSharingSession: () => set({ sharingSession: null, isSharing: false }),

  setWatchedSession: (session) => set({ watchedSession: session, isWatching: true }),

  updateWatchedSession: (updates) => set((state) => ({
    watchedSession: state.watchedSession
      ? { ...state.watchedSession, ...updates }
      : null
  })),

  clearWatchedSession: () => set({ watchedSession: null, isWatching: false }),

  setDestination: (destination) => {
    const { sharingSession } = get()
    if (sharingSession) {
      set((state) => ({
        sharingSession: { ...state.sharingSession!, destination }
      }))
    }
  },

  setSelectedPace: (pace) => set({ selectedPace: pace }),

  setStakeAmount: (amount) => set((state) => ({
    sharingSession: state.sharingSession
      ? { ...state.sharingSession, stakeAmount: amount, isStaked: amount > BigInt(0) }
      : null
  })),

  setCommitmentId: (id) => set((state) => ({
    sharingSession: state.sharingSession
      ? { ...state.sharingSession, commitmentId: id }
      : null
  })),

  addBettor: (bettor) => set((state) => ({
    sharingSession: state.sharingSession
      ? { ...state.sharingSession, bettors: [...state.sharingSession.bettors, bettor] }
      : null
  })),

  setStaked: (staked) => set((state) => ({
    sharingSession: state.sharingSession
      ? { ...state.sharingSession, isStaked: staked }
      : null
  })),
}))
