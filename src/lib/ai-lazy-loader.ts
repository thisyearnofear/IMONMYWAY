/**
 * AI Model Lazy Loader
 * 
 * Implements lazy initialization and on-demand loading of AI models
 * based on device capabilities and actual usage patterns.
 * 
 * Core Principles:
 * - PERFORMANT: Load models only when needed
 * - MODULAR: Independent loading for each model type
 * - DRY: Single source of truth for model loading state
 * - CLEAN: Clear separation between loading logic and usage
 */

import { adaptiveLoader } from '@/lib/performance';
import { getDeviceCapabilities, type DeviceCapabilities } from '@/lib/performance';

// ============================================================================
// MODEL TYPES
// ============================================================================

export type AIModelType = 'stake' | 'reputation' | 'route' | 'achievement' | 'betting';

export interface AIModel {
  type: AIModelType;
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  lastLoaded: number | null;
  priority: 'low' | 'medium' | 'high';
}

export interface ModelLoadingOptions {
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
  fallback?: boolean;
}

// ============================================================================
// AI LAZY LOADER
// ============================================================================

export class AILazyLoader {
  private static instance: AILazyLoader;
  private models: Map<AIModelType, AIModel> = new Map();
  private loadingPromises: Map<AIModelType, Promise<void>> = new Map();
  private deviceCapabilities: DeviceCapabilities;
  private preloadQueue: AIModelType[] = [];

  static getInstance(): AILazyLoader {
    if (!AILazyLoader.instance) {
      AILazyLoader.instance = new AILazyLoader();
    }
    return AILazyLoader.instance;
  }

  constructor() {
    this.deviceCapabilities = getDeviceCapabilities();
    this.initializeModels();
  }

  /**
   * Initialize all model states
   */
  private initializeModels(): void {
    const modelTypes: AIModelType[] = ['stake', 'reputation', 'route', 'achievement', 'betting'];
    
    for (const type of modelTypes) {
      this.models.set(type, {
        type,
        loaded: false,
        loading: false,
        error: null,
        lastLoaded: null,
        priority: this.getDefaultPriority(type)
      });
    }
  }

