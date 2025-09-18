"use client"

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useRealtimeTrigger } from '@/hooks/useRealtime'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { motion } from 'framer-motion'

export function RealtimeDemo() {
  const { address, isConnected } = useWallet()
  const { triggerSessionCompletion, triggerReputationChange, triggerAchievementUnlock, isConnected: isRealtimeConnected } = useRealtimeTrigger()
  const [isTriggering, setIsTriggering] = useState(false)

  if (!isConnected || !address) {
    return null
  }

  const handleTriggerSession = async (success: boolean) => {
    setIsTriggering(true)
    
    try {
      // Simulate session completion
      triggerSessionCompletion({
        walletAddress: address,
        sessionId: `session_${Date.now()}`,
        success,
        pace: success ? 7.5 + Math.random() * 2 : undefined,
        distance: success ? 3 + Math.random() * 5 : undefined,
        duration: success ? 25 + Math.random() * 10 : undefined,
        accuracy: success ? 85 + Math.random() * 15 : undefined
      })

      // Simulate reputation change
      const oldScore = 750 + Math.random() * 2000
      const newScore = success ? oldScore + 50 + Math.random() * 100 : oldScore - 25 - Math.random() * 50
      
      triggerReputationChange({
        walletAddress: address,
        oldScore,
        newScore,
        reason: success ? 'Session completed successfully' : 'Session failed'
      })

      // Occasionally trigger achievement
      if (success && Math.random() > 0.7) {
        const achievements = [
          { id: 'streak_5', title: 'On Fire', icon: '🔥' },
          { id: 'reliable', title: 'Reliable Runner', icon: '⭐' },
          { id: 'speed_demon', title: 'Speed Demon', icon: '⚡' }
        ]
        const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)]
        
        triggerAchievementUnlock({
          walletAddress: address,
          achievement: randomAchievement
        })
      }

    } catch (error) {
      console.error('Error triggering real-time events:', error)
    } finally {
      setTimeout(() => setIsTriggering(false), 1000)
    }
  }

  return (
    <motion.div
      className="fixed bottom-4 right-4 glass-enhanced p-4 rounded-xl border border-purple-400/30 bg-purple-500/10 z-50"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold text-white mb-1">Real-time Demo</h3>
        <div className="flex items-center gap-2 justify-center">
          <div className={`w-2 h-2 rounded-full ${isRealtimeConnected() ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-white/60">
            {isRealtimeConnected() ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <PremiumButton
          variant="primary"
          size="sm"
          onClick={() => handleTriggerSession(true)}
          disabled={isTriggering}
        >
          ✅ Success
        </PremiumButton>
        <PremiumButton
          variant="secondary"
          size="sm"
          onClick={() => handleTriggerSession(false)}
          disabled={isTriggering}
        >
          ❌ Fail
        </PremiumButton>
      </div>
      
      {isTriggering && (
        <div className="mt-2 text-xs text-center text-purple-400">
          Triggering events...
        </div>
      )}
    </motion.div>
  )
}