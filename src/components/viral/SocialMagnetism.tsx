"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simple SVG icons
const Heart = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z"/>
  </svg>
);

const Flame = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd"/>
  </svg>
);

const Lightning = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
  </svg>
);

const Rocket = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd"/>
    <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z"/>
  </svg>
);

interface SocialMagnetismProps {
  children: React.ReactNode;
  onViralAction?: (action: string, data: any) => void;
  enableRealTimeStats?: boolean;
  enableSocialProof?: boolean;
  enableViralChallenges?: boolean;
}

interface ViralStats {
  activeUsers: number;
  totalShares: number;
  viralScore: number;
  trendingActions: string[];
  socialProof: {
    recentActions: Array<{
      user: string;
      action: string;
      timestamp: number;
    }>;
    popularFeatures: string[];
  };
}

interface ViralChallenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  reward: string;
  shareText: string;
  timeLeft: number;
}

const VIRAL_CHALLENGES: ViralChallenge[] = [
  {
    id: "network_explorer",
    title: "Network Explorer",
    description: "Connect to 3 different networks",
    icon: <Lightning className="w-5 h-5" />,
    progress: 0,
    target: 3,
    reward: "Explorer Badge + 500 XP",
    shareText: "Just completed the Network Explorer challenge! 🚀 #Web3Explorer",
    timeLeft: 86400000 // 24 hours
  },
  {
    id: "social_catalyst",
    title: "Social Catalyst",
    description: "Get 5 friends to join",
    icon: <Users className="w-5 h-5" />,
    progress: 0,
    target: 5,
    reward: "Catalyst Crown + 1000 XP",
    shareText: "I'm a Social Catalyst! Join me in the Web3 revolution! 👑",
    timeLeft: 604800000 // 7 days
  },
  {
    id: "streak_legend",
    title: "Streak Legend",
    description: "Maintain 30-day streak",
    icon: <Flame className="w-5 h-5" />,
    progress: 0,
    target: 30,
    reward: "Legend Status + Exclusive NFT",
    shareText: "30-day streak achieved! I'm officially a Web3 Legend! 🔥",
    timeLeft: 2592000000 // 30 days
  }
];

