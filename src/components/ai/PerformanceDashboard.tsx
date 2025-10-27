"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAIEngine } from "@/hooks/useAIEngine";
import { useUIStore } from "@/stores/uiStore";
import { useWallet } from "@/hooks/useWallet";
import { useAIPerformanceMonitoring } from "@/hooks/useAIPerformanceMonitoring";
import { AILoadingSkeleton } from "@/components/ui/AILoadingSkeleton";
import { AdaptiveAIDisplay, ConfidenceBadge, ConfidenceProgress } from "@/components/ui/AdaptiveAIDisplay";
import { ConfidencePulse, AIHoverEffect, AIStaggerContainer, AIStaggerItem } from "@/components/ui/AIMicroInteractions";
import { cn } from "@/lib/utils";
import { 
  ReputationPrediction, 
  OptimizedRoute, 
  AchievementPrediction 
} from "@/lib/ai-service";

interface PerformanceMetrics {
  reputationScore: number;
  successRate: number;
  totalCommitments: number;
  successfulCommitments: number;
  avgCompletionTime: number; // in minutes
  reliabilityScore: number; // 0-100
  punctualityStreak: number;
  bettingWinRate: number;
  totalEarnings: number;
}

interface AIInsights {
  predictedReputation: ReputationPrediction | null;
  routeOptimizations: OptimizedRoute | null;
  predictedAchievements: AchievementPrediction | null;
  performanceTrend: 'improving' | 'declining' | 'stable';
  suggestedActions: string[];
  confidence: number;
}

export function PerformanceDashboard() {
  const { address } = useWallet();
  const { aiState } = useUIStore();
  const { 
    predictReputation, 
    optimizeRoute, 
    predictAchievements,
    aiPerformanceMetrics
  } = useAIEngine();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    reputationScore: 750,
    successRate: 85,
    totalCommitments: 42,
    successfulCommitments: 36,
    avgCompletionTime: 28,
    reliabilityScore: 82,
    punctualityStreak: 7,
    bettingWinRate: 68,
    totalEarnings: 12.45
  });
  
  const [aiInsights, setAiInsights] = useState<AIInsights>({
    predictedReputation: null,
    routeOptimizations: null,
    predictedAchievements: null,
    performanceTrend: 'stable',
    suggestedActions: [],
    confidence: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Load AI predictions when component mounts
  const loadAIPredictions = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    
    try {
      // Get AI predictions in parallel
      const [reputationPrediction, routeOptimization, achievementPrediction] = await Promise.all([
        predictReputation(address, timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90),
        optimizeRoute(address, { lat: 0, lng: 0 }, { lat: 0, lng: 0 }), // Placeholder coordinates
        predictAchievements(address, timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90)
      ]);
      
      // Determine performance trend based on predictions
      let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (reputationPrediction && reputationPrediction.trend === 'improving') {
        performanceTrend = 'improving';
      } else if (reputationPrediction && reputationPrediction.trend === 'declining') {
        performanceTrend = 'declining';
      }
      
      // Generate suggested actions based on predictions
      const suggestedActions = generateSuggestedActions(
        reputationPrediction, 
        routeOptimization, 
        achievementPrediction
      );
      
      setAiInsights({
        predictedReputation: reputationPrediction,
        routeOptimizations: routeOptimization,
        predictedAchievements: achievementPrediction,
        performanceTrend,
        suggestedActions,
        confidence: aiPerformanceMetrics.modelConfidence
      });
    } catch (error) {
      console.error('Error loading AI predictions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, predictReputation, optimizeRoute, predictAchievements]);

  useEffect(() => {
    if (address) {
      loadAIPredictions();
    }
  }, [address, timeframe, loadAIPredictions]);

  const generateSuggestedActions = (
    reputationPrediction: ReputationPrediction | null,
    routeOptimization: OptimizedRoute | null,
    achievementPrediction: AchievementPrediction | null
  ): string[] => {
    const actions: string[] = [];
    
    // Reputation-based suggestions
    if (reputationPrediction) {
      if (reputationPrediction.predictedScore < metrics.reputationScore - 50) {
        actions.push("Focus on improving punctuality to maintain your reputation");
      } else if (reputationPrediction.predictedScore > metrics.reputationScore + 50) {
        actions.push("Consider taking on more challenging commitments to boost your reputation");
      }
      
      if (reputationPrediction.influencingFactors.includes("Late arrivals")) {
        actions.push("Try leaving earlier to improve arrival times");
      }
    }
    
    // Route optimization suggestions
    if (routeOptimization && routeOptimization.alternativeRoutes.length > 0) {
      const bestRoute = routeOptimization.alternativeRoutes[0];
      if (bestRoute.timeSaved > 300) { // More than 5 minutes saved
        actions.push(`Consider alternative route that saves ${Math.round(bestRoute.timeSaved / 60)} minutes`);
      }
    }
    
    // Achievement suggestions
    if (achievementPrediction && achievementPrediction.predictedAchievements.length > 0) {
      const nextAchievement = achievementPrediction.predictedAchievements[0];
      if (nextAchievement.probability > 0.7) {
        actions.push(`You're close to unlocking "${nextAchievement.requirements[0]}" achievement`);
      }
    }
    
    // General performance suggestions
    if (metrics.successRate < 80) {
      actions.push("Work on improving your success rate by planning better routes");
    }
    
    if (metrics.punctualityStreak < 5) {
      actions.push("Build your punctuality streak by committing to consistent arrivals");
    }
    
    return actions.slice(0, 3); // Limit to 3 suggestions
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  // Format time values
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  // Get trend indicator
  const getTrendIndicator = () => {
    switch (aiInsights.performanceTrend) {
      case 'improving':
        return { icon: '↗️', color: 'text-green-500', text: 'Improving' };
      case 'declining':
        return { icon: '↘️', color: 'text-red-500', text: 'Declining' };
      default:
        return { icon: '➡️', color: 'text-gray-500', text: 'Stable' };
    }
  };

  const trend = getTrendIndicator();

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
          <p className="text-white/70">Your punctuality metrics and AI-powered insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                timeframe === period
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* AI Confidence Banner */}
      {aiInsights.confidence > 0 && (
        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <div className="font-medium text-blue-300">
                AI Insights Powered
              </div>
              <div className="text-sm text-blue-200">
                {Math.round(aiInsights.confidence * 100)}% confident in predictions
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-400">Powered by</div>
              <div className="text-sm font-medium text-blue-300">Somnia AI</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Reputation</div>
              <div className="text-2xl font-bold text-white mt-1">
                {metrics.reputationScore}
              </div>
            </div>
            <div className="text-3xl">
              {metrics.reputationScore > 900 ? '👑' : 
               metrics.reputationScore > 800 ? '⭐' : 
               metrics.reputationScore > 700 ? '🎯' : '📈'}
            </div>
          </div>
          {aiInsights.predictedReputation && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-white/60">
                Predicted: {aiInsights.predictedReputation.predictedScore} 
                <span className={`ml-2 ${trend.color}`}>
                  {trend.icon} {trend.text}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Success Rate</div>
              <div className="text-2xl font-bold text-white mt-1">
                {metrics.successRate}%
              </div>
            </div>
            <div className="text-3xl">
              {metrics.successRate > 90 ? '✅' : 
               metrics.successRate > 80 ? '👍' : '⚠️'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.successRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Total Earnings</div>
              <div className="text-2xl font-bold text-white mt-1">
                {formatCurrency(metrics.totalEarnings)}
              </div>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-white/60">
              {metrics.totalCommitments} commitments
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-5 rounded-xl"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Current Streak</div>
              <div className="text-2xl font-bold text-white mt-1">
                {metrics.punctualityStreak} days
              </div>
            </div>
            <div className="text-3xl">
              {metrics.punctualityStreak > 10 ? '🔥' : 
               metrics.punctualityStreak > 5 ? '🌟' : '📅'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-white/60">
              Keep it going!
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Over Time */}
        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Success Rate Trends</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[75, 80, 85, 82, 88, 90, 87].map((rate, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg transition-all duration-500"
                  style={{ height: `${rate}%` }}
                />
                <div className="text-xs text-white/60 mt-2">
                  Day {index + 1}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Earnings Distribution */}
        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Earnings Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Pie Chart Representation */}
              <div className="absolute inset-0 rounded-full border-8 border-blue-500"></div>
              <div className="absolute inset-4 rounded-full border-8 border-purple-500"></div>
              <div className="absolute inset-8 rounded-full border-8 border-green-500"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(metrics.totalEarnings)}
                  </div>
                  <div className="text-sm text-white/60">Total</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-sm text-blue-400">Commitments</div>
              <div className="font-medium text-white">{formatCurrency(metrics.totalEarnings * 0.6)}</div>
            </div>
            <div>
              <div className="text-sm text-purple-400">Betting Wins</div>
              <div className="font-medium text-white">{formatCurrency(metrics.totalEarnings * 0.3)}</div>
            </div>
            <div>
              <div className="text-sm text-green-400">Bonuses</div>
              <div className="font-medium text-white">{formatCurrency(metrics.totalEarnings * 0.1)}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights Section */}
      <motion.div
        className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🔮</div>
          <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-white/70">Analyzing your performance...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Predicted Reputation */}
            {aiInsights.predictedReputation && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Reputation Forecast</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {aiInsights.predictedReputation.predictedScore}
                    </div>
                    <div className="text-xs text-white/60">
                      in {aiInsights.predictedReputation.timeframe} days
                    </div>
                  </div>
                  <div className={`text-lg ${trend.color}`}>
                    {trend.icon} {trend.text}
                  </div>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  {aiInsights.predictedReputation.confidence * 100}% confidence
                </div>
              </div>
            )}

            {/* Route Optimization */}
            {aiInsights.routeOptimizations && aiInsights.routeOptimizations.alternativeRoutes.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Route Optimization</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Current Route</span>
                    <span className="text-white">
                      {formatTime(metrics.avgCompletionTime)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Optimized Route</span>
                    <span className="text-green-400 font-medium">
                      {formatTime(
                        metrics.avgCompletionTime - 
                        aiInsights.routeOptimizations.alternativeRoutes[0].timeSaved / 60
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Time Saved</span>
                    <span className="text-green-400 font-medium">
                      {formatTime(aiInsights.routeOptimizations.alternativeRoutes[0].timeSaved / 60)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {aiInsights.suggestedActions.length > 0 && (
              <div className="md:col-span-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
                <h4 className="font-medium text-white mb-3">Personalized Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiInsights.suggestedActions.map((action, index) => (
                    <div 
                      key={index}
                      className="bg-white/5 rounded-lg p-3 flex items-start gap-2"
                    >
                      <div className="text-lg">💡</div>
                      <div className="text-sm text-white/90">{action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Achievement Predictions */}
      {aiInsights.predictedAchievements && aiInsights.predictedAchievements.predictedAchievements.length > 0 && (
        <motion.div
          className="bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 p-6 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🏆</div>
            <h3 className="text-lg font-semibold text-white">Upcoming Achievements</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.predictedAchievements.predictedAchievements.slice(0, 3).map((achievement, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xl">⭐</div>
                  <div className="font-medium text-yellow-300">
                    {achievement.achievementId.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="text-sm text-white/70 mb-2">
                  {achievement.requirements.join(', ')}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                    {Math.round(achievement.probability * 100)}% chance
                  </div>
                  <div className="text-xs text-white/60">
                    in {achievement.timeframe} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}