import { useCallback, useMemo } from 'react'

interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  reduce?: boolean
}

interface CelebrationConfig {
  type: 'success' | 'achievement' | 'bet_won' | 'commitment_fulfilled'
  intensity: 'subtle' | 'medium' | 'intense'
  haptic?: boolean
  sound?: boolean
}

export function useAnimation() {
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Simple performance check - assume modern devices can handle animations
  const isLowPerformance = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return navigator.hardwareConcurrency <= 1
  }, [])

  // Adaptive animation configuration based on performance
  const getOptimizedConfig = useCallback((config: AnimationConfig): AnimationConfig => {
    const shouldReduce = prefersReducedMotion || isLowPerformance || config.reduce

    if (shouldReduce) {
      return {
        ...config,
        duration: Math.min(config.duration * 0.3, 150), // Much faster on low-performance
        easing: 'ease-out', // Simpler easing
        delay: 0 // Remove delays
      }
    }

    return config
  }, [prefersReducedMotion, isLowPerformance])

  // Smart animation classes based on context
  const getAnimationClass = useCallback((
    type: 'enter' | 'exit' | 'hover' | 'press' | 'success' | 'error' | 'delight' | 'heartbeat' | 'shimmer',
    intensity: 'subtle' | 'medium' | 'intense' = 'medium'
  ) => {
    const shouldReduce = prefersReducedMotion || isLowPerformance

    const animations = {
      enter: {
        subtle: shouldReduce ? 'animate-fade-in' : 'animate-slide-up',
        medium: shouldReduce ? 'animate-fade-in' : 'animate-slide-up animate-scale-in',
        intense: shouldReduce ? 'animate-fade-in' : 'animate-slide-up animate-scale-in animate-glow'
      },
      exit: {
        subtle: 'animate-fade-out',
        medium: shouldReduce ? 'animate-fade-out' : 'animate-slide-down',
        intense: shouldReduce ? 'animate-fade-out' : 'animate-slide-down animate-scale-out'
      },
      hover: {
        subtle: shouldReduce ? '' : 'hover:scale-102 transition-transform',
        medium: shouldReduce ? 'hover:opacity-90' : 'hover-lift hover:scale-105',
        intense: shouldReduce ? 'hover:opacity-80' : 'hover-lift hover:scale-110 hover:shadow-xl'
      },
      press: {
        subtle: 'active:scale-98',
        medium: shouldReduce ? 'active:scale-95' : 'btn-press',
        intense: shouldReduce ? 'active:scale-90' : 'btn-press active:scale-90'
      },
      success: {
        subtle: shouldReduce ? 'animate-pulse' : 'animate-bounce-gentle',
        medium: shouldReduce ? 'animate-pulse' : 'animate-success-pulse',
        intense: shouldReduce ? 'animate-pulse' : 'animate-celebration'
      },
      error: {
        subtle: shouldReduce ? 'animate-pulse' : 'animate-shake',
        medium: shouldReduce ? 'animate-pulse' : 'animate-shake animate-error-glow',
        intense: shouldReduce ? 'animate-pulse' : 'animate-shake animate-error-glow animate-error-bounce'
      },
      delight: {
        subtle: shouldReduce ? 'animate-pulse-gentle' : 'animate-bounce-subtle',
        medium: shouldReduce ? 'animate-pulse-gentle' : 'animate-shimmer',
        intense: shouldReduce ? 'animate-pulse-gentle' : 'animate-heartbeat'
      },
      heartbeat: {
        subtle: 'animate-pulse-gentle',
        medium: 'animate-heartbeat',
        intense: 'animate-heartbeat animate-glow'
      },
      shimmer: {
        subtle: 'animate-shimmer',
        medium: 'animate-shimmer',
        intense: 'animate-shimmer animate-glow'
      }
    }

    return animations[type][intensity]
  }, [prefersReducedMotion, isLowPerformance])

  // Celebration system for major user achievements
  const triggerCelebration = useCallback(async (config: CelebrationConfig) => {
    const { type, intensity, haptic = true, sound = false } = config

    // Skip intense celebrations on low-performance devices
    if (isLowPerformance && intensity === 'intense') {
      return triggerCelebration({ ...config, intensity: 'medium' })
    }

    // Haptic feedback (if supported and enabled)
    if (haptic && 'vibrate' in navigator && !prefersReducedMotion) {
      const patterns = {
        subtle: [50],
        medium: [100, 50, 100],
        intense: [200, 100, 200, 100, 200]
      }
      navigator.vibrate(patterns[intensity])
    }

    // Visual celebration
    const celebrationElement = document.createElement('div')
    celebrationElement.className = `
      fixed inset-0 pointer-events-none z-[9999] 
      ${getAnimationClass('success', intensity)}
    `

    // Add celebration content based on type
    const celebrationContent = {
      success: '🎉',
      achievement: '🏆',
      bet_won: '💰',
      commitment_fulfilled: '✅'
    }

    celebrationElement.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-8xl animate-bounce-gentle">
          ${celebrationContent[type]}
        </div>
      </div>
    `

    document.body.appendChild(celebrationElement)

    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(celebrationElement)
    }, intensity === 'intense' ? 3000 : intensity === 'medium' ? 2000 : 1000)

    // Sound feedback (future enhancement)
    if (sound) {
      // Audio feedback with Web Audio API
      if (config.sound && typeof window !== 'undefined') {
        await playAudioFeedback(config.type, config.intensity)
      }
    }
  }, [isLowPerformance, prefersReducedMotion, getAnimationClass])

  // Staggered animations for lists
  const getStaggeredDelay = useCallback((index: number, baseDelay: number = 100) => {
    if (prefersReducedMotion || isLowPerformance) return 0
    return index * Math.min(baseDelay, 50) // Cap delay on low-performance
  }, [prefersReducedMotion, isLowPerformance])

  // Context-aware loading animations
  const getLoadingAnimation = useCallback((context: 'button' | 'page' | 'component' | 'data') => {
    const animations = {
      button: isLowPerformance ? 'animate-pulse' : 'animate-spin',
      page: isLowPerformance ? 'animate-pulse' : 'animate-skeleton-wave',
      component: isLowPerformance ? 'animate-pulse' : 'animate-fade-in',
      data: isLowPerformance ? 'animate-pulse' : 'animate-skeleton-shimmer'
    }
    return animations[context]
  }, [isLowPerformance])

  return {
    getOptimizedConfig,
    getAnimationClass,
    triggerCelebration,
    getStaggeredDelay,
    getLoadingAnimation,
    isReducedMotion: prefersReducedMotion,
    isLowPerformance,
    fps: 60 // Default FPS since we don't have monitoring
  }
}

// Hook for component-specific animations
// ============================================================================
// AUDIO FEEDBACK SYSTEM
// ============================================================================

async function playAudioFeedback(type: CelebrationConfig['type'], intensity: CelebrationConfig['intensity']) {
  try {
    // Check user preference for audio (respects browser autoplay policies)
    const audioEnabled = localStorage.getItem('audioFeedbackEnabled') !== 'false'
    if (!audioEnabled) return

    // Create audio context (lazy initialization)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Resume context if suspended (required by browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    // Audio parameters based on celebration type and intensity
    const audioConfig = {
      success: { frequency: 523.25, duration: 0.3 }, // C5
      achievement: { frequency: 659.25, duration: 0.5 }, // E5
      bet_won: { frequency: 783.99, duration: 0.4 }, // G5
      commitment_fulfilled: { frequency: 440, duration: 0.6 } // A4
    }

    const intensityMultiplier = {
      subtle: 0.1,
      medium: 0.2,
      intense: 0.3
    }

    const config = audioConfig[type]
    const volume = intensityMultiplier[intensity]

    // Create oscillator for tone
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Configure audio
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime)
    oscillator.type = 'sine'
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration)

    // Play sound
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + config.duration)

  } catch (error) {
    // Fallback: no audio if Web Audio API fails
    console.log(`🔊 Audio feedback: ${type} (${intensity})`)
  }
}

export function useComponentAnimation(componentName: string) {
  const { getAnimationClass, getStaggeredDelay, triggerCelebration } = useAnimation()

  const enterAnimation = getAnimationClass('enter', 'medium')
  const hoverAnimation = getAnimationClass('hover', 'subtle')
  const pressAnimation = getAnimationClass('press', 'medium')

  return {
    enterAnimation,
    hoverAnimation,
    pressAnimation,
    getStaggeredDelay,
    triggerCelebration,
    // Component-specific animation combinations
    cardAnimation: `${enterAnimation} ${hoverAnimation}`,
    buttonAnimation: `${hoverAnimation} ${pressAnimation}`,
    listItemAnimation: (index: number) =>
      `${enterAnimation} ${hoverAnimation}`,
    successAnimation: () => getAnimationClass('success', 'medium')
  }
}