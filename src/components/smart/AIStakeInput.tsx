"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIEngine } from "@/hooks/useAIEngine";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { StakeRecommendation } from "@/lib/ai-service";

interface AIStakeInputProps {
  onStakeSet: (amount: string) => void;
  userBalance: string;
  context?: {
    distance?: number;
    timeAvailable?: number;
    destination?: string;
  };
  aiRecommendations?: StakeRecommendation[];
  className?: string;
}

export function AIStakeInput({ 
  onStakeSet, 
  userBalance, 
  context,
  aiRecommendations = [],
  className = ""
}: AIStakeInputProps) {
  const { getStakeRecommendation } = useAIEngine();
  const [stakeAmount, setStakeAmount] = useState("");
  const [currentRecommendations, setCurrentRecommendations] = useState<StakeRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [progress, setProgress] = useState(0);

  // Load AI recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      if (getStakeRecommendation && context) {
        setIsLoading(true);
        try {
          const rec = await getStakeRecommendation('temp-user', {
            estimatedTime: context.timeAvailable || 30,
            distance: context.distance || 5,
            targetLocation: { lat: 0, lng: 0 }, // Placeholder
            deadline: new Date(Date.now() + (context.timeAvailable || 30) * 60000)
          });
          setCurrentRecommendations([rec]);
        } catch (error) {
          console.error('Error loading stake recommendations:', error);
          // Use fallback recommendations
          setCurrentRecommendations(aiRecommendations.length > 0 ? aiRecommendations : [{
            suggestedStake: '1.00',
            confidence: 0.7,
            riskLevel: 'medium',
            reasoning: 'Based on your balance and typical stake amounts',
            timeEstimate: context?.timeAvailable || 30
          }]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Use provided recommendations
        setCurrentRecommendations(aiRecommendations.length > 0 ? aiRecommendations : [{
          suggestedStake: '1.00',
          confidence: 0.7,
          riskLevel: 'medium',
          reasoning: 'Based on your balance and typical stake amounts',
          timeEstimate: context?.timeAvailable || 30
        }]);
      }
    };

    loadRecommendations();
  }, [getStakeRecommendation, context, aiRecommendations]);

  // Update risk level based on stake amount
  useEffect(() => {
    if (stakeAmount) {
      const amount = parseFloat(stakeAmount);
      const balance = parseFloat(userBalance);
      
      if (amount <= 0.1 * balance) {
        setRiskLevel('low');
      } else if (amount <= 0.25 * balance) {
        setRiskLevel('medium');
      } else {
        setRiskLevel('high');
      }
    }
  }, [stakeAmount, userBalance]);

  // Animate progress when stake amount changes
  useEffect(() => {
    if (stakeAmount) {
      const amount = parseFloat(stakeAmount);
      const balance = parseFloat(userBalance);
      const percentage = Math.min(100, (amount / balance) * 100);
      
      setProgress(0);
      setTimeout(() => setProgress(percentage), 10);
    } else {
      setProgress(0);
    }
  }, [stakeAmount, userBalance]);

  const handleQuickBet = (amount: string) => {
    setStakeAmount(amount);
  };

  const handleStakeSubmit = () => {
    if (stakeAmount && parseFloat(stakeAmount) > 0) {
      onStakeSet(stakeAmount);
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskBarColor = () => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={cn("bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl border border-white/20", className)}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-xl">💰</span>
        Set Your Stake
      </h3>
      
      <div className="space-y-4">
        {/* Stake amount input */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Stake Amount (STT)
          </label>
          <div className="relative">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50 text-lg">
              STT
            </div>
          </div>
        </div>
        
        {/* Risk visualization */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">Risk Level</span>
            <span className={cn("font-medium", getRiskColor())}>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div 
              className={`h-2 rounded-full ${getRiskBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {/* Balance indicator */}
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Balance</span>
          <span className="text-white font-medium">{userBalance} STT</span>
        </div>
        
        {/* Quick bet buttons */}
        <div>
          <div className="text-sm text-white/70 mb-2">Quick Bets</div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBet((parseFloat(userBalance) * 0.05).toFixed(2))}
              className="text-xs py-3"
            >
              5%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBet((parseFloat(userBalance) * 0.1).toFixed(2))}
              className="text-xs py-3"
            >
              10%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBet((parseFloat(userBalance) * 0.2).toFixed(2))}
              className="text-xs py-3"
            >
              20%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBet((parseFloat(userBalance) * 0.3).toFixed(2))}
              className="text-xs py-3"
            >
              30%
            </Button>
          </div>
        </div>
        
        {/* AI Recommendations */}
        <AnimatePresence>
          {currentRecommendations.length > 0 && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowRecommendations(!showRecommendations)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-white">AI Recommendation</span>
                </div>
                <span className={`transform transition-transform ${showRecommendations ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
              
              <AnimatePresence>
                {showRecommendations && (
                  <motion.div
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {currentRecommendations.map((rec, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Suggested: {rec.suggestedStake} STT</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            rec.confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
                            rec.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>
                        
                        <div className="text-sm text-white/70">
                          {rec.reasoning}
                        </div>
                        
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Risk: {rec.riskLevel}</span>
                          <span>Time: ~{Math.round(rec.timeEstimate / 60)} min</span>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStakeAmount(rec.suggestedStake)}
                          className="w-full text-xs"
                        >
                          Use AI Suggestion
                        </Button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Submit button */}
        <Button
          onClick={handleStakeSubmit}
          disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(userBalance)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 text-lg rounded-xl shadow-xl hover:from-blue-700 hover:to-purple-700"
        >
          Confirm Stake
        </Button>
      </div>
    </div>
  );
}