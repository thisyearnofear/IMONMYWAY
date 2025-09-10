/**
 * Lazy Loader - Performance Optimization System
 * 
 * Provides intelligent code splitting, lazy loading, and performance monitoring
 * to optimize bundle size and loading performance.
 */

"use client";

import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect, useCallback } from 'react'
import { UnifiedLoader, ComponentLoader } from '@/components/core/UnifiedLoader'
import { ComponentErrorBoundary } from '@/components/core/GlobalErrorBoundary'
import { useNetworkResilience } from '@/lib/engines/network-resilience-engine'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LazyComponentProps {
  fallback?: ReactNode
  errorFallback?: ReactNode
  retryOnError?: boolean
  preload?: boolean
  priority?: 'low' | 'medium' | 'high'
}

interface LazyRouteProps extends LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>
  componentName: string
}

interface PreloadConfig {
  components: string[]
  delay?: number
  onIdle?: boolean
  onVisible?: boolean
}

// ============================================================================
// LAZY COMPONENT WRAPPER
// ============================================================================

export function LazyComponent<T = {}>({
  component,
  componentName,
  fallback,
  errorFallback,
  retryOnError = true,
  preload = false,
  priority = 'medium',
  ...props
}: LazyRouteProps & T) {
  const { isSlowConnection, cacheData, getCachedData } = useNetworkResilience()
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Create lazy component with error handling
  const LazyComp = lazy(async () => {
    try {
      // Check cache first for slow connections
      if (isSlowConnection) {
        const cached = await getCachedData(`component_${componentName}`)
        if (cached) {
          return cached
        }
      }

      const componentModule = await component()
      
      // Cache the component for future use
      if (isSlowConnection) {
        await cacheData(`component_${componentName}`, componentModule, {
          ttl: 24 * 60 * 60 * 1000, // 24 hours
          priority: priority
        })
      }

      setLoadError(null)
      return componentModule
    } catch (error) {
      setLoadError(error as Error)
      throw error
    }
  })

  // Preload component if requested
  useEffect(() => {
    if (preload) {
      const preloadTimer = setTimeout(() => {
        component().catch(console.error)
      }, 100) // Small delay to not block initial render

      return () => clearTimeout(preloadTimer)
    }
  }, [preload, component])

  const handleRetry = () => {
    setLoadError(null)
    setRetryCount(prev => prev + 1)
  }

  const defaultFallback = fallback || (
    <ComponentLoader 
      message={`Loading ${componentName}...`}
      overlay={false}
    />
  )

  const defaultErrorFallback = errorFallback || (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center space-x-2 text-yellow-800">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Failed to load {componentName}</span>
      </div>
      <p className="mt-1 text-sm text-yellow-700">
        The component couldn&apos;t be loaded. This might be due to a network issue.
      </p>
      {retryOnError && (
        <button
          onClick={handleRetry}
          className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
        >
          Try again {retryCount > 0 && `(${retryCount})`}
        </button>
      )}
    </div>
  )

  return (
    <ComponentErrorBoundary
      componentName={componentName}
      fallback={defaultErrorFallback}
      onError={(error) => {
        console.error(`Failed to load component ${componentName}:`, error)
        setLoadError(error)
      }}
    >
      <Suspense fallback={defaultFallback}>
        <LazyComp {...props} key={retryCount} />
      </Suspense>
    </ComponentErrorBoundary>
  )
}

// ============================================================================
// LAZY ROUTE COMPONENT
// ============================================================================

export function LazyRoute({
  component,
  componentName,
  fallback,
  ...props
}: LazyRouteProps) {
  return (
    <LazyComponent
      component={component}
      componentName={componentName}
      fallback={fallback || <UnifiedLoader type="spinner" size="lg" context="page" fullScreen />}
      preload={true}
      priority="high"
      {...props}
    />
  )
}

// ============================================================================
// PRELOADER SYSTEM
// ============================================================================

export class ComponentPreloader {
  private static preloadedComponents = new Set<string>()
  private static preloadPromises = new Map<string, Promise<any>>()

  static async preloadComponent(
    name: string,
    loader: () => Promise<{ default: ComponentType<any> }>
  ): Promise<{ default: ComponentType<any> } | void> {
    if (this.preloadedComponents.has(name)) {
      return
    }

    if (this.preloadPromises.has(name)) {
      return this.preloadPromises.get(name)
    }

    const promise = loader()
      .then((module) => {
        this.preloadedComponents.add(name)
        this.preloadPromises.delete(name)
        return module
      })
      .catch((error) => {
        this.preloadPromises.delete(name)
        console.error(`Failed to preload component ${name}:`, error)
        throw error
      })

    this.preloadPromises.set(name, promise)
    return promise
  }

