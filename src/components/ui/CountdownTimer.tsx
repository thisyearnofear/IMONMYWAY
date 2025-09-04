'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetTime: number // timestamp
  onComplete?: () => void
  className?: string
  showMilliseconds?: boolean
  urgentThreshold?: number // seconds when it becomes urgent
}

export function CountdownTimer({ 
  targetTime, 
  onComplete, 
  className = '',
  showMilliseconds = false,
  urgentThreshold = 300 // 5 minutes
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, targetTime - now)
      setTimeLeft(remaining)
      
      const secondsLeft = remaining / 1000
      setIsUrgent(secondsLeft <= urgentThreshold && secondsLeft > 0)
      
      if (remaining === 0) {
        onComplete?.()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, showMilliseconds ? 100 : 1000)
    
    return () => clearInterval(interval)
  }, [targetTime, onComplete, urgentThreshold, showMilliseconds])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 10)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}${showMilliseconds ? `.${milliseconds.toString().padStart(2, '0')}` : ''}`
    } else {
      return `${seconds}${showMilliseconds ? `.${milliseconds.toString().padStart(2, '0')}` : ''}s`
    }
  }

  const getColorClass = () => {
    if (timeLeft === 0) return 'text-gray-500'
    if (isUrgent) return 'text-red-600'
    if (timeLeft < 600000) return 'text-orange-600' // 10 minutes
    return 'text-green-600'
  }

  const getBackgroundClass = () => {
    if (timeLeft === 0) return 'bg-gray-100'
    if (isUrgent) return 'bg-red-50'
    if (timeLeft < 600000) return 'bg-orange-50'
    return 'bg-green-50'
  }

  return (
    <div className={`
      inline-flex items-center px-3 py-2 rounded-lg font-mono font-bold
      transition-all duration-300
      ${getBackgroundClass()}
      ${getColorClass()}
      ${isUrgent ? 'animate-pulse' : ''}
      ${className}
    `}>
      {timeLeft === 0 ? (
        <span className="flex items-center space-x-1">
          <span>⏰</span>
          <span>Time&apos;s Up!</span>
        </span>
      ) : (
        <span className="flex items-center space-x-1">
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </span>
      )}
    </div>
  )
}