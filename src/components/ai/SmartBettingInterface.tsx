"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIEngine } from "@/hooks/useAIEngine";
import { useUIStore } from "@/stores/uiStore";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { BettingOdds } from "@/lib/ai-service";

interface BettingOption {
  id: string;
  label: string;
  description: string;
  odds: number;
  probability: number;
  potentialWinnings: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
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

export function SmartBettingInterface({
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
    aiPerformanceMetrics,
    getBettingRecommendation
  } = useAIEngine();
  
  const [bettingOptions, setBettingOptions] = useState<BettingOption[]>([]);
  const [selectedBet, setSelectedBet] = useState<BettingOption | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestedBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [odds, setOdds] = useState<BettingOdds | null>(null);
  const [currentOdds, setCurrentOdds] = useState({ forSuccess: 2.0, againstSuccess: 2.0 });

  // Load betting odds and AI suggestions when component mounts
  const loadBettingData = useCallback(async () => {
    if (!commitmentId || !address) return;
    
    setIsLoading(true);
    
    try {
      // Get AI-powered betting odds
      const bettingOdds = await calculateBettingOdds(commitmentId, address);
      setOdds(bettingOdds);
      
      // Generate betting options based on odds
      const options = generateBettingOptions(bettingOdds);
      setBettingOptions(options);
      
      // Get AI betting recommendations if available
      if (getBettingRecommendation) {
        const recommendations = await getBettingRecommendation(commitmentId, address);
        setAiSuggestions(recommendations);
      } else {
        // Fallback to mock suggestions
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
      }
      
    } catch (error) {
      console.error('Error loading betting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [commitmentId, address, calculateBettingOdds, getBettingRecommendation]);

  useEffect(() => {
    if (commitmentId && address) {
      loadBettingData();
    }
  }, [commitmentId, address, loadBettingData]);

  const generateBettingOptions = (odds: BettingOdds): BettingOption[] => {
    return [
      {
        id: 'for-success',
        label: 'Bet For Success',
        description: 'Person will arrive on time',
        odds: odds.forSuccessOdds,
        probability: 1 / odds.forSuccessOdds,
        potentialWinnings: odds.forSuccessOdds * parseFloat(betAmount || "0"),
        riskLevel: odds.volatility > 0.5 ? 'high' : odds.volatility > 0.3 ? 'medium' : 'low',
        confidence: odds.confidence || 0.8
      },
      {
        id: 'against-success',
        label: 'Bet Against Success',
        description: 'Person will be late',
        odds: odds.againstSuccessOdds,
        probability: 1 / odds.againstSuccessOdds,
        potentialWinnings: odds.againstSuccessOdds * parseFloat(betAmount || "0"),
        riskLevel: odds.volatility > 0.5 ? 'high' : odds.volatility > 0.3 ? 'medium' : 'low',
        confidence: odds.confidence || 0.6
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
      // Use the contract service to place the bet
      const { useContractService } = await import('@/hooks/useContractService');
      const { ContractService } = await import('@/services/contractService');
      
      if (typeof window !== 'undefined' && window.ethereum) {
        const { BrowserProvider } = await import('ethers');
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractService = new ContractService(signer);
        
        await contractService.placeBet(
          commitmentId,
          betType === 'for',
          betAmount
        );
      }
      
      // Show success notification
      useUIStore.getState().addToast({
        type: 'success',
        message: `Successfully placed ${betType} bet of ${betAmount} STT!`
      });
      
      // Reset form
      setBetAmount("");
      setSelectedBet(null);
      
    } catch (error) {
      console.error('Error placing bet:', error);
      useUIStore.getState().addToast({
        type: 'error',
        message: 'Failed to place bet. Please try again.'
      });
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

  const getRiskBarColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-500';
    if (confidence > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with Session Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Smart Betting</h2>
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
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              🤖
            </motion.div>
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
      <AnimatePresence>
        {showAIInsights && (
          <motion.div
            className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl border border-purple-500/30 bg-purple-500/10"
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
                    <motion.div 
                      key={index} 
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
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
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Betting Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bettingOptions.map((option, index) => (
          <motion.div
            key={option.id}
            className={cn(
              "bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
              selectedBet?.id === option.id 
                ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30" 
                : "border-white/20 hover:border-white/40"
            )}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBet(option)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <div className="relative z-10">
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
              
              {/* Confidence bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>AI Confidence</span>
                  <span>{Math.round(option.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className={`h-2 rounded-full ${getRiskBarColor(option.confidence)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${option.confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bet Amount Input */}
      <AnimatePresence>
        {selectedBet && (
          <motion.div
            className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                <motion.div 
                  className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
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
                </motion.div>
              )}
              
              {/* Quick bet suggestions */}
              <div className="space-y-2">
                <div className="text-sm text-white/70">Quick Bets</div>
                <div className="flex gap-2">
                  {aiSuggestions
                    .filter(s => s.betType === (selectedBet.id.includes('for') ? 'for' : 'against'))
                    .map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setBetAmount(suggestion.suggestedAmount.toString())}
                        className="flex-1 text-xs"
                      >
                        <span className="text-yellow-400 mr-1">💡</span>
                        {suggestion.suggestedAmount.toFixed(2)} STT
                      </Button>
                    ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
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
                </Button>
                
                <Button
                  onClick={() => setSelectedBet(null)}
                  variant="outline"
                  className="px-4 py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Betting Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">24</div>
          <div className="text-sm text-white/70 mt-1">Total Bets</div>
        </div>
        
        <div className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-400">18</div>
          <div className="text-sm text-white/70 mt-1">Wins</div>
        </div>
        
        <div className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">75%</div>
          <div className="text-sm text-white/70 mt-1">Win Rate</div>
        </div>
      </div>
    </div>
  );
}