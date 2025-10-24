"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AILoadingSkeletonProps {
  type?: 'card' | 'chart' | 'list' | 'dashboard' | 'input' | 'prediction';
  count?: number;
  className?: string;
  showAIIndicator?: boolean;
}

/**
 * AI-Powered Loading Skeleton
 * 
 * Displays intelligent loading states with AI branding and adaptive animations
 * based on device performance and prediction confidence.
 */
export function AILoadingSkeleton({
  type = 'card',
  count = 1,
  className,
  showAIIndicator = true
}: AILoadingSkeletonProps) {
  const renderCardSkeleton = () => (
    <motion.div
      className="glass-enhanced rounded-xl p-6 space-y-4"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-between">
        <div className="h-6 bg-white/10 rounded-lg w-32"></div>
        <div className="h-4 bg-white/10 rounded-full w-16"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded-lg w-full"></div>
        <div className="h-4 bg-white/10 rounded-lg w-5/6"></div>
        <div className="h-4 bg-white/10 rounded-lg w-4/6"></div>
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-8 bg-white/10 rounded-lg flex-1"></div>
        <div className="h-8 bg-white/10 rounded-lg flex-1"></div>
      </div>
    </motion.div>
  );

  const renderChartSkeleton = () => (
    <motion.div
      className="glass-enhanced rounded-xl p-6 space-y-4"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="h-6 bg-white/10 rounded-lg w-40"></div>
      <div className="flex items-end justify-between gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-blue-500/30 to-blue-500/10 rounded-t-lg"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </motion.div>
  );

  const renderListSkeleton = () => (
    <motion.div
      className="glass-enhanced rounded-xl p-6 space-y-4"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 pb-4 border-b border-white/10 last:border-0">
          <div className="h-10 w-10 bg-white/10 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded-lg w-32"></div>
            <div className="h-3 bg-white/10 rounded-lg w-24"></div>
          </div>
          <div className="h-6 bg-white/10 rounded-lg w-16"></div>
        </div>
      ))}
    </motion.div>
  );

  const renderDashboardSkeleton = () => (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="h-8 bg-white/10 rounded-lg w-48"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="glass-enhanced rounded-xl p-5 space-y-3"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-4 bg-white/10 rounded-lg w-24"></div>
            <div className="h-8 bg-white/10 rounded-lg w-16"></div>
            <div className="h-2 bg-white/10 rounded-full w-full"></div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <motion.div
            key={i}
            className="glass-enhanced rounded-xl p-6 space-y-4"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-6 bg-white/10 rounded-lg w-40"></div>
            <div className="h-48 bg-white/5 rounded-lg"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderInputSkeleton = () => (
    <motion.div
      className="glass-enhanced rounded-xl p-6 space-y-4"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="h-6 bg-white/10 rounded-lg w-32"></div>
      <div className="h-12 bg-white/10 rounded-lg"></div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
        ))}
      </div>
      <div className="h-10 bg-white/10 rounded-lg w-full"></div>
    </motion.div>
  );

  const renderPredictionSkeleton = () => (
    <motion.div
      className="glass-enhanced rounded-xl p-6 space-y-4"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-white/10 rounded-full"></div>
        <div className="h-6 bg-white/10 rounded-lg w-40"></div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-white/10 rounded-lg w-24"></div>
          <div className="h-4 bg-white/10 rounded-lg w-16"></div>
        </div>
        <div className="h-2 bg-white/10 rounded-full w-full"></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-white/10 rounded-lg"></div>
        ))}
      </div>
    </motion.div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'chart':
        return renderChartSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'dashboard':
        return renderDashboardSkeleton();
      case 'input':
        return renderInputSkeleton();
      case 'prediction':
        return renderPredictionSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Loading Indicator */}
      {showAIIndicator && (
        <motion.div
          className="flex items-center gap-2 text-sm text-blue-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
          <span>🤖 AI is analyzing...</span>
        </motion.div>
      )}

      {/* Skeleton Content */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer Loading Effect
 * 
 * Advanced loading effect with shimmer animation
 */
export function ShimmerLoader({
  className,
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r from-white/5 via-white/20 to-white/5 bg-[length:200%_100%]",
        className
      )}
      animate={{
        backgroundPosition: ["-200% center", "200% center"]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Confidence-Based Loading State
 * 
 * Shows different loading states based on AI prediction confidence
 */
export function ConfidenceBasedLoader({
  confidence,
  isLoading,
  children
}: {
  confidence: number; // 0-1
  isLoading: boolean;
  children: React.ReactNode;
}) {
  if (!isLoading) {
    return <>{children}</>;
  }

  const confidencePercentage = Math.round(confidence * 100);
  const confidenceColor = 
    confidence > 0.8 ? 'text-green-400' :
    confidence > 0.6 ? 'text-blue-400' :
    confidence > 0.4 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="space-y-4">
      <motion.div
        className="glass-enhanced rounded-xl p-4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-sm text-white/70">AI Processing</span>
          </div>
          <span className={cn("text-sm font-medium", confidenceColor)}>
            {confidencePercentage}% confident
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
      {children}
    </div>
  );
}
