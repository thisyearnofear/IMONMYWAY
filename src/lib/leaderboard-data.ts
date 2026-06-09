// Leaderboard Data Service
// Reads on-chain reputation events from PunctualityCore to build rankings

import { ContractService } from '@/services/contractService'

export interface LeaderboardEntry {
  walletAddress: string
  displayName?: string
  reputationScore: number
  totalSessions: number
  successRate: number
  averagePace: number
  totalDistance: number
  rank: number
  tier: 'legendary' | 'expert' | 'skilled' | 'developing' | 'newcomer'
  isCurrentUser?: boolean
}

export interface LeaderboardFilters {
  category: 'overall' | 'reputation' | 'accuracy' | 'activity'
  limit: number
}

function getTier(score: number): LeaderboardEntry['tier'] {
  if (score >= 9000) return 'legendary'
  if (score >= 7000) return 'expert'
  if (score >= 5000) return 'skilled'
  if (score >= 3000) return 'developing'
  return 'newcomer'
}

class LeaderboardDataService {
  async getLeaderboard(
    filters: LeaderboardFilters = { category: 'overall', limit: 50 },
    currentUserAddress?: string
  ): Promise<LeaderboardEntry[]> {
    try {
      const service = new ContractService()
      const users = await service.getLeaderboardUsers()

      if (users.length === 0) return []

      let sorted = [...users]
      switch (filters.category) {
        case 'reputation':
          sorted.sort((a, b) => b.reputation - a.reputation)
          break
        case 'accuracy':
          sorted.sort((a, b) => b.successRate - a.successRate)
          break
        case 'activity':
          sorted.sort((a, b) => b.totalSessions - a.totalSessions)
          break
        default:
          sorted.sort((a, b) => b.reputation - a.reputation)
      }

      return sorted.slice(0, filters.limit).map((user, index) => ({
        walletAddress: user.address,
        reputationScore: user.reputation,
        totalSessions: user.totalSessions,
        successRate: user.successRate,
        averagePace: 0,
        totalDistance: 0,
        rank: index + 1,
        tier: getTier(user.reputation),
        isCurrentUser: currentUserAddress
          ? user.address.toLowerCase() === currentUserAddress.toLowerCase()
          : false,
      }))
    } catch {
      return []
    }
  }

  async getUserRank(walletAddress: string): Promise<{ rank: number; total: number } | null> {
    try {
      const service = new ContractService()
      const users = await service.getLeaderboardUsers()
      if (users.length === 0) return null
      const idx = users.findIndex(u => u.address.toLowerCase() === walletAddress.toLowerCase())
      if (idx === -1) return null
      return { rank: idx + 1, total: users.length }
    } catch {
      return null
    }
  }
}

export const leaderboardData = new LeaderboardDataService()
