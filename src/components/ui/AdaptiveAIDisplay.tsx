"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdaptiveAIDisplayProps {
  confidence: number; // 0-1
  children: React.ReactNode;
  className?: string;
  showConfidenceIndicator?: boolean;
  adaptiveOpacity?: boolean;
  adaptiveScale?: boolean;
  adaptiveBlur?: boolean;
}

/**
 * Adaptive AI Display Component
 * 
 * Adjusts visual presentation based on AI prediction confidence:
 * - High confidence (>0.8): Full opacity, normal scale, no blur
 * - Medium confidence (0.6-0.8): Slight opacity reduction, subtle scale
 * - Low confidence (<0.6): Reduced opacity, slight scale reduction, blur effect
 */
export function AdaptiveAIDisplay({
  confidence,
  children,
  className,
  showConfidenceIndicator = true,
  adaptiveOpacity = true,
  adaptiveScale = true,
  adaptiveBlur = true
}: AdaptiveAIDisplayProps) {
  // Calculate adaptive properties based on confidence
  const getAdaptiveStyles = () => {
    let opacity = 1;
    let scale = 1;
    let blur = 0;
    let borderColor = 'border-green-500/30';
    let bgColor = 'bg-green-500/5';
    let textColor = 'text-green-400';
    let label = 'High Confidence';

    if (confidence < 0.6) {
      opacity = adaptiveOpacity ? 0.7 : 1;
      scale = adaptiveScale ? 0.98 : 1;
      blur = adaptiveBlur ? 2 : 0;
      borderColor = 'border-red-500/30';
      bgColor = 'bg-red-500/5';
      textColor = 'text-red-400';
      label = 'Low Confidence';
    } else if (confidence < 0.8) {
      opacity = adaptiveOpacity ? 0.85 : 1;
      scale = adaptiveScale ? 0.99 : 1;
      blur = adaptiveBlur ? 1 : 0;
      borderColor = 'border-yellow-500/30';
      bgColor = 'bg-yellow-500/5';
      textColor = 'text-yellow-400';
      label = 'Medium Confidence';
    }

    return { opacity, scale, blur, borderColor, bgColor, textColor, label };
  };

  const styles = getAdaptiveStyles();
  const confidencePercentage = Math.round(confidence * 100);

  return (
    <motion.div
      className={cn(
        "relative rounded-xl border transition-all duration-300",
        styles.borderColor,
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: styles.opacity,
        scale: styles.scale,
        filter: `blur(${styles.blur}px)`
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Confidence Background */}
      <div className={cn("absolute inset-0 rounded-xl pointer-events-none", styles.bgColor)} />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Confidence Indicator */}
      {showConfidenceIndicator && (
        <motion.div
          className={cn(
            "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium",
            "bg-white/10 backdrop-blur-sm border",
            styles.borderColor
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className={styles.textColor}>
            {confidencePercentage}% confident
          </span>
        </motion.div>
      )}

      {/* Low Confidence Warning */}
      {confidence < 0.6 && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-red-500/50"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(239, 68, 68, 0.3)",
              "0 0 0 8px rgba(239, 68, 68, 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

/**
 * Confidence Badge Component
 * 
 * Displays confidence level with visual indicators
 */
export function ConfidenceBadge({
  confidence,
  showPercentage = true,
  size = 'md',
  className
}: {
  confidence: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const confidencePercentage = Math.round(confidence * 100);
  
  const getColor = () => {
    if (confidence > 0.8) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (confidence > 0.6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getIcon = () => {
    if (confidence > 0.8) return '✓';
    if (confidence > 0.6) return '◐';
    return '✕';
  };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",
        getColor(),
        getSize(),
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span>{getIcon()}</span>
      {showPercentage && <span>{confidencePercentage}%</span>}
    </motion.div>
  );
}

/**
 * Confidence-Based Content Visibility
 * 
 * Shows/hides content based on confidence threshold
 */
export function ConfidenceGated({
  confidence,
  threshold = 0.6,
  children,
  fallback,
  showThresholdWarning = true
}: {
  confidence: number;
  threshold?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showThresholdWarning?: boolean;
}) {
  const meetsThreshold = confidence >= threshold;

  return (
    <AnimatePresence mode="wait">
      {meetsThreshold ? (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="fallback"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {fallback || (
            showThresholdWarning && (
              <div className="glass-enhanced rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-300">
                      Low Confidence Prediction
                    </p>
                    <p className="text-xs text-yellow-200/70 mt-1">
                      AI confidence is {Math.round(confidence * 100)}%. 
                      Predictions may be less reliable.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Confidence Progress Indicator
 * 
 * Visual representation of confidence level
 */
export function ConfidenceProgress({
  confidence,
  showLabel = true,
  animated = true,
  className
}: {
  confidence: number;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const confidencePercentage = Math.round(confidence * 100);
  
  const getGradient = () => {
    if (confidence > 0.8) return 'from-green-500 to-emerald-500';
    if (confidence > 0.6) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/70">Confidence</span>
          <span className="font-medium text-white">{confidencePercentage}%</span>
        </div>
      )}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getGradient())}
          initial={{ width: 0 }}
          animate={{ width: `${confidencePercentage}%` }}
          transition={animated ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }}
        />
      </div>
    </div>
  );
}

/**
 * Confidence-Based Blur Effect
 * 
 * Applies blur based on confidence level
 */
export function ConfidenceBlur({
  confidence,
  children,
  className
}: {
  confidence: number;
  children: React.ReactNode;
  className?: string;
}) {
  const blurAmount = confidence > 0.8 ? 0 : confidence > 0.6 ? 1 : 2;

  return (
    <motion.div
      className={className}
      animate={{ filter: `blur(${blurAmount}px)` }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
