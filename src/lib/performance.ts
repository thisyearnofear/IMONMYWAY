/**
 * Performance Optimization System
 * 
 * Adaptive loading, intelligent caching, and resource optimization
 * Automatically adjusts based on device capabilities and network conditions
 */

// Performance Monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('cumulative-layout-shift', (entry as any).value);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetric(name: string): { avg: number; latest: number; trend: 'improving' | 'degrading' | 'stable' } {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return { avg: 0, latest: 0, trend: 'stable' };

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const latest = values[values.length - 1];
    
    // Calculate trend from last 10 values
    const recent = values.slice(-10);
    const older = values.slice(-20, -10);
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (recentAvg < olderAvg * 0.9) trend = 'improving';
    else if (recentAvg > olderAvg * 1.1) trend = 'degrading';

    return { avg, latest, trend };
  }

  getPerformanceScore(): number {
    const fcp = this.getMetric('first-contentful-paint');
    const cls = this.getMetric('cumulative-layout-shift');
    
    // Simple scoring algorithm (0-100)
    let score = 100;
    
    // Penalize slow FCP (> 2s)
    if (fcp.latest > 2000) score -= Math.min(30, (fcp.latest - 2000) / 100);
    
    // Penalize high CLS (> 0.1)
    if (cls.latest > 0.1) score -= Math.min(20, cls.latest * 200);
    
    return Math.max(0, Math.round(score));
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Device Capability Detection
export interface DeviceCapabilities {
  memory: number;
  cores: number;
  connection: 'slow' | 'medium' | 'fast';
  battery: 'low' | 'medium' | 'high' | 'unknown';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export function getDeviceCapabilities(): DeviceCapabilities {
  const nav = navigator as any;
  
  // Memory detection
  const memory = nav.deviceMemory || 4; // Default to 4GB
  
  // CPU cores
  const cores = nav.hardwareConcurrency || 4;
  
  // Connection speed
  let connection: DeviceCapabilities['connection'] = 'medium';
  if (nav.connection) {
    const effectiveType = nav.connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      connection = 'slow';
    } else if (effectiveType === '4g') {
      connection = 'fast';
    }
  }
  
  // Battery level
  let battery: DeviceCapabilities['battery'] = 'unknown';
  if (nav.getBattery) {
    nav.getBattery().then((batteryManager: any) => {
      if (batteryManager.level < 0.2) battery = 'low';
      else if (batteryManager.level < 0.5) battery = 'medium';
      else battery = 'high';
    });
  }
  
  // Device type detection
  let deviceType: DeviceCapabilities['deviceType'] = 'desktop';
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    deviceType = 'mobile';
  } else if (/Tablet|iPad/i.test(navigator.userAgent)) {
    deviceType = 'tablet';
  }
  
  return { memory, cores, connection, battery, deviceType };
}

// Adaptive Loading System
export class AdaptiveLoader {
  private static instance: AdaptiveLoader;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private capabilities: DeviceCapabilities;

  static getInstance(): AdaptiveLoader {
    if (!AdaptiveLoader.instance) {
      AdaptiveLoader.instance = new AdaptiveLoader();
    }
    return AdaptiveLoader.instance;
  }

  constructor() {
    this.capabilities = getDeviceCapabilities();
    this.startCacheCleanup();
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  async loadResource<T>(
    key: string,
    loader: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      fallback?: T;
    } = {}
  ): Promise<T> {
    const { ttl = 300000, priority = 'medium', fallback } = options; // 5min default TTL

    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Check if already loading
    if (this.loadingQueue.has(key)) {
      return this.loadingQueue.get(key)!;
    }

    // Adaptive loading based on device capabilities
    const shouldDefer = this.shouldDeferLoading(priority);
    
    if (shouldDefer && fallback !== undefined) {
      // Return fallback immediately, load in background
      this.loadInBackground(key, loader, ttl);
      return fallback;
    }

    // Load immediately
    const loadPromise = this.executeLoad(key, loader, ttl);
    this.loadingQueue.set(key, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingQueue.delete(key);
      return result;
    } catch (error) {
      this.loadingQueue.delete(key);
      if (fallback !== undefined) return fallback;
      throw error;
    }
  }

