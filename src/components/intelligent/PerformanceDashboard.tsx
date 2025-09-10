/**
 * Performance Dashboard - Real-time Performance Monitoring
 * 
 * Provides comprehensive performance monitoring, metrics visualization,
 * and optimization recommendations for the application.
 */

"use client";

import { useState, useEffect, useCallback } from 'react'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { useNetworkResilience } from '@/lib/engines/network-resilience-engine'
import { useOptimizedDatabase } from '@/lib/database/optimized-db-service'
import { useComponentExperience } from '@/lib/engines/unified-experience-engine'
import { EnhancedButton } from '@/components/core/EnhancedButton'
import { UnifiedLoader } from '@/components/core/UnifiedLoader'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  loadTime: number
  renderTime: number
  networkLatency: number
  cacheHitRate: number
  errorRate: number
  bundleSize: number
}

interface OptimizationRecommendation {
  id: string
  type: 'critical' | 'warning' | 'info'
  category: 'performance' | 'network' | 'database' | 'ui' | 'mobile'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  action?: () => void
}

// ============================================================================
// PERFORMANCE DASHBOARD COMPONENT
// ============================================================================

export function PerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'database' | 'recommendations'>('overview')
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])

  const { metrics: performanceMetrics, startMonitoring, stopMonitoring } = usePerformanceMonitor()
  const { networkState, queueStats, storageInfo } = useNetworkResilience()
  const { getPerformanceStats, healthCheck } = useOptimizedDatabase()
  const { cardAnimation, getAnimationClass } = useComponentExperience('PerformanceDashboard')

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  const collectMetrics = useCallback(async () => {
    try {
      const dbStats = getPerformanceStats()
      const health = await healthCheck()
      
      // Simulate additional metrics (in real implementation, these would come from actual monitoring)
      const newMetrics: PerformanceMetrics = {
        fps: performanceMetrics.fps,
        memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
        loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0,
        renderTime: performanceMetrics.animationFrameTime,
        networkLatency: networkState.rtt,
        cacheHitRate: dbStats.cacheHitRate,
        errorRate: dbStats.errorRate,
        bundleSize: 0 // Would be calculated from actual bundle analysis
      }

      setMetrics(newMetrics)
      generateRecommendations(newMetrics, dbStats, networkState, queueStats, storageInfo)
    } catch (error) {
      console.error('Failed to collect performance metrics:', error)
    }
  }, [performanceMetrics, networkState, queueStats, storageInfo, getPerformanceStats, healthCheck])

  // ============================================================================
  // RECOMMENDATIONS GENERATION
  // ============================================================================

  const generateRecommendations = useCallback((
    metrics: PerformanceMetrics,
    dbStats: any,
    networkState: any,
    queueStats: any,
    storageInfo: any
  ) => {
    const newRecommendations: OptimizationRecommendation[] = []

    // Performance recommendations
    if (metrics.fps < 30) {
      newRecommendations.push({
        id: 'low-fps',
        type: 'critical',
        category: 'performance',
        title: 'Low Frame Rate Detected',
        description: `Current FPS: ${metrics.fps}. Consider reducing animation complexity or enabling performance mode.`,
        impact: 'high',
        effort: 'medium',
        action: () => {
          // Enable performance mode
          localStorage.setItem('performance-mode', 'true')
          window.location.reload()
        }
      })
    }

    if (metrics.memoryUsage > 100) {
      newRecommendations.push({
        id: 'high-memory',
        type: 'warning',
        category: 'performance',
        title: 'High Memory Usage',
        description: `Memory usage: ${metrics.memoryUsage.toFixed(1)}MB. Consider implementing memory optimization strategies.`,
        impact: 'medium',
        effort: 'high'
      })
    }

    // Network recommendations
    if (!networkState.isOnline) {
      newRecommendations.push({
        id: 'offline',
        type: 'critical',
        category: 'network',
        title: 'Offline Mode Active',
        description: 'Application is running in offline mode. Some features may be limited.',
        impact: 'high',
        effort: 'low'
      })
    }

    if (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') {
      newRecommendations.push({
        id: 'slow-connection',
        type: 'warning',
        category: 'network',
        title: 'Slow Network Connection',
        description: 'Slow network detected. Consider enabling data saver mode.',
        impact: 'medium',
        effort: 'low',
        action: () => {
          localStorage.setItem('data-saver-mode', 'true')
          alert('Data saver mode enabled')
        }
      })
    }

    if (queueStats.total > 10) {
      newRecommendations.push({
        id: 'queue-backlog',
        type: 'warning',
        category: 'network',
        title: 'Action Queue Backlog',
        description: `${queueStats.total} actions queued. Consider manual sync.`,
        impact: 'medium',
        effort: 'low'
      })
    }

    // Database recommendations
    if (dbStats.averageQueryTime > 500) {
      newRecommendations.push({
        id: 'slow-queries',
        type: 'warning',
        category: 'database',
        title: 'Slow Database Queries',
        description: `Average query time: ${dbStats.averageQueryTime.toFixed(0)}ms. Consider query optimization.`,
        impact: 'medium',
        effort: 'high'
      })
    }

    if (dbStats.cacheHitRate < 50) {
      newRecommendations.push({
        id: 'low-cache-hit',
        type: 'info',
        category: 'database',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate: ${dbStats.cacheHitRate.toFixed(1)}%. Consider cache optimization.`,
        impact: 'medium',
        effort: 'medium'
      })
    }

    // Storage recommendations
    if (storageInfo.utilizationPercent > 80) {
      newRecommendations.push({
        id: 'storage-full',
        type: 'warning',
        category: 'performance',
        title: 'Storage Nearly Full',
        description: `Storage utilization: ${storageInfo.utilizationPercent.toFixed(1)}%. Consider clearing cache.`,
        impact: 'medium',
        effort: 'low',
        action: () => {
          localStorage.clear()
          alert('Cache cleared')
        }
      })
    }

    setRecommendations(newRecommendations)
  }, [])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isVisible) {
      startMonitoring()
      collectMetrics()
      
      const interval = setInterval(collectMetrics, 5000) // Update every 5 seconds
      return () => {
        clearInterval(interval)
        stopMonitoring()
      }
    }
  }, [isVisible, startMonitoring, stopMonitoring, collectMetrics])

  // ============================================================================
  // KEYBOARD SHORTCUT
  // ============================================================================

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderMetricCard = (title: string, value: string | number, unit: string, status: 'good' | 'warning' | 'critical') => {
    const statusColors = {
      good: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    }

    return (
      <div className={cn('p-4 rounded-lg border-2', statusColors[status], cardAnimation)}>
        <h3 className="text-sm font-medium opacity-75">{title}</h3>
        <div className="mt-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm ml-1">{unit}</span>
        </div>
      </div>
    )
  }

  const renderRecommendation = (rec: OptimizationRecommendation) => {
    const typeColors = {
      critical: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50'
    }

    const typeIcons = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    }

    return (
      <div key={rec.id} className={cn('p-4 rounded-lg border', typeColors[rec.type], cardAnimation)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span>{typeIcons[rec.type]}</span>
              <h4 className="font-medium">{rec.title}</h4>
              <span className="text-xs px-2 py-1 bg-white rounded-full">{rec.category}</span>
            </div>
            <p className="text-sm mt-1 opacity-75">{rec.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs">
              <span>Impact: <strong>{rec.impact}</strong></span>
              <span>Effort: <strong>{rec.effort}</strong></span>
            </div>
          </div>
          {rec.action && (
            <EnhancedButton
              size="sm"
              variant="outline"
              onClick={rec.action}
              className="ml-4"
            >
              Fix
            </EnhancedButton>
          )}
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <EnhancedButton
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          📊 Performance
        </EnhancedButton>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold">Performance Dashboard</h2>
            <p className="text-sm text-gray-600">Real-time application performance monitoring</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Ctrl+Shift+P</span>
            <EnhancedButton
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              ✕
            </EnhancedButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'network', label: 'Network' },
            { id: 'database', label: 'Database' },
            { id: 'recommendations', label: `Recommendations (${recommendations.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
          {!metrics ? (
            <div className="flex items-center justify-center h-64">
              <UnifiedLoader message="Collecting performance metrics..." />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderMetricCard(
                      'Frame Rate',
                      metrics.fps,
                      'fps',
                      metrics.fps >= 50 ? 'good' : metrics.fps >= 30 ? 'warning' : 'critical'
                    )}
                    {renderMetricCard(
                      'Memory Usage',
                      metrics.memoryUsage.toFixed(1),
                      'MB',
                      metrics.memoryUsage < 50 ? 'good' : metrics.memoryUsage < 100 ? 'warning' : 'critical'
                    )}
                    {renderMetricCard(
                      'Load Time',
                      (metrics.loadTime / 1000).toFixed(1),
                      's',
                      metrics.loadTime < 2000 ? 'good' : metrics.loadTime < 5000 ? 'warning' : 'critical'
                    )}
                    {renderMetricCard(
                      'Cache Hit Rate',
                      metrics.cacheHitRate.toFixed(1),
                      '%',
                      metrics.cacheHitRate >= 70 ? 'good' : metrics.cacheHitRate >= 50 ? 'warning' : 'critical'
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <EnhancedButton size="sm" onClick={collectMetrics}>
                        🔄 Refresh Metrics
                      </EnhancedButton>
                      <EnhancedButton size="sm" variant="outline" onClick={() => localStorage.clear()}>
                        🗑️ Clear Cache
                      </EnhancedButton>
                      <EnhancedButton size="sm" variant="outline" onClick={() => window.location.reload()}>
                        ↻ Reload App
                      </EnhancedButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Tab */}
              {activeTab === 'network' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderMetricCard(
                      'Connection',
                      networkState.isOnline ? 'Online' : 'Offline',
                      '',
                      networkState.isOnline ? 'good' : 'critical'
                    )}
                    {renderMetricCard(
                      'Network Type',
                      networkState.effectiveType,
                      '',
                      networkState.effectiveType === '4g' ? 'good' : networkState.effectiveType === '3g' ? 'warning' : 'critical'
                    )}
                    {renderMetricCard(
                      'Queued Actions',
                      queueStats.total,
                      'items',
                      queueStats.total < 5 ? 'good' : queueStats.total < 15 ? 'warning' : 'critical'
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Storage Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Items:</span>
                        <span className="ml-2 font-medium">{storageInfo.totalItems}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Storage Used:</span>
                        <span className="ml-2 font-medium">{(storageInfo.totalSize / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Utilization:</span>
                        <span className="ml-2 font-medium">{storageInfo.utilizationPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Tab */}
              {activeTab === 'database' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderMetricCard(
                      'Avg Query Time',
                      getPerformanceStats().averageQueryTime.toFixed(0),
                      'ms',
                      getPerformanceStats().averageQueryTime < 200 ? 'good' : getPerformanceStats().averageQueryTime < 500 ? 'warning' : 'critical'
                    )}
                    {renderMetricCard(
                      'Total Queries',
                      getPerformanceStats().totalQueries,
                      '',
                      'good'
                    )}
                    {renderMetricCard(
                      'Error Rate',
                      getPerformanceStats().errorRate.toFixed(1),
                      '%',
                      getPerformanceStats().errorRate < 1 ? 'good' : getPerformanceStats().errorRate < 5 ? 'warning' : 'critical'
                    )}
                  </div>

                  {getPerformanceStats().slowQueries.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-medium mb-2 text-yellow-800">Slow Queries</h3>
                      <div className="space-y-2">
                        {getPerformanceStats().slowQueries.slice(0, 5).map((query, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-mono text-yellow-700">{query.query}</span>
                            <span className="ml-2 text-yellow-600">({query.duration.toFixed(0)}ms)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3 className="text-lg font-medium text-gray-900">All Good!</h3>
                      <p className="text-gray-600">No performance issues detected.</p>
                    </div>
                  ) : (
                    recommendations.map(renderRecommendation)
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PERFORMANCE MONITOR HOOK
// ============================================================================

export function usePerformanceDashboard() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Enable in development or when explicitly enabled
    const shouldEnable = process.env.NODE_ENV === 'development' || 
                        localStorage.getItem('performance-dashboard') === 'true'
    setIsEnabled(shouldEnable)
  }, [])

  const toggle = useCallback(() => {
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem('performance-dashboard', newState.toString())
  }, [isEnabled])

  return {
    isEnabled,
    toggle,
    PerformanceDashboard: isEnabled ? PerformanceDashboard : () => null
  }
}