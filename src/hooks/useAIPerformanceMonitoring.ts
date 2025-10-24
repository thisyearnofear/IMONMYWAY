/**
 * AI Performance Monitoring Hook
 * 
 * Provides real-time performance metrics and optimization recommendations
 * for AI operations. Enables components to adapt their behavior based on
 * actual performance data and device capabilities.
 * 
 * Usage:
 * const { performanceScore, recommendations, metrics } = useAIPerformanceMonitoring();
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  aiPerformanceMonitor, 
  type AggregatedMetrics, 
  type PerformanceOptimization 
} from '@/lib/ai-performance-monitor';
import { getDeviceCapabilities, type DeviceCapabilities } from '@/lib/performance';

interface UseAIPerformanceMonitoringReturn {
  // Performance Metrics
  performanceScore: number;
  aggregatedMetrics: Map<string, AggregatedMetrics>;
  
  // Optimization Recommendations
  recommendations: PerformanceOptimization;
  
  // Device Information
  deviceCapabilities: DeviceCapabilities;
  
  // Adaptive Behavior Flags
  shouldReduceAnimations: boolean;
  shouldLazyLoadAI: boolean;
  shouldBatchOperations: boolean;
  shouldUseSimplifiedUI: boolean;
  
  // Utility Functions
  getOperationTrend: (operationType: string) => 'improving' | 'degrading' | 'stable';
  getDetailedReport: () => any;
  clearMetrics: (operationType?: string) => void;
}

export function useAIPerformanceMonitoring(): UseAIPerformanceMonitoringReturn {
  const [performanceScore, setPerformanceScore] = useState(100);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<Map<string, AggregatedMetrics>>(new Map());
  const [recommendations, setRecommendations] = useState<PerformanceOptimization>({
    shouldReduceComplexity: false,
    shouldIncreaseCache: true,
    shouldDeferOperations: false,
    recommendedBatchSize: 5,
    estimatedMemoryUsage: 10
  });
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>(
    getDeviceCapabilities()
  );

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setPerformanceScore(aiPerformanceMonitor.getPerformanceScore());
      setAggregatedMetrics(new Map(aiPerformanceMonitor.getAllAggregatedMetrics()));
      setRecommendations(aiPerformanceMonitor.getOptimizationRecommendations());
      setDeviceCapabilities(getDeviceCapabilities());
    };

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  // Get operation trend
  const getOperationTrend = useCallback(
    (operationType: string) => aiPerformanceMonitor.getOperationTrend(operationType),
    []
  );

  // Get detailed report
  const getDetailedReport = useCallback(
    () => aiPerformanceMonitor.getDetailedReport(),
    []
  );

  // Clear metrics
  const clearMetrics = useCallback(
    (operationType?: string) => aiPerformanceMonitor.clearMetrics(operationType),
    []
  );

  // Calculate adaptive behavior flags
  const adaptiveBehavior = useMemo(() => {
    const shouldReduceAnimations = 
      performanceScore < 60 || 
      deviceCapabilities.memory < 2 ||
      deviceCapabilities.connection === 'slow';

    const shouldLazyLoadAI = 
      deviceCapabilities.battery === 'low' ||
      deviceCapabilities.connection === 'slow' ||
      recommendations.shouldDeferOperations;

    const shouldBatchOperations = 
      performanceScore < 70 ||
      recommendations.shouldReduceComplexity;

    const shouldUseSimplifiedUI = 
      performanceScore < 50 ||
      deviceCapabilities.memory < 1.5;

    return {
      shouldReduceAnimations,
      shouldLazyLoadAI,
      shouldBatchOperations,
      shouldUseSimplifiedUI
    };
  }, [performanceScore, deviceCapabilities, recommendations]);

  return {
    performanceScore,
    aggregatedMetrics,
    recommendations,
    deviceCapabilities,
    shouldReduceAnimations: adaptiveBehavior.shouldReduceAnimations,
    shouldLazyLoadAI: adaptiveBehavior.shouldLazyLoadAI,
    shouldBatchOperations: adaptiveBehavior.shouldBatchOperations,
    shouldUseSimplifiedUI: adaptiveBehavior.shouldUseSimplifiedUI,
    getOperationTrend,
    getDetailedReport,
    clearMetrics
  };
}
