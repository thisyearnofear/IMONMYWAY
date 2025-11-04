"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { formatTime, formatDistance } from "@/lib/utils";

interface ProgressDashboardProps {
  currentProgress: number;
  timeRemaining: number;
  distanceRemaining: number;
  reputationScore: number;
  streakCount: number;
  onDashboardAction?: (action: string) => void;
  className?: string;
  showAchievementMilestones?: boolean;
  nextAchievement?: {
    title: string;
    progress: number;
    target: number;
  };
}

export function ProgressDashboard({ 
  currentProgress, 
  timeRemaining, 
  distanceRemaining, 
  reputationScore, 
  streakCount,
  onDashboardAction,
  className = "",
  showAchievementMilestones = true,
  nextAchievement
}: ProgressDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Trigger pulse animation when values change significantly
  const triggerPulse = () => {
    setPulseAnimation(true);
    setTimeout(() => setPulseAnimation(false), 1000);
  };

  const handleExpand = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatReputation = (score: number) => {
    if (score >= 900) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (score >= 750) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (score >= 600) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { label: 'Needs Improvement', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const reputation = formatReputation(reputationScore);
  const progressPercentage = Math.round(currentProgress * 100);
  const nextAchievementPercentage = nextAchievement ? (nextAchievement.progress / nextAchievement.target) * 100 : 0;

  return (
    <div className={cn("bg-gradient-to-br from-indigo-950/30 to-purple-950/30 rounded-2xl p-6 border border-white/20 shadow-2xl", className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Your Progress</h2>
        <p className="text-white/70">Track your journey in real-time</p>
      </div>

      {/* Main Progress Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          
          {/* Progress circle */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              background: `conic-gradient(from 0deg, #6366f1 0%, #8b5cf6 ${progressPercentage}%, #1e293b ${progressPercentage}%)`,
              mask: 'radial-gradient(black 55%, transparent 56%)',
              WebkitMask: 'radial-gradient(black 55%, transparent 56%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1],
              scale: [0.8, 1]
            }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-4 rounded-full bg-gray-900 flex flex-col items-center justify-center">
              <motion.div
                className="text-3xl font-bold text-white"
                animate={pulseAnimation ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {progressPercentage}%
              </motion.div>
              <div className="text-white/70 text-sm">Complete</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Time Remaining */}
        <div 
          className="bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => handleExpand('time')}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-white font-bold text-lg">{formatTime(timeRemaining)}</div>
            <div className="text-white/70 text-sm">Time Remaining</div>
          </div>
        </div>

        {/* Distance Remaining */}
        <div 
          className="bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => handleExpand('distance')}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📍</div>
            <div className="text-white font-bold text-lg">{formatDistance(distanceRemaining)}</div>
            <div className="text-white/70 text-sm">Distance Left</div>
          </div>
        </div>

        {/* Reputation Score */}
        <div 
          className="bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => handleExpand('reputation')}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className={`font-bold text-lg ${reputation.color}`}>{reputationScore}</div>
            <div className="text-white/70 text-sm">Reputation</div>
          </div>
        </div>

        {/* Streak Count */}
        <div 
          className="bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => handleExpand('streak')}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-white font-bold text-lg">{streakCount}</div>
            <div className="text-white/70 text-sm">Streak</div>
          </div>
        </div>
      </div>

      {/* Next Achievement Progress */}
      {showAchievementMilestones && nextAchievement && (
        <div 
          className="bg-white/10 rounded-xl p-4 border border-white/10 mb-4 cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => handleExpand('achievement')}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Next Achievement</span>
            <span className="text-white font-medium text-sm">{Math.round(nextAchievementPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <motion.div 
              className="h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, nextAchievementPercentage)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="text-white font-medium">{nextAchievement.title}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button 
          variant="glass" 
          className="w-full"
          onClick={() => onDashboardAction?.('share')}
        >
          📤 Share Progress
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onDashboardAction?.('invite')}
        >
          👥 Invite Friends
        </Button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expandedSection && (
          <motion.div
            className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {expandedSection === 'time' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white">Time Status</h4>
                <p className="text-white/70 text-sm">
                  {timeRemaining > 0 
                    ? `You have ${formatTime(timeRemaining)} remaining to reach your destination.` 
                    : 'Time limit exceeded!'}
                </p>
                <div className="text-xs text-white/60 mt-2">
                  ETA: {timeRemaining > 0 ? new Date(Date.now() + timeRemaining * 1000).toLocaleTimeString() : 'Overdue'}
                </div>
              </div>
            )}
            
            {expandedSection === 'distance' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white">Distance Status</h4>
                <p className="text-white/70 text-sm">
                  {distanceRemaining > 0 
                    ? `You have ${formatDistance(distanceRemaining)} left to travel.` 
                    : 'You have reached your destination!'}
                </p>
                <div className="text-xs text-white/60 mt-2">
                  Speed: {distanceRemaining > 0 && timeRemaining > 0 
                    ? (distanceRemaining / timeRemaining * 3600).toFixed(1) 
                    : '0'} km/h
                </div>
              </div>
            )}
            
            {expandedSection === 'reputation' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white">Reputation Score</h4>
                <p className="text-white/70 text-sm">
                  Your reputation score reflects your punctuality and betting history.
                </p>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${reputation.bg} ${reputation.color}`}>
                  {reputation.label}
                </div>
              </div>
            )}
            
            {expandedSection === 'streak' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white">Current Streak</h4>
                <p className="text-white/70 text-sm">
                  Your streak represents consecutive successful commitments.
                </p>
                <div className="text-xs text-white/60 mt-2">
                  {streakCount > 0 
                    ? `Keep it up! You've been on time for ${streakCount} commitments in a row.` 
                    : 'No active streak. Make a successful commitment to start one!'}
                </div>
              </div>
            )}
            
            {expandedSection === 'achievement' && nextAchievement && (
              <div className="space-y-2">
                <h4 className="font-bold text-white">{nextAchievement.title}</h4>
                <p className="text-white/70 text-sm">
                  {nextAchievement.title} achievement progress.
                </p>
                <div className="text-xs text-white/60 mt-2">
                  {Math.round(nextAchievement.progress)} / {nextAchievement.target} completed
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}