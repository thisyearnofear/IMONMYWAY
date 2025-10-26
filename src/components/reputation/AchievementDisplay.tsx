"use client";

import { useState, useEffect } from "react";
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
      icon: "🚀",
      unlocked: true,
      category: "punctuality",
      unlockedAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: "punctual-pro",
      title: "Punctual Pro",
      description: "Arrive on time 10 times in a row",
      icon: "⏰",
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
      icon: "🦋",
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      category: "social"
    },
    {
      id: "distance-warrior",
      title: "Distance Warrior",
      description: "Travel over 100km in total",
      icon: "🏃‍♂️",
      unlocked: false,
      progress: 67,
      maxProgress: 100,
      category: "distance"
    },
    {
      id: "consistency-king",
      title: "Consistency King",
      description: "Use the app for 30 consecutive days",
      icon: "👑",
      unlocked: false,
      progress: 12,
      maxProgress: 30,
      category: "consistency"
    },
    {
      id: "early-adopter",
      title: "Early Adopter",
      description: "Join the beta program",
      icon: "🌟",
      unlocked: true,
      category: "special",
      unlockedAt: new Date(Date.now() - 604800000) // 1 week ago
    }
  ];

  useEffect(() => {
    loadAchievements();
  }, [address, userId]);

  const loadAchievements = async () => {
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
  };

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'punctuality': return 'from-blue-500 to-cyan-500';
      case 'social': return 'from-pink-500 to-purple-500';
      case 'distance': return 'from-green-500 to-emerald-500';
      case 'consistency': return 'from-orange-500 to-red-500';
      case 'special': return 'from-yellow-500 to-amber-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-mono">
            ACHIEVEMENTS_UNLOCKED
          </h2>
          <div className="text-sm text-white/60 font-mono">
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`
                relative p-4 rounded-lg border transition-all duration-300 hover:scale-105
                ${achievement.unlocked 
                  ? `bg-gradient-to-br ${getCategoryColor(achievement.category)} border-white/20` 
                  : 'bg-gray-800 border-gray-600 opacity-60'
                }
              `}
            >
              {/* Achievement Icon */}
              <div className="text-3xl mb-2 text-center">
                {achievement.icon}
              </div>

              {/* Achievement Title */}
              <h3 className={`
                text-sm font-semibold text-center mb-1
                ${achievement.unlocked ? 'text-white' : 'text-gray-400'}
              `}>
                {achievement.title}
              </h3>

              {/* Achievement Description */}
              <p className={`
                text-xs text-center mb-2
                ${achievement.unlocked ? 'text-white/80' : 'text-gray-500'}
              `}>
                {achievement.description}
              </p>

              {/* Progress Bar (for incomplete achievements) */}
              {!achievement.unlocked && achievement.progress && achievement.maxProgress && (
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                    }}
                  />
                </div>
              )}

              {/* Progress Text */}
              {!achievement.unlocked && achievement.progress && achievement.maxProgress && (
                <div className="text-xs text-center text-gray-400">
                  {achievement.progress}/{achievement.maxProgress}
                </div>
              )}

              {/* Unlocked Indicator */}
              {achievement.unlocked && (
                <div className="absolute top-2 right-2 text-yellow-400">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Button */}
        {achievements.length >= limit && (
          <div className="text-center mt-6">
            <button className="text-blue-400 hover:text-blue-300 text-sm font-mono transition-colors">
              VIEW_ALL_ACHIEVEMENTS →
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