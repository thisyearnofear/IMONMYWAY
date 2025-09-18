/**
 * Unified Button - Single Source of Truth for All Button Interactions
 * 
 * Consolidates: PremiumButton, DelightfulButton, FloatingButton, EnhancedButton
 * Features: Adaptive design, performance optimization, viral sharing integration
 */

"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UnifiedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Core variants - simplified from 7 to 3 essential types
  variant?: "primary" | "secondary" | "ghost";
  
  // Adaptive sizing based on context
  size?: "sm" | "md" | "lg" | "adaptive";
  
  // Enhanced states
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  
  // Visual enhancements
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  gradient?: boolean;
  glow?: boolean;
  
  // Interaction patterns
  haptic?: boolean;
  soundFeedback?: boolean;
  
  // Social/Viral features
  shareOnSuccess?: boolean;
  celebrateOnClick?: boolean;
  
  // Performance
  priority?: "high" | "normal" | "low";
}

export const UnifiedButton = forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      isSuccess = false,
      loadingText,
      successText,
      icon,
      iconPosition = "left",
      gradient = false,
      glow = false,
      haptic = false,
      soundFeedback = false,
      shareOnSuccess = false,
      celebrateOnClick = false,
      priority = "normal",
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Adaptive sizing based on viewport and context
    const getAdaptiveSize = () => {
      if (size !== "adaptive") return size;
      
      // Smart sizing based on screen size and context
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        if (width < 640) return "lg"; // Mobile gets larger buttons
        if (width < 1024) return "md"; // Tablet
        return "md"; // Desktop
      }
      return "md";
    };

    const actualSize = getAdaptiveSize();

    // Enhanced click handler with viral features
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      // Haptic feedback for mobile
      if (haptic && "vibrate" in navigator) {
        navigator.vibrate(50);
      }

      // Sound feedback (optional)
      if (soundFeedback) {
        // Could integrate Web Audio API for subtle click sounds
      }

      // Celebration animation
      if (celebrateOnClick) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1000);
      }

      // Call original onClick
      onClick?.(e);

      // Share on success (viral feature)
      if (shareOnSuccess && isSuccess) {
        // Could integrate Web Share API
        if ("share" in navigator) {
          try {
            await navigator.share({
              title: "Check out my achievement!",
              text: "I just completed a challenge on IMONMYWAY!",
              url: window.location.href,
            });
          } catch (err) {
            // Fallback to clipboard
            navigator.clipboard?.writeText(window.location.href);
          }
        }
      }
    };

    // Dynamic classes based on state and variant
    const buttonClasses = cn(
      // Base styles
      "relative inline-flex items-center justify-center",
      "font-semibold tracking-wide transition-all duration-300",
      "rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transform-gpu", // Hardware acceleration
      
      // Size variants
      {
        "px-3 py-2 text-sm": actualSize === "sm",
        "px-6 py-3 text-base": actualSize === "md",
        "px-8 py-4 text-lg": actualSize === "lg",
      },
      
      // Variant styles
      {
        // Primary - Bold, action-oriented
        "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent": 
          variant === "primary" && !gradient,
        "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-transparent": 
          variant === "primary" && gradient,
        "hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500": 
          variant === "primary",
        
        // Secondary - Subtle, supportive
        "bg-white/10 text-white border-white/20 backdrop-blur-sm": 
          variant === "secondary",
        "hover:bg-white/20 hover:border-white/30 focus:ring-white/50": 
          variant === "secondary",
        
        // Ghost - Minimal, clean
        "bg-transparent text-white/80 border-transparent": 
          variant === "ghost",
        "hover:bg-white/10 hover:text-white focus:ring-white/30": 
          variant === "ghost",
      },
      
      // State modifiers
      {
        "opacity-50 cursor-not-allowed": disabled,
        "cursor-wait": isLoading,
        "scale-95": isPressed && !disabled,
      },
      
      // Glow effect
      {
        "shadow-lg shadow-blue-500/25": glow && variant === "primary",
        "shadow-lg shadow-white/10": glow && variant !== "primary",
      },
      
      className
    );

    // Content with loading and success states
    const renderContent = () => {
      if (isLoading) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {loadingText || "Loading..."}
          </motion.div>
        );
      }

      if (isSuccess && successText) {
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-green-400">✓</span>
            {successText}
          </motion.div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          {icon && iconPosition === "left" && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === "right" && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      );
    };

    // Separate conflicting props from button props
    const { 
      onDrag, 
      onDragStart, 
      onDragEnd, 
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...buttonProps 
    } = props;

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        {...buttonProps}
      >
        {renderContent()}
        
        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl"
            >
              <span className="text-2xl">🎉</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

UnifiedButton.displayName = "UnifiedButton";

// Export aliases for backward compatibility during migration
export const Button = UnifiedButton;
export const PremiumButton = UnifiedButton;
export const DelightfulButton = UnifiedButton;