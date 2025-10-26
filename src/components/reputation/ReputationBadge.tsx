"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAIEngine } from '@/hooks/useAIEngine'

interface ReputationBadgeProps {
  score: number // 0-10000 (0-100%)
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  userId?: string // For AI predictions
  showPrediction?: boolean // Whether to show AI prediction
  predictionTimeframe?: number // Days for prediction (default: 30)
}

export function ReputationBadge({ 
  score, 
  size = 'md', 
  showLabel = true,
  userId,
  showPrediction = false,
  predictionTimeframe = 30
}: ReputationBadgeProps) {
  const percentage = Math.round(score / 100)
  const { predictReputation, aiPerformanceMetrics } = useAIEngine()
  const [predictedScore, setPredictedScore] = useState<number | null>(null)
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false)

  // Load AI prediction when component mounts and userId is provided
  const loadPrediction = useCallback(async () => {
    if (!userId) return
    
    setIsLoadingPrediction(true)
    try {
      const prediction = await predictReputation(userId, predictionTimeframe)
      setPredictedScore(prediction.predictedScore)
    } catch (error) {
      console.error('Error loading reputation prediction:', error)
    } finally {
      setIsLoadingPrediction(false)
    }
  }, [userId, predictionTimeframe, predictReputation])

  useEffect(() => {
    if (showPrediction && userId) {
      loadPrediction()
    }
  }, [showPrediction, userId, predictionTimeframe, loadPrediction])

  const getColor = (score: number) => {
    if (score >= 9000) return 'text-green-600 bg-green-100'
    if (score >= 8000) return 'text-blue-600 bg-blue-100'
    if (score >= 7000) return 'text-yellow-600 bg-yellow-100'
    if (score >= 6000) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getIcon = (score: number) => {
    if (score >= 9000) return '⭐'
    if (score >= 8000) return '🎯'
    if (score >= 7000) return '👍'
    if (score >= 6000) return '⚠️'
    return '❌'
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-4 py-2 text-base'
      default:
        return 'px-3 py-1 text-sm'
    }
  }

  const colorClasses = getColor(score)
  const sizeClasses = getSizeClasses(size)
  const icon = getIcon(score)

  // Get prediction indicator
  const getPredictionIndicator = () => {
    if (!showPrediction || !predictedScore) return null
    
    const currentPercentage = percentage
    const predictedPercentage = Math.round(predictedScore / 100)
    const change = predictedPercentage - currentPercentage
    
    if (Math.abs(change) < 2) {
      return { icon: '➡️', color: 'text-gray-500', trend: 'stable' }
    } else if (change > 0) {
      return { icon: '↗️', color: 'text-green-500', trend: 'improving' }
    } else {
      return { icon: '↘️', color: 'text-red-500', trend: 'declining' }
    }
  }

  const predictionIndicator = getPredictionIndicator()

  return (
    <div className="inline-flex items-center space-x-1">
      {/* Current Reputation Badge */}
      <div className={`inline-flex items-center space-x-1 rounded-full font-medium ${colorClasses} ${sizeClasses}`}>
        <span>{icon}</span>
        <span>{percentage}%</span>
        {showLabel && size !== 'sm' && (
          <span className="text-xs opacity-75">reliability</span>
        )}
      </div>
      
      {/* AI Prediction Indicator */}
      {showPrediction && predictionIndicator && (
        <div className={`flex items-center ${predictionIndicator.color} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          <span className="mx-1">•</span>
          <span title={`AI predicts ${Math.round(predictedScore! / 100)}% in ${predictionTimeframe} days (${predictionIndicator.trend})`}>
            {predictionIndicator.icon}
          </span>
          {isLoadingPrediction && (
            <span className="ml-1 animate-pulse">...</span>
          )}
        </div>
      )}
      
      {/* AI Confidence Indicator */}
      {showPrediction && aiPerformanceMetrics.modelConfidence > 0.8 && (
        <div className="text-blue-500" title={`AI Confidence: ${Math.round(aiPerformanceMetrics.modelConfidence * 100)}%`}>
          <span className="text-xs">🤖</span>
        </div>
      )}
    </div>
  )
}