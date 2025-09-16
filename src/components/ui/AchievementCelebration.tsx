"use client";

import { useEffect, useState } from "react";
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementCelebrationProps {
  achievement: Achievement;
  onComplete: () => void;
  duration?: number;
}

export function AchievementCelebration({
  achievement,
  onComplete,
  duration = 4000,
}: AchievementCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 100);

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [achievement, onComplete, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 animate-fade-in" />

      {/* Celebration Content */}
      <div
        className={`
        relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500
        rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl
        transition-all duration-700 transform
        ${
          isAnimating
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-75 translate-y-8 opacity-0"
        }
      `}
      >
        {/* Achievement Icon with Bounce */}
        <div className="relative mb-6">
          <div className="text-8xl animate-bounce-gentle">
            {achievement.icon}
          </div>

          {/* Sparkle Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 text-yellow-300 animate-ping"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: "1.5s",
                }}
              >
                ✨
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Title */}
        <h2 className="text-2xl font-bold text-white mb-2 animate-slide-up">
          Achievement Unlocked!
        </h2>

        {/* Achievement Details */}
        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4 animate-scale-in">
          <h3 className="text-xl font-semibold text-white mb-1">
            {achievement.title}
          </h3>
          <p className="text-white text-opacity-90 text-sm">
            {achievement.description}
          </p>
        </div>

        {/* Progress Indicator (if applicable) */}
        {achievement.progress && achievement.maxProgress && (
          <div className="bg-white bg-opacity-20 rounded-full h-2 mb-4">
            <div
              className="bg-white h-full rounded-full transition-all duration-1000"
              style={{
                width: `${
                  (achievement.progress / achievement.maxProgress) * 100
                }%`,
              }}
            />
          </div>
        )}

        {/* Encouraging Message */}
        <p className="text-white text-opacity-75 text-sm animate-fade-in">
          Keep up the great work! 🎉
        </p>
      </div>
    </div>
  );
}
