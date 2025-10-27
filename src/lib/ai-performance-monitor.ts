/**
 * AI Performance Monitoring System
 * 
 * Tracks AI operation metrics, predicts performance issues, and optimizes
 * AI processing based on real-time performance data and device capabilities.
 * 
 * Core Principles:
 * - PERFORMANT: Adaptive loading, caching, and resource optimization
 * - MODULAR: Independent monitoring for each AI operation type
 * - DRY: Single source of truth for performance metrics
 * - CLEAN: Clear separation between monitoring and optimization logic
 */

import { getDeviceCapabilities, type DeviceCapabilities } from '@/lib/performance';

// ============================================================================
// PERFORMANCE METRICS TYPES
// ============================================================================

export interface AIOperationMetrics {
  operationType: 'stake' | 'reputation' | 'route' | 'achievement' | 'betting';
  executionTime: number; // milliseconds
  cacheHit: boolean;
  confidence: number;
  timestamp: number;
  deviceTier: 'lowEnd' | 'midRange' | 'highEnd';
  success: boolean;
  errorMessage?: string;
}

export interface AggregatedMetrics {
  operationType: string;
  avgExecutionTime: number;
  cacheHitRate: number;
  avgConfidence: number;
  successRate: number;
  totalOperations: number;
  trend: 'improving' | 'degrading' | 'stable';
  lastUpdated: number;
}

export interface PerformanceOptimization {
  shouldReduceComplexity: boolean;
  shouldIncreaseCache: boolean;
  shouldDeferOperations: boolean;
  recommendedBatchSize: number;
  estimatedMemoryUsage: number;
}

// ============================================================================
// AI PERFORMANCE MONITOR
// ============================================================================

export class AIPerformanceMonitor {
  private static instance: AIPerformanceMonitor;
  private metrics: Map<string, AIOperationMetrics[]> = new Map();
  private aggregatedMetrics: Map<string, AggregatedMetrics> = new Map();
  private readonly maxMetricsPerOperation = 100; // Keep last 100 metrics per operation
  private updateInterval: NodeJS.Timeout | null = null;
  private deviceCapabilities: DeviceCapabilities;

