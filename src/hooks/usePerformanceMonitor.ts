import { useEffect, useState, useCallback } from 'react'

interface PerformanceMetrics {
  fps: number
  memoryUsage?: number
  animationFrameTime: number
  isLowPerformance: boolean
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    animationFrameTime: 16.67,
    isLowPerformance: false
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  const measurePerformance = useCallback(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measure = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        const animationFrameTime = 1000 / fps

        setMetrics({
          fps,
          animationFrameTime,
          isLowPerformance: fps < 30 || animationFrameTime > 33
        })

        frameCount = 0
        lastTime = currentTime
      }

      if (isMonitoring) {
        animationId = requestAnimationFrame(measure)
      }
    }

    animationId = requestAnimationFrame(measure)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isMonitoring])

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
  }, [])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  useEffect(() => {
    if (isMonitoring) {
      const cleanup = measurePerformance()
      return cleanup
    }
  }, [isMonitoring, measurePerformance])

  // Auto-detect low-performance devices
  useEffect(() => {
    const isLowEndDevice =
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2

    if (isLowEndDevice) {
      setMetrics(prev => ({ ...prev, isLowPerformance: true }))
    }
  }, [])

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  }
}

// Performance-aware animation hook
export function useOptimizedAnimation() {
  const { metrics } = usePerformanceMonitor()

  const getOptimizedDuration = useCallback((baseDuration: number) => {
    if (metrics.isLowPerformance) {
      return Math.max(baseDuration * 0.5, 0.1) // Speed up animations on low-performance devices
    }
    return baseDuration
  }, [metrics.isLowPerformance])

  const shouldReduceMotion = useCallback(() => {
    return metrics.isLowPerformance ||
           window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [metrics.isLowPerformance])

  return {
    getOptimizedDuration,
    shouldReduceMotion,
    isLowPerformance: metrics.isLowPerformance,
    fps: metrics.fps
  }
}