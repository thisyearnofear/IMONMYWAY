import { create } from 'zustand'

interface WalletState {
  walletAddress: string | null
  isWalletConnected: boolean
  userReputationScore: number
  currentStreak: number
  bestStreak: number
  totalCompletions: number

  setWalletAddress: (address: string | null) => void
  setWalletConnected: (connected: boolean) => void
  setUserReputationScore: (score: number) => void
  recordCompletion: (success: boolean) => void
  setStreakData: (current: number, best: number, total: number) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  walletAddress: null,
  isWalletConnected: false,
  userReputationScore: 7500,
  currentStreak: 0,
  bestStreak: 0,
  totalCompletions: 0,

  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletConnected: (connected) => set({ isWalletConnected: connected }),
  setUserReputationScore: (score) => set({ userReputationScore: score }),

  recordCompletion: (success) => set((state) => {
    if (success) {
      const newStreak = state.currentStreak + 1;
      return {
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, state.bestStreak),
        totalCompletions: state.totalCompletions + 1,
      };
    }
    return { currentStreak: 0 };
  }),

  setStreakData: (current, best, total) => set({
    currentStreak: current,
    bestStreak: best,
    totalCompletions: total,
  }),
}))
