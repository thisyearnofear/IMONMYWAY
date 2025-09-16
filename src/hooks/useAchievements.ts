import { useState, useEffect, useCallback } from 'react'
import { useHapticFeedback } from './useHapticFeedback'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  progress?: number
  maxProgress?: number
}

export interface StreakData {
  current: number
  longest: number
  lastActivity: number
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_commitment',
      title: 'First Steps',
      description: 'Created your first punctuality commitment',
      icon: '🎯',
      unlocked: false
    },
    {
      id: 'first_bet',
      title: 'Social Gambler',
      description: 'Placed your first bet on someone else',
      icon: '🎲',
      unlocked: false
    },
    {
      id: 'streak_3',
      title: 'Consistent',
      description: 'Maintained a 3-day commitment streak',
      icon: '🔥',
      unlocked: false,
      progress: 0,
      maxProgress: 3
    },
    {
      id: 'streak_7',
      title: 'Dedicated',
      description: 'Maintained a 7-day commitment streak',
      icon: '⚡',
      unlocked: false,
      progress: 0,
      maxProgress: 7
    },
    {
      id: 'high_roller',
      title: 'High Roller',
      description: 'Placed a bet worth 1 STT or more',
      icon: '💰',
      unlocked: false
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Had 5 different people bet on your commitments',
      icon: '🦋',
      unlocked: false,
      progress: 0,
      maxProgress: 5
    },
    // Surprise achievements - unlocked automatically based on behavior
    {
      id: 'midnight_runner',
      title: 'Night Owl Runner',
      description: 'Created a commitment between midnight and 4 AM',
      icon: '🦉',
      unlocked: false
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Set a target pace under 5 minutes per mile',
      icon: '⚡',
      unlocked: false
    },
    {
      id: 'perfect_week',
      title: 'Perfect Week',
      description: 'Completed all commitments for 7 consecutive days',
      icon: '👑',
      unlocked: false
    },
    {
      id: 'social_connector',
      title: 'Social Connector',
      description: 'Had 10 different people interact with your commitments',
      icon: '🤝',
      unlocked: false,
      progress: 0,
      maxProgress: 10
    }
  ])

  const [streak, setStreak] = useState<StreakData>({
    current: 0,
    longest: 0,
    lastActivity: 0
  })

  const [showCelebration, setShowCelebration] = useState<Achievement | null>(null)
  const { success, medium } = useHapticFeedback()

  // Load achievements from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('punctuality_achievements')
    if (saved) {
      setAchievements(JSON.parse(saved))
    }

    const savedStreak = localStorage.getItem('punctuality_streak')
    if (savedStreak) {
      setStreak(JSON.parse(savedStreak))
    }
  }, [])

  // Save achievements to localStorage
  useEffect(() => {
    localStorage.setItem('punctuality_achievements', JSON.stringify(achievements))
  }, [achievements])

  useEffect(() => {
    localStorage.setItem('punctuality_streak', JSON.stringify(streak))
  }, [streak])

  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === achievementId && !achievement.unlocked) {
        const unlockedAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: Date.now()
        }
        setShowCelebration(unlockedAchievement)
        success() // Haptic feedback
        return unlockedAchievement
      }
      return achievement
    }))
  }, [success])

  const updateProgress = useCallback((achievementId: string, progress: number) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === achievementId) {
        const updated = { ...achievement, progress }
        if (progress >= (achievement.maxProgress || 0) && !achievement.unlocked) {
          unlockAchievement(achievementId)
        }
        return updated
      }
      return achievement
    }))
  }, [unlockAchievement])

  const updateStreak = useCallback((activityDate: number = Date.now()) => {
    const today = new Date(activityDate).toDateString()
    const lastActivity = new Date(streak.lastActivity).toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

    let newStreak = { ...streak }

    if (today === lastActivity) {
      // Already updated today, no change
      return
    } else if (lastActivity === yesterday) {
      // Consecutive day
      newStreak.current += 1
      newStreak.longest = Math.max(newStreak.longest, newStreak.current)
    } else {
      // Streak broken or first activity
      newStreak.current = 1
    }

    newStreak.lastActivity = activityDate
    setStreak(newStreak)

    // Check streak achievements
    if (newStreak.current >= 3) {
      updateProgress('streak_3', Math.min(newStreak.current, 3))
    }
    if (newStreak.current >= 7) {
      updateProgress('streak_7', Math.min(newStreak.current, 7))
    }
  }, [streak, updateProgress])

  const celebrateAchievement = useCallback((achievement: Achievement) => {
    setShowCelebration(achievement)
    medium() // Haptic feedback
  }, [medium])

  const dismissCelebration = useCallback(() => {
    setShowCelebration(null)
  }, [])

  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter(a => a.unlocked)
  }, [achievements])

  const getProgressAchievements = useCallback(() => {
    return achievements.filter(a => !a.unlocked && a.progress !== undefined)
  }, [achievements])

  // Surprise achievement checkers - enhance existing system
  const checkSurpriseAchievements = useCallback((context: {
    hour?: number;
    pace?: number;
    perfectDays?: number;
    socialInteractions?: number;
  }) => {
    const { hour, pace, perfectDays, socialInteractions } = context;

    // Night Owl Runner - commitment between midnight and 4 AM
    if (hour !== undefined && hour >= 0 && hour <= 4 && !achievements.find(a => a.id === 'midnight_runner')?.unlocked) {
      unlockAchievement('midnight_runner');
    }

    // Speed Demon - pace under 5 min/mile
    if (pace !== undefined && pace < 5 && !achievements.find(a => a.id === 'speed_demon')?.unlocked) {
      unlockAchievement('speed_demon');
    }

    // Perfect Week - 7 consecutive perfect days
    if (perfectDays !== undefined && perfectDays >= 7 && !achievements.find(a => a.id === 'perfect_week')?.unlocked) {
      unlockAchievement('perfect_week');
    }

    // Social Connector - 10 different people interacted
    if (socialInteractions !== undefined) {
      updateProgress('social_connector', Math.min(socialInteractions, 10));
    }
  }, [achievements, unlockAchievement, updateProgress]);

  return {
    achievements,
    streak,
    showCelebration,
    unlockAchievement,
    updateProgress,
    updateStreak,
    celebrateAchievement,
    dismissCelebration,
    getUnlockedAchievements,
    getProgressAchievements,
    checkSurpriseAchievements
  }
}