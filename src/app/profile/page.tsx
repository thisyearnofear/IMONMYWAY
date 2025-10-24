"use client"

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { motion } from 'framer-motion'
import WebGLParticleSystem from '@/components/three/ParticleSystem'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { ReputationBadge } from '@/components/reputation/ReputationBadge'
import { PerformanceDashboard } from '@/components/ai/PerformanceDashboard'
import { profileData, type UserProfile } from '@/lib/profile-data'
import { useProfileRealtime, useReputationRealtime } from '@/hooks/useRealtime'

export default function ProfilePage() {
  const { isConnected, address } = useWallet()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeUpdate, setRealtimeUpdate] = useState<string | null>(null)
  const [reputationChange, setReputationChange] = useState<{
    oldScore: number
    newScore: number
    reason: string
  } | null>(null)

  const loadProfile = useCallback(async () => {
    if (!address) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const userProfile = await profileData.getUserProfile(address)
      
      if (!userProfile) {
        setError('Profile not found. Complete your first session to create a profile.')
      } else {
        setProfile(userProfile)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Real-time profile updates
  useProfileRealtime(address ?? undefined, (data) => {
    console.log('👤 Real-time profile update received:', data)
    
    // Show real-time update indicator
    const updateText = data.sessionData.success 
      ? `Session completed successfully! ${data.sessionData.pace ? `${data.sessionData.pace.toFixed(1)} min/mi` : ''}`
      : 'Session failed - better luck next time!'
    
    setRealtimeUpdate(updateText)
    
    // Refresh profile data
    loadProfile()
    
    // Clear indicator after 5 seconds
    setTimeout(() => setRealtimeUpdate(null), 5000)
  })

  // Real-time reputation changes
  useReputationRealtime(address ?? undefined, (data) => {
    console.log('⭐ Real-time reputation change received:', data)
    
    // Show reputation change notification
    setReputationChange(data)
    
    // Refresh profile data
    loadProfile()
    
    // Clear notification after 8 seconds
    setTimeout(() => setReputationChange(null), 8000)
  })

  // Load profile data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadProfile()
    }
  }, [isConnected, address, loadProfile])

  const getTierIcon = (tier: UserProfile['tier']) => {
    const icons = {
      legendary: '👑',
      expert: '⭐',
      skilled: '🎯',
      developing: '📈',
      newcomer: '🌱'
    }
    return icons[tier] || '🏃'
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <WebGLParticleSystem count={800} color="#60a5fa" size={0.015} />
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
        
        <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            className="glass-enhanced p-8 rounded-xl text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h1>
            <p className="text-white/70 mb-6">
              Connect your wallet to view your punctuality profile, session history, and reputation score.
            </p>
            <PremiumButton variant="primary" className="w-full">
              Connect Wallet to View Profile
            </PremiumButton>
          </motion.div>
        </main>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <WebGLParticleSystem count={800} color="#60a5fa" size={0.015} />
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
        
        <main className="relative z-10 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="glass-enhanced p-8 rounded-xl animate-pulse">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-white/10 rounded mb-2 w-1/3"></div>
                  <div className="h-4 bg-white/5 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-enhanced p-6 rounded-xl animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-8 bg-white/5 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen relative">
        <WebGLParticleSystem count={800} color="#60a5fa" size={0.015} />
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />
        
        <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            className="glass-enhanced p-8 rounded-xl text-center max-w-md border border-red-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-white/70 mb-6">{error}</p>
            <div className="space-y-3">
              <PremiumButton variant="primary" className="w-full" onClick={loadProfile}>
                Try Again
              </PremiumButton>
              <PremiumButton variant="secondary" className="w-full">
                Start Your First Session
              </PremiumButton>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Profile dashboard
  return (
    <div className="min-h-screen relative">
      <WebGLParticleSystem count={800} color="#60a5fa" size={0.015} />
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/50 via-purple-950/30 to-pink-950/15" />

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Real-time Notifications */}
        {realtimeUpdate && (
          <motion.div
            className="glass-enhanced p-4 rounded-xl mb-6 border border-blue-400/30 bg-blue-500/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium">Live Update: {realtimeUpdate}</span>
            </div>
          </motion.div>
        )}

        {reputationChange && (
          <motion.div
            className={`glass-enhanced p-4 rounded-xl mb-6 border ${
              reputationChange.newScore > reputationChange.oldScore 
                ? 'border-green-400/30 bg-green-500/10' 
                : 'border-red-400/30 bg-red-500/10'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {reputationChange.newScore > reputationChange.oldScore ? '⭐' : '📉'}
              </span>
              <div>
                <div className={`font-semibold ${
                  reputationChange.newScore > reputationChange.oldScore ? 'text-green-400' : 'text-red-400'
                }`}>
                  Reputation {reputationChange.newScore > reputationChange.oldScore ? 'Increased' : 'Decreased'}!
                </div>
                <div className="text-sm text-white/70">
                  {reputationChange.oldScore} → {reputationChange.newScore} ({reputationChange.reason})
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Header */}
        <motion.div
          className="glass-enhanced p-8 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-3xl">
              {getTierIcon(profile?.tier || 'newcomer')}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {profile?.displayName || formatAddress(address || '')}
              </h1>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <ReputationBadge score={profile?.reputationScore || 750} size="sm" />
                <span className="text-white/70">
                  {profile?.totalSessions || 0} sessions completed
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">🏃‍♂️ Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Success Rate</span>
                <span className="text-green-400 font-semibold">
                  {profile?.successRate.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Average Pace</span>
                <span className="text-white font-semibold">
                  {profile?.averagePace ? `${profile.averagePace.toFixed(1)} min/mi` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Total Distance</span>
                <span className="text-white font-semibold">
                  {profile?.totalDistance ? `${profile.totalDistance.toFixed(1)} mi` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">🏆 Achievements</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {profile?.achievements.length || 0}
              </div>
              <div className="text-white/70">Badges Earned</div>
              {profile?.achievements && profile.achievements.length > 0 && (
                <div className="mt-3 flex justify-center gap-1">
                  {profile.achievements.slice(0, 3).map((achievement) => (
                    <span key={achievement.id} className="text-lg">
                      {achievement.icon}
                    </span>
                  ))}
                  {profile.achievements.length > 3 && (
                    <span className="text-white/60">+{profile.achievements.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="glass-enhanced p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">🔥 Streaks</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Current</span>
                <span className="text-orange-400 font-semibold">
                  {profile?.currentStreak || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Best</span>
                <span className="text-yellow-400 font-semibold">
                  {profile?.longestStreak || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Betting Success</span>
                <span className="text-purple-400 font-semibold">
                  {profile?.bettingSuccessRate.toFixed(1) || '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Enhanced Performance Dashboard */}
        {profile && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PerformanceDashboard />
          </motion.div>
        )}

        {/* Recent Sessions */}
        {profile?.recentSessions && profile.recentSessions.length > 0 && (
          <motion.div
            className="glass-enhanced p-6 rounded-xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">📈 Recent Sessions</h3>
            <div className="space-y-3">
              {profile.recentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 glass-modern rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${session.success ? 'text-green-400' : 'text-red-400'}`}>
                      {session.success ? '✅' : '❌'}
                    </span>
                    <div>
                      <div className="text-white font-medium">
                        {formatDate(session.date)}
                      </div>
                      <div className="text-xs text-white/60">
                        {session.pace && `${session.pace.toFixed(1)} min/mi`}
                        {session.distance && ` • ${session.distance.toFixed(1)} mi`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${session.success ? 'text-green-400' : 'text-red-400'}`}>
                      {session.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Data State */}
        {(!profile || profile.totalSessions === 0) && (
          <motion.div
            className="glass-enhanced p-8 rounded-xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🏃‍♂️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Start Your Journey</h2>
            <p className="text-white/70 mb-6">
              Complete your first punctuality session to unlock your profile dashboard with detailed analytics.
            </p>
            <PremiumButton variant="primary">
              Create Your First Session
            </PremiumButton>
          </motion.div>
        )}
      </main>
    </div>
  )
}