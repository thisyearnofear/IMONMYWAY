"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChallengeBrowser } from "@/components/challenges/ChallengeBrowser";
import { ChallengeCreation } from "@/components/challenges/ChallengeCreation";
import { ChallengeTemplate } from "@/lib/challenge-templates";

export default function ChallengeBrowserPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeTemplate | null>(null);
  
  const handleChallengeSelect = (challenge: ChallengeTemplate) => {
    setSelectedChallenge(challenge);
  };
  
  const handleChallengeCreated = (challenge: any) => {
    console.log('Challenge created:', challenge);
    // In a real app, this would navigate to the challenge tracking page
    setSelectedChallenge(null);
  };
  
  const handleCancel = () => {
    setSelectedChallenge(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 p-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Challenge <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Templates</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Pick from our curated challenges or create your own. Each challenge comes with specific conditions, 
            verification requirements, and rewards.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {selectedChallenge ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl mx-auto"
            >
              <ChallengeCreation
                challenge={selectedChallenge}
                onChallengeCreated={handleChallengeCreated}
                onCancel={handleCancel}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ChallengeBrowser
                onSelectChallenge={handleChallengeSelect}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}