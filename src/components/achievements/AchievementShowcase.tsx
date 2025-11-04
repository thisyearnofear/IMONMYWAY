"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  unlockDate?: Date;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementShowcaseProps {
  achievements: Achievement[];
  onAchievementClick?: (achievementId: string) => void;
  showProgress?: boolean;
  showRarity?: boolean;
}

export function AchievementShowcase({ 
  achievements, 
  onAchievementClick,
  showProgress = true,
  showRarity = true
}: AchievementShowcaseProps) {
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-400';
    }
  };

  const getRarityGradient = (rarity?: string) => {
    switch (rarity) {
      case 'rare': return 'from-blue-500/10 to-blue-700/10';
      case 'epic': return 'from-purple-500/10 to-purple-700/10';
      case 'legendary': return 'from-yellow-500/20 to-yellow-700/20';
      default: return 'from-gray-500/5 to-gray-700/5';
    }
  };

  const handleAchievementClick = (achievementId: string) => {
    if (onAchievementClick) {
      onAchievementClick(achievementId);
    }
    if (expandedAchievement === achievementId) {
      setExpandedAchievement(null);
    } else {
      setExpandedAchievement(achievementId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Achievements</h3>
        <span className="text-white/70 text-sm">
          {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            className={cn(
              "bg-gradient-to-br",
              getRarityGradient(achievement.rarity),
              "border rounded-xl p-4 cursor-pointer overflow-hidden",
              achievement.unlocked 
                ? cn("border-white/30", getRarityColor(achievement.rarity))
                : "border-white/10 opacity-60",
              "hover:scale-[1.02] transition-all duration-300 relative"
            )}
            onClick={() => handleAchievementClick(achievement.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
          >
            {/* Achievement icon with animation */}
            <motion.div
              className="text-4xl mb-3"
              animate={achievement.unlocked ? { 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {achievement.icon}
            </motion.div>
            
            <h4 className="font-bold text-white mb-1">{achievement.title}</h4>
            <p className="text-xs text-white/70 mb-3">{achievement.description}</p>
            
            {/* Progress bar for locked achievements */}
            {showProgress && !achievement.unlocked && achievement.progress !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(achievement.progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            
            {/* Status badge */}
            <div className="flex justify-between items-center">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                achievement.unlocked 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-gray-500/20 text-gray-400"
              )}>
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </span>
              
              {showRarity && achievement.rarity && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium capitalize",
                  "bg-white/10",
                  achievement.rarity === 'rare' && 'text-blue-400',
                  achievement.rarity === 'epic' && 'text-purple-400',
                  achievement.rarity === 'legendary' && 'text-yellow-400'
                )}>
                  {achievement.rarity}
                </span>
              )}
            </div>
            
            {/* Unlock celebration effect */}
            <AnimatePresence>
              {achievement.unlocked && expandedAchievement === achievement.id && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                      initial={{ scale: 0, y: 0, rotate: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        y: -50,
                        rotate: [0, 360]
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: i * 0.1
                      }}
                    >
                      🎉
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      {/* Expanded achievement details */}
      <AnimatePresence>
        {expandedAchievement && (
          <motion.div
            className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl border border-white/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {(() => {
              const achievement = achievements.find(a => a.id === expandedAchievement);
              if (!achievement) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{achievement.title}</h3>
                      <p className="text-white/70 mt-1">{achievement.description}</p>
                      
                      {achievement.unlocked && achievement.unlockDate && (
                        <div className="text-sm text-white/60 mt-2">
                          Unlocked: {new Date(achievement.unlockDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Share Achievement</Button>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}