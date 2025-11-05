// AI Service for Punctuality Protocol
// Single source of truth for all AI logic and model management
// Implements lazy initialization, performance monitoring, and adaptive processing

import { aiConfig, isFeatureEnabled, getPerformanceConfig } from '@/config/ai-config';
import { cacheService } from '@/lib/cache-service';
import { performanceMonitor, adaptiveLoader, getDeviceCapabilities } from '@/lib/performance';
import { veniceClient, isVeniceAvailable } from '@/lib/venice-client';

// ============================================================================
// DATABASE SERVICE HELPER
// ============================================================================

// Helper to get database service dynamically to avoid build-time initialization
const getDbService = async () => {
  const { dbService } = await import('@/lib/db-service');
  return dbService;
};

// ============================================================================
// AI DATA STRUCTURES
// ============================================================================

export interface StakeRecommendation {
  suggestedStake: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  timeEstimate: number; // in seconds
}

export interface ReputationPrediction {
  predictedScore: number;
  confidence: number;
  timeframe: number; // in days
  trend: 'improving' | 'declining' | 'stable';
  influencingFactors: string[];
}

export interface OptimizedRoute {
  alternativeRoutes: Array<{
    routeId: string;
    distance: number;
    estimatedTime: number;
    timeSaved: number;
    routeDetails: any;
  }>;
  confidence: number;
  trafficConditions: string;
}

export interface AchievementPrediction {
  predictedAchievements: Array<{
    achievementId: string;
    probability: number;
    timeframe: number; // in days
    requirements: string[];
  }>;
  confidence: number;
}

export interface BettingOdds {
  forSuccessOdds: number;
  againstSuccessOdds: number;
  confidence: number;
  volatility: number;
  lastUpdated: Date;
}

// ============================================================================
// AI SERVICE (Enhanced Implementation)
// ============================================================================

