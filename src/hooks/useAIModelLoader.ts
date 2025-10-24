/**
 * AI Model Loader Hook
 * 
 * Provides lazy loading capabilities for AI models with progress tracking
 * and error handling. Enables components to load models on-demand.
 * 
 * Usage:
 * const { isReady, isLoading, error, progress } = useAIModelLoader('stake');
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  aiLazyLoader, 
  type AIModelType,
  type ModelLoadingOptions,
  getModelLoadingStatus
} from '@/lib/ai-lazy-loader';

interface UseAIModelLoaderReturn {
  // Model Status
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Loading Progress
  progress: {
    total: number;
    loaded: number;
    loading: number;
    percentage: number;
  };
  
  // Utility Functions
  loadModel: (options?: ModelLoadingOptions) => Promise<void>;
  preloadModels: (modelTypes: AIModelType[], priority?: 'low' | 'medium' | 'high') => void;
  clearModel: () => void;
}

/**
 * Hook for loading a single AI model
 */
export function useAIModelLoader(
  modelType: AIModelType,
  autoLoad: boolean = true,
  options: ModelLoadingOptions = {}
): UseAIModelLoaderReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({
    total: 5,
    loaded: 0,
    loading: 0,
    percentage: 0
  });

  // Load model on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadModel(options);
    }
  }, [modelType, autoLoad]);

  // Update progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getModelLoadingStatus();
      setProgress(status);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Load model function
  const loadModel = useCallback(
    async (loadOptions: ModelLoadingOptions = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        await aiLazyLoader.loadModel(modelType, { ...options, ...loadOptions });
        setIsReady(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsReady(false);
      } finally {
        setIsLoading(false);
      }
    },
    [modelType, options]
  );

  // Preload multiple models
  const preloadModels = useCallback(
    (modelTypes: AIModelType[], priority: 'low' | 'medium' | 'high' = 'low') => {
      aiLazyLoader.preloadModels(modelTypes, priority);
    },
    []
  );

  // Clear model
  const clearModel = useCallback(() => {
    aiLazyLoader.clearModels(modelType);
    setIsReady(false);
    setError(null);
  }, [modelType]);

  return {
    isReady,
    isLoading,
    error,
    progress,
    loadModel,
    preloadModels,
    clearModel
  };
}

/**
 * Hook for loading multiple AI models
 */
export function useAIModelsLoader(
  modelTypes: AIModelType[],
  autoLoad: boolean = true,
  priority: 'low' | 'medium' | 'high' = 'medium'
): UseAIModelLoaderReturn & {
  allReady: boolean;
  modelStatuses: Record<AIModelType, { loaded: boolean; loading: boolean; error: string | null }>;
} {
  const [allReady, setAllReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({
    total: 5,
    loaded: 0,
    loading: 0,
    percentage: 0
  });
  const [modelStatuses, setModelStatuses] = useState<
    Record<AIModelType, { loaded: boolean; loading: boolean; error: string | null }>
  >({
    stake: { loaded: false, loading: false, error: null },
    reputation: { loaded: false, loading: false, error: null },
    route: { loaded: false, loading: false, error: null },
    achievement: { loaded: false, loading: false, error: null },
    betting: { loaded: false, loading: false, error: null }
  });

  // Load models on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && modelTypes.length > 0) {
      loadModels();
    }
  }, [modelTypes.join(','), autoLoad]);

  // Update progress and statuses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getModelLoadingStatus();
      setProgress(status);
      setModelStatuses(status.models);

      // Check if all requested models are loaded
      const allLoaded = modelTypes.every(type => status.models[type].loaded);
      setAllReady(allLoaded);
    }, 500);

    return () => clearInterval(interval);
  }, [modelTypes]);

  // Load models function
  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const promises = modelTypes.map(modelType =>
        aiLazyLoader.loadModel(modelType, { priority })
      );

      await Promise.all(promises);
      setAllReady(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [modelTypes, priority]);

  // Preload additional models
  const preloadModels = useCallback(
    (additionalModels: AIModelType[], preloadPriority: 'low' | 'medium' | 'high' = 'low') => {
      aiLazyLoader.preloadModels(additionalModels, preloadPriority);
    },
    []
  );

  // Clear all models
  const clearModel = useCallback(() => {
    modelTypes.forEach(type => aiLazyLoader.clearModels(type));
    setAllReady(false);
    setError(null);
  }, [modelTypes]);

  return {
    isReady: allReady,
    isLoading,
    error,
    progress,
    allReady,
    modelStatuses,
    loadModel: loadModels,
    preloadModels,
    clearModel
  };
}