  static getInstance(): AIPerformanceMonitor {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Return a mock object on the server
      const mockInstance = new AIPerformanceMonitor();
      // Override methods to be no-ops on server
      mockInstance.recordOperation = () => {};
      mockInstance.getAggregatedMetrics = () => null;
      mockInstance.getAllAggregatedMetrics = () => new Map();
      mockInstance.getOptimizationRecommendations = () => ({
        shouldReduceComplexity: false,
        shouldIncreaseCache: true,
        shouldDeferOperations: false,
        recommendedBatchSize: 5,
        estimatedMemoryUsage: 10
      });
      mockInstance.getPerformanceScore = () => 100;
      mockInstance.getOperationTrend = () => 'stable';
      mockInstance.clearMetrics = () => {};
      mockInstance.getDetailedReport = () => ({
        deviceCapabilities: { memory: 4, cores: 4, connection: 'fast' as const, battery: 'high' as const, deviceType: 'desktop' as const },
        performanceScore: 100,
        aggregatedMetrics: new Map(),
        recommendations: {
          shouldReduceComplexity: false,
          shouldIncreaseCache: true,
          shouldDeferOperations: false,
          recommendedBatchSize: 5,
          estimatedMemoryUsage: 10
        },
        operationTrends: {}
      });
      return mockInstance;
    }
    
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor();
    }
    return AIPerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.deviceCapabilities = getDeviceCapabilities();
      this.startAggregationLoop();
    } else {
      // Default capabilities for server
      this.deviceCapabilities = { 
        memory: 4, 
        cores: 4, 
        connection: 'fast', 
        battery: 'high', 
        deviceType: 'desktop' 
      };
    }
  }

  /**
   * Record a single AI operation metric
   */
  recordOperation(metric: AIOperationMetrics): void {
    const key = metric.operationType;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const operations = this.metrics.get(key)!;
    operations.push(metric);

    // Keep only last N metrics to prevent memory bloat
    if (operations.length > this.maxMetricsPerOperation) {
      operations.shift();
    }

    // Update aggregated metrics
    this.updateAggregatedMetrics(key);
  }

  /**
   * Get aggregated metrics for a specific operation type
   */
  getAggregatedMetrics(operationType: string): AggregatedMetrics | null {
    return this.aggregatedMetrics.get(operationType) || null;
  }

  /**
   * Get all aggregated metrics
   */
  getAllAggregatedMetrics(): Map<string, AggregatedMetrics> {
    return new Map(this.aggregatedMetrics);
  }

  /**
   * Calculate performance optimization recommendations
   */
  getOptimizationRecommendations(): PerformanceOptimization {
    const allMetrics = Array.from(this.aggregatedMetrics.values());
    
    if (allMetrics.length === 0) {
      return this.getDefaultOptimization();
    }

    // Calculate average metrics across all operations
    const avgExecutionTime = allMetrics.reduce((sum, m) => sum + m.avgExecutionTime, 0) / allMetrics.length;
    const avgSuccessRate = allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length;
    const avgCacheHitRate = allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / allMetrics.length;

    // Determine if we should reduce complexity
    const shouldReduceComplexity = 
      avgExecutionTime > 1000 || // Operations taking > 1 second
      avgSuccessRate < 0.8 || // Success rate below 80%
      this.deviceCapabilities.memory < 2; // Low memory device

    // Determine if we should increase cache
    const shouldIncreaseCache = 
      avgCacheHitRate < 0.5 && // Cache hit rate below 50%
      this.deviceCapabilities.connection !== 'slow'; // Not on slow connection

    // Determine if we should defer operations
    const shouldDeferOperations = 
      this.deviceCapabilities.battery === 'low' ||
      this.deviceCapabilities.memory < 1.5 ||
      avgExecutionTime > 2000;

    // Calculate recommended batch size based on device capabilities
    let recommendedBatchSize = 5;
    if (this.deviceCapabilities.memory < 2) {
      recommendedBatchSize = 1;
    } else if (this.deviceCapabilities.memory < 4) {
      recommendedBatchSize = 2;
    } else if (this.deviceCapabilities.memory >= 8) {
      recommendedBatchSize = 10;
    }

    // Estimate memory usage
    const estimatedMemoryUsage = this.estimateMemoryUsage();

    return {
      shouldReduceComplexity,
      shouldIncreaseCache,
      shouldDeferOperations,
      recommendedBatchSize,
      estimatedMemoryUsage
    };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const allMetrics = Array.from(this.aggregatedMetrics.values());
    
    if (allMetrics.length === 0) return 100;

    // Calculate weighted score
    let score = 100;

    // Penalize slow execution times
    const avgExecutionTime = allMetrics.reduce((sum, m) => sum + m.avgExecutionTime, 0) / allMetrics.length;
    if (avgExecutionTime > 1000) {
      score -= Math.min(30, (avgExecutionTime - 1000) / 100);
    }

    // Penalize low success rates
    const avgSuccessRate = allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length;
    if (avgSuccessRate < 0.9) {
      score -= (0.9 - avgSuccessRate) * 50;
    }

    // Reward high cache hit rates
    const avgCacheHitRate = allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / allMetrics.length;
    score += avgCacheHitRate * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get performance trend for a specific operation
   */
  getOperationTrend(operationType: string): 'improving' | 'degrading' | 'stable' {
    const metrics = this.metrics.get(operationType);
    if (!metrics || metrics.length < 10) return 'stable';

    // Compare recent metrics with older metrics
    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    const recentAvgTime = recent.reduce((sum, m) => sum + m.executionTime, 0) / recent.length;
    const olderAvgTime = older.reduce((sum, m) => sum + m.executionTime, 0) / older.length;

    const recentSuccessRate = recent.filter(m => m.success).length / recent.length;
    const olderSuccessRate = older.filter(m => m.success).length / older.length;

    // Determine trend
    const timeImprovement = (olderAvgTime - recentAvgTime) / olderAvgTime;
    const successImprovement = recentSuccessRate - olderSuccessRate;

    if (timeImprovement > 0.1 || successImprovement > 0.1) {
      return 'improving';
    } else if (timeImprovement < -0.1 || successImprovement < -0.1) {
      return 'degrading';
    }

    return 'stable';
  }

  /**
   * Clear metrics for a specific operation or all operations
   */
  clearMetrics(operationType?: string): void {
    if (operationType) {
      this.metrics.delete(operationType);
      this.aggregatedMetrics.delete(operationType);
    } else {
      this.metrics.clear();
      this.aggregatedMetrics.clear();
    }
  }

  /**
   * Get detailed report for debugging
   */
  getDetailedReport(): {
    deviceCapabilities: DeviceCapabilities;
    performanceScore: number;
    aggregatedMetrics: Map<string, AggregatedMetrics>;
    recommendations: PerformanceOptimization;
    operationTrends: Record<string, 'improving' | 'degrading' | 'stable'>;
  } {
    const operationTrends: Record<string, 'improving' | 'degrading' | 'stable'> = {};
    
    for (const operationType of this.metrics.keys()) {
      operationTrends[operationType] = this.getOperationTrend(operationType);
    }

    return {
      deviceCapabilities: this.deviceCapabilities,
      performanceScore: this.getPerformanceScore(),
      aggregatedMetrics: new Map(this.aggregatedMetrics),
      recommendations: this.getOptimizationRecommendations(),
      operationTrends
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private updateAggregatedMetrics(operationType: string): void {
    const operations = this.metrics.get(operationType);
    if (!operations || operations.length === 0) return;

    // Calculate aggregated metrics
    const avgExecutionTime = operations.reduce((sum, m) => sum + m.executionTime, 0) / operations.length;
    const cacheHitRate = operations.filter(m => m.cacheHit).length / operations.length;
    const avgConfidence = operations.reduce((sum, m) => sum + m.confidence, 0) / operations.length;
    const successRate = operations.filter(m => m.success).length / operations.length;

    const aggregated: AggregatedMetrics = {
      operationType,
      avgExecutionTime,
      cacheHitRate,
      avgConfidence,
      successRate,
      totalOperations: operations.length,
      trend: this.getOperationTrend(operationType),
      lastUpdated: Date.now()
    };

    this.aggregatedMetrics.set(operationType, aggregated);
  }

  private startAggregationLoop(): void {
    if (typeof window !== 'undefined') {
      // Update device capabilities periodically on the client
      this.updateInterval = setInterval(() => {
        this.deviceCapabilities = getDeviceCapabilities();
      }, 30000); // Every 30 seconds
    }
  }

  private getDefaultOptimization(): PerformanceOptimization {
    return {
      shouldReduceComplexity: false,
      shouldIncreaseCache: true,
      shouldDeferOperations: false,
      recommendedBatchSize: 5,
      estimatedMemoryUsage: 10 // MB
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in MB
    let usage = 5; // Base usage

    // Add memory for each operation type
    for (const operations of this.metrics.values()) {
      usage += (operations.length * 0.1); // ~0.1MB per operation metric
    }

    // Add memory for aggregated metrics
    usage += (this.aggregatedMetrics.size * 0.05);

    return Math.round(usage * 10) / 10; // Round to 1 decimal place
  }

  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.metrics.clear();
    this.aggregatedMetrics.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiPerformanceMonitor = AIPerformanceMonitor.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a performance-tracked wrapper for AI operations
 */
export function createPerformanceTrackedOperation<T>(
  operationType: 'stake' | 'reputation' | 'route' | 'achievement' | 'betting',
  operation: () => Promise<{ result: T; confidence: number }>,
  options: { cacheHit?: boolean } = {}
): Promise<T> {
  const startTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0;
  const deviceCapabilities = getDeviceCapabilities();
  const deviceTier = getDeviceTier(deviceCapabilities);

  return operation()
    .then(({ result, confidence }) => {
      const endTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0;
      const executionTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? endTime - startTime : 0;

      aiPerformanceMonitor.recordOperation({
        operationType,
        executionTime,
        cacheHit: options.cacheHit || false,
        confidence,
        timestamp: Date.now(),
        deviceTier,
        success: true
      });

      return result;
    })
    .catch((error) => {
      const endTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0;
      const executionTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? endTime - startTime : 0;

      aiPerformanceMonitor.recordOperation({
        operationType,
        executionTime,
        cacheHit: options.cacheHit || false,
        confidence: 0,
        timestamp: Date.now(),
        deviceTier,
        success: false,
        errorMessage: error.message
      });

      throw error;
    });
}

/**
 * Determine device tier from capabilities
 */
function getDeviceTier(capabilities: DeviceCapabilities): 'lowEnd' | 'midRange' | 'highEnd' {
  if (capabilities.memory <= 2 || capabilities.cores <= 2 || capabilities.connection === 'slow') {
    return 'lowEnd';
  } else if (capabilities.memory >= 8 && capabilities.cores >= 8 && capabilities.connection === 'fast') {
    return 'highEnd';
  }
  return 'midRange';
}
