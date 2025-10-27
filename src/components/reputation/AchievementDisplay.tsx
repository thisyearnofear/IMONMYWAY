"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useAIEngine } from "@/hooks/useAIEngine";
import { Card } from "@/components/ui/PremiumCard";
import { AchievementCelebration } from "@/components/ui/AchievementCelebration";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
  category: 'punctuality' | 'social' | 'distance' | 'consistency' | 'special';
}

interface AchievementDisplayProps {
  userId?: string;
  showPredictions?: boolean;
  limit?: number;
}

export function AchievementDisplay({ 
  userId, 
  showPredictions = false, 
  limit = 6 
}: AchievementDisplayProps) {
  const { address } = useWallet();
  const { predictAchievements } = useAIEngine();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sample achievements data - in a real app, this would come from your backend
  const sampleAchievements: Achievement[] = [
    {
      id: "first-journey",
      title: "First Journey",
      description: "Complete your first tracked journey",
      icon: "🕐",
      unlocked: true,
      category: "punctuality",
      unlockedAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: "punctual-pro",
      title: "Punctual Pro",
      description: "Arrive on time 10 times in a row",
      icon: "⏱️",
      unlocked: true,
      progress: 10,
      maxProgress: 10,
      category: "punctuality",
      unlockedAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      id: "social-butterfly",
      title: "Social Butterfly",
      description: "Get 5 friends to bet on your journey",
      icon: "⏱️",
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      category: "social"
    },
    {
      id: "distance-warrior",
      title: "Distance Warrior",
      description: "Travel over 100km in total",
      icon: "🧭",
      unlocked: false,
      progress: 67,
      maxProgress: 100,
      category: "distance"
    },
    {
      id: "consistency-king",
      title: "Consistency King",
      description: "Use the app for 30 consecutive days",
      icon: "⏰",
      unlocked: false,
      progress: 12,
      maxProgress: 30,
      category: "consistency"
    },
    {
      id: "early-adopter",
      title: "Early Adopter",
      description: "Join the beta program",
      icon: "⏳",
      unlocked: true,
      category: "special",
      unlockedAt: new Date(Date.now() - 604800000) // 1 week ago
    }
  ];

  const loadAchievements = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd fetch from your backend
      // For now, we'll use sample data
      const userAchievements = sampleAchievements.slice(0, limit);
      setAchievements(userAchievements);
      
      // Check for newly unlocked achievements
      const newlyUnlocked = userAchievements.find(
        a => a.unlocked && a.unlockedAt && 
        Date.now() - a.unlockedAt.getTime() < 5000 // Within last 5 seconds
      );
      
      if (newlyUnlocked && !celebratingAchievement) {
        setCelebratingAchievement(newlyUnlocked);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, celebratingAchievement]);

  useEffect(() => {
    loadAchievements();
  }, [address, userId, loadAchievements]);

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'punctuality': return 'text-gold';
      case 'social': return 'text-violet';
      case 'distance': return 'text-gold';
      case 'consistency': return 'text-violet';
      case 'special': return 'text-gold';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 border border-white/10 bg-black/20">
        <div className="animate-pulse mb-4">
          <div className="h-6 bg-gradient-to-r from-gold/20 to-violet/20 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gradient-to-r from-gold/10 to-violet/10 rounded-lg border border-white/5"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 border border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-display">
            ACHIEVEMENTS_UNEARNED
          </h2>
          <div className="text-sm text-gold/60 font-mono">
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`
                relative p-4 rounded-lg transition-all duration-300 hover:scale-105
                ${achievement.unlocked 
                  ? `bg-gradient-to-br from-gold/10 to-violet/10 border border-gold/20` 
                  : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50'
                }
              `}
            >
              {/* Achievement Icon */}
              <div className={`text-2xl mb-2 text-center ${achievement.unlocked ? getCategoryColor(achievement.category) : 'text-gray-500'}`}>
                {achievement.icon}
              </div>

              {/* Achievement Title */}
              <h3 className={`
                text-xs font-semibold text-center mb-2 font-mono uppercase tracking-wider
                ${achievement.unlocked ? 'text-white' : 'text-gray-400'}
              `}>
                {achievement.title}
              </h3>

              {/* Progress Bar (for incomplete achievements) */}
              {!achievement.unlocked && achievement.progress && achievement.maxProgress && (
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-gradient-to-r from-gold to-violet h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                    }}
                  />
                </div>
              )}

              {/* Progress Text */}
              {!achievement.unlocked && achievement.progress && achievement.maxProgress && (
                <div className="text-xs text-center text-gold/60 font-mono">
                  {achievement.progress}/{achievement.maxProgress}
                </div>
              )}

              {/* Unlocked Indicator */}
              {achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Button */}
        {achievements.length >= limit && (
          <div className="text-center mt-6">
            <button className="text-gold hover:text-gold/80 font-mono text-sm transition-colors border border-gold/30 px-4 py-2 rounded">
              VIEW_ALL_ACHIEVEMENTS_→
            </button>
          </div>
        )}
      </Card>

      {/* Achievement Celebration Modal */}
      {celebratingAchievement && (
        <AchievementCelebration
          achievement={celebratingAchievement}
          onComplete={() => setCelebratingAchievement(null)}
        />
      )}
    </>
  );
}