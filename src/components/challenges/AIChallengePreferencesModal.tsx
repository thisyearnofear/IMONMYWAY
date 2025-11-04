"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { AIChallengePreferences, aiChallengeService } from "@/lib/ai-challenge-generator";

interface AIChallengePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeGenerated: (challenge: any) => void;
  initialPreferences?: Partial<AIChallengePreferences>;
  className?: string;
}

export function AIChallengePreferencesModal({
  isOpen,
  onClose,
  onChallengeGenerated,
  initialPreferences = {},
  className = ""
}: AIChallengePreferencesModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preferences, setPreferences] = useState<AIChallengePreferences>({
    interests: [],
    fitnessLevel: 'intermediate',
    timeAvailable: 60,
    preferredConditions: [],
    location: {
      start: [51.5074, -0.1278], // London
      end: [48.8566, 2.3522],   // Paris
      radius: 10
    },
    socialPreference: 'solo',
    viralPreference: 'medium',
    ...initialPreferences
  });

  const interestsOptions = [
    'adventure', 'fitness', 'exploration', 'social', 'creative',
    'charity', 'photography', 'cycling', 'walking', 'running',
    'nature', 'urban', 'cultural', 'food', 'music'
  ];

  const conditionTypes = [
    'time-bound', 'distance-based', 'mode-specific', 'proof-required',
    'location-specific', 'behavioral', 'speed-focused'
  ];

  const handleInterestToggle = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleConditionToggle = (condition: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredConditions: prev.preferredConditions.includes(condition)
        ? prev.preferredConditions.filter(c => c !== condition)
        : [...prev.preferredConditions, condition]
    }));
  };

  const handleGenerateChallenge = async () => {
    try {
      const aiChallenge = await aiChallengeService.generateChallenge('current-user-id', preferences);
      if (aiChallenge) {
        onChallengeGenerated(aiChallenge);
        onClose();
      }
    } catch (error) {
      console.error('Error generating AI challenge:', error);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">What interests you?</h3>
            <p className="text-white/70">Select your preferred challenge themes</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {interestsOptions.map((interest) => (
                <button
                  key={interest}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    preferences.interests.includes(interest)
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                  )}
                  onClick={() => handleInterestToggle(interest)}
                >
                  <div className="capitalize">{interest}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">How much time do you have?</h3>
            <p className="text-white/70">Select your available time range</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Time Available: {preferences.timeAvailable} minutes</span>
              </div>
              <input
                type="range"
                min="15"
                max="480" // 8 hours
                value={preferences.timeAvailable}
                onChange={(e) => setPreferences(prev => ({ ...prev, timeAvailable: parseInt(e.target.value) }))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-sm text-white/60">
                <span>15 min</span>
                <span>8 hours</span>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">What type of challenges do you prefer?</h4>
              <div className="grid grid-cols-2 gap-3">
                {conditionTypes.map((condition) => (
                  <button
                    key={condition}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all text-sm",
                      preferences.preferredConditions.includes(condition)
                        ? "border-purple-500 bg-purple-500/20 text-purple-400"
                        : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                    )}
                    onClick={() => handleConditionToggle(condition)}
                  >
                    <div className="capitalize">{condition.replace('-', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Social Settings</h3>
            <p className="text-white/70">How do you prefer to challenge?</p>

            <div className="grid grid-cols-2 gap-4">
              {(['solo', 'friends', 'public', 'competitive'] as const).map((socialPref) => (
                <button
                  key={socialPref}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all capitalize",
                    preferences.socialPreference === socialPref
                      ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                      : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                  )}
                  onClick={() => setPreferences(prev => ({ ...prev, socialPreference: socialPref }))}
                >
                  <div>{socialPref}</div>
                  <div className="text-xs text-white/60 mt-1">
                    {socialPref === 'solo' && 'Just you'}
                    {socialPref === 'friends' && 'With friends'}
                    {socialPref === 'public' && 'With strangers'}
                    {socialPref === 'competitive' && 'Compete with others'}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Viral Potential</h4>
              <p className="text-white/70 text-sm mb-3">How shareable should your challenge be?</p>

              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((viralPref) => (
                  <button
                    key={viralPref}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all capitalize",
                      preferences.viralPreference === viralPref
                        ? "border-orange-500 bg-orange-500/20 text-orange-400"
                        : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                    )}
                    onClick={() => setPreferences(prev => ({ ...prev, viralPreference: viralPref }))}
                  >
                    {viralPref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={cn("bg-gradient-to-br from-indigo-950/90 to-purple-950/90 rounded-2xl p-6 border border-white/20 w-full max-w-md", className)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">AI Challenge Creator</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/70 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-1 rounded-full ${step === num ? 'bg-blue-500' : 'bg-white/20'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={step === 1}
                onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
              >
                Back
              </Button>

              {step < 3 ? (
                <Button
                  variant="gradient"
                  onClick={() => setStep(prev => (prev + 1) as 1 | 2 | 3)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={handleGenerateChallenge}
                >
                  Generate Challenge
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}