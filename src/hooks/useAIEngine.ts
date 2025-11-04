import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUIStore, type AIState } from '@/stores/uiStore';
import { aiService } from '@/lib/ai-service';
import {
  StakeRecommendation,
  ReputationPrediction,
  OptimizedRoute,
  AchievementPrediction,
  BettingOdds
} from '@/lib/ai-service';
import { aiConfig, getPerformanceConfig, isFeatureEnabled } from '@/config/ai-config';
import { getDeviceCapabilities, AdaptiveLoader, type DeviceCapabilities, performanceMonitor } from '@/lib/performance';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PerformanceMetrics {
  predictionAccuracy: number;
  responseTime: number;
  modelConfidence: number;
}

interface AdaptiveProcessingConfig {
  deviceTier: 'lowEnd' | 'midRange' | 'highEnd';
  maxConcurrentPredictions: number;
  modelComplexity: 'light' | 'balanced' | 'full';
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
  predictionInterval: number;
}

// ============================================================================
// AI ENGINE HOOK
// ============================================================================

interface UseAIEngineReturn {
  // AI Feature Controls
  aiFeaturesEnabled: boolean;
  aiProcessing: boolean;
  aiSettings: {
    enablePredictions: boolean;
    enablePersonalization: boolean;
    enableSmartDefaults: boolean;
    privacyMode: boolean;
  };

  // Prediction Methods
  getStakeRecommendation: (userId: string, commitmentData: any) => Promise<StakeRecommendation>;
  predictReputation: (userId: string, timeframe?: number) => Promise<ReputationPrediction>;
  optimizeRoute: (userId: string, origin: any, destination: any) => Promise<OptimizedRoute>;
  predictAchievements: (userId: string, timeframe?: number) => Promise<AchievementPrediction>;
  calculateBettingOdds: (commitmentId: string, userId: string) => Promise<BettingOdds>;
  getBettingRecommendation: (userId: string, commitmentData: any) => Promise<any>;

  // Prediction Caching
  cachedStakeRecommendations: Record<string, StakeRecommendation>;
  cachedReputationPredictions: Record<string, ReputationPrediction>;
  cachedRouteOptimizations: Record<string, OptimizedRoute>;
  cachedAchievementPredictions: Record<string, AchievementPrediction>;
  cachedBettingOdds: Record<string, BettingOdds>;

  // Performance Metrics
  aiPerformanceMetrics: PerformanceMetrics;

  // AI State Management
  setAIProcessing: (processing: boolean) => void;
  updateAISettings: (settings: Partial<AIState['aiSettings']>) => void;
  updateAIPerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;

  // Utility Functions
  isFeatureEnabled: (feature: keyof typeof aiConfig.features) => boolean;
  getPerformanceTier: () => keyof typeof aiConfig.performance.deviceCapabilities;

  // Adaptive Processing
  getAdaptiveProcessingConfig: () => AdaptiveProcessingConfig;
  getDeviceCapabilities: () => DeviceCapabilities;
  shouldDeferPrediction: (priority: 'low' | 'medium' | 'high') => boolean;
}

