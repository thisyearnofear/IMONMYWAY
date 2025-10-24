// AI Configuration for Punctuality Protocol
// Single source of truth for all AI-related settings

// ============================================================================ 
// AI MODEL CONFIGURATIONS
// ============================================================================

export const AI_MODEL_CONFIGS = {
  // Stake recommendation model
  stakeRecommendation: {
    modelId: 'stake-recommender-v1',
    endpoint: '/api/ai/stake-recommend',
    maxStakeMultiplier: 5, // Maximum stake relative to user balance
    minConfidence: 0.7, // Minimum confidence for AI recommendations
    defaultStake: '1.0', // Default stake when AI unavailable
    learningRate: 0.1, // Rate at which model adapts to user behavior
  },

  // Reputation prediction model
  reputationPrediction: {
    modelId: 'reputation-predictor-v1',
    endpoint: '/api/ai/reputation-predict',
    predictionHorizon: 30, // Days to predict reputation changes
    updateInterval: 3600, // Update predictions every hour
    confidenceThreshold: 0.65,
  },

  // Route optimization model
  routeOptimization: {
    modelId: 'route-optimizer-v1',
    endpoint: '/api/ai/route-optimize',
    maxAlternativeRoutes: 3,
    timeSavingsThreshold: 60, // Only suggest alternative if saves more than 60s
    trafficIntegration: true,
  },

  // Achievement prediction model
  achievementPrediction: {
    modelId: 'achievement-predictor-v1',
    endpoint: '/api/ai/achievement-predict',
    predictionWindow: 7, // Predict achievements in next 7 days
    motivationFactor: 1.5, // How much to encourage achievement hunting
  },

  // Betting odds calculator
  bettingOdds: {
    modelId: 'odds-calculator-v1',
    endpoint: '/api/ai/odds-calculate',
    maxOdds: 10, // Maximum odds for any bet
    minOdds: 1.1, // Minimum odds (slightly better than even)
    volatilityWindow: 24, // Hours for volatility calculation
  },
};

// ============================================================================ 
// AI PERFORMANCE CONFIGURATIONS
// ============================================================================

export const AI_PERFORMANCE = {
  // Adaptive processing based on device capabilities
  deviceCapabilities: {
    lowEnd: {
      maxConcurrentPredictions: 1,
      modelComplexity: 'light',
      cacheTimeout: 300, // 5 minutes
      predictionInterval: 60000, // 1 minute
    },
    midRange: {
      maxConcurrentPredictions: 2,
      modelComplexity: 'balanced',
      cacheTimeout: 600, // 10 minutes
      predictionInterval: 30000, // 30 seconds
    },
    highEnd: {
      maxConcurrentPredictions: 4,
      modelComplexity: 'full',
      cacheTimeout: 1200, // 20 minutes
      predictionInterval: 15000, // 15 seconds
    },
  },

  // Fallback strategies when AI is unavailable
  fallbackStrategies: {
    useHistoricalData: true,
    useRuleBased: true,
    degradeGracefully: true,
    offlineSupport: true,
  },
};

// ============================================================================ 
// AI PRIVACY & SECURITY CONFIGURATIONS
// ============================================================================

export const AI_PRIVACY = {
  // Data handling and privacy settings
  dataRetention: {
    predictionHistory: 7, // Days to retain prediction history
    userBehavior: 30, // Days to retain behavioral data
    modelTraining: 90, // Days to retain for training data
  },

  // Privacy settings
  anonymizeUserData: true,
  localProcessing: true, // Prefer client-side when possible
  dataMinimization: true, // Only collect necessary data
  optOutSupported: true,
};

// ============================================================================ 
// AI MONITORING & LOGGING CONFIGURATIONS
// ============================================================================

export const AI_MONITORING = {
  // Logging and monitoring settings
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  logPredictions: false, // Whether to log individual predictions
  logPerformance: true, // Whether to log performance metrics
  anomalyDetection: true, // Detect unusual prediction patterns

  // Performance monitoring
  performanceThresholds: {
    predictionLatency: 1000, // Max 1 second for prediction
    modelSizeLimit: 50, // Max 50MB for model assets
    cpuUsageLimit: 80, // Max 80% CPU usage
  },
};

// ============================================================================ 
// AI FEATURE FLAGS
// ============================================================================

export const AI_FEATURE_FLAGS = {
  // Feature flags to enable/disable AI features
  enableStakeRecommendations: true,
  enableRouteOptimization: true,
  enableReputationPrediction: true,
  enableAchievementPrediction: true,
  enableBettingOddsCalculation: true,
  enablePredictiveNotifications: true,
  enablePersonalizedDashboard: true,
  enableSmartDefaults: true,
};

// ============================================================================ 
// SINGLETON CONFIGURATION INSTANCE
// ============================================================================

export const aiConfig = {
  models: AI_MODEL_CONFIGS,
  performance: AI_PERFORMANCE,
  privacy: AI_PRIVACY,
  monitoring: AI_MONITORING,
  features: AI_FEATURE_FLAGS,
};

// ============================================================================ 
// UTILITY FUNCTIONS
// ============================================================================

export function isFeatureEnabled(featureName: keyof typeof AI_FEATURE_FLAGS): boolean {
  return aiConfig.features[featureName] ?? false;
}

export function getDevicePerformanceTier(): keyof typeof AI_PERFORMANCE.deviceCapabilities {
  // Determine device tier based on hardware capabilities
  if (typeof navigator === 'undefined') return 'midRange'; // Server side render
  
  // Simple heuristic for device tier
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4; // 4GB as default
  
  if (hardwareConcurrency <= 2 || memory <= 2) {
    return 'lowEnd';
  } else if (hardwareConcurrency <= 4 || memory <= 4) {
    return 'midRange';
  } else {
    return 'highEnd';
  }
}

export function getPerformanceConfig() {
  return aiConfig.performance.deviceCapabilities[getDevicePerformanceTier()];
}