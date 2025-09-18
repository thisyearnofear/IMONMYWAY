/**
 * Unified Component System - Complete Architecture
 * 
 * This is the single source of truth for the entire UI/UX system
 * Built with DRY principles, performance optimization, and viral mechanics
 */

// Core System
export { 
  ComponentSystem, 
  SystemProvider, 
  useSystem, 
  useViralActions, 
  useAdaptivePerformance,
  SystemStats,
  FeatureToggle
} from "./ComponentSystem";

// Unified Components
export * from "../unified";

// Viral Components
export { GameifiedInterface } from "../viral/GameifiedInterface";
export { SocialMagnetism } from "../viral/SocialMagnetism";

// System Types
export interface SystemConfig {
  theme?: "light" | "dark" | "auto";
  performance?: "high" | "medium" | "low";
  features?: {
    gamification?: boolean;
    socialMagnetism?: boolean;
    viralExperience?: boolean;
    adaptiveLoading?: boolean;
    realTimeStats?: boolean;
  };
  user?: {
    level?: number;
    xp?: number;
    achievements?: string[];
    preferences?: Record<string, any>;
  };
}

// Quick Setup Presets
export const SYSTEM_PRESETS = {
  FULL_VIRAL: {
    features: {
      gamification: true,
      socialMagnetism: true,
      viralExperience: true,
      adaptiveLoading: true,
      realTimeStats: true
    },
    performance: "high" as const
  },
  
  PERFORMANCE_FOCUSED: {
    features: {
      gamification: false,
      socialMagnetism: false,
      viralExperience: false,
      adaptiveLoading: true,
      realTimeStats: false
    },
    performance: "high" as const
  },
  
  MOBILE_OPTIMIZED: {
    features: {
      gamification: true,
      socialMagnetism: false,
      viralExperience: false,
      adaptiveLoading: true,
      realTimeStats: false
    },
    performance: "medium" as const
  },
  
  MINIMAL: {
    features: {
      gamification: false,
      socialMagnetism: false,
      viralExperience: false,
      adaptiveLoading: false,
      realTimeStats: false
    },
    performance: "low" as const
  }
} as const;

// Utility function for easy setup
export const createSystemConfig = (preset?: keyof typeof SYSTEM_PRESETS, overrides?: Partial<SystemConfig>): SystemConfig => {
  const baseConfig = preset ? SYSTEM_PRESETS[preset] : SYSTEM_PRESETS.FULL_VIRAL;
  return { ...baseConfig, ...overrides };
};