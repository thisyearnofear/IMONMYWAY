import { create } from 'zustand'

export interface BettingState {
  // Active bets
  activeBets: ActiveBet[]
  
  // Betting UI state
  isPlacingBet: boolean
  selectedBetAmount: string
  isBettingFor: boolean
  
  // Contract interaction state
  isCreatingCommitment: boolean
  isFulfillingCommitment: boolean
  
  // Actions
  addActiveBet: (bet: ActiveBet) => void
  removeActiveBet: (commitmentId: string) => void
  updateActiveBet: (commitmentId: string, updates: Partial<ActiveBet>) => void
  
  setPlacingBet: (placing: boolean) => void
  setSelectedBetAmount: (amount: string) => void
  setIsBettingFor: (bettingFor: boolean) => void
  
  setCreatingCommitment: (creating: boolean) => void
  setFulfillingCommitment: (fulfilling: boolean) => void
  
  clearBettingState: () => void
}

export interface ActiveBet {
  commitmentId: string
  userAddress: string
  targetAddress: string
  stakeAmount: bigint
  betAmount: bigint
  bettingFor: boolean
  deadline: number
  status: 'active' | 'fulfilled' | 'expired'
  startLocation: {
    lat: number
    lng: number
  }
  targetLocation: {
    lat: number
    lng: number
  }
  estimatedDistance: number
  estimatedPace: number
  createdAt: number
}

export const useBettingStore = create<BettingState>((set, get) => ({
  // Initial state
  activeBets: [],
  
  isPlacingBet: false,
  selectedBetAmount: '0.01',
  isBettingFor: true,
  
  isCreatingCommitment: false,
  isFulfillingCommitment: false,
  
  // Actions
  addActiveBet: (bet) => set((state) => ({
    activeBets: [...state.activeBets, bet]
  })),
  
  removeActiveBet: (commitmentId) => set((state) => ({
    activeBets: state.activeBets.filter(bet => bet.commitmentId !== commitmentId)
  })),
  
  updateActiveBet: (commitmentId, updates) => set((state) => ({
    activeBets: state.activeBets.map(bet => 
      bet.commitmentId === commitmentId 
        ? { ...bet, ...updates }
        : bet
    )
  })),
  
  setPlacingBet: (placing) => set({ isPlacingBet: placing }),
  
  setSelectedBetAmount: (amount) => set({ selectedBetAmount: amount }),
  
  setIsBettingFor: (bettingFor) => set({ isBettingFor: bettingFor }),
  
  setCreatingCommitment: (creating) => set({ isCreatingCommitment: creating }),
  
  setFulfillingCommitment: (fulfilling) => set({ isFulfillingCommitment: fulfilling }),
  
  clearBettingState: () => set({
    isPlacingBet: false,
    selectedBetAmount: '0.01',
    isBettingFor: true,
    isCreatingCommitment: false,
    isFulfillingCommitment: false
  })
}))