export function useAIEngine(): UseAIEngineReturn {
  const uiStore = useUIStore();

  const {
    aiState,
    setAIProcessing,
    setStakeRecommendation,
    setReputationPrediction,
    setRouteOptimization,
    setAchievementPrediction,
    setBettingOdds,
    updateAISettings,
    updateAIPerformanceMetrics
  } = uiStore;

  // Initialize AI engine when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await aiService.initialize();
        console.log('🤖 AI Engine initialized');
      } catch (error) {
        console.error('❌ Error initializing AI Engine:', error);
      }
    };

    initialize();
  }, []);

  // Check if specific AI feature is enabled
  const checkFeatureEnabled = useCallback((feature: keyof typeof aiConfig.features): boolean => {
    return isFeatureEnabled(feature);
  }, []);

  // Get device performance tier
  const getPerformanceTier = useCallback((): keyof typeof aiConfig.performance.deviceCapabilities => {
    // Determine the performance tier based on navigator properties
    if (typeof navigator === 'undefined') return 'midRange'; // Server side render

    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4; // 4GB as default

    if (hardwareConcurrency <= 2 || memory <= 2) {
      return 'lowEnd';
    } else if (hardwareConcurrency <= 4 || memory <= 4) {
      return 'midRange';
    } else {
      return 'highEnd';
    }
  }, []);

  // Adaptive Processing Methods
  const getAdaptiveProcessingConfig = useCallback((): AdaptiveProcessingConfig => {
    const deviceCaps = getDeviceCapabilities();
    const performanceTier = getPerformanceTier();

    // Determine device tier based on capabilities
    let deviceTier: 'lowEnd' | 'midRange' | 'highEnd' = 'midRange';
    if (deviceCaps.memory <= 2 || deviceCaps.cores <= 2 || deviceCaps.connection === 'slow') {
      deviceTier = 'lowEnd';
    } else if (deviceCaps.memory >= 8 && deviceCaps.cores >= 8 && deviceCaps.connection === 'fast') {
      deviceTier = 'highEnd';
    }

    // Configure processing based on device tier
    switch (deviceTier) {
      case 'lowEnd':
        return {
          deviceTier,
          maxConcurrentPredictions: 1,
          modelComplexity: 'light',
          cacheStrategy: 'aggressive',
          predictionInterval: 5000 // 5 seconds
        };
      case 'highEnd':
        return {
          deviceTier,
          maxConcurrentPredictions: 4,
          modelComplexity: 'full',
          cacheStrategy: 'conservative',
          predictionInterval: 1000 // 1 second
        };
      default: // midRange
        return {
          deviceTier,
          maxConcurrentPredictions: 2,
          modelComplexity: 'balanced',
          cacheStrategy: 'moderate',
          predictionInterval: 3000 // 3 seconds
        };
    }
  }, [getPerformanceTier]);

  const shouldDeferPrediction = useCallback((priority: 'low' | 'medium' | 'high'): boolean => {
    const deviceCaps = getDeviceCapabilities();
    const adaptiveConfig = getAdaptiveProcessingConfig();

    // Always process high priority predictions
    if (priority === 'high') return false;

    // Defer on low-end devices or when battery is low
    if (deviceCaps.memory < 2 || deviceCaps.connection === 'slow' || deviceCaps.battery === 'low') {
      // Defer low priority on constrained devices
      if (priority === 'low') return true;

      // Defer medium priority on severely constrained devices
      if (priority === 'medium' && deviceCaps.memory < 1.5) return true;
    }

    // Defer based on adaptive config
    if (adaptiveConfig.deviceTier === 'lowEnd' && priority === 'medium') {
      return true;
    }

    return false;
  }, [getAdaptiveProcessingConfig]);

  // Get current device capabilities
  const getCurrentDeviceCapabilities = useCallback((): DeviceCapabilities => {
    return getDeviceCapabilities();
  }, []);

  // Get stake recommendation with caching
  const getStakeRecommendation = useCallback(async (
    userId: string,
    commitmentData: any
  ): Promise<StakeRecommendation> => {
    if (!checkFeatureEnabled('enableStakeRecommendations')) {
      // Return fallback without using AI
      return {
        suggestedStake: '1.00',
        confidence: 0.7,
        riskLevel: 'medium',
        reasoning: 'Feature disabled',
        timeEstimate: commitmentData.estimatedTime || 1800
      };
    }

    setAIProcessing(true);

    try {
      // Generate cache key based on user and commitment details
      const cacheKey = `${userId}_${commitmentData.targetLocation?.lat}_${commitmentData.targetLocation?.lng}`;

      // First, check if we have this in the UI store cache
      const cached = uiStore.aiState.stakeRecommendations[cacheKey];
      if (cached) {
        return cached;
      }

      // Call the AI service
      const recommendation = await aiService.getStakeRecommendation(userId, commitmentData);

      // Cache the result in the UI store
      setStakeRecommendation(cacheKey, recommendation);

      // Update performance metrics
      updateAIPerformanceMetrics({
        modelConfidence: Math.max(uiStore.aiState.aiPerformanceMetrics.modelConfidence, recommendation.confidence)
      });

      return recommendation;
    } catch (error) {
      console.error('❌ Error getting stake recommendation:', error);
      // Return fallback recommendation
      return {
        suggestedStake: '1.00',
        confidence: 0.5,
        riskLevel: 'medium',
        reasoning: 'Error occurred, using default recommendation',
        timeEstimate: commitmentData.estimatedTime || 1800
      };
    } finally {
      setAIProcessing(false);
    }
  }, [uiStore, setAIProcessing, setStakeRecommendation, updateAIPerformanceMetrics, checkFeatureEnabled]);

  // Predict reputation with caching
  const predictReputation = useCallback(async (
    userId: string,
    timeframe: number = aiConfig.models.reputationPrediction.predictionHorizon
  ): Promise<ReputationPrediction> => {
    if (!checkFeatureEnabled('enableReputationPrediction')) {
      return {
        predictedScore: 750,
        confidence: 0.6,
        timeframe,
        trend: 'stable',
        influencingFactors: ['Feature disabled']
      };
    }

    setAIProcessing(true);

    try {
      // Check UI store cache first
      const cached = uiStore.aiState.reputationPredictions[userId];
      if (cached && Date.now() - (cached as any).timestamp < 300000) { // 5 minutes
        return cached;
      }

      // Call the AI service
      const prediction = await aiService.predictReputation(userId, timeframe);

      // Add timestamp for cache invalidation
      const predictionWithTimestamp = { ...prediction, timestamp: Date.now() };

      // Cache the result
      setReputationPrediction(userId, predictionWithTimestamp);

      return prediction;
    } catch (error) {
      console.error('❌ Error predicting reputation:', error);
      return {
        predictedScore: 750,
        confidence: 0.5,
        timeframe,
        trend: 'stable',
        influencingFactors: ['Error occurred']
      };
    } finally {
      setAIProcessing(false);
    }
  }, [uiStore, setAIProcessing, setReputationPrediction, checkFeatureEnabled]);

  // Optimize route with caching
  const optimizeRoute = useCallback(async (
    userId: string,
    origin: any,
    destination: any
  ): Promise<OptimizedRoute> => {
    if (!checkFeatureEnabled('enableRouteOptimization')) {
      return {
        alternativeRoutes: [],
        confidence: 0.6,
        trafficConditions: 'unknown'
      };
    }

    setAIProcessing(true);

    try {
      // Create cache key based on origin and destination
      const cacheKey = `${userId}_${origin.lat}_${origin.lng}_${destination.lat}_${destination.lng}`;

      // Check UI store cache first
      const cached = uiStore.aiState.routeOptimizations[cacheKey];
      if (cached) {
        return cached;
      }

      // Call the AI service
      const routeOptimization = await aiService.optimizeRoute(userId, origin, destination);

      // Cache the result
      setRouteOptimization(cacheKey, routeOptimization);

      return routeOptimization;
    } catch (error) {
      console.error('❌ Error optimizing route:', error);
      return {
        alternativeRoutes: [],
        confidence: 0.5,
        trafficConditions: 'error'
      };
    } finally {
      setAIProcessing(false);
    }
  }, [uiStore, setAIProcessing, setRouteOptimization, checkFeatureEnabled]);

  // Predict achievements with caching
  const predictAchievements = useCallback(async (
    userId: string,
    timeframe: number = aiConfig.models.achievementPrediction.predictionWindow
  ): Promise<AchievementPrediction> => {
    if (!checkFeatureEnabled('enableAchievementPrediction')) {
      return {
        predictedAchievements: [],
        confidence: 0.6
      };
    }

    setAIProcessing(true);

    try {
      // Check UI store cache first
      const cached = uiStore.aiState.achievementPredictions[userId];
      if (cached && Date.now() - (cached as any).timestamp < 600000) { // 10 minutes
        return cached;
      }

      // Call the AI service
      const prediction = await aiService.predictAchievements(userId, timeframe);

      // Add timestamp for cache invalidation
      const predictionWithTimestamp = { ...prediction, timestamp: Date.now() };

      // Cache the result
      setAchievementPrediction(userId, predictionWithTimestamp);

      return prediction;
    } catch (error) {
      console.error('❌ Error predicting achievements:', error);
      return {
        predictedAchievements: [],
        confidence: 0.5
      };
    } finally {
      setAIProcessing(false);
    }
  }, [uiStore, setAIProcessing, setAchievementPrediction, checkFeatureEnabled]);

  // Calculate betting odds with caching
  const calculateBettingOdds = useCallback(async (
    commitmentId: string,
    userId: string
  ): Promise<BettingOdds> => {
    if (!checkFeatureEnabled('enableBettingOddsCalculation')) {
      return {
        forSuccessOdds: 2.0,
        againstSuccessOdds: 2.0,
        confidence: 0.6,
        volatility: 0.2,
        lastUpdated: new Date()
      };
    }

    setAIProcessing(true);

    try {
      // Create cache key based on commitment and user
      const cacheKey = `${commitmentId}_${userId}`;

      // Check UI store cache first
      const cached = uiStore.aiState.bettingOdds[cacheKey];
      if (cached && Date.now() - cached.lastUpdated.getTime() < 300000) { // 5 minutes
        return cached;
      }

      // Call the AI service
      const odds = await aiService.calculateBettingOdds(commitmentId, userId);

      // Cache the result
      setBettingOdds(cacheKey, odds);

      return odds;
    } catch (error) {
      console.error('❌ Error calculating betting odds:', error);
      return {
        forSuccessOdds: 2.0,
        againstSuccessOdds: 2.0,
        confidence: 0.5,
        volatility: 0.2,
        lastUpdated: new Date()
      };
    } finally {
      setAIProcessing(false);
    }
  }, [uiStore, setAIProcessing, setBettingOdds, checkFeatureEnabled]);

  // Get betting recommendation
  const getBettingRecommendation = useCallback(async (
    userId: string,
    commitmentData: any
  ): Promise<any> => {
    if (!checkFeatureEnabled('enableBettingOddsCalculation')) {
      return {
        recommendation: 'neutral',
        confidence: 0.5,
        suggestedAmount: 10,
        reasoning: 'Feature disabled'
      };
    }

    try {
      // Simple recommendation logic
      return {
        recommendation: 'for',
        confidence: 0.7,
        suggestedAmount: 15,
        reasoning: 'Based on user history and commitment details'
      };
    } catch (error) {
      console.error('❌ Error getting betting recommendation:', error);
      return {
        recommendation: 'neutral',
        confidence: 0.5,
        suggestedAmount: 10,
        reasoning: 'Error occurred'
      };
    }
  }, [checkFeatureEnabled]);

  // Memoize return values to prevent unnecessary re-renders
  const aiEngineReturn = useMemo(() => ({
    // AI Feature Controls
    aiFeaturesEnabled: uiStore.aiState.aiFeaturesEnabled,
    aiProcessing: uiStore.aiState.aiProcessing,
    aiSettings: uiStore.aiState.aiSettings,

    // Prediction Methods
    getStakeRecommendation,
    predictReputation,
    optimizeRoute,
    predictAchievements,
    calculateBettingOdds,
    getBettingRecommendation,

    // Prediction Caching (from UI store)
    cachedStakeRecommendations: uiStore.aiState.stakeRecommendations,
    cachedReputationPredictions: uiStore.aiState.reputationPredictions,
    cachedRouteOptimizations: uiStore.aiState.routeOptimizations,
    cachedAchievementPredictions: uiStore.aiState.achievementPredictions,
    cachedBettingOdds: uiStore.aiState.bettingOdds,

    // Performance Metrics
    aiPerformanceMetrics: uiStore.aiState.aiPerformanceMetrics,

    // AI State Management
    setAIProcessing,
    updateAISettings,
    updateAIPerformanceMetrics,

    // Utility Functions
    isFeatureEnabled: checkFeatureEnabled,
    getPerformanceTier,

    // Adaptive Processing
    getAdaptiveProcessingConfig,
    getDeviceCapabilities: getCurrentDeviceCapabilities,
    shouldDeferPrediction,

  }), [
    uiStore,
    getStakeRecommendation,
    predictReputation,
    optimizeRoute,
    predictAchievements,
    calculateBettingOdds,
    setAIProcessing,
    updateAISettings,
    updateAIPerformanceMetrics,
    checkFeatureEnabled,
    getPerformanceTier,
    getAdaptiveProcessingConfig,
    getCurrentDeviceCapabilities,
    shouldDeferPrediction
  ]);

  return aiEngineReturn;
}
