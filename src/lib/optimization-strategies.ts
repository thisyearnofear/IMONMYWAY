// Advanced optimization strategies for viral UX
import { performanceMonitor, adaptiveLoader } from './performance';

export interface OptimizationStrategy {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  execute: () => Promise<void>;
  rollback?: () => Promise<void>;
}

export class ViralOptimizer {
  private static instance: ViralOptimizer;
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private activeOptimizations: Set<string> = new Set();

  static getInstance(): ViralOptimizer {
    if (!ViralOptimizer.instance) {
      ViralOptimizer.instance = new ViralOptimizer();
    }
    return ViralOptimizer.instance;
  }

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies() {
    // Critical path optimization
    this.registerStrategy({
      name: 'critical-path',
      priority: 'critical',
      execute: async () => {
        // Preload critical components
        await this.preloadCriticalComponents();
        // Optimize initial render
        await this.optimizeInitialRender();
      }
    });

    // Viral moment optimization
    this.registerStrategy({
      name: 'viral-moments',
      priority: 'high',
      execute: async () => {
        // Preload sharing components
        await Promise.all([
          adaptiveLoader.loadResource('social-magnetism', () => import('../components/viral/SocialMagnetism'), { priority: 'high' }),
          adaptiveLoader.loadResource('gamified-interface', () => import('../components/viral/GameifiedInterface'), { priority: 'high' }),
          adaptiveLoader.loadResource('viral-experience', () => import('../components/unified/ViralExperience'), { priority: 'high' })
        ]);
      }
    });

    // Progressive enhancement
    this.registerStrategy({
      name: 'progressive-enhancement',
      priority: 'medium',
      execute: async () => {
        const capabilities = await this.getDeviceCapabilities();
        
        if (capabilities.memory > 4 && capabilities.cores > 2) {
          // Enable advanced animations
          await this.enableAdvancedAnimations();
        }
        
        if (capabilities.connection === 'fast') {
          // Preload non-critical assets
          await this.preloadNonCriticalAssets();
        }
      }
    });

    // Background optimization
    this.registerStrategy({
      name: 'background-optimization',
      priority: 'low',
      execute: async () => {
        // Optimize images in background
        await this.optimizeBackgroundAssets();
        // Prefetch likely next pages
        await this.prefetchLikelyPages();
      }
    });
  }

  registerStrategy(strategy: OptimizationStrategy) {
    this.strategies.set(strategy.name, strategy);
  }

