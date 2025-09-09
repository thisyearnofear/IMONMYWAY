import { useState, useEffect, useCallback } from 'react'
import { useWallet } from './useWallet'
import { cacheService } from '@/lib/cache-service'

interface UserPreferences {
  preferredStakeAmounts: string[]
  frequentDestinations: Array<{
    name: string
    coordinates: [number, number]
    frequency: number
  }>
  averagePace: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  successRate: number
}

interface SmartRecommendation {
  type: 'stake_amount' | 'destination' | 'pace' | 'time_buffer'
  value: any
  confidence: number
  reason: string
}

export function useSmartDefaults() {
  const { address, isConnected } = useWallet()
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredStakeAmounts: ['0.01', '0.05', '0.1'],
    frequentDestinations: [],
    averagePace: 8,
    riskTolerance: 'moderate',
    successRate: 0.75
  })

  // Load user preferences from cache/storage
  useEffect(() => {
    if (isConnected && address) {
      loadUserPreferences()
    }
  }, [isConnected, address])

  const loadUserPreferences = async () => {
    if (!address) return

    try {
      // Try to get from cache first
      const cached = await cacheService.getUserProfile(address)
      if (cached?.preferences) {
        setPreferences(prev => ({ ...prev, ...cached.preferences }))
        return
      }

      // Load from localStorage as fallback
      const stored = localStorage.getItem(`preferences_${address}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    }
  }

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)

    if (address) {
      // Save to localStorage
      localStorage.setItem(`preferences_${address}`, JSON.stringify(newPreferences))
      
      // Update cache
      try {
        await cacheService.invalidateUserProfile(address)
      } catch (error) {
        console.error('Error updating cached preferences:', error)
      }
    }
  }, [preferences, address])

  // Smart stake amount recommendation
  const getRecommendedStakeAmount = useCallback((
    context?: {
      distance?: number
      timeAvailable?: number
      currentBalance?: number
    }
  ): SmartRecommendation => {
    const { distance = 1000, timeAvailable = 30, currentBalance = 1 } = context || {}
    
    // Base recommendation on user's risk tolerance and success rate
    let baseAmount = 0.01
    
    if (preferences.riskTolerance === 'conservative') {
      baseAmount = Math.min(0.02, currentBalance * 0.05) // 5% of balance max
    } else if (preferences.riskTolerance === 'aggressive') {
      baseAmount = Math.min(0.1, currentBalance * 0.15) // 15% of balance max
    } else {
      baseAmount = Math.min(0.05, currentBalance * 0.1) // 10% of balance max
    }

    // Adjust based on success rate
    if (preferences.successRate > 0.8) {
      baseAmount *= 1.2 // Increase for high success rate
    } else if (preferences.successRate < 0.6) {
      baseAmount *= 0.8 // Decrease for low success rate
    }

    // Adjust based on distance and time (difficulty)
    const difficultyFactor = (distance / 1000) / (timeAvailable / 30) // normalized difficulty
    if (difficultyFactor > 1.5) {
      baseAmount *= 0.8 // Reduce for difficult commitments
    } else if (difficultyFactor < 0.7) {
      baseAmount *= 1.1 // Increase for easy commitments
    }

    const confidence = Math.min(95, 60 + (preferences.successRate * 30))
    
    return {
      type: 'stake_amount',
      value: baseAmount.toFixed(3),
      confidence,
      reason: `Based on your ${preferences.riskTolerance} risk profile and ${(preferences.successRate * 100).toFixed(0)}% success rate`
    }
  }, [preferences])

  // Smart destination suggestions
  const getDestinationSuggestions = useCallback((): SmartRecommendation[] => {
    return preferences.frequentDestinations
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map(dest => ({
        type: 'destination',
        value: dest,
        confidence: Math.min(90, 50 + (dest.frequency * 10)),
        reason: `You've been here ${dest.frequency} times before`
      }))
  }, [preferences])

  // Smart pace recommendation
  const getRecommendedPace = useCallback((
    context?: {
      distance?: number
      timeAvailable?: number
      weather?: string
    }
  ): SmartRecommendation => {
    const { distance = 1000, timeAvailable = 30, weather = 'clear' } = context || {}
    
    let recommendedPace = preferences.averagePace
    
    // Adjust for weather
    if (weather === 'rain' || weather === 'snow') {
      recommendedPace += 1 // Slower in bad weather
    } else if (weather === 'hot') {
      recommendedPace += 0.5 // Slightly slower in heat
    }

    // Adjust for distance (longer distances = slightly slower pace)
    if (distance > 2000) {
      recommendedPace += 0.5
    }

    // Ensure the pace allows completion within time limit
    const requiredPace = (distance / 1609) / (timeAvailable / 60) // miles per hour to min/mile
    if (requiredPace < recommendedPace) {
      recommendedPace = Math.max(requiredPace * 0.9, 5) // 10% buffer, minimum 5 min/mile
    }

    return {
      type: 'pace',
      value: Math.round(recommendedPace * 10) / 10,
      confidence: 80,
      reason: `Based on your average pace and current conditions`
    }
  }, [preferences])

  // Smart time buffer recommendation
  const getRecommendedTimeBuffer = useCallback((
    context?: {
      distance?: number
      trafficConditions?: 'light' | 'moderate' | 'heavy'
      timeOfDay?: number
    }
  ): SmartRecommendation => {
    const { distance = 1000, trafficConditions = 'moderate', timeOfDay = 12 } = context || {}
    
    let bufferMinutes = 5 // Base buffer
    
    // Adjust for distance
    bufferMinutes += Math.min(10, distance / 500) // 1 minute per 500m, max 10 minutes
    
    // Adjust for traffic
    if (trafficConditions === 'heavy') {
      bufferMinutes += 10
    } else if (trafficConditions === 'light') {
      bufferMinutes += 2
    } else {
      bufferMinutes += 5
    }
    
    // Adjust for rush hour
    if ((timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19)) {
      bufferMinutes += 5
    }
    
    // Adjust based on user's success rate
    if (preferences.successRate < 0.7) {
      bufferMinutes += 5 // More buffer for users who are often late
    }

    return {
      type: 'time_buffer',
      value: Math.round(bufferMinutes),
      confidence: 75,
      reason: `Accounts for distance, traffic, and your punctuality history`
    }
  }, [preferences])

  // Learn from user behavior
  const recordUserAction = useCallback(async (action: {
    type: 'stake_created' | 'destination_selected' | 'commitment_completed'
    data: any
    success?: boolean
  }) => {
    const { type, data, success } = action

    try {
      switch (type) {
        case 'stake_created':
          // Learn preferred stake amounts
          const newStakeAmounts = [...preferences.preferredStakeAmounts]
          if (!newStakeAmounts.includes(data.amount)) {
            newStakeAmounts.push(data.amount)
            newStakeAmounts.sort((a, b) => parseFloat(a) - parseFloat(b))
            if (newStakeAmounts.length > 5) {
              newStakeAmounts.splice(0, 1) // Keep only 5 most recent
            }
          }
          await updatePreferences({ preferredStakeAmounts: newStakeAmounts })
          break

        case 'destination_selected':
          // Learn frequent destinations
          const destinations = [...preferences.frequentDestinations]
          const existing = destinations.find(d => 
            Math.abs(d.coordinates[0] - data.coordinates[0]) < 0.001 &&
            Math.abs(d.coordinates[1] - data.coordinates[1]) < 0.001
          )
          
          if (existing) {
            existing.frequency += 1
          } else {
            destinations.push({
              name: data.name || 'Unknown Location',
              coordinates: data.coordinates,
              frequency: 1
            })
          }
          
          // Keep only top 10 destinations
          destinations.sort((a, b) => b.frequency - a.frequency)
          if (destinations.length > 10) {
            destinations.splice(10)
          }
          
          await updatePreferences({ frequentDestinations: destinations })
          break

        case 'commitment_completed':
          // Update success rate and average pace
          const totalCommitments = (preferences.successRate * 100) || 1
          const successfulCommitments = success 
            ? (preferences.successRate * totalCommitments) + 1
            : (preferences.successRate * totalCommitments)
          
          const newSuccessRate = successfulCommitments / (totalCommitments + 1)
          
          // Update average pace if provided
          let newAveragePace = preferences.averagePace
          if (data.actualPace) {
            newAveragePace = (preferences.averagePace + data.actualPace) / 2
          }
          
          await updatePreferences({ 
            successRate: newSuccessRate,
            averagePace: newAveragePace
          })
          break
      }
    } catch (error) {
      console.error('Error recording user action:', error)
    }
  }, [preferences, updatePreferences])

  return {
    preferences,
    updatePreferences,
    getRecommendedStakeAmount,
    getDestinationSuggestions,
    getRecommendedPace,
    getRecommendedTimeBuffer,
    recordUserAction
  }
}