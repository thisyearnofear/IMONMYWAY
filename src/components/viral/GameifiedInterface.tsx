"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Simple SVG icons to replace lucide-react
const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
  </svg>
);

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h9a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25H12v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Z"/>
  </svg>
);

const Share2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

const Crown = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z"/>
    <path fillRule="evenodd" d="M22.5 9.75l-2.25-2.25V21a.75.75 0 01-.75.75H4.5A.75.75 0 014.5 21V7.5L2.25 9.75H1.5v-3h21v3h-.75z" clipRule="evenodd"/>
  </svg>
);

const Gift = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z"/>
  </svg>
);

interface GameifiedInterfaceProps {
  children: React.ReactNode;
  onViralMoment?: (type: string, data: any) => void;
  enableAchievements?: boolean;
  enableStreaks?: boolean;
  enableSocialSharing?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  shareText: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface UserProgress {
  level: number;
  xp: number;
  streak: number;
  achievements: Achievement[];
  totalShares: number;
  viralScore: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_connection",
    title: "Network Pioneer",
    description: "Connected to your first blockchain network",
    icon: <Zap className="w-5 h-5" />,
    unlocked: false,
    shareText: "Just became a Network Pioneer! 🚀 #Web3Journey",
    rarity: "common"
  },
  {
    id: "streak_master",
    title: "Consistency King",
    description: "Maintained a 7-day streak",
    icon: <Crown className="w-5 h-5" />,
    unlocked: false,
    shareText: "7-day streak achieved! I'm on fire! 🔥 #ConsistencyKing",
    rarity: "rare"
  },
  {
    id: "social_butterfly",
    title: "Viral Catalyst",
    description: "Shared 10 achievements with friends",
    icon: <Share2 className="w-5 h-5" />,
    unlocked: false,
    shareText: "Just became a Viral Catalyst! Spreading the Web3 love! 💫",
    rarity: "epic"
  },
  {
    id: "legend",
    title: "Web3 Legend",
    description: "Reached maximum level with perfect streak",
    icon: <Trophy className="w-5 h-5" />,
    unlocked: false,
    shareText: "I'm officially a Web3 Legend! 👑 Join me on this incredible journey!",
    rarity: "legendary"
  }
];

export const GameifiedInterface: React.FC<GameifiedInterfaceProps> = ({
  children,
  onViralMoment,
  enableAchievements = true,
  enableStreaks = true,
  enableSocialSharing = true
}) => {
  const [progress, setProgress] = useState<UserProgress>({
    level: 1,
    xp: 0,
    streak: 0,
    achievements: ACHIEVEMENTS,
    totalShares: 0,
    viralScore: 0
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Particle System
  const createParticleExplosion = () => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  // Viral Moment Trigger
  const triggerViralMoment = (type: string, data: any) => {
    createParticleExplosion();
    onViralMoment?.(type, data);
  };

  // XP and Level System
  const addXP = useCallback((amount: number, reason: string) => {
    setProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      const leveledUp = newLevel > prev.level;

      if (leveledUp) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
        triggerViralMoment("level_up", { level: newLevel, reason });
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        viralScore: prev.viralScore + (leveledUp ? 50 : 10)
      };
    });
  }, []);

  // Achievement System
  const unlockAchievement = (achievementId: string) => {
    setProgress(prev => {
      const achievement = prev.achievements.find(a => a.id === achievementId);
      if (!achievement || achievement.unlocked) return prev;

      const updatedAchievements = prev.achievements.map(a =>
        a.id === achievementId ? { ...a, unlocked: true } : a
      );

      setShowAchievement(achievement);
      setTimeout(() => setShowAchievement(null), 4000);
      
      triggerViralMoment("achievement_unlocked", achievement);
      
      return {
        ...prev,
        achievements: updatedAchievements,
        viralScore: prev.viralScore + getRarityScore(achievement.rarity)
      };
    });
  };

  // Social Sharing
  const shareAchievement = async (achievement: Achievement) => {
    if (!enableSocialSharing) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: achievement.title,
          text: achievement.shareText,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${achievement.shareText} ${window.location.href}`
        );
      }

      setProgress(prev => ({
        ...prev,
        totalShares: prev.totalShares + 1,
        viralScore: prev.viralScore + 25
      }));

      addXP(50, "shared_achievement");
    } catch (error) {
      console.log("Sharing not available");
    }
  };

  const getRarityScore = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return 25;
      case "rare": return 50;
      case "epic": return 100;
      case "legendary": return 250;
      default: return 25;
    }
  };

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return "from-gray-400 to-gray-600";
      case "rare": return "from-blue-400 to-blue-600";
      case "epic": return "from-purple-400 to-purple-600";
      case "legendary": return "from-yellow-400 to-yellow-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  // Auto-trigger achievements based on interactions
  useEffect(() => {
    const handleInteraction = () => {
      addXP(10, "user_interaction");
    };

    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, [addXP]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Particle System */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: `${particle.x}%`,
              y: `${particle.y}%`
            }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,
              x: `${particle.x + (Math.random() - 0.5) * 50}%`,
              y: `${particle.y + (Math.random() - 0.5) * 50}%`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute pointer-events-none z-50"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Progress HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-40 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10"
      >
        <div className="flex items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Level {progress.level}</span>
          </div>
          <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.xp % 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {enableStreaks && (
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-sm">{progress.streak}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <div>
                  <h3 className="text-2xl font-bold">Level Up!</h3>
                  <p className="text-lg">You reached Level {progress.level}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Unlock */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 z-50 max-w-sm"
          >
            <div className={`bg-gradient-to-r ${getRarityColor(showAchievement.rarity)} p-0.5 rounded-2xl`}>
              <div className="bg-black/90 backdrop-blur-md rounded-2xl p-4">
                <div className="flex items-start gap-3 text-white">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {showAchievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{showAchievement.title}</h4>
                    <p className="text-sm text-white/80">{showAchievement.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(showAchievement.rarity)}`}>
                        {showAchievement.rarity.toUpperCase()}
                      </span>
                      {enableSocialSharing && (
                        <button
                          onClick={() => shareAchievement(showAchievement)}
                          className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          Share
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Hidden triggers for achievements */}
      <div className="hidden">
        <button onClick={() => unlockAchievement("first_connection")}>
          Trigger First Connection
        </button>
        <button onClick={() => unlockAchievement("streak_master")}>
          Trigger Streak Master
        </button>
        <button onClick={() => unlockAchievement("social_butterfly")}>
          Trigger Social Butterfly
        </button>
        <button onClick={() => unlockAchievement("legend")}>
          Trigger Legend
        </button>
      </div>
    </div>
  );
};

export default GameifiedInterface;