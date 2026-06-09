"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingTooltipProps {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  position?: 'top-right' | 'bottom-right' | 'top-center';
  delay?: number;
}

export function OnboardingTooltip({
  id,
  message,
  actionLabel,
  onAction,
  position = 'bottom-right',
  delay = 800,
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`onboarding_seen_${id}`);
    if (seen) return;

    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [id, delay]);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`onboarding_seen_${id}`, '1');
  };

  const positionClasses = {
    'top-right': 'fixed top-20 right-4',
    'bottom-right': 'fixed bottom-8 right-4',
    'top-center': 'fixed top-20 left-1/2 -translate-x-1/2',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`${positionClasses[position]} z-50 max-w-sm`}
        >
          <div className="bg-graphite-800/95 backdrop-blur-xl border border-violet-500/30 rounded-xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-violet-400">?</span>
              </div>
              <div className="flex-1">
                <p className="text-white/90 text-sm leading-relaxed">{message}</p>
                {actionLabel && onAction && (
                  <button
                    onClick={() => { onAction(); dismiss(); }}
                    className="mt-2 text-sm text-violet-400 hover:text-violet-300 font-medium"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
              <button
                onClick={dismiss}
                className="text-white/40 hover:text-white/70 text-sm flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
