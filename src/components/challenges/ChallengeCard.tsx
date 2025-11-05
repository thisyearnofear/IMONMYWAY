"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { ChallengeTemplate, ChallengeCondition, challengeService } from "@/lib/challenge-templates";
import { AIGeneratedChallenge } from "@/lib/ai-challenge-generator";
import { culturalAdaptation } from "@/lib/cultural-adaptation";
import { useMobileExperience } from "@/hooks/useMobileExperience";

interface ChallengeCardProps {
  challenge: ChallengeTemplate;
  onSelect: (challenge: ChallengeTemplate) => void;
  isFeatured?: boolean;
  className?: string;
  culturalRelevance?: number;
}

export function ChallengeCard({ 
  challenge, 
  onSelect, 
  isFeatured = false,
  className = "",
  culturalRelevance 
}: ChallengeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { triggerHaptic } = useMobileExperience();
  
  // Cultural adaptation
  const culturalContext = culturalAdaptation.getContext();
  const adaptedChallenge = {
    ...challenge,
    estimatedDistance: culturalAdaptation.formatNumber(challenge.estimatedDistance, 'distance'),
    estimatedTime: culturalAdaptation.formatNumber(challenge.estimatedTime, 'time'),
    description: challenge.description + (culturalRelevance ? ` (${culturalRelevance}% match for your region)` : '')
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'hard': return 'text-orange-400 bg-orange-500/10';
      case 'extreme': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'adventure': return 'from-blue-500 to-cyan-500';
      case 'fitness': return 'from-green-500 to-emerald-500';
      case 'social': return 'from-purple-500 to-violet-500';
      case 'creative': return 'from-pink-500 to-rose-500';
      case 'charity': return 'from-yellow-500 to-amber-500';
      case 'viral': return 'from-red-500 to-orange-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const handleCardClick = () => {
    triggerHaptic('light');
    onSelect(challenge);
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      className={cn(
        "bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 rounded-2xl overflow-hidden cursor-pointer relative group",
        "hover:scale-[1.02] transition-all duration-300",
        isFeatured && "ring-2 ring-yellow-400/50",
        culturalRelevance && culturalRelevance > 80 && "ring-2 ring-green-400/30",
        className
      )}
      onClick={handleCardClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Category gradient header */}
      <div className={`h-2 bg-gradient-to-r ${getCategoryColor(challenge.category)} rounded-t-xl`}></div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-white text-lg">{challenge.name}</h3>
            <p className="text-sm text-white/70 mt-1 line-clamp-2">{adaptedChallenge.description}</p>
          </div>
          <div className="flex flex-col gap-1">
            {isFeatured && (
              <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                ⭐ Featured
              </div>
            )}
            {culturalRelevance && culturalRelevance > 70 && (
              <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                🌍 {culturalRelevance}% match
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {challenge.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index} 
              className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="text-white/60">Time</div>
              <div className="text-white font-medium">{adaptedChallenge.estimatedTime}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <div>
              <div className="text-white/60">Distance</div>
              <div className="text-white font-medium">{adaptedChallenge.estimatedDistance}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getDifficultyColor(challenge.difficulty))}>
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </span>
          
          <span className="text-white font-bold">
            {challenge.stakeAmount.suggested} <span className="text-sm text-white/70">STT</span>
          </span>
        </div>

        {/* Viral factor indicator */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-white/60">Viral potential</span>
          <div className="flex">
            {[...Array(10)].map((_, i) => (
              <span 
                key={i} 
                className={cn("text-xs", i < challenge.viralFactor ? "text-red-400" : "text-white/30")}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Expandable details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="mt-4 pt-4 border-t border-white/10"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <h4 className="font-medium text-white mb-2">Conditions:</h4>
              <ul className="text-xs text-white/70 space-y-1">
                {challenge.conditions.slice(0, 3).map((condition, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{condition.description}</span>
                  </li>
                ))}
              </ul>
              {challenge.conditions.length > 3 && (
                <p className="text-xs text-white/50 mt-2">
                  +{challenge.conditions.length - 3} more conditions
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleExpandToggle}
          >
            {isExpanded ? "Show Less" : "View Details"}
          </Button>
          
          {/* Cultural quick action */}
          {culturalRelevance && culturalRelevance > 80 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCardClick}
              className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium border border-green-500/30 hover:bg-green-500/30 transition-colors"
            >
              Perfect Match! →
            </motion.button>
          )}
        </div>
        
        {/* Hover effect overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none rounded-2xl"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}