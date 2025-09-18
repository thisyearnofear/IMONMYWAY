/**
 * Viral Experience - Gamified Social Sharing System
 * 
 * Features: Achievement system, social sharing, streak tracking, viral mechanics
 * Purpose: Make users want to share their achievements and invite friends
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useState, useEffect } from "react";
import { UnifiedButton } from "./UnifiedButton";
import { useToast } from "./UnifiedToast";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
  unlockedAt?: Date;
}

interface ViralMoment {
  type: "achievement" | "streak" | "milestone" | "challenge_complete";
  title: string;
  description: string;
  shareText: string;
  hashtags: string[];
  value?: number;
  icon?: string;
}

interface ViralExperienceProps {
  userId?: string;
  className?: string;
}

export function ViralExperience({ userId, className }: ViralExperienceProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentMoment, setRecentMoment] = useState<ViralMoment | null>(null);
  
  const { addToast } = useToast();

  // Sample achievements data
  const availableAchievements: Achievement[] = [
    {
      id: "first_bet",
      title: "First Steps",
      description: "Made your first punctuality bet",
      icon: "🎯",
      rarity: "common",
      points: 100,
    },
    {
      id: "perfect_week",
      title: "Perfect Week",
      description: "On time for 7 days straight",
      icon: "🔥",
      rarity: "rare",
      points: 500,
    },
    {
      id: "big_winner",
      title: "Big Winner",
      description: "Won a bet worth 100+ STT",
      icon: "💎",
      rarity: "epic",
      points: 1000,
    },
    {
      id: "legend",
      title: "Punctuality Legend",
      description: "Maintained 95%+ success rate for 30 days",
      icon: "👑",
      rarity: "legendary",
      points: 5000,
    },
  ];

  // Trigger viral moment
  const triggerViralMoment = (moment: ViralMoment) => {
    setRecentMoment(moment);
    setShowCelebration(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setRecentMoment(null);
    }, 5000);

    // Show achievement toast
    addToast({
      type: "achievement",
      title: moment.title,
      message: moment.description,
      shareData: {
        title: moment.title,
        text: moment.shareText,
        url: window.location.href,
      },
      duration: 8000,
    });
  };

  // Unlock achievement
  const unlockAchievement = (achievementId: string) => {
    const achievement = availableAchievements.find(a => a.id === achievementId);
    if (!achievement || achievements.find(a => a.id === achievementId)) return;

    const unlockedAchievement = {
      ...achievement,
      unlockedAt: new Date(),
    };

    setAchievements(prev => [...prev, unlockedAchievement]);
    setTotalPoints(prev => prev + achievement.points);

    // Trigger viral moment
    triggerViralMoment({
      type: "achievement",
      title: `🎉 ${achievement.title}`,
      description: achievement.description,
      shareText: `Just unlocked "${achievement.title}" on IMONMYWAY! ${achievement.icon} Who else is ready to bet on their punctuality? 💪`,
      hashtags: ["IMONMYWAY", "PunctualityChallenge", "Web3Gaming"],
      value: achievement.points,
      icon: achievement.icon,
    });
  };

  // Share achievement
  const shareAchievement = async (achievement: Achievement) => {
    const shareData = {
      title: `Achievement Unlocked: ${achievement.title}`,
      text: `I just unlocked "${achievement.title}" on IMONMYWAY! ${achievement.icon} Join me in the punctuality challenge!`,
      url: `${window.location.origin}?ref=${userId}`,
    };

    if ("share" in navigator) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        navigator.clipboard?.writeText(shareText);
        
        addToast({
          type: "success",
          message: "Achievement copied to clipboard! Share it with friends!",
        });
      }
    }
  };

  // Rarity colors
  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return "from-gray-400 to-gray-600";
      case "rare": return "from-blue-400 to-blue-600";
      case "epic": return "from-purple-400 to-purple-600";
      case "legendary": return "from-yellow-400 to-orange-500";
    }
  };

  // Achievement card
  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <motion.div
      className={cn(
        "relative p-4 rounded-xl border backdrop-blur-sm",
        "bg-gradient-to-br from-white/5 to-white/10",
        "border-white/20 hover:border-white/30 transition-all duration-300"
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Rarity glow */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-20 blur-xl",
        `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
      )} />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{achievement.icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{achievement.title}</h3>
            <p className="text-xs text-white/60 capitalize">{achievement.rarity}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-yellow-400">
              +{achievement.points}
            </div>
            {achievement.unlockedAt && (
              <div className="text-xs text-green-400">✓ Unlocked</div>
            )}
          </div>
        </div>
        
        <p className="text-sm text-white/80 mb-3">{achievement.description}</p>
        
        {achievement.unlockedAt && (
          <UnifiedButton
            variant="secondary"
            size="sm"
            onClick={() => shareAchievement(achievement)}
            className="w-full"
            icon="📤"
          >
            Share Achievement
          </UnifiedButton>
        )}
      </div>
    </motion.div>
  );

  // Celebration overlay
  const CelebrationOverlay = () => (
    <AnimatePresence>
      {showCelebration && recentMoment && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-br from-purple-600/90 to-pink-600/90 rounded-2xl p-8 max-w-md mx-4 text-center backdrop-blur-xl border border-white/20"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Confetti animation */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{
                    x: "50%",
                    y: "50%",
                    scale: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {recentMoment.icon || "🎉"}
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {recentMoment.title}
              </h2>
              
              <p className="text-white/90 mb-6">
                {recentMoment.description}
              </p>
              
              <div className="space-y-3">
                <UnifiedButton
                  variant="primary"
                  gradient
                  glow
                  onClick={() => shareAchievement(achievements[achievements.length - 1])}
                  className="w-full"
                >
                  🚀 Share with Friends
                </UnifiedButton>
                
                <UnifiedButton
                  variant="ghost"
                  onClick={() => setShowCelebration(false)}
                  className="w-full"
                >
                  Continue Playing
                </UnifiedButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
          <div className="text-2xl font-bold text-yellow-400">{totalPoints}</div>
          <div className="text-xs text-white/60">Total Points</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
          <div className="text-2xl font-bold text-orange-400">{currentStreak}</div>
          <div className="text-xs text-white/60">Day Streak</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-400">{achievements.length}</div>
          <div className="text-xs text-white/60">Achievements</div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Achievements</h3>
        <div className="grid gap-3">
          {availableAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <UnifiedButton
          variant="primary"
          gradient
          onClick={() => unlockAchievement("first_bet")}
          className="w-full"
        >
          🎯 Simulate Achievement
        </UnifiedButton>
        
        <UnifiedButton
          variant="secondary"
          onClick={() => triggerViralMoment({
            type: "milestone",
            title: "🔥 7-Day Streak!",
            description: "You're on fire! Keep it up!",
            shareText: "Just hit a 7-day punctuality streak on IMONMYWAY! 🔥 Who's ready to challenge me?",
            hashtags: ["PunctualityStreak", "IMONMYWAY"],
          })}
          className="w-full"
        >
          🔥 Simulate Streak
        </UnifiedButton>
      </div>

      {/* Celebration Overlay */}
      <CelebrationOverlay />
    </div>
  );
}

export default ViralExperience;