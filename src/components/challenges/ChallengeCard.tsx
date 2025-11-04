"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { ChallengeTemplate, ChallengeCondition, challengeService } from "@/lib/challenge-templates";
import { AIGeneratedChallenge } from "@/lib/ai-challenge-generator";

interface ChallengeCardProps {
  challenge: ChallengeTemplate;
  onSelect: (challenge: ChallengeTemplate) => void;
  isFeatured?: boolean;
  className?: string;
}

export function ChallengeCard({ 
  challenge, 
  onSelect, 
  isFeatured = false,
  className = "" 
}: ChallengeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <motion.div
      className={cn(
        "bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 rounded-2xl p-5 cursor-pointer overflow-hidden",
        "hover:scale-[1.02] transition-all duration-300 relative",
        isFeatured && "ring-2 ring-yellow-400/50",
        className
      )}
      onClick={() => onSelect(challenge)}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Category gradient header */}
      <div className={`h-2 bg-gradient-to-r ${getCategoryColor(challenge.category)} rounded-t-xl`}></div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-white text-lg">{challenge.name}</h3>
            <p className="text-sm text-white/70 mt-1">{challenge.description}</p>
          </div>
          {isFeatured && (
            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </div>
          )}
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
              <div className="text-white font-medium">{challenge.estimatedTime} min</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <div>
              <div className="text-white/60">Distance</div>
              <div className="text-white font-medium">{challenge.estimatedDistance} km</div>
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

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? "Show Less" : "View Details"}
        </Button>
      </div>
    </motion.div>
  );
}