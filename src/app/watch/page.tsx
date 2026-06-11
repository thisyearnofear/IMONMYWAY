"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import { getReadOnlyContractService, type AgentListingData } from '@/services/contractService'
import { getNetworkConfig } from '@/contracts/addresses'

export default function WatchPage() {
  const [listings, setListings] = useState<AgentListingData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  const loadListings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const service = getReadOnlyContractService()
      const data = await service.getRecentListings(20)
      setListings(data)
    } catch (err) {
      console.error('Failed to load listings:', err)
      setError('Could not connect to the registry contract')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Mount-time fetch: setState in effects is the documented way to trigger
    // an async load. The rule over-fires here because the actual setState
    // happens after `await`, so we suppress for the synchronous preamble.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    setError(null)
    ;(async () => {
      try {
        const service = getReadOnlyContractService()
        const raw = await service.getRecentListings(20)
        // Defer ethers import to the load path so the initial bundle
        // for /watch stays small; formatEther is the only ethers call here.
        const { formatEther } = await import('ethers')
        const data = raw.map((l) => ({ ...l, stakeAmountFormatted: formatEther(l.stakeAmount) }))
        setListings(data)
      } catch (err) {
        console.error('Failed to load listings:', err)
        setError('Could not connect to the registry contract')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  // Tick the wall-clock every second so expiry / time-remaining stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const networkConfig = getNetworkConfig()

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const getTimeRemaining = (deadline: number) => {
    const remaining = deadline - now
    if (remaining <= 0) return 'Expired'
    const hours = Math.floor(remaining / 3600)
    const mins = Math.floor((remaining % 3600) / 60)
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          className="py-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gold via-violet to-gold bg-clip-text text-transparent">
            Live Agent Commitments
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            Watch autonomous agents manage punctuality commitments on {networkConfig.name}
          </p>
        </motion.div>

        {/* Divider */}
        <div className="px-4 py-2 mb-6">
          <div className="divider">
            <div className="line" />
            <div className="dot" />
            <div className="line" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <motion.div
            className="p-6 rounded-xl border border-red-500/30 bg-red-500/5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <PremiumButton variant="secondary" size="sm" onClick={loadListings}>
              Retry
            </PremiumButton>
          </motion.div>
        ) : listings.length === 0 ? (
          <motion.div
            className="p-8 rounded-xl text-center max-w-md mx-auto section-zone-violet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">👁️</div>
            <h2 className="text-xl font-bold text-white mb-2">No Active Listings</h2>
            <p className="text-white/60 text-sm mb-6">
              Agent commitments will appear here when agents create and list commitments on the registry. Deploy your agent to get started.
            </p>
            <div className="space-y-3">
              <Link href="/setup">
                <PremiumButton variant="primary" className="w-full">
                  Deploy Your Agent
                </PremiumButton>
              </Link>
              <Link href="/rankings">
                <PremiumButton variant="secondary" className="w-full">
                  View Rankings
                </PremiumButton>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-white/60">{listings.length} active listings</span>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={loadListings}
              >
                Refresh
              </PremiumButton>
            </div>
            <AnimatePresence>
              {listings.map((listing, index) => {
                const isActive = listing.deadline > now
                return (
                  <motion.div
                    key={listing.commitmentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-xl border transition-all hover:scale-[1.01] ${
                      isActive
                        ? 'border-gold-500/20 hover:border-gold-500/40'
                        : 'border-white/5 opacity-60'
                    }`}
                  >
                    <Link href={`/commitment/${listing.commitmentId}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-sm font-bold text-white">
                              {formatAddress(listing.principal)}
                            </span>
                            <span className="text-[10px] font-mono text-white/50">
                              principal
                            </span>
                          </div>
                          {listing.context && (
                            <p className="text-xs text-white/70 mb-2 max-w-sm truncate">
                              {listing.context}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <span>
                              {listing.stakeAmountFormatted} {networkConfig.nativeCurrency.symbol}
                            </span>
                            <span>
                              Agent: {formatAddress(listing.agentContract)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-mono px-2 py-1 rounded ${
                            isActive
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {isActive ? getTimeRemaining(listing.deadline) : 'Expired'}
                          </span>
                          <div className="text-[10px] font-mono text-white/50 mt-1">
                            {listing.commitmentId.slice(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
