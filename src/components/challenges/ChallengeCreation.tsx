"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { AIStakeInput } from "@/components/smart/AIStakeInput";
import { ChallengeTemplate, ChallengeCondition, createChallengeFromTemplate } from "@/lib/challenge-templates";

interface ChallengeCreationProps {
  challenge: ChallengeTemplate;
  onChallengeCreated: (challenge: any) => void;
  onCancel: () => void;
  className?: string;
}

export function ChallengeCreation({ 
  challenge, 
  onChallengeCreated, 
  onCancel,
  className = "" 
}: ChallengeCreationProps) {
  const [stakeAmount, setStakeAmount] = useState(challenge.stakeAmount.suggested.toString());
  const [customConditions, setCustomConditions] = useState<Record<string, any>>({});
  const [proofRequirements, setProofRequirements] = useState<Record<string, File | null>>({});
  const [isCreating, setIsCreating] = useState(false);

  const handleConditionChange = (conditionId: string, value: any) => {
    setCustomConditions(prev => ({
      ...prev,
      [conditionId]: value
    }));
  };

  const handleProofUpload = (requirementId: string, file: File | null) => {
    setProofRequirements(prev => ({
      ...prev,
      [requirementId]: file
    }));
  };

  const handleCreateChallenge = () => {
    setIsCreating(true);
    
    try {
      // Placeholder location data for this component context
      const placeholderLocations = {
        start: { latitude: 0, longitude: 0 },
        target: { latitude: 0, longitude: 0 },
      };

      // Custom settings to override template defaults
      const customSettings = {
        stakeAmount: {
          min: challenge.stakeAmount.min,
          max: challenge.stakeAmount.max,
          suggested: parseFloat(stakeAmount),
        },
      };

      // Create challenge from template with custom settings and placeholder locations
      const newChallenge = createChallengeFromTemplate(
        challenge.id,
        'current-user-id', // In a real app, this would come from auth context
        placeholderLocations,
        customSettings
      );

      if (newChallenge) {
        onChallengeCreated(newChallenge);
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div 
      className={cn("bg-gradient-to-br from-indigo-950/30 to-purple-950/30 rounded-2xl p-6 border border-white/20", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{challenge.name}</h2>
        <p className="text-white/70">{challenge.description}</p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {challenge.tags.map((tag, index) => (
            <span 
              key={index} 
              className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Challenge Conditions Preview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Challenge Conditions</h3>
        <div className="space-y-3">
          {challenge.conditions.map((condition, index) => (
            <div 
              key={index} 
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-white">{condition.description}</div>
                  <div className="text-xs text-white/60 mt-1">
                    Verification: {condition.verificationMethod} | Required: {condition.required ? 'Yes' : 'No'}
                  </div>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                  {condition.type}
                </span>
              </div>
              
              {/* Customizable conditions */}
              <AnimatePresence>
                {condition.type === 'time' && (
                  <motion.div 
                    className="mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-xs text-white/70 mb-1">Custom time limit (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      defaultValue={condition.value as number}
                      onChange={(e) => handleConditionChange(condition.description, e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </motion.div>
                )}
                
                {condition.type === 'distance' && (
                  <motion.div 
                    className="mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-xs text-white/70 mb-1">Custom distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      defaultValue={condition.value as number}
                      onChange={(e) => handleConditionChange(condition.description, e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Stake Amount */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Your Stake</h3>
        <AIStakeInput
          onStakeSet={setStakeAmount}
          userBalance="100.00"
          context={{
            distance: challenge.estimatedDistance,
            timeAvailable: challenge.estimatedTime,
            destination: challenge.name
          }}
          aiRecommendations={[
            {
              suggestedStake: challenge.stakeAmount.suggested.toString(),
              confidence: 0.8,
              riskLevel: 'medium',
              reasoning: `Recommended based on challenge difficulty and typical stake amounts`,
              timeEstimate: challenge.estimatedTime
            }
          ]}
        />
      </div>

      {/* Proof Requirements Preview */}
      {challenge.proofRequirements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Proof Requirements</h3>
          <div className="space-y-2">
            {challenge.proofRequirements.map((req, index) => (
              <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <span className="text-sm text-white/80">{req}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById(`proof-upload-${index}`)?.click()}
                >
                  Upload
                </Button>
                <input
                  id={`proof-upload-${index}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProofUpload(req, e.target.files[0])}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Preview */}
      {challenge.rewards && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {challenge.rewards.tokenReward && (
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span className="text-white">Token Reward: {challenge.rewards.tokenReward} STT</span>
              </div>
            )}
            {challenge.rewards.achievement && (
              <div className="flex items-center gap-2">
                <span>🏆</span>
                <span className="text-white">Achievement: {challenge.rewards.achievement}</span>
              </div>
            )}
            {challenge.rewards.multiplier && (
              <div className="flex items-center gap-2">
                <span>✨</span>
                <span className="text-white">Multiplier: {challenge.rewards.multiplier}x</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          variant="gradient"
          className="flex-1"
          onClick={handleCreateChallenge}
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : `Accept Challenge (${stakeAmount} STT)`}
        </Button>
      </div>
    </motion.div>
  );
}