/**
 * Unified Components - Single Source of Truth
 * 
 * All UI components consolidated into intelligent, adaptive, viral-ready components
 * Following DRY principles and performance optimization
 */

// Core unified components
export { 
  UnifiedButton, 
  Button, 
  PremiumButton, 
  DelightfulButton 
} from "./UnifiedButton";

export { 
  UnifiedLoader, 
  PageLoader, 
  ComponentLoader, 
  ButtonLoader, 
  DataLoader,
  LoadingSpinner,
  CuteLoader,
  LoadingSkeleton 
} from "./UnifiedLoader";

export { 
  ToastProvider, 
  ToastContainer, 
  useToast, 
  useSuccessToast, 
  useErrorToast, 
  useAchievementToast 
} from "./UnifiedToast";

export { ViralExperience } from "./ViralExperience";

// Re-export for backward compatibility
export { UnifiedButton as EnhancedButton } from "./UnifiedButton";
export { UnifiedButton as MobileOptimizedButton } from "./UnifiedButton";
export { UnifiedButton as FloatingButton } from "./UnifiedButton";
export { ToastContainer as Toast } from "./UnifiedToast";
export { ToastContainer as PremiumToast } from "./UnifiedToast";
export { ToastContainer as SmartNotificationCenter } from "./UnifiedToast";