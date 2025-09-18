/**
 * Unified Loader - Single Source of Truth for All Loading States
 * 
 * Consolidates: UnifiedLoader, LoadingSpinner, CuteLoader, LoadingSkeleton
 * Features: Context-aware loading, performance optimization, delightful animations
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";

interface UnifiedLoaderProps {
  // Core loading types
  type?: "spinner" | "skeleton" | "pulse" | "dots" | "progress";
  
  // Context-aware sizing
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "adaptive";
  
  // Visual customization
  color?: "primary" | "secondary" | "white" | "custom";
  customColor?: string;
  
  // Content and messaging
  message?: string;
  showMessage?: boolean;
  
  // Layout options
  fullScreen?: boolean;
  overlay?: boolean;
  
  // Performance and UX
  minDuration?: number; // Prevent flash of loading
  delayShow?: number; // Delay showing loader for fast operations
  
  // Context for intelligent behavior
  context?: "page" | "component" | "button" | "form" | "data";
  
  // Skeleton-specific props
  lines?: number;
  avatar?: boolean;
  
  // Progress-specific props
  progress?: number; // 0-100
  
  className?: string;
}

export function UnifiedLoader({
  type = "spinner",
  size = "md",
  color = "primary",
  customColor,
  message,
  showMessage = false,
  fullScreen = false,
  overlay = false,
  minDuration = 300,
  delayShow = 100,
  context = "component",
  lines = 3,
  avatar = false,
  progress,
  className,
}: UnifiedLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // Intelligent delay and minimum duration handling
  useEffect(() => {
    const showTimer = setTimeout(() => setShouldShow(true), delayShow);
    
    if (shouldShow) {
      setIsVisible(true);
      
      // Ensure minimum duration for UX consistency
      const minTimer = setTimeout(() => {
        // This would be controlled by parent component unmounting
      }, minDuration);
      
      return () => clearTimeout(minTimer);
    }
    
    return () => clearTimeout(showTimer);
  }, [delayShow, minDuration, shouldShow]);

  // Adaptive sizing based on context
  const getAdaptiveSize = () => {
    if (size !== "adaptive") return size;
    
    switch (context) {
      case "page": return "xl";
      case "component": return "lg";
      case "button": return "sm";
      case "form": return "md";
      case "data": return "md";
      default: return "md";
    }
  };

  const actualSize = getAdaptiveSize();

  // Size classes
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  // Color classes
  const colorClasses = {
    primary: "text-blue-500",
    secondary: "text-purple-500",
    white: "text-white",
    custom: customColor ? `text-[${customColor}]` : "text-blue-500",
  };

  // Spinner component
  const SpinnerLoader = () => (
    <motion.div
      className={cn(
        "border-2 border-current border-t-transparent rounded-full animate-spin",
        sizeClasses[actualSize],
        colorClasses[color]
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    />
  );

  // Dots loader
  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "rounded-full bg-current",
            actualSize === "xs" ? "w-1 h-1" :
            actualSize === "sm" ? "w-1.5 h-1.5" :
            actualSize === "md" ? "w-2 h-2" :
            actualSize === "lg" ? "w-2.5 h-2.5" : "w-3 h-3",
            colorClasses[color]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );

  // Pulse loader
  const PulseLoader = () => (
    <motion.div
      className={cn(
        "rounded-full bg-current",
        sizeClasses[actualSize],
        colorClasses[color]
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  );

  // Skeleton loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
      {avatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 bg-white/10 rounded",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );

  // Progress loader
  const ProgressLoader = () => (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-white/70">
        <span>{message || "Loading..."}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress || 0}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );

  // Render appropriate loader
  const renderLoader = () => {
    switch (type) {
      case "spinner": return <SpinnerLoader />;
      case "dots": return <DotsLoader />;
      case "pulse": return <PulseLoader />;
      case "skeleton": return <SkeletonLoader />;
      case "progress": return <ProgressLoader />;
      default: return <SpinnerLoader />;
    }
  };

  // Container classes
  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    {
      "fixed inset-0 z-50": fullScreen,
      "absolute inset-0": overlay && !fullScreen,
      "bg-black/50 backdrop-blur-sm": overlay || fullScreen,
    },
    className
  );

  if (!shouldShow || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={containerClasses}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-center space-y-3">
          {renderLoader()}
          
          {showMessage && message && type !== "progress" && (
            <motion.p
              className="text-sm text-white/70 text-center max-w-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Convenience components for common use cases
export function PageLoader({ message = "Loading page..." }: { message?: string }) {
  return (
    <UnifiedLoader
      type="spinner"
      size="xl"
      fullScreen
      showMessage
      message={message}
      context="page"
    />
  );
}

export function ComponentLoader({ message }: { message?: string }) {
  return (
    <UnifiedLoader
      type="dots"
      size="md"
      showMessage={!!message}
      message={message}
      context="component"
    />
  );
}

export function ButtonLoader() {
  return (
    <UnifiedLoader
      type="spinner"
      size="sm"
      context="button"
    />
  );
}

export function DataLoader({ progress }: { progress?: number }) {
  return (
    <UnifiedLoader
      type={progress !== undefined ? "progress" : "pulse"}
      size="md"
      progress={progress}
      context="data"
    />
  );
}

// Export aliases for backward compatibility
export const LoadingSpinner = UnifiedLoader;
export const CuteLoader = UnifiedLoader;
export const LoadingSkeleton = ({ lines = 3, avatar = false }: { lines?: number; avatar?: boolean }) => (
  <UnifiedLoader type="skeleton" lines={lines} avatar={avatar} />
);