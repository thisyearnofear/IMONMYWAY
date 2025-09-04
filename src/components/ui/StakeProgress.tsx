'use client'

import { useEffect, useState } from 'react'
import { CountdownTimer } from './CountdownTimer'

interface StakeProgressProps {
  startTime: number
  deadline: number
  currentLocation: { lat: number; lng: number }
  targetLocation: { lat: number; lng: number }
  estimatedDistance: number
  className?: string
}

export function StakeProgress({
  startTime,
  deadline,
  currentLocation,
  targetLocation,
  estimatedDistance,
  className = ''
}: StakeProgressProps) {
  const [progress, setProgress] = useState(0)
  const [distanceCovered, setDistanceCovered] = useState(0)

  useEffect(() => {
    // Calculate progress based on time and distance
    const totalTime = deadline - startTime
    const elapsedTime = Date.now() - startTime
    const timeProgress = Math.min(elapsedTime / totalTime, 1)

    // Simulate distance progress (in real app, this would be calculated from actual movement)
    const simulatedDistance = timeProgress * estimatedDistance * (0.8 + Math.random() * 0.4)
    setDistanceCovered(simulatedDistance)
    setProgress(Math.min(simulatedDistance / estimatedDistance, 1))
  }, [startTime, deadline, estimatedDistance])

  const getProgressColor = () => {
    const timeLeft = deadline - Date.now()
    const timeProgress = (Date.now() - startTime) / (deadline - startTime)
    
    if (progress >= 0.9) return 'from-green-500 to-emerald-500'
    if (timeLeft < 300000 && progress < 0.7) return 'from-red-500 to-orange-500' // 5 min left, behind
    if (timeProgress > 0.7 && progress < 0.7) return 'from-orange-500 to-yellow-500' // Behind schedule
    return 'from-blue-500 to-purple-500'
  }

  const getStatusMessage = () => {
    const timeLeft = deadline - Date.now()
    const timeProgress = (Date.now() - startTime) / (deadline - startTime)
    
    if (progress >= 1) return '🎉 Destination reached!'
    if (timeLeft <= 0) return '⏰ Time expired'
    if (progress > timeProgress + 0.1) return '🚀 Ahead of schedule'
    if (progress < timeProgress - 0.1) return '⚡ Need to speed up'
    return '🎯 On track'
  }

  return (
    <div className={`bg-white rounded-lg p-6 shadow-md border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
        <CountdownTimer 
          targetTime={deadline}
          urgentThreshold={300}
          className="text-sm"
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Distance Progress</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out relative`}
            style={{ 
              width: `${progress * 100}%`,
              '--progress-width': `${progress * 100}%`
            }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Distance Covered:</span>
          <div className="font-medium text-gray-900">
            {distanceCovered < 1000 
              ? `${Math.round(distanceCovered)}m`
              : `${(distanceCovered / 1000).toFixed(1)}km`
            }
          </div>
        </div>
        <div>
          <span className="text-gray-600">Remaining:</span>
          <div className="font-medium text-gray-900">
            {estimatedDistance - distanceCovered < 1000 
              ? `${Math.round(estimatedDistance - distanceCovered)}m`
              : `${((estimatedDistance - distanceCovered) / 1000).toFixed(1)}km`
            }
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-center animate-fade-in">
          {getStatusMessage()}
        </p>
      </div>
    </div>
  )
}