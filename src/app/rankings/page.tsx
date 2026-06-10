"use client"

import { useEffect, useState, useCallback } from 'react'
import dynamicImport from 'next/dynamic'
import { useWallet } from '@/hooks/useWallet'
import { motion } from 'framer-motion'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { leaderboardData, type LeaderboardEntry, type LeaderboardFilters } from '@/lib/leaderboard-data'
import { useLeaderboardRealtime } from '@/hooks/useRealtime'

// Dynamic imports for components that might cause SSR issues
const WebGLParticleSystem = dynamicImport(() => import('@/components/three/ParticleSystem'), {
  ssr: false
})

const ReputationBadge = dynamicImport(() => import('@/components/reputation/ReputationBadge').then(mod => ({ default: mod.ReputationBadge })), {
  ssr: false
})

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LeaderboardPage() {
  const { isConnected, address } = useWallet()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [filters, setFilters] = useState<LeaderboardFilters>({
    category: 'overall',
    limit: 50
  })
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null)
  const [realtimeIndicator, setRealtimeIndicator] = useState<string | null>(null)

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setIsEmpty(false)
      
      const data = await leaderboardData.getLeaderboard(filters, address || undefined)
      setLeaderboard(data)
      
      if (data.length === 0) {
        setIsEmpty(true)
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setError('Failed to load leaderboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, address])

  const loadUserRank = useCallback(async () => {
    if (!address) return
    
    try {
      const rank = await leaderboardData.getUserRank(address)
      setUserRank(rank)
    } catch (err) {
      console.error('Error loading user rank:', err)
    }
  }, [address])

  // Real-time leaderboard updates
  useLeaderboardRealtime((data) => {
    console.log('📊 Real-time leaderboard update received:', data)
    
    // Show real-time indicator
    setRealtimeIndicator(`${data.walletAddress.slice(0, 6)}... ${data.success ? 'completed' : 'failed'} a session`)
    
    // Refresh leaderboard data
    loadLeaderboard()
    
    // Clear indicator after 5 seconds
    setTimeout(() => setRealtimeIndicator(null), 5000)
  }, address || undefined)

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboard()
  }, [filters, loadLeaderboard])

  // Load user rank if connected
  useEffect(() => {
    if (isConnected && address) {
      loadUserRank()
    }
  }, [isConnected, address, loadUserRank])

  const handleFilterChange = (newCategory: LeaderboardFilters['category']) => {
    setFilters(prev => ({ ...prev, category: newCategory }))
  }

  const getTierIcon = (tier: LeaderboardEntry['tier']) => {
    switch (tier) {
      case 'legendary': return '👑'
      case 'expert': return '⭐'
      case 'skilled': return '🎯'
      case 'developing': return '📈'
      case 'newcomer': return '🌱'
      default: return '🏃'
    }
  }

  const getTierColor = (tier: LeaderboardEntry['tier']) => {
    switch (tier) {
      case 'legendary': return 'from-gold-400 to-gold-600'
      case 'expert': return 'from-violet-400 to-violet-600'
      case 'skilled': return 'from-violet-300 to-gold-400'
      case 'developing': return 'from-graphite-300 to-graphite-500'
      case 'newcomer': return 'from-graphite-400 to-graphite-600'
      default: return 'from-graphite-400 to-graphite-600'
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <WebGLParticleSystem count={800} color="#6E2BF2" size={0.015} />
        
        <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            className="p-8 rounded-xl text-center max-w-md section-zone-violet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h1>
            <p className="text-white/70 mb-6">
              Connect your wallet to view the punctuality leaderboard and see how you rank against other users.
            </p>
            <PremiumButton variant="primary" className="w-full">
              Connect Wallet to View Leaderboard
            </PremiumButton>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <WebGLParticleSystem count={800} color="#6E2BF2" size={0.015} />

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-gold via-violet to-gold bg-clip-text text-transparent">
            Punctuality Leaderboard
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Real user rankings based on reputation scores, session success rates, and activity levels.
          </p>
          
          {/* User Rank Display */}
          {userRank && (
            <motion.div
              className="mt-4 p-4 rounded-xl inline-block border border-gold-500/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-white/80">Your Rank: </span>
              <span className="text-gold-500 font-bold font-mono text-xl numeral">#{userRank.rank}</span>
              <span className="text-white/60"> of {userRank.total}</span>
            </motion.div>
          )}

          {/* Real-time Activity Indicator */}
          {realtimeIndicator && (
            <motion.div
              className="mt-4 p-3 rounded-xl inline-block border border-green-400/30"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Live: {realtimeIndicator}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="px-4 py-2 mb-6">
          <div className="divider">
            <div className="line" />
            <div className="dot" />
            <div className="line" />
          </div>
        </div>

        {/* Filters */}
        <motion.div
          className="p-6 rounded-xl mb-8 section-zone"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { key: 'overall', label: '🏆 Overall' },
              { key: 'reputation', label: '⭐ Reputation' },
              { key: 'accuracy', label: '🎯 Accuracy' },
              { key: 'activity', label: '📊 Activity' }
            ].map(({ key, label }) => (
              <PremiumButton
                key={key}
                variant={filters.category === key ? 'primary' : 'glass'}
                size="sm"
                onClick={() => handleFilterChange(key as any)}
              >
                {label}
              </PremiumButton>
            ))}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            className="p-6 rounded-xl mb-8 border border-red-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
              <p className="text-white/70">{error}</p>
              <PremiumButton
                variant="primary"
                className="mt-4"
                onClick={loadLeaderboard}
              >
                Try Again
              </PremiumButton>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && (
          <motion.div
            className="p-6 rounded-xl mb-8 border border-gold-500/20 section-zone-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Users Yet</h3>
              <p className="text-white/70">Complete a punctuality session to appear in rankings.</p>
              <PremiumButton
                variant="primary"
                className="mt-4"
                onClick={() => window.location.href = '/setup'}
              >
                Deploy Your Agent
              </PremiumButton>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl animate-pulse border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {!isLoading && !error && leaderboard.length > 0 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.walletAddress}
                className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] border border-white/5 hover:border-gold-500/20 ${
                  entry.isCurrentUser ? 'ring-2 ring-gold-500/40 border-gold-500/30' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  {/* Rank and User Info */}
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getTierColor(entry.tier)} flex items-center justify-center font-bold font-mono text-white text-xl numeral`}>
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {entry.displayName || formatAddress(entry.walletAddress)}
                        </span>
                        <span className="text-lg">{getTierIcon(entry.tier)}</span>
                        {entry.isCurrentUser && (
                          <span className="px-2 py-1 bg-gold-500/20 text-gold-500 text-xs rounded-full border border-gold-500/30">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <ReputationBadge score={entry.reputationScore} size="sm" />
                        <span>{entry.totalSessions} sessions</span>
                        <span>{entry.successRate.toFixed(1)}% success</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    {entry.averagePace > 0 && (
                      <div className="text-white font-semibold">
                        {entry.averagePace.toFixed(1)} min/km
                      </div>
                    )}
                    {entry.totalDistance > 0 && (
                      <div className="text-green-400 text-sm">
                        {entry.totalDistance.toFixed(1)} km total
                      </div>
                    )}
                    <div className="text-white/60 text-sm capitalize">
                      {entry.tier} tier
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}