  private shouldDeferLoading(priority: 'low' | 'medium' | 'high'): boolean {
    const { memory, connection, battery } = this.capabilities;
    
    // Always load high priority
    if (priority === 'high') return false;
    
    // Defer on low-end devices
    if (memory < 2 || connection === 'slow' || battery === 'low') {
      return priority === 'low';
    }
    
    return false;
  }

  private async loadInBackground<T>(key: string, loader: () => Promise<T>, ttl: number) {
    // Use requestIdleCallback if available
    const loadFn = () => this.executeLoad(key, loader, ttl);
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadFn);
    } else {
      setTimeout(loadFn, 100);
    }
  }

  private async executeLoad<T>(key: string, loader: () => Promise<T>, ttl: number): Promise<T> {
    try {
      const data = await loader();
      this.cache.set(key, { data, timestamp: Date.now(), ttl });
      return data;
    } catch (error) {
      console.warn(`Failed to load resource: ${key}`, error);
      throw error;
    }
  }

  // Preload resources based on user behavior
  preload(keys: string[], loaders: (() => Promise<any>)[], priority: 'low' | 'medium' | 'high' = 'low') {
    if (this.capabilities.connection === 'slow' || this.capabilities.battery === 'low') {
      return; // Skip preloading on constrained devices
    }

    keys.forEach((key, index) => {
      if (!this.cache.has(key) && !this.loadingQueue.has(key)) {
        this.loadResource(key, loaders[index], { priority });
      }
    });
  }

  clearCache(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      loading: this.loadingQueue.size,
      capabilities: this.capabilities
    };
  }
}

// Resource Bundling and Code Splitting
export function createDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): () => Promise<T> {
  const loader = AdaptiveLoader.getInstance();
  const key = importFn.toString(); // Use function string as key
  
  return () => loader.loadResource(
    key,
    async () => {
      const moduleResult = await importFn();
      return moduleResult.default;
    },
    { fallback, priority: 'medium' }
  );
}

// Performance-aware component lazy loading
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const moduleResult = await importFn();
      return { default: moduleResult.default };
    } catch (error) {
      console.warn('Failed to load component:', error);
      if (fallback) {
        return { default: fallback as T };
      }
      throw error;
    }
  });
}

// Image optimization
export function optimizeImageLoading(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
    lazy?: boolean;
  } = {}
): string {
  const { width, height, quality = 80, format = 'auto', lazy = true } = options;
  const capabilities = getDeviceCapabilities();
  
  // Adjust quality based on device capabilities
  let adjustedQuality = quality;
  if (capabilities.connection === 'slow') adjustedQuality = Math.min(quality, 60);
  if (capabilities.memory < 2) adjustedQuality = Math.min(adjustedQuality, 70);
  
  // Build optimized URL (assuming you have an image optimization service)
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', adjustedQuality.toString());
  
  if (format === 'auto') {
    // Choose format based on browser support
    if (CSS.supports('image-rendering', 'pixelated')) {
      params.set('f', 'webp');
    }
  } else {
    params.set('f', format);
  }
  
  return `${src}?${params.toString()}`;
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const adaptiveLoader = AdaptiveLoader.getInstance();

// React hooks for performance optimization
import React from 'react';

export function usePerformanceOptimization() {
  const [capabilities] = React.useState(() => getDeviceCapabilities());
  const [performanceScore, setPerformanceScore] = React.useState(100);
  
  React.useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    const updateScore = () => {
      setPerformanceScore(monitor.getPerformanceScore());
    };
    
    const interval = setInterval(updateScore, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return {
    capabilities,
    performanceScore,
    shouldReduceAnimations: capabilities.memory < 2 || performanceScore < 60,
    shouldLazyLoad: capabilities.connection === 'slow' || capabilities.battery === 'low',
    shouldPreload: capabilities.connection === 'fast' && capabilities.battery !== 'low'
  };
}