  static preloadOnIdle(config: PreloadConfig): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadComponents(config)
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadComponents(config)
      }, config.delay || 2000)
    }
  }

  static preloadOnVisible(
    element: HTMLElement,
    config: PreloadConfig
  ): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preloadComponents(config)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }

  private static async preloadComponents(config: PreloadConfig): Promise<void> {
    const { components } = config

    // Preload components in parallel but with some delay between each
    for (let i = 0; i < components.length; i++) {
      const componentName = components[i]
      
      // Add delay between preloads to not overwhelm the network
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // This would need to be mapped to actual component loaders
      // In a real implementation, you'd have a registry of component loaders
      console.log(`Preloading component: ${componentName}`)
    }
  }

  static getPreloadedComponents(): string[] {
    return Array.from(this.preloadedComponents)
  }

  static clearPreloadCache(): void {
    this.preloadedComponents.clear()
    this.preloadPromises.clear()
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useComponentPreloader() {
  const preload = (
    name: string,
    loader: () => Promise<{ default: ComponentType<any> }>
  ) => {
    return ComponentPreloader.preloadComponent(name, loader)
  }

  const preloadOnIdle = useCallback((config: PreloadConfig) => {
    ComponentPreloader.preloadOnIdle(config)
  }, [])

  const preloadOnVisible = useCallback((config: PreloadConfig, element: HTMLElement | null) => {
    if (element) {
      return ComponentPreloader.preloadOnVisible(element, config)
    }
    return () => {}
  }, [])

  return {
    preload,
    preloadOnIdle,
    preloadOnVisible,
    getPreloadedComponents: ComponentPreloader.getPreloadedComponents,
    clearPreloadCache: ComponentPreloader.clearPreloadCache
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export function useLoadingPerformance(componentName: string) {
  const [metrics, setMetrics] = useState<{
    loadTime: number | null
    renderTime: number | null
    totalTime: number | null
  }>({
    loadTime: null,
    renderTime: null,
    totalTime: null
  })

  useEffect(() => {
    const startTime = performance.now()
    let loadEndTime: number | null = null

    // Mark when component starts loading
    performance.mark(`${componentName}-load-start`)

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.name.includes(componentName)) {
          if (entry.name.includes('load-end')) {
            loadEndTime = entry.startTime
          }
        }
      })
    })

    observer.observe({ entryTypes: ['mark', 'measure'] })

    return () => {
      const endTime = performance.now()
      
      // Mark when component finishes loading
      performance.mark(`${componentName}-load-end`)
      
      // Measure total time
      performance.measure(
        `${componentName}-total-time`,
        `${componentName}-load-start`,
        `${componentName}-load-end`
      )

      const totalTime = endTime - startTime
      const loadTime = loadEndTime ? loadEndTime - startTime : null
      const renderTime = loadTime ? totalTime - loadTime : null

      setMetrics({
        loadTime,
        renderTime,
        totalTime
      })

      // Log performance metrics
      console.log(`Performance metrics for ${componentName}:`, {
        loadTime: loadTime ? `${loadTime.toFixed(2)}ms` : 'N/A',
        renderTime: renderTime ? `${renderTime.toFixed(2)}ms` : 'N/A',
        totalTime: `${totalTime.toFixed(2)}ms`
      })

      observer.disconnect()
    }
  }, [componentName])

  return metrics
}

// ============================================================================
// LAZY COMPONENT FACTORY
// ============================================================================

export function createLazyComponent<T = {}>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options: {
    name: string
    fallback?: ReactNode
    errorFallback?: ReactNode
    preload?: boolean
    priority?: 'low' | 'medium' | 'high'
  }
) {
  const { name, fallback, errorFallback, preload = false, priority = 'medium' } = options

  return function LazyComponentWrapper(props: T) {
    return (
      <LazyComponent
        component={loader}
        componentName={name}
        fallback={fallback}
        errorFallback={errorFallback}
        preload={preload}
        priority={priority}
        {...props}
      />
    )
  }
}

// ============================================================================
// BUNDLE ANALYZER UTILITIES
// ============================================================================

export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    // In development, we can analyze the bundle
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const totalSize = scripts.reduce((total, script) => {
      const src = (script as HTMLScriptElement).src
      if (src.includes('/_next/static/')) {
        // Estimate size based on URL (this is approximate)
        return total + 1 // Placeholder - in real implementation, you'd fetch actual sizes
      }
      return total
    }, 0)

    console.log('Bundle analysis:', {
      scriptCount: scripts.length,
      estimatedSize: `${totalSize}KB`,
      preloadedComponents: ComponentPreloader.getPreloadedComponents()
    })
  }
}

// ============================================================================
// EXPORT LAZY COMPONENT DEFINITIONS
// ============================================================================

// Note: Lazy loading examples removed due to named exports.
// To use lazy loading with existing components, they would need to be
// converted to default exports or wrapped in default export files.