export const SocialMagnetism: React.FC<SocialMagnetismProps> = ({
  children,
  onViralAction,
  enableRealTimeStats = true,
  enableSocialProof = true,
  enableViralChallenges = true
}) => {
  const [viralStats, setViralStats] = useState<ViralStats>({
    activeUsers: 1247,
    totalShares: 8934,
    viralScore: 95,
    trendingActions: ["network_connect", "achievement_unlock", "social_share"],
    socialProof: {
      recentActions: [
        { user: "Alex", action: "unlocked Network Pioneer", timestamp: Date.now() - 30000 },
        { user: "Sarah", action: "shared achievement", timestamp: Date.now() - 60000 },
        { user: "Mike", action: "reached Level 5", timestamp: Date.now() - 90000 }
      ],
      popularFeatures: ["Gamified Progress", "Social Sharing", "Achievement System"]
    }
  });

  const [challenges, setChallenges] = useState<ViralChallenge[]>(VIRAL_CHALLENGES);
  const [showViralMoment, setShowViralMoment] = useState<string | null>(null);
  const [pulseElements, setPulseElements] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time stats simulation
  useEffect(() => {
    if (!enableRealTimeStats) return;

    const interval = setInterval(() => {
      setViralStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        totalShares: prev.totalShares + Math.floor(Math.random() * 3),
        viralScore: Math.min(100, prev.viralScore + (Math.random() - 0.5) * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [enableRealTimeStats]);

  // Social proof updates
  useEffect(() => {
    if (!enableSocialProof) return;

    const names = ["Alex", "Sarah", "Mike", "Emma", "David", "Lisa", "John", "Maria"];
    const actions = [
      "unlocked Network Pioneer",
      "shared achievement",
      "reached Level 5",
      "completed challenge",
      "invited friends",
      "earned streak bonus"
    ];

    const interval = setInterval(() => {
      const newAction = {
        user: names[Math.floor(Math.random() * names.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        timestamp: Date.now()
      };

      setViralStats(prev => ({
        ...prev,
        socialProof: {
          ...prev.socialProof,
          recentActions: [newAction, ...prev.socialProof.recentActions.slice(0, 4)]
        }
      }));
    }, 15000);

    return () => clearInterval(interval);
  }, [enableSocialProof]);

  // Viral moment trigger
  const triggerViralMoment = (type: string) => {
    setShowViralMoment(type);
    createPulseEffect();
    setTimeout(() => setShowViralMoment(null), 3000);
    onViralAction?.(type, { timestamp: Date.now(), viralScore: viralStats.viralScore });
  };

  // Pulse effect for viral moments
  const createPulseEffect = () => {
    const newPulses = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 60
    }));
    
    setPulseElements(newPulses);
    setTimeout(() => setPulseElements([]), 2000);
  };

  // Challenge progress update
  const updateChallengeProgress = (challengeId: string, increment: number = 1) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.id === challengeId) {
        const newProgress = Math.min(challenge.target, challenge.progress + increment);
        const completed = newProgress === challenge.target && challenge.progress < challenge.target;
        
        if (completed) {
          triggerViralMoment(`challenge_completed_${challengeId}`);
        }
        
        return { ...challenge, progress: newProgress };
      }
      return challenge;
    }));
  };

  // Share challenge
  const shareChallenge = async (challenge: ViralChallenge) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: challenge.title,
          text: challenge.shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(
          `${challenge.shareText} ${window.location.href}`
        );
      }
      
      triggerViralMoment("challenge_shared");
      updateChallengeProgress("social_catalyst");
    } catch (error) {
      console.log("Sharing not available");
    }
  };

  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "< 1h";
  };

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pulse Effects */}
      <AnimatePresence>
        {pulseElements.map(pulse => (
          <motion.div
            key={pulse.id}
            initial={{ 
              opacity: 0.8, 
              scale: 0,
              x: `${pulse.x}%`,
              y: `${pulse.y}%`
            }}
            animate={{ 
              opacity: 0, 
              scale: 3,
              x: `${pulse.x}%`,
              y: `${pulse.y}%`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute pointer-events-none z-30"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Real-time Stats HUD */}
      {enableRealTimeStats && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-20 left-4 z-40 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10"
        >
          <div className="space-y-2 text-white text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>{viralStats.activeUsers.toLocaleString()} online</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <span>{viralStats.totalShares.toLocaleString()} shares</span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span>Viral Score: {Math.round(viralStats.viralScore)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Social Proof Feed */}
      {enableSocialProof && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 z-40 max-w-xs"
        >
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Live Activity
            </h4>
            <div className="space-y-2">
              {viralStats.socialProof.recentActions.slice(0, 3).map((action, index) => (
                <motion.div
                  key={`${action.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-white/80"
                >
                  <span className="font-medium text-blue-400">{action.user}</span> {action.action}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Viral Challenges */}
      {enableViralChallenges && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-4 left-4 z-40 max-w-sm"
        >
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Lightning className="w-4 h-4 text-yellow-400" />
              Viral Challenges
            </h4>
            <div className="space-y-3">
              {challenges.slice(0, 2).map(challenge => (
                <div key={challenge.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {challenge.icon}
                      <span className="text-sm font-medium text-white">{challenge.title}</span>
                    </div>
                    <span className="text-xs text-white/60">
                      {formatTimeLeft(challenge.timeLeft)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">
                      {challenge.progress}/{challenge.target}
                    </span>
                    <button
                      onClick={() => shareChallenge(challenge)}
                      className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Viral Moment Celebration */}
      <AnimatePresence>
        {showViralMoment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-8 py-4 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <Rocket className="w-8 h-8" />
                <div>
                  <h3 className="text-2xl font-bold">Viral Moment!</h3>
                  <p className="text-lg opacity-90">You&apos;re trending! 🚀</p>
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

      {/* Hidden triggers for testing */}
      <div className="hidden">
        <button onClick={() => updateChallengeProgress("network_explorer")}>
          Update Network Explorer
        </button>
        <button onClick={() => updateChallengeProgress("social_catalyst")}>
          Update Social Catalyst
        </button>
        <button onClick={() => updateChallengeProgress("streak_legend")}>
          Update Streak Legend
        </button>
        <button onClick={() => triggerViralMoment("manual_trigger")}>
          Trigger Viral Moment
        </button>
      </div>
    </div>
  );
};

export default SocialMagnetism;