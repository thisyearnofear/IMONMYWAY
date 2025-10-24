"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAIPerformanceMonitoring } from "@/hooks/useAIPerformanceMonitoring";

interface AIMicroInteractionProps {
  type?: 'pulse' | 'bounce' | 'shimmer' | 'glow' | 'float' | 'spin' | 'wave';
  intensity?: 'low' | 'medium' | 'high';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * AI-Driven Micro-Interactions
 * 
 * Provides intelligent, performance-aware animations that adapt based on:
 * - Device performance
 * - Battery status
 * - User preferences
 * - AI prediction confidence
 */
export function AIMicroInteraction({
  type = 'pulse',
  intensity = 'medium',
  children,
  className,
  disabled = false
}: AIMicroInteractionProps) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  // Skip animations on low-performance devices
  if (shouldReduceAnimations || disabled) {
    return <div className={className}>{children}</div>;
  }

  const getDuration = () => {
    switch (intensity) {
      case 'low':
        return 3;
      case 'high':
        return 1;
      default:
        return 2;
    }
  };

  const getVariants = () => {
    const duration = getDuration();

    switch (type) {
      case 'pulse':
        return {
          initial: { opacity: 1 },
          animate: {
            opacity: [1, 0.7, 1],
            transition: { duration, repeat: Infinity }
          }
        };

      case 'bounce':
        return {
          initial: { y: 0 },
          animate: {
            y: [0, -8, 0],
            transition: { duration, repeat: Infinity, ease: "easeInOut" }
          }
        };

      case 'shimmer':
        return {
          initial: { backgroundPosition: "200% center" },
          animate: {
            backgroundPosition: ["-200% center", "200% center"],
            transition: { duration, repeat: Infinity, ease: "linear" }
          }
        };

      case 'glow':
        return {
          initial: { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.3)" },
          animate: {
            boxShadow: [
              "0 0 0 0 rgba(59, 130, 246, 0.3)",
              "0 0 0 12px rgba(59, 130, 246, 0)"
            ],
            transition: { duration, repeat: Infinity }
          }
        };

      case 'float':
        return {
          initial: { y: 0 },
          animate: {
            y: [0, -12, 0],
            transition: { duration, repeat: Infinity, ease: "easeInOut" }
          }
        };

      case 'spin':
        return {
          initial: { rotate: 0 },
          animate: {
            rotate: 360,
            transition: { duration, repeat: Infinity, ease: "linear" }
          }
        };

      case 'wave':
        return {
          initial: { x: 0 },
          animate: {
            x: [0, 8, -8, 0],
            transition: { duration, repeat: Infinity, ease: "easeInOut" }
          }
        };

      default:
        return {};
    }
  };

  return (
    <motion.div
      className={className}
      variants={getVariants()}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

/**
 * AI Confidence Pulse
 * 
 * Pulses based on AI prediction confidence level
 */
export function ConfidencePulse({
  confidence,
  children,
  className
}: {
  confidence: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  // Determine pulse intensity based on confidence
  const getPulseIntensity = () => {
    if (confidence > 0.8) return 'low';
    if (confidence > 0.6) return 'medium';
    return 'high';
  };

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AIMicroInteraction
      type="pulse"
      intensity={getPulseIntensity()}
      className={className}
    >
      {children}
    </AIMicroInteraction>
  );
}

/**
 * AI Success Animation
 * 
 * Celebratory animation for successful AI predictions
 */
export function AISuccessAnimation({
  show = true,
  onComplete
}: {
  show?: boolean;
  onComplete?: () => void;
}) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  if (!show || shouldReduceAnimations) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 pointer-events-none flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={onComplete}
      >
        {/* Confetti-like particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * 100,
              y: Math.sin((i / 12) * Math.PI * 2) * 100 - 50,
              opacity: 0,
              scale: 0
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}

        {/* Center checkmark */}
        <motion.div
          className="text-4xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: "backOut" }}
        >
          ✓
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * AI Loading Pulse
 * 
 * Intelligent loading animation that adapts to performance
 */
export function AILoadingPulse({
  isLoading,
  confidence = 0.5,
  children,
  className
}: {
  isLoading: boolean;
  confidence?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  if (!isLoading) {
    return <div className={className}>{children}</div>;
  }

  const pulseColor = 
    confidence > 0.8 ? 'from-green-500 to-emerald-500' :
    confidence > 0.6 ? 'from-blue-500 to-cyan-500' :
    'from-yellow-500 to-orange-500';

  return (
    <motion.div
      className={cn(
        "relative",
        className
      )}
      animate={shouldReduceAnimations ? {} : { opacity: [1, 0.7, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Animated border */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r",
            pulseColor,
            "opacity-20"
          )}
          animate={shouldReduceAnimations ? {} : {
            backgroundPosition: ["-200% center", "200% center"]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * AI Hover Effect
 * 
 * Intelligent hover animation with confidence-based intensity
 */
export function AIHoverEffect({
  confidence = 0.7,
  children,
  className,
  onClick
}: {
  confidence?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  const getScale = () => {
    if (shouldReduceAnimations) return 1;
    if (confidence > 0.8) return 1.05;
    if (confidence > 0.6) return 1.03;
    return 1.01;
  };

  const getGlow = () => {
    if (shouldReduceAnimations) return "0 0 0 0 rgba(59, 130, 246, 0)";
    if (confidence > 0.8) return "0 0 20px rgba(59, 130, 246, 0.5)";
    if (confidence > 0.6) return "0 0 10px rgba(59, 130, 246, 0.3)";
    return "0 0 5px rgba(59, 130, 246, 0.1)";
  };

  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      whileHover={shouldReduceAnimations ? {} : {
        scale: getScale(),
        boxShadow: getGlow()
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AI Transition Effect
 * 
 * Smooth transitions between AI states
 */
export function AITransition({
  state,
  children,
  className
}: {
  state: 'loading' | 'success' | 'error' | 'idle';
  children: React.ReactNode;
  className?: string;
}) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  const getColor = () => {
    switch (state) {
      case 'loading':
        return 'from-blue-500/20 to-purple-500/20';
      case 'success':
        return 'from-green-500/20 to-emerald-500/20';
      case 'error':
        return 'from-red-500/20 to-pink-500/20';
      default:
        return 'from-white/5 to-white/10';
    }
  };

  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r rounded-lg p-4",
        getColor(),
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={shouldReduceAnimations ? { duration: 0 } : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AI Stagger Animation
 * 
 * Staggered animations for lists of AI predictions
 */
export function AIStaggerContainer({
  children,
  staggerDelay = 0.1,
  className
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const { shouldReduceAnimations } = useAIPerformanceMonitoring();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: shouldReduceAnimations ? 0 : staggerDelay,
            delayChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AI Stagger Item
 * 
 * Individual item for staggered animations
 */
export function AIStaggerItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