  /**
   * Load a specific AI model
   */
  async loadModel(
    modelType: AIModelType,
    options: ModelLoadingOptions = {}
  ): Promise<void> {
    const { priority = 'medium', timeout = 5000, fallback = true } = options;

    // Check if already loaded
    const model = this.models.get(modelType);
    if (!model) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    if (model.loaded) {
      return; // Already loaded
    }

    // Check if already loading
    if (model.loading) {
      const existingPromise = this.loadingPromises.get(modelType);
      if (existingPromise) {
        return existingPromise;
      }
    }

    // Check if we should defer loading
    if (this.shouldDeferLoading(priority)) {
      if (fallback) {
        console.log(`⏳ Deferring ${modelType} model loading (device constraints)`);
        this.scheduleBackgroundLoad(modelType, priority);
        return;
      }
    }

    // Load the model
    const loadPromise = this.executeModelLoad(modelType, timeout);
    this.loadingPromises.set(modelType, loadPromise);

    try {
      await loadPromise;
      model.loaded = true;
      model.lastLoaded = Date.now();
      console.log(`✅ Loaded ${modelType} model`);
    } catch (error) {
      model.error = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Failed to load ${modelType} model:`, error);
      throw error;
    } finally {
      model.loading = false;
      this.loadingPromises.delete(modelType);
    }
  }

  /**
   * Preload multiple models in the background
   */
  preloadModels(modelTypes: AIModelType[], priority: 'low' | 'medium' | 'high' = 'low'): void {
    // Only preload on capable devices
    if (this.deviceCapabilities.connection === 'slow' || this.deviceCapabilities.battery === 'low') {
      console.log('⏭️  Skipping preload on constrained device');
      return;
    }

    for (const modelType of modelTypes) {
      if (!this.models.get(modelType)?.loaded) {
        this.preloadQueue.push(modelType);
      }
    }

    this.processPreloadQueue(priority);
  }

  /**
   * Get model loading status
   */
  getModelStatus(modelType: AIModelType): AIModel | null {
    return this.models.get(modelType) || null;
  }

  /**
   * Get all model statuses
   */
  getAllModelStatuses(): Map<AIModelType, AIModel> {
    return new Map(this.models);
  }

  /**
   * Check if a model is ready for use
   */
  isModelReady(modelType: AIModelType): boolean {
    const model = this.models.get(modelType);
    return model?.loaded || false;
  }

  /**
   * Get loading progress
   */
  getLoadingProgress(): {
    total: number;
    loaded: number;
    loading: number;
    percentage: number;
  } {
    const total = this.models.size;
    const loaded = Array.from(this.models.values()).filter(m => m.loaded).length;
    const loading = Array.from(this.models.values()).filter(m => m.loading).length;
    const percentage = Math.round((loaded / total) * 100);

    return { total, loaded, loading, percentage };
  }

  /**
   * Clear model cache and reset loading state
   */
  clearModels(modelType?: AIModelType): void {
    if (modelType) {
      const model = this.models.get(modelType);
      if (model) {
        model.loaded = false;
        model.loading = false;
        model.error = null;
        model.lastLoaded = null;
      }
    } else {
      for (const model of this.models.values()) {
        model.loaded = false;
        model.loading = false;
        model.error = null;
        model.lastLoaded = null;
      }
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async executeModelLoad(modelType: AIModelType, timeout: number): Promise<void> {
    const model = this.models.get(modelType)!;
    model.loading = true;

    return Promise.race([
      this.simulateModelLoad(modelType),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`Model load timeout: ${modelType}`)), timeout)
      )
    ]);
  }

  private async simulateModelLoad(modelType: AIModelType): Promise<void> {
    // Simulate model loading with adaptive delay based on device capabilities
    const baseDelay = 100; // ms
    const deviceFactor = this.getDeviceFactor();
    const delay = baseDelay * deviceFactor;

    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private shouldDeferLoading(priority: 'low' | 'medium' | 'high'): boolean {
    const { memory, connection, battery } = this.deviceCapabilities;

    // Always load high priority
    if (priority === 'high') return false;

    // Defer on constrained devices
    if (memory < 2 || connection === 'slow' || battery === 'low') {
      return priority === 'low';
    }

    return false;
  }

  private scheduleBackgroundLoad(modelType: AIModelType, priority: 'low' | 'medium' | 'high'): void {
    // Use requestIdleCallback if available, otherwise use setTimeout
    const loadFn = () => {
      this.loadModel(modelType, { priority, fallback: true }).catch(error => {
        console.warn(`Background load failed for ${modelType}:`, error);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadFn, { timeout: 30000 });
    } else {
      setTimeout(loadFn, 5000); // Delay by 5 seconds
    }
  }

  private processPreloadQueue(priority: 'low' | 'medium' | 'high'): void {
    if (this.preloadQueue.length === 0) return;

    const modelType = this.preloadQueue.shift();
    if (!modelType) return;

    this.loadModel(modelType, { priority, fallback: true })
      .then(() => this.processPreloadQueue(priority))
      .catch(error => {
        console.warn(`Preload failed for ${modelType}:`, error);
        this.processPreloadQueue(priority);
      });
  }

  private getDefaultPriority(modelType: AIModelType): 'low' | 'medium' | 'high' {
    // Prioritize models based on typical usage patterns
    switch (modelType) {
      case 'stake':
      case 'reputation':
        return 'high'; // Most frequently used
      case 'betting':
      case 'achievement':
        return 'medium';
      case 'route':
        return 'low'; // Less frequently used
      default:
        return 'medium';
    }
  }

  private getDeviceFactor(): number {
    const { memory, cores, connection } = this.deviceCapabilities;

    let factor = 1;

    // Adjust for memory
    if (memory < 2) factor *= 2;
    else if (memory < 4) factor *= 1.5;
    else if (memory >= 8) factor *= 0.5;

    // Adjust for CPU cores
    if (cores < 2) factor *= 1.5;
    else if (cores >= 8) factor *= 0.7;

    // Adjust for connection
    if (connection === 'slow') factor *= 2;
    else if (connection === 'fast') factor *= 0.5;

    return factor;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiLazyLoader = AILazyLoader.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensure a model is loaded before executing an operation
 */
export async function ensureModelLoaded(
  modelType: AIModelType,
  options: ModelLoadingOptions = {}
): Promise<void> {
  const loader = AILazyLoader.getInstance();

  if (!loader.isModelReady(modelType)) {
    await loader.loadModel(modelType, options);
  }
}

/**
 * Get model loading status for UI display
 */
export function getModelLoadingStatus(): {
  total: number;
  loaded: number;
  loading: number;
  percentage: number;
  models: Record<AIModelType, { loaded: boolean; loading: boolean; error: string | null }>;
} {
  const loader = AILazyLoader.getInstance();
  const progress = loader.getLoadingProgress();
  const statuses = loader.getAllModelStatuses();

  const models: Record<AIModelType, { loaded: boolean; loading: boolean; error: string | null }> = {
    stake: { loaded: false, loading: false, error: null },
    reputation: { loaded: false, loading: false, error: null },
    route: { loaded: false, loading: false, error: null },
    achievement: { loaded: false, loading: false, error: null },
    betting: { loaded: false, loading: false, error: null }
  };

  for (const [type, status] of statuses) {
    models[type] = {
      loaded: status.loaded,
      loading: status.loading,
      error: status.error?.message || null
    };
  }

  return {
    ...progress,
    models
  };
}
