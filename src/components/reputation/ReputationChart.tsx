"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAIEngine } from '@/hooks/useAIEngine'

interface ReputationChartProps {
  score: number
  totalCommitments: number
  successfulCommitments: number
  userId?: string // For AI predictions
  className?: string
}

export function ReputationChart({ 
  score, 
  totalCommitments, 
  successfulCommitments,
  userId,
  className = ''
}: ReputationChartProps) {
  const percentage = Math.round(score / 100)
  const successRate = totalCommitments > 0 ? Math.round((successfulCommitments / totalCommitments) * 100) : 0
  const { predictReputation, predictAchievements, aiPerformanceMetrics } = useAIEngine()
  const [predictions, setPredictions] = useState<{
    reputation30d: number | null
    reputation90d: number | null
    achievements: any[] | null
  }>({
    reputation30d: null,
    reputation90d: null,
    achievements: null
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load AI predictions when component mounts and userId is provided
  const loadPredictions = useCallback(async () => {
    if (!userId || !predictReputation || !predictAchievements) return
    
    setIsLoading(true)
    try {
      // Load multiple predictions in parallel
      const [prediction30d, prediction90d, achievementPrediction] = await Promise.all([
        predictReputation(userId, 30),
        predictReputation(userId, 90),
        predictAchievements(userId, 30)
      ])
      
      setPredictions({
        reputation30d: prediction30d.predictedScore,
        reputation90d: prediction90d.predictedScore,
        achievements: achievementPrediction.predictedAchievements
      })
    } catch (error) {
      console.error('Error loading reputation predictions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, predictReputation, predictAchievements])

  useEffect(() => {
    if (userId) {
      loadPredictions()
    }
  }, [userId, loadPredictions])

  // Get trend indicator based on predictions
  const getTrendIndicator = () => {
    if (!predictions.reputation30d) return null
    
    const currentPercentage = percentage
    const predictedPercentage = Math.round(predictions.reputation30d / 100)
    const change = predictedPercentage - currentPercentage
    
    if (Math.abs(change) < 2) {
      return { text: 'Stable', color: 'text-gray-500', icon: '➡️' }
    } else if (change > 0) {
      return { text: `+${change}% predicted`, color: 'text-green-500', icon: '↗️' }
    } else {
      return { text: `${change}% predicted`, color: 'text-red-500', icon: '↘️' }
    }
  }

  const trendIndicator = getTrendIndicator()

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Reputation Score</h3>
        {isLoading && (
          <div className="text-sm text-blue-500 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            AI analyzing...
          </div>
        )}
      </div>
      
      {/* AI Confidence Banner */}
      {aiPerformanceMetrics.modelConfidence > 0.7 && (
        <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-700 flex items-center">
            <span className="mr-2">🤖</span>
            <span>AI Confidence: {Math.round(aiPerformanceMetrics.modelConfidence * 100)}%</span>
            <span className="ml-auto">Powered by Somnia AI</span>
          </div>
        </div>
      )}
      
      {/* Main Score */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3">
          <div className="text-4xl font-bold text-gray-900 mb-2">{percentage}%</div>
          {trendIndicator && (
            <div className={`text-lg font-medium ${trendIndicator.color}`}>
              {trendIndicator.icon} {trendIndicator.text}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600">Reliability Score</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Current Reputation</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              percentage >= 90 ? 'bg-green-500' :
              percentage >= 80 ? 'bg-blue-500' :
              percentage >= 70 ? 'bg-yellow-500' :
              percentage >= 60 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Predicted Reputation Bars */}
        {predictions.reputation30d && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                <span className="text-blue-500 mr-2">🔮</span>
                Predicted (30d)
              </span>
              <span className="text-blue-600 font-medium">
                {Math.round(predictions.reputation30d / 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.round(predictions.reputation30d / 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {predictions.reputation90d && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                <span className="text-purple-500 mr-2">🔮</span>
                Predicted (90d)
              </span>
              <span className="text-purple-600 font-medium">
                {Math.round(predictions.reputation90d / 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${Math.round(predictions.reputation90d / 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalCommitments}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{successfulCommitments}</div>
          <div className="text-xs text-gray-600">Success</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
          <div className="text-xs text-gray-600">Rate</div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      {(predictions.reputation30d || predictions.achievements) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <span className="mr-2">🔮</span>
            AI Insights
          </h4>
          
          {/* Reputation Prediction Insight */}
          {predictions.reputation30d && (
            <div className="mb-3">
              <div className="text-sm text-blue-800">
                Based on your current trajectory, your reputation is predicted to 
                {predictions.reputation30d > score ? 'improve' : 'decline'} to{' '}
                <span className="font-bold">{Math.round(predictions.reputation30d / 100)}%</span>
                {' '}in 30 days.
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Confidence: {Math.round(aiPerformanceMetrics.modelConfidence * 100)}%
              </div>
            </div>
          )}
          
          {/* Achievement Prediction Insight */}
          {predictions.achievements && predictions.achievements.length > 0 && (
            <div>
              <div className="text-sm text-purple-800">
                You&apos;re on track to unlock{' '}
                <span className="font-bold">{predictions.achievements[0].achievementId.replace(/_/g, ' ')}</span>
                {' '}within {predictions.achievements[0].timeframe} days.
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {Math.round(predictions.achievements[0].probability * 100)}% probability
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievement Badges */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-medium text-gray-700">Achievements</div>
          {userId && (
            <button 
              onClick={loadPredictions}
              className="text-xs text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              Refresh Predictions
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {successfulCommitments >= 10 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              🎯 Consistent
            </span>
          )}
          {successfulCommitments >= 50 && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
              🏆 Expert
            </span>
          )}
          {percentage >= 95 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              ⭐ Reliable
            </span>
          )}
          {totalCommitments >= 100 && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              🔥 Active
            </span>
          )}
          {/* AI-Predicted Achievements */}
          {predictions.achievements && predictions.achievements.map((achievement, index) => (
            <span 
              key={index} 
              className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200"
              title={`AI predicts ${Math.round(achievement.probability * 100)}% chance in ${achievement.timeframe} days`}
            >
              🔮 {achievement.achievementId.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}