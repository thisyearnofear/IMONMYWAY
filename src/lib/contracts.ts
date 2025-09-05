// Simple contract utilities for the Punctuality Protocol
// Since real blockchain integration is already complete, this provides basic utilities

export function getContract(chainId: number) {
  // Return a mock contract object for now
  // In production, this would return the actual ethers.js contract instance
  return {
    calculateDistance: async (lat1: number, lng1: number, lat2: number, lng2: number) => {
      // Haversine distance calculation (simplified)
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return Math.round(R * c * 1000) // Return meters
    },

    createCommitment: async (startLocation: any, targetLocation: any, deadline: number, pace: number, stakeAmount: string) => {
      // Mock commitment creation - in real implementation this would interact with blockchain
      return `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },

    placeBet: async (commitmentId: string, betAmount: string, bettingFor: boolean) => {
      // Mock bet placement
      return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },

    fulfillCommitment: async (commitmentId: string, arrivalLocation: any) => {
      // Mock commitment fulfillment
      return {
        success: Math.random() > 0.3, // 70% success rate for demo
        reward: Math.random() > 0.5 ? '0.1' : undefined
      }
    },

    getCommitment: async (commitmentId: string) => {
      // Mock commitment retrieval
      return {
        id: commitmentId,
        status: 'active',
        stakeAmount: '1.0'
      }
    },

    getUserReputation: async (userAddress: string) => {
      // Mock reputation score
      return Math.floor(Math.random() * 5000) + 2500 // 2500-7500 range
    }
  }
}

export function estimateGasCost(operation: string, params: any) {
  // Mock gas estimation
  const baseCosts = {
    createCommitment: 150000,
    placeBet: 100000,
    fulfillCommitment: 120000
  }

  return baseCosts[operation as keyof typeof baseCosts] || 50000
}