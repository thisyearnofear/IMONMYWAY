"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAIEngine } from "@/hooks/useAIEngine";
import { useUIStore } from "@/stores/uiStore";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import { BettingOdds } from "@/lib/ai-service";

interface BettingOption {
  id: string;
  label: string;
  description: string;
  odds: number;
  probability: number;
  potentialWinnings: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface BettingSession {
  commitmentId: string;
  stakeAmount: number;
  deadline: Date;
  currentProgress: number; // 0-100%
  status: 'active' | 'completed' | 'failed';
  destinationReached: boolean | null;
  estimatedArrival: Date | null;
  timeRemaining: number | null; // in seconds
}

interface AISuggestedBet {
  betType: 'for' | 'against';
  suggestedAmount: number;
  confidence: number;
  reasoning: string;
  riskAssessment: {
    volatility: number;
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    historicalAccuracy: number;
  };
}

export function UnifiedBettingInterface({
  commitmentId,
  stakeAmount,
  deadline,
  currentProgress,
  status,
  destinationReached,
  estimatedArrival,
  timeRemaining
}: BettingSession) {
  const { address, isConnected } = useWallet();
  const { aiState } = useUIStore();
  const { 
    calculateBettingOdds, 
    aiPerformanceMetrics
  } = useAIEngine();
  
  const [bettingOptions, setBettingOptions] = useState<BettingOption[]>([]);
  const [selectedBet, setSelectedBet] = useState<BettingOption | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestedBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [odds, setOdds] = useState<BettingOdds | null>(null);

  // Load betting odds and AI suggestions when component mounts
  useEffect(() => {
    if (commitmentId && address) {
      loadBettingData();
    }
  }, [commitmentId, address]);

  const loadBettingData = async () => {
    if (!commitmentId || !address) return;
    
    setIsLoading(true);
    
    try {
      // Get AI-powered betting odds
      const bettingOdds = await calculateBettingOdds(commitmentId, address);
      setOdds(bettingOdds);
      
      // Generate betting options based on odds
      const options = generateBettingOptions(bettingOdds);
      setBettingOptions(options);
      
      // For now, we'll generate mock AI suggestions since there's no getBettingRecommendation method
      const mockAiSuggestions: AISuggestedBet[] = [
        {
          betType: 'for',
          suggestedAmount: stakeAmount * 0.1,
          confidence: 0.85,
          reasoning: "High confidence based on user's past performance and current progress",
          riskAssessment: {
            volatility: 0.3,
            marketSentiment: 'bullish',
            historicalAccuracy: 0.88
          }
        },
        {
          betType: 'against',
          suggestedAmount: stakeAmount * 0.05,
          confidence: 0.65,
          reasoning: "Moderate confidence for contrarian bet with potential high returns",
          riskAssessment: {
            volatility: 0.7,
            marketSentiment: 'bearish',
            historicalAccuracy: 0.72
          }
        }
      ];
      setAiSuggestions(mockAiSuggestions);
      
    } catch (error) {
      console.error('Error loading betting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBettingOptions = (odds: BettingOdds): BettingOption[] => {
    return [
      {
        id: 'for-success',
        label: 'Bet For Success',
        description: 'Person will arrive on time',
        odds: odds.forSuccessOdds,
        probability: 1 / odds.forSuccessOdds,
        potentialWinnings: odds.forSuccessOdds * parseFloat(betAmount || "0"),
        riskLevel: odds.volatility > 0.5 ? 'high' : odds.volatility > 0.3 ? 'medium' : 'low'
      },
      {
        id: 'against-success',
        label: 'Bet Against Success',
        description: 'Person will be late',
        odds: odds.againstSuccessOdds,
        probability: 1 / odds.againstSuccessOdds,
        potentialWinnings: odds.againstSuccessOdds * parseFloat(betAmount || "0"),
        riskLevel: odds.volatility > 0.5 ? 'high' : odds.volatility > 0.3 ? 'medium' : 'low'
      }
    ];
  };

  const handleBetAmountChange = (value: string) => {
    setBetAmount(value);
    
    // Recalculate potential winnings
    if (odds) {
      const newOptions = generateBettingOptions(odds);
      setBettingOptions(newOptions);
    }
  };

  const placeBet = async (betType: 'for' | 'against') => {
    if (!address || !commitmentId || !betAmount) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the smart contract
      console.log(`Placing ${betType} bet of ${betAmount} STT on commitment ${commitmentId}`);
      
      // Simulate bet placement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success notification
      alert(`Successfully placed ${betType} bet of ${betAmount} STT!`);
      
      // Reset form
      setBetAmount("");
      setSelectedBet(null);
      
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Session Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Betting Interface</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)} Session
            </span>
            <span className="text-white/40">•</span>
            <span className="text-sm text-white/70">
              {formatTime(timeRemaining)} remaining
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm text-white/60">Stake Amount</div>
            <div className="text-lg font-bold text-white">
              {stakeAmount.toFixed(2)} STT
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xl">
            💰
          </div>
        </div>
      </div>

      {/* AI Confidence Banner */}
      {aiPerformanceMetrics.modelConfidence > 0.7 && (
        <motion.div
          className="glass-enhanced p-4 rounded-xl border border-purple-500/30 bg-purple-500/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <div className="font-medium text-purple-300">
                AI-Powered Betting Odds
              </div>
              <div className="text-sm text-purple-200">
                {Math.round(aiPerformanceMetrics.modelConfidence * 100)}% confident in predictions
              </div>
            </div>
            <button 
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showAIInsights ? 'Hide' : 'View'} Insights
            </button>
          </div>
        </motion.div>
      )}

      {/* AI Insights Panel */}
      {showAIInsights && (
        <motion.div
          className="glass-enhanced p-6 rounded-xl border border-purple-500/30 bg-purple-500/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🔮</div>
            <h3 className="text-lg font-semibold text-purple-300">AI Betting Insights</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white/60 mb-1">Market Volatility</div>
              <div className="text-xl font-bold text-white">
                {odds ? (odds.volatility * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs text-white/60 mt-1">
                {odds && odds.volatility > 0.5 ? 'High' : 
                 odds && odds.volatility > 0.3 ? 'Medium' : 'Low'} risk
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white/60 mb-1">Model Confidence</div>
              <div className="text-xl font-bold text-white">
                {Math.round(aiPerformanceMetrics.modelConfidence * 100)}%
              </div>
              <div className="text-xs text-white/60 mt-1">
                {aiPerformanceMetrics.modelConfidence > 0.8 ? 'Very High' : 
                 aiPerformanceMetrics.modelConfidence > 0.6 ? 'High' : 'Moderate'}
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-white/60 mb-1">Prediction Accuracy</div>
              <div className="text-xl font-bold text-white">
                {Math.round(aiPerformanceMetrics.predictionAccuracy * 100)}%
              </div>
              <div className="text-xs text-white/60 mt-1">
                Based on historical data
              </div>
            </div>
          </div>
          
          {aiSuggestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h4 className="font-medium text-purple-300 mb-2">AI Recommendations</h4>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div className="text-lg">💡</div>
                    <div className="flex-1">
                      <div className="text-sm text-white">
                        {suggestion.betType === 'for' ? 'Bet For Success' : 'Bet Against Success'}
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        {suggestion.reasoning}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                          Suggested: {suggestion.suggestedAmount.toFixed(2)} STT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Betting Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bettingOptions.map((option) => (
          <motion.div
            key={option.id}
            className={cn(
              "glass-enhanced p-5 rounded-xl border transition-all duration-300 cursor-pointer",
              selectedBet?.id === option.id 
                ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30" 
                : "border-white/20 hover:border-white/40"
            )}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBet(option)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-white">{option.label}</h3>
                <p className="text-sm text-white/70 mt-1">{option.description}</p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                getRiskColor(option.riskLevel)
              )}>
                {option.riskLevel.charAt(0).toUpperCase() + option.riskLevel.slice(1)} Risk
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-white/60">Odds</div>
                <div className="text-xl font-bold text-white">{option.odds.toFixed(2)}x</div>
              </div>
              <div>
                <div className="text-sm text-white/60">Probability</div>
                <div className="text-xl font-bold text-white">
                  {(option.probability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-sm text-white/60">
                Potential Winnings: <span className="font-medium text-green-400">
                  {option.potentialWinnings.toFixed(2)} STT
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bet Amount Input */}
      {selectedBet && (
        <motion.div
          className="glass-enhanced p-6 rounded-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Place Your Bet
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Bet Amount (STT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => handleBetAmountChange(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50">
                  STT
                </div>
              </div>
            </div>
            
            {betAmount && (
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white/70">Total Return</div>
                    <div className="text-2xl font-bold text-white">
                      {(parseFloat(betAmount) * selectedBet.odds).toFixed(2)} STT
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/70">Profit</div>
                    <div className="text-xl font-bold text-green-400">
                      {((parseFloat(betAmount) * selectedBet.odds) - parseFloat(betAmount)).toFixed(2)} STT
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => placeBet(selectedBet.id.includes('for') ? 'for' : 'against')}
                disabled={!betAmount || isLoading || !isConnected}
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isConnected 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    : "bg-gray-600 text-gray-300"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Placing Bet...
                  </div>
                ) : isConnected ? (
                  `Place ${selectedBet.label} Bet`
                ) : (
                  "Connect Wallet to Bet"
                )}
              </button>
              
              <button
                onClick={() => setSelectedBet(null)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Bet Buttons */}
      {!selectedBet && (
        <div className="glass-enhanced p-6 rounded-xl border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Bet Options
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['0.1', '0.5', '1.0', '2.5'].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setBetAmount(amount);
                  // Auto-select the "for success" bet option
                  const forSuccessOption = bettingOptions.find(opt => opt.id === 'for-success');
                  if (forSuccessOption) {
                    setSelectedBet(forSuccessOption);
                  }
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 text-center"
              >
                <div className="font-medium">{amount} STT</div>
                <div className="text-xs text-white/60 mt-1">Quick Bet</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Betting History Preview */}
      <div className="glass-enhanced p-6 rounded-xl border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Bets</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-xs">
                  👤
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {index === 1 ? 'You' : `Bettor ${index}`}
                  </div>
                  <div className="text-xs text-white/60">
                    {index === 1 ? 'For Success' : 'Against Success'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {index === 1 ? '0.50' : index === 2 ? '1.25' : '0.75'} STT
                </div>
                <div className="text-xs text-white/60">
                  {index === 1 ? '+1.25' : index === 2 ? '-1.25' : '+0.88'} STT
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Betting Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-enhanced p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">24</div>
          <div className="text-sm text-white/70 mt-1">Total Bets</div>
        </div>
        
        <div className="glass-enhanced p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-400">18</div>
          <div className="text-sm text-white/70 mt-1">Wins</div>
        </div>
        
        <div className="glass-enhanced p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">75%</div>
          <div className="text-sm text-white/70 mt-1">Win Rate</div>
        </div>
      </div>
    </div>
  );
}