  async executeOptimizations(maxConcurrent: number = 3) {
    const sortedStrategies = Array.from(this.strategies.values())
      .sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));

    const batches = this.createBatches(sortedStrategies, maxConcurrent);
    
    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(async (strategy) => {
          try {
            this.activeOptimizations.add(strategy.name);
            await strategy.execute();
            performanceMonitor.recordMetric(`optimization-${strategy.name}`, performance.now());
          } catch (error) {
            console.warn(`Optimization strategy ${strategy.name} failed:`, error);
            if (strategy.rollback) {
              await strategy.rollback();
            }
          } finally {
            this.activeOptimizations.delete(strategy.name);
          }
        })
      );
    }
  }

  private getPriorityWeight(priority: OptimizationStrategy['priority']): number {
    const weights = { critical: 1, high: 2, medium: 3, low: 4 };
    return weights[priority];
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async preloadCriticalComponents() {
    await Promise.all([
      adaptiveLoader.loadResource('unified-button', () => import('../components/unified/UnifiedButton'), { priority: 'high' }),
      adaptiveLoader.loadResource('unified-loader', () => import('../components/unified/UnifiedLoader'), { priority: 'high' }),
      adaptiveLoader.loadResource('component-system', () => import('../components/system/ComponentSystem'), { priority: 'high' })
    ]);
  }

  private async optimizeInitialRender() {
    // Implement render optimization techniques
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback for non-critical work
      const scheduleWork = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(callback);
        } else {
          setTimeout(callback, 0);
        }
      };

      scheduleWork(() => {
        // Initialize non-critical features
        this.initializeNonCriticalFeatures();
      });
    }
  }

  private async enableAdvancedAnimations() {
    // Dynamically enable advanced animations based on device capability
    try {
      // Simple animation enablement without external module
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('advanced-animations');
      }
    } catch (error) {
      console.warn('Failed to enable advanced animations:', error);
    }
  }

  private async preloadNonCriticalAssets() {
    const assets = [
      '/images/celebration-confetti.svg',
      '/images/achievement-badges.svg',
      '/sounds/achievement-sound.mp3'
    ];

    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = asset;
      document.head.appendChild(link);
    });
  }

  private async optimizeBackgroundAssets() {
    // Implement background asset optimization
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'OPTIMIZE_ASSETS',
          assets: ['images', 'fonts', 'icons']
        });
      } catch (error) {
        console.warn('Service worker optimization failed:', error);
      }
    }
  }

  private async prefetchLikelyPages() {
    // Prefetch pages user is likely to visit based on current context
    const likelyPages = this.predictLikelyPages();
    
    likelyPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }

  private predictLikelyPages(): string[] {
    // Simple prediction logic - can be enhanced with ML
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    
    const predictions: Record<string, string[]> = {
      '/': ['/plan', '/share'],
      '/plan': ['/watch', '/share'],
      '/watch': ['/share', '/plan'],
      '/share': ['/plan', '/watch']
    };

    return predictions[currentPath] || [];
  }

  private async getDeviceCapabilities() {
    const nav = navigator as any;
    return {
      memory: nav.deviceMemory || 4,
      cores: nav.hardwareConcurrency || 4,
      connection: this.getConnectionSpeed()
    };
  }

  private getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    const connection = (navigator as any).connection;
    if (!connection) return 'medium';

    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') return 'fast';
    if (effectiveType === '3g') return 'medium';
    return 'slow';
  }

  private initializeNonCriticalFeatures() {
    // Initialize features that don't block initial render
    this.initializeAnalytics();
    this.initializeA11yFeatures();
    this.initializeExperimentalFeatures();
  }

  private initializeAnalytics() {
    // Initialize analytics in a non-blocking way
    setTimeout(() => {
      // Analytics initialization code
    }, 1000);
  }

  private initializeA11yFeatures() {
    // Initialize accessibility features
    if (typeof window !== 'undefined') {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      }
    }
  }

  private initializeExperimentalFeatures() {
    // Initialize experimental features based on feature flags
    const features = this.getEnabledFeatures();
    features.forEach(feature => {
      this.enableFeature(feature);
    });
  }

  private getEnabledFeatures(): string[] {
    // Get enabled features from localStorage or API
    try {
      const stored = localStorage.getItem('experimental-features');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private enableFeature(feature: string) {
    // Enable specific experimental feature
    console.log(`Enabling experimental feature: ${feature}`);
  }

  getOptimizationStatus() {
    return {
      total: this.strategies.size,
      active: this.activeOptimizations.size,
      completed: this.strategies.size - this.activeOptimizations.size,
      strategies: Array.from(this.strategies.keys())
    };
  }
}

// Export singleton instance
export const viralOptimizer = ViralOptimizer.getInstance();

// Utility functions for optimization
export function createOptimizedComponent<T extends React.ComponentType<any>>(
  Component: T,
  optimizations: {
    lazy?: boolean;
    preload?: boolean;
    priority?: 'high' | 'medium' | 'low';
  } = {}
): T {
  if (optimizations.lazy) {
    // Return lazy-loaded version
    return React.lazy(() => Promise.resolve({ default: Component })) as unknown as T;
  }

  if (optimizations.preload) {
    // Preload component
    adaptiveLoader.preload(
      [Component.name || 'anonymous'],
      [() => Promise.resolve(Component)],
      optimizations.priority || 'medium'
    );
  }

  return Component;
}

export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const WrappedComponent = React.memo((props: P) => {
    React.useEffect(() => {
      const startTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0;
      
      return () => {
        const endTime = typeof window !== 'undefined' && typeof performance !== 'undefined' ? performance.now() : 0;
        performanceMonitor.recordMetric(`component-${componentName}`, endTime - startTime);
      };
    }, []);

    return React.createElement(Component, props);
  });

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent;
}

// React import for TypeScript
import React from 'react';