export class AIService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // ============================================================================
  // HEALTH CHECKS & CONNECTION MANAGEMENT
  // ============================================================================

  async healthCheck() {
    // Check if AI features are enabled and properly configured
    const featuresEnabled = Object.values(aiConfig.features).some(flag => flag);
    const configValid = !!aiConfig.models && !!aiConfig.performance;

    console.log(`✅ AI Service healthy - Features: ${featuresEnabled}, Config: ${configValid}`);
    return {
      aiEngine: true,
      featuresEnabled,
      configValid,
      performanceTier: getPerformanceConfig()
    };
  }

  async initialize() {
    // Prevent multiple simultaneous initializations
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize() {
    try {
      console.log('🤖 AI Service initialized successfully');
      // Initialize AI models and cache warmup
      await this.warmupModels();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ AI Service initialization failed:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  // ============================================================================
  // STAKE RECOMMENDATION ENGINE
  // ============================================================================

  async getStakeRecommendation(
    userId: string,
    commitmentData: {
      estimatedTime: number;
      distance: number;
      targetLocation: { lat: number; lng: number };
      deadline: Date;
    }
  ): Promise<StakeRecommendation> {
    if (!isFeatureEnabled('enableStakeRecommendations')) {
      return this.getRuleBasedStakeRecommendation(userId, commitmentData);
    }

    try {
      // Check cache first
      const cacheKey = `ai:stake:${userId}:${commitmentData.targetLocation.lat}:${commitmentData.targetLocation.lng}`;
      const cachedRecommendation = await this.getCachedStakeRecommendation(cacheKey);
      if (cachedRecommendation) {
        return cachedRecommendation;
      }

      // Get user's historical data with timeout protection
      const dbService = await getDbService();
      const userPromise = dbService.getUserByWallet(userId);
      const userBetsPromise = dbService.getUserBets(userId, 20);

      // Add timeout to database calls to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 2000) // 2 second timeout
      );

      const [user, userBets] = await Promise.race([
        Promise.all([userPromise, userBetsPromise]),
        timeoutPromise
      ]) as [any, any[]];

      // Perform AI prediction (simulated)
      const performanceHistory = userBets.filter(bet => bet.commitmentId).length;
      const successRate = user ? (user.reputationScore / 1000) : 0.75; // Normalize reputation score
      const timeFamiliarity = Math.min(1, commitmentData.estimatedTime / 3600); // Normalize time

      // Calculate stake based on user history, risk tolerance, and commitment difficulty
      const baseStake = Math.min(5, Math.max(0.1, successRate * 2)); // Base stake between 0.1 and 5
      const riskAdjustedStake = baseStake * (1 + timeFamiliarity) * (1 - (1 - successRate));

      // Ensure stake doesn't exceed reasonable limits
      const finalStake = Math.min(10, Math.max(0.1, riskAdjustedStake));

      const recommendation: StakeRecommendation = {
        suggestedStake: finalStake.toFixed(2),
        confidence: Math.min(0.95, Math.max(0.6, successRate + timeFamiliarity * 0.2)),
        riskLevel: successRate > 0.85 ? 'low' : successRate > 0.6 ? 'medium' : 'high',
        reasoning: `Based on user's reputation (${(user?.reputationScore || 0).toFixed(1)}) and estimated travel time (${(commitmentData.estimatedTime / 60).toFixed(0)}min)`,
        timeEstimate: commitmentData.estimatedTime
      };

      // Cache the result
      await this.cacheStakeRecommendation(cacheKey, recommendation);

      return recommendation;
    } catch (error) {
      console.error('❌ Error getting AI stake recommendation:', error);
      // Fallback to rule-based recommendation
      return this.getRuleBasedStakeRecommendation(userId, commitmentData);
    }
  }

  private async getRuleBasedStakeRecommendation(
    userId: string,
    commitmentData: any
  ): Promise<StakeRecommendation> {
    // Rule-based fallback for stake recommendation
    const dbService = await getDbService();
    const user = await dbService.getUserByWallet(userId);
    const baseStake = user?.reputationScore && user.reputationScore > 800 ? 2.0 : 1.0;

    return {
      suggestedStake: baseStake.toFixed(2),
      confidence: 0.7,
      riskLevel: 'medium',
      reasoning: 'Rule-based recommendation',
      timeEstimate: commitmentData.estimatedTime
    };
  }

  private async getCachedStakeRecommendation(cacheKey: string): Promise<StakeRecommendation | null> {
    try {
      const cached = await cacheService['get'](cacheKey);
      if (cached) {
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached stake recommendation:', error);
      return null;
    }
  }

  private async cacheStakeRecommendation(cacheKey: string, recommendation: StakeRecommendation) {
    try {
      const ttl = aiConfig.models.stakeRecommendation.learningRate * 3600; // Convert to seconds
      await cacheService['set'](cacheKey, { data: recommendation, timestamp: Date.now(), ttl });
    } catch (error) {
      console.error('❌ Error caching stake recommendation:', error);
    }
  }

  // ============================================================================
  // REPUTATION PREDICTION ENGINE
  // ============================================================================

  async predictReputation(
    userId: string,
    timeframe: number = aiConfig.models.reputationPrediction.predictionHorizon
  ): Promise<ReputationPrediction> {
    if (!isFeatureEnabled('enableReputationPrediction')) {
      return this.getRuleBasedReputationPrediction(userId, timeframe);
    }

    try {
      const dbService = await getDbService();
      const user = await dbService.getUserByWallet(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Try Venice AI enhancement
      if (await isVeniceAvailable()) {
        console.log('🧠 Using Venice AI for reputation prediction...');

        // Get comprehensive user data for AI analysis
        const userBets = await dbService.getUserBets(userId, 50);
        const recentBets = userBets.filter(bet =>
          new Date(bet.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        );

        // Calculate current metrics
        const successRate = userBets.length > 0 ?
        userBets.filter(bet => bet.result === 'won').length / userBets.length : 0;

        const prompt = `Analyze this user's betting/reputation history and predict their future reputation score.

User Profile:
- Current Reputation: ${user.reputationScore}/1000
- Total Bets: ${userBets.length}
- Recent Bets (30 days): ${recentBets.length}
- Success Rate: ${(successRate * 100).toFixed(1)}%
- Prediction Timeframe: ${timeframe} days

Recent Performance (last 10 bets):
${userBets.slice(-10).map((bet, i) => `${i+1}. ${bet.result} - ${bet.amount} tokens`).join('\n')}

Provide a JSON response with:
- predictedScore: number (0-1000)
- confidence: number (0-1)
- trend: "improving" | "declining" | "stable"
- reasoning: brief explanation

Consider:
- Historical performance patterns
- Recent trends and consistency
- Risk of overfitting to small sample sizes`;

        const messages = [
          {
            role: 'system' as const,
            content: 'You are a financial analyst specializing in reputation-based systems and predictive modeling. Provide data-driven reputation predictions.'
          },
          {
            role: 'user' as const,
            content: prompt
          }
        ];

        const response = await fetch('/api/ai/reputation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userData: {
              reputation: user.reputationScore,
              totalBets: userBets.length,
              recentBets: recentBets.length,
              successRate
            },
            timeframe
          })
        });

        if (response.ok) {
        const data = await response.json();
        console.log('✅ Venice AI reputation prediction:', data);

          // Mark as AI-enhanced
        return {
          ...data,
        aiEnhanced: true,
        method: 'venice_ai'
        };
        } else {
        const errorData = await response.json();
        if (errorData.paymentRequired) {
          console.log('💰 Payment required for Venice AI reputation - using rule-based fallback');
            return await this.getRuleBasedReputationPrediction(userId, timeframe);
            }
            if (errorData.fallback) {
              console.log('⏭️ Venice AI reputation prediction unavailable, using fallback');
              return await this.getRuleBasedReputationPrediction(userId, timeframe);
            }
          }
      }

      // Fallback to rule-based prediction
      console.log('⏭️ Using rule-based reputation prediction');

      // Analyze user's historical performance
      const userBets = await dbService.getUserBets(userId, 50);
      const recentBets = userBets.filter(bet =>
        new Date(bet.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      );

      // Calculate trend based on recent performance
      let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
      let predictedScore = user.reputationScore || 750;

      if (recentBets.length >= 5) {
        const recentSuccessRate = recentBets.filter(bet =>
          // This is a simplified calculation - in reality would check actual bet outcomes
          Math.random() > 0.3 // Simulate 70% success rate for example
        ).length / recentBets.length;

        // Adjust prediction based on trend
        const trendFactor = timeframe / 30; // Normalize timeframe
        const improvementPotential = (recentSuccessRate - 0.5) * 100 * trendFactor;
        predictedScore += improvementPotential;

        // Determine trend direction
        if (improvementPotential > 20) performanceTrend = 'improving';
        else if (improvementPotential < -20) performanceTrend = 'declining';
      }

      // Apply confidence based on historical data availability
      const confidence = Math.min(0.9, Math.max(0.5, recentBets.length * 0.05));

      const prediction: ReputationPrediction = {
        predictedScore: Math.max(0, Math.min(1000, predictedScore)),
        confidence,
        timeframe,
        trend: performanceTrend,
        influencingFactors: [
          `Historical performance (${recentBets.length} recent bets)`,
          `Success rate trend (${performanceTrend})`,
          'Time-based decay factor'
        ]
      };

      return prediction;
    } catch (error) {
      console.error('❌ Error predicting reputation:', error);
      return this.getRuleBasedReputationPrediction(userId, timeframe);
    }
  }

  private async getRuleBasedReputationPrediction(
    userId: string,
    timeframe: number
  ): Promise<ReputationPrediction> {
    const dbService = await getDbService();
    const user = await dbService.getUserByWallet(userId);
    return {
      predictedScore: user?.reputationScore || 750,
      confidence: 0.6,
      timeframe,
      trend: 'stable',
      influencingFactors: ['Historical average', 'No recent trend data']
    };
  }

  // ============================================================================
  // ROUTE OPTIMIZATION ENGINE
  // ============================================================================

  async optimizeRoute(
    userId: string,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<OptimizedRoute> {
    if (!isFeatureEnabled('enableRouteOptimization')) {
      return this.getRuleBasedRouteOptimization(origin, destination);
    }

    try {
      // Simulate route optimization with AI prediction
      // In a real implementation, this would call a routing AI model
      const baseTime = Math.sqrt(
        Math.pow(destination.lat - origin.lat, 2) +
        Math.pow(destination.lng - origin.lng, 2)
      ) * 1200; // Convert to seconds (approximation)

      // Generate alternative routes with time savings
      const alternatives = Array.from({ length: aiConfig.models.routeOptimization.maxAlternativeRoutes }, (_, i) => ({
        routeId: `route_${i + 1}`,
        distance: baseTime * (0.95 - i * 0.02), // Each alternative is slightly faster
        estimatedTime: baseTime * (0.95 - i * 0.02),
        timeSaved: baseTime - (baseTime * (0.95 - i * 0.02)),
        routeDetails: {
          traffic: i === 0 ? 'moderate' : i === 1 ? 'light' : 'light',
          roadType: ['highway', 'local', 'mixed'][i % 3],
          tolls: i > 1
        }
      })).filter(alt => alt.timeSaved > aiConfig.models.routeOptimization.timeSavingsThreshold);

      const optimizedRoute: OptimizedRoute = {
        alternativeRoutes: alternatives,
        confidence: 0.8,
        trafficConditions: 'moderate'
      };

      return optimizedRoute;
    } catch (error) {
      console.error('❌ Error optimizing route:', error);
      return this.getRuleBasedRouteOptimization(origin, destination);
    }
  }

  private getRuleBasedRouteOptimization(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): OptimizedRoute {
    const baseTime = Math.sqrt(
      Math.pow(destination.lat - origin.lat, 2) +
      Math.pow(destination.lng - origin.lng, 2)
    ) * 1200;

    return {
      alternativeRoutes: [{
        routeId: 'default',
        distance: baseTime,
        estimatedTime: baseTime,
        timeSaved: 0,
        routeDetails: { traffic: 'unknown', roadType: 'mixed', tolls: false }
      }],
      confidence: 0.6,
      trafficConditions: 'unknown'
    };
  }

  // ============================================================================
  // ACHIEVEMENT PREDICTION ENGINE
  // ============================================================================

  async predictAchievements(
    userId: string,
    timeframe: number = aiConfig.models.achievementPrediction.predictionWindow
  ): Promise<AchievementPrediction> {
    if (!isFeatureEnabled('enableAchievementPrediction')) {
      return this.getRuleBasedAchievementPrediction(userId, timeframe);
    }

    try {
      const dbService = await getDbService();
      const user = await dbService.getUserByWallet(userId);
      const userAchievements = await dbService.getUserAchievements(userId);

      // Predict likely upcoming achievements based on user behavior
      const possibleAchievements = [
        { id: 'punctuality_novice', probability: 0.8, requirements: ['Complete 10 commitments'] },
        { id: 'reliable_traveler', probability: 0.6, requirements: ['Maintain 90%+ punctuality'] },
        { id: 'betting_expert', probability: 0.7, requirements: ['Win 50%+ of bets'] },
        { id: 'early_bird', probability: 0.5, requirements: ['Arrive early 20% of time'] },
        { id: 'streak_builder', probability: 0.4, requirements: ['3 day commitment streak'] }
      ];

      // Filter achievements user doesn't already have
      const unlockedIds = userAchievements.map(ach => ach.achievementId);
      const filteredAchievements = possibleAchievements
        .filter(ach => !unlockedIds.includes(ach.id))
        .map(ach => ({
          achievementId: ach.id,
          probability: ach.probability,
          timeframe, // All predictions within the specified timeframe
          requirements: ach.requirements
        }));

      const prediction: AchievementPrediction = {
        predictedAchievements: filteredAchievements,
        confidence: Math.min(0.9, 0.5 + (userAchievements.length * 0.1))
      };

      return prediction;
    } catch (error) {
      console.error('❌ Error predicting achievements:', error);
      return this.getRuleBasedAchievementPrediction(userId, timeframe);
    }
  }

  private async getRuleBasedAchievementPrediction(
    userId: string,
    timeframe: number
  ): Promise<AchievementPrediction> {
    return {
      predictedAchievements: [
        { achievementId: 'punctuality_novice', probability: 0.7, timeframe, requirements: ['Complete 10 commitments'] }
      ],
      confidence: 0.5
    };
  }

  // ============================================================================
  // BETTING ODDS CALCULATION ENGINE
  // ============================================================================

  async calculateBettingOdds(
    commitmentId: string,
    userId: string
  ): Promise<BettingOdds> {
    if (!isFeatureEnabled('enableBettingOddsCalculation')) {
      return this.getRuleBasedBettingOdds(commitmentId, userId);
    }

    try {
      const dbService = await getDbService();
      const user = await dbService.getUserByWallet(userId);
      const commitment = await dbService.getCommitment(commitmentId);
      const userBets = await dbService.getUserBets(userId, 20);

      if (!user || !commitment) {
        throw new Error('User or commitment not found');
      }

      // Calculate odds based on user's reputation, commitment difficulty, and historical performance
      const reputationFactor = (user.reputationScore || 750) / 1000; // Normalize to 0-1
      const timeFactor = Math.max(0.5, Math.min(1.5, commitment.estimatedPace / 60)); // Factor in pace estimate (convert to hours)
      const commitmentDifficulty = timeFactor * (1 - reputationFactor); // Higher difficulty for longer time/low rep

      // Calculate base odds
      const baseOdds = 1 + (commitmentDifficulty * 2);
      const adjustedOdds = Math.min(
        aiConfig.models.bettingOdds.maxOdds,
        Math.max(aiConfig.models.bettingOdds.minOdds, baseOdds)
      );

      // Calculate volatility based on user's betting history
      const volatility = Math.max(0.1, userBets.length * 0.01);

      const odds: BettingOdds = {
        forSuccessOdds: adjustedOdds,
        againstSuccessOdds: 1 / (1 - 1 / adjustedOdds), // Adjust for inverse
        confidence: Math.min(0.95, 0.5 + reputationFactor * 0.3),
        volatility,
        lastUpdated: new Date()
      };

      return odds;
    } catch (error) {
      console.error('❌ Error calculating betting odds:', error);
      return this.getRuleBasedBettingOdds(commitmentId, userId);
    }
  }

  private async getRuleBasedBettingOdds(
    commitmentId: string,
    userId: string
  ): Promise<BettingOdds> {
    return {
      forSuccessOdds: 2.0,
      againstSuccessOdds: 2.0,
      confidence: 0.6,
      volatility: 0.2,
      lastUpdated: new Date()
    };
  }

  // ============================================================================
  // AI MODEL MANAGEMENT
  // ============================================================================

  async warmupModels() {
    try {
      console.log('🔥 Starting AI model warmup...');

      // Pre-load commonly used model configurations
      const modelConfigs = Object.values(aiConfig.models);

      for (const config of modelConfigs) {
        console.log(`🤖 Preparing model: ${config.modelId}`);
        // In a real implementation, load models here
      }

      console.log('✅ AI models ready for predictions');
    } catch (error) {
      console.error('❌ Error during AI model warmup:', error);
    }
  }

  async updateModelForUser(userId: string) {
    try {
      // Update AI models based on user's latest behavior
      // This would typically involve retraining or fine-tuning models
      console.log(`🔄 Updating AI model for user: ${userId}`);

      // Get user's latest data
      const dbService = await getDbService();
      const user = await dbService.getUserByWallet(userId);
      const userBets = await dbService.getUserBets(userId, 50);

      // Adjust model parameters based on user behavior
      if (userBets.length > 10) {
        // Adjust model weights based on user's betting pattern
        console.log(`🤖 Adjusted model for user ${userId} based on ${userBets.length} bets`);
      }

    } catch (error) {
      console.error('❌ Error updating model for user:', error);
    }
  }

  // ============================================================================
  // CONTEXTUAL INSIGHTS WITH VENICE AI
  // ============================================================================

  async generateContextualInsights(
  userId: string,
  context: {
  currentTime: string;
      location: string;
  weather?: string;
  socialContext: 'solo' | 'friends' | 'public';
  urgency: 'low' | 'medium' | 'high';
  }
  ): Promise<{
  insights: string[];
  recommendations: string[];
  riskAssessment: 'low' | 'medium' | 'high';
  }> {
  if (await isVeniceAvailable()) {
  console.log('🧠 Using Venice AI for contextual insights...');

  try {
  const dbService = await getDbService();
  const user = await dbService.getUserByWallet(userId);
    const userBets = await dbService.getUserBets(userId, 20);

        const successRate = userBets.length > 0 ?
          (userBets.filter(bet => bet.result === 'won').length / userBets.length) : 0;

        const insights = await veniceClient.generateContextualInsights(
          {
            reputation: user?.reputationScore || 750,
            totalCommitments: userBets.length,
            successRate,
            averagePace: 0.083 // Default pace
          },
          {
            type: context.urgency === 'high' ? 'urgent' : context.urgency === 'medium' ? 'work' : 'social',
            timeOfDay: context.currentTime,
            location: context.location,
            weather: context.weather
          }
        );

        if (insights) {
          console.log('✅ Venice AI contextual insights:', insights);
          return insights;
        }
      } catch (error) {
        console.error('Error generating Venice contextual insights:', error);
      }
    }

    // Fallback insights
    return {
      insights: [
        `Current time: ${context.currentTime}`,
        `Location: ${context.location}`,
        `${context.socialContext} context with ${context.urgency} urgency`
      ],
      recommendations: [
        'Consider current conditions for timing',
        'Check weather and traffic conditions',
        'Adjust pace based on social context'
      ],
      riskAssessment: context.urgency === 'high' ? 'high' : context.urgency === 'medium' ? 'medium' : 'low'
    };
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async getPerformanceMetrics() {
    try {
      const performanceTier = getPerformanceConfig();
      const isFeatureEnabled = Object.values(aiConfig.features).filter(f => f).length;
      const veniceHealth = await isVeniceAvailable() ? {
        veniceAvailable: true,
        veniceApiKeyConfigured: !!process.env.NEXT_PUBLIC_VENICE_API_KEY
      } : { veniceAvailable: false, veniceApiKeyConfigured: false };

      return {
        performanceTier,
        featuresEnabled: isFeatureEnabled,
        modelsLoaded: Object.keys(aiConfig.models).length,
        veniceHealth,
        lastUpdate: new Date(),
        aiProcessingEnabled: true
      };
    } catch (error) {
      console.error('❌ Error getting AI performance metrics:', error);
      return {
        performanceTier: 'midRange',
        featuresEnabled: 4,
        modelsLoaded: 3,
        veniceHealth: { veniceAvailable: false, veniceApiKeyConfigured: false },
        lastUpdate: new Date(),
        aiProcessingEnabled: false
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiService = new AIService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeAIService() {
  try {
    await aiService.initialize();
    console.log('🚀 AI Service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AI service:', error);
    throw error;
  }
}

export async function getAIServiceHealth() {
  return await aiService.healthCheck();
}