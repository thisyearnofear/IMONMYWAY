"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/PremiumButton";
import { ChallengeTemplate, getPopularChallenges } from "@/lib/challenge-templates";

interface ViralChallengesProps {
  challenges: ChallengeTemplate[];
  onSelectChallenge: (challenge: ChallengeTemplate) => void;
}

export function ViralChallenges({ challenges, onSelectChallenge }: ViralChallengesProps) {
  const viralChallenges = challenges
    .filter(c => c.viralFactor >= 7)
    .sort((a, b) => b.viralFactor - a.viralFactor)
    .slice(0, 3);

  if (viralChallenges.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-r from-violet-900/20 to-gold-900/20 rounded-3xl border border-violet-500/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-gold-400 via-violet-400 to-gold-400 bg-clip-text text-transparent">
              Viral Challenges
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Participate in our most engaging challenges that are spreading across social media
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {viralChallenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              className="bg-gradient-to-br from-graphite-700/50 to-graphite-800/30 backdrop-blur-lg rounded-2xl p-6 border border-violet-500/20 hover:border-gold-500/30 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {index === 0 ? '🔥' : index === 1 ? '🌟' : '✨'}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{challenge.name}</h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{challenge.description}</p>
                
                <div className="flex justify-center gap-2 mb-4">
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                    Viral {challenge.viralFactor}/10
                  </span>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                    {challenge.category}
                  </span>
                </div>

                <div className="text-2xl font-bold text-gold-400 mb-4">
                  {challenge.stakeAmount.suggested} <span className="text-sm text-white/70">STT</span>
                </div>

                <Button 
                  variant="gradient"
                  className="w-full"
                  onClick={() => onSelectChallenge(challenge)}
                >
                  Take Challenge
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}