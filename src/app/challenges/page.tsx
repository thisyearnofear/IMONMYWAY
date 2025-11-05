"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChallengeBrowser } from "@/components/challenges/ChallengeBrowser";
import { ChallengeCreation } from "@/components/challenges/ChallengeCreation";
import { ChallengeTemplate } from "@/lib/challenge-templates";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { DelightfulEmptyState, EmptyStatePresets } from "@/components/ui/DelightfulEmptyState";
import { personalityEngine, getWelcomeMessage } from "@/lib/personality-engine";
import { culturalAdaptation } from "@/lib/cultural-adaptation";
import { useUIStore } from "@/stores/uiStore";
import { useMobileExperience } from "@/hooks/useMobileExperience";
import ParallaxSection from "@/components/three/ParallaxSection";

export default function ChallengeBrowserPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeTemplate | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [culturalContext, setCulturalContext] = useState(culturalAdaptation.getContext());
  
  const { addToast } = useUIStore();
  const { triggerHaptic } = useMobileExperience();
  const { 
    navigateWithContext, 
    markStepCompleted, 
    suggestedNextAction,
    getPreservedState 
  } = useNavigationContext();
  
  // Initialize cultural adaptation and personality
  useEffect(() => {
    const message = culturalAdaptation.getCulturalMessage('encouragement', getWelcomeMessage());
    setWelcomeMessage(message);
    
    // Mark page visit for analytics
    culturalAdaptation.updatePreferences({
      action: 'page_visit_challenges',
      timestamp: Date.now(),
      context: { page: 'challenges' }
    });
  }, []);
  
  const handleChallengeSelect = (challenge: ChallengeTemplate) => {
    setSelectedChallenge(challenge);
    triggerHaptic('light');
    
    // Track selection for cultural learning
    culturalAdaptation.updatePreferences({
      action: 'challenge_selected',
      timestamp: Date.now(),
      context: { 
        challengeType: challenge.category,
        difficulty: challenge.difficulty,
        viralFactor: challenge.viralFactor
      }
    });
    
    addToast({
      message: culturalAdaptation.getCulturalMessage('guidance', "Great choice! Let's customize this for you."),
      type: "info",
      duration: 3000
    });
  };
  
  const handleChallengeCreated = (challenge: any) => {
    markStepCompleted('challenge-created');
    triggerHaptic('success');
    
    // Cultural celebration message
    const celebrationMessage = culturalAdaptation.getCulturalMessage('celebration');
    addToast({
    message: celebrationMessage,
    type: "success",
    duration: 4000
    });
    
    // Navigate to tracking with context
    navigateWithContext('/profile', {
      from: 'challenge-creation',
      newChallenge: challenge.id,
      shouldCelebrate: true
    });
    
    setSelectedChallenge(null);
  };
  
  const handleCancel = () => {
    setSelectedChallenge(null);
    triggerHaptic('light');
  };
  
  const handleCreateFromScratch = () => {
    navigateWithContext('/plan', {
      from: 'challenges-browse',
      action: 'create-custom'
    });
  };
  
  const handleBrowseTemplates = () => {
    // Focus on browser section (scroll to it)
    const browserElement = document.getElementById('challenge-browser');
    browserElement?.scrollIntoView({ behavior: 'smooth' });
    
    addToast({
      message: culturalAdaptation.getCulturalMessage('guidance', "Here are some inspiring challenges to get you started!"),
      type: "info",
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 p-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Enhanced Header with Personality */}
        <ParallaxSection offset={20} className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Challenge <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Discovery</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-4">
              Discover challenges perfectly tailored to your style. Each one is designed to push your limits 
              while celebrating your unique approach to punctuality.
            </p>
            
            {/* Cultural Welcome Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full border border-violet-500/30"
            >
              <p className="text-violet-200 text-sm font-medium">
                {welcomeMessage}
              </p>
            </motion.div>
            
            {/* Cultural Context Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-4 text-sm text-white/60"
            >
              <span>🌍 {culturalContext.cultural.region} Region</span>
              <span>•</span>
              <span>📏 {culturalContext.cultural.measurementSystem === 'metric' ? 'Metric' : 'Imperial'}</span>
              <span>•</span>
              <span>🎯 {culturalContext.preferences.experienceLevel}</span>
            </motion.div>
            
            {/* Smart Navigation Suggestion */}
            {suggestedNextAction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-md mx-auto"
              >
                <p className="text-blue-200 text-sm mb-2">
                  💡 {suggestedNextAction.reason}
                </p>
                <button
                  onClick={() => navigateWithContext(suggestedNextAction.path)}
                  className="text-blue-300 hover:text-white text-sm font-medium transition-colors"
                >
                  {suggestedNextAction.icon} {suggestedNextAction.label} →
                </button>
              </motion.div>
            )}
          </motion.div>
        </ParallaxSection>

        {/* Main Content with Cultural Adaptation */}
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
            <>
              {/* Quick Action Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12"
              >
                {/* Create Custom Challenge */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 cursor-pointer"
                  onClick={handleCreateFromScratch}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎨</div>
                    <h3 className="text-xl font-bold text-white mb-2">Create Custom</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Start from scratch and build your perfect challenge
                    </p>
                    <div className="text-blue-400 text-sm font-medium">
                      Plan your route → Create challenge
                    </div>
                  </div>
                </motion.div>

                {/* Browse Templates */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 cursor-pointer"
                  onClick={handleBrowseTemplates}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-xl font-bold text-white mb-2">Browse Templates</h3>
                    <p className="text-white/70 text-sm mb-4">
                      Explore curated challenges tailored to your region
                    </p>
                    <div className="text-green-400 text-sm font-medium">
                      {culturalContext.cultural.region} recommendations available
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Enhanced Challenge Browser */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                id="challenge-browser"
              >
                <ChallengeBrowser
                  onSelectChallenge={handleChallengeSelect}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}