"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DelightfulNotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  duration?: number;
  onAction?: () => void;
  actionLabel?: string;
  icon?: string;
  animation?: 'bounce' | 'slide' | 'fade';
  showCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
}

export function DelightfulNotification({ 
  message, 
  type, 
  duration = 3000,
  onAction,
  actionLabel,
  icon,
  animation = 'slide',
  showCloseButton = true,
  onClose,
  className = ""
}: DelightfulNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-100';
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-100';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-100';
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-100';
      default:
        return 'bg-white/10 border-white/20 text-white';
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'achievement': return '🎉';
      default: return '💬';
    }
  };

  const animationVariants = {
    slide: {
      initial: { opacity: 0, x: 100, y: 0 },
      animate: { opacity: 1, x: 0, y: 0 },
      exit: { opacity: 0, x: 100, y: 0 }
    },
    bounce: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "fixed top-4 right-4 z-50 max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-sm",
          getNotificationStyle(),
          className
        )}
        variants={animationVariants[animation]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">{getIcon()}</div>
          
          <div className="flex-1">
            <div className="font-medium">{message}</div>
            
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                className="mt-2 text-sm underline hover:no-underline"
              >
                {actionLabel}
              </button>
            )}
          </div>
          
          {showCloseButton && (
            <button
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Progress bar for timed notifications */}
        {duration > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: type === 'success' ? '#22c55e' : 
                                  type === 'error' ? '#ef4444' : 
                                  type === 'warning' ? '#f59e0b' : 
                                  type === 'info' ? '#3b82f6' : 
                                  '#f59e0b' }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  duration?: number;
  onAction?: () => void;
  actionLabel?: string;
  icon?: string;
  animation?: 'bounce' | 'slide' | 'fade';
}

interface NotificationQueue {
  notifications: NotificationState[];
}

// Notification queue context and hook would go here if needed for a full system