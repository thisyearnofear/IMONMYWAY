/**
 * Navigation Context Hook - Maintains UX cohesion across pages
 * 
 * Tracks user journey, maintains context, and provides smart navigation suggestions
 * Features: Breadcrumb state, journey tracking, smart next actions
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocalStorage } from "./useLocalStorage";

interface NavigationStep {
  path: string;
  timestamp: number;
  duration?: number;
  completed?: boolean;
  metadata?: Record<string, any>;
}

interface UserJourney {
  steps: NavigationStep[];
  currentGoal?: "browse" | "plan" | "create" | "track" | "compete";
  lastActiveTimestamp: number;
  preferences: {
    skipOnboarding?: boolean;
    preferredStartPage?: string;
    completedActions?: string[];
  };
}

interface NavigationContext {
  // Current state
  currentPath: string;
  currentStep: number;
  totalSteps: number;
  
  // Journey tracking
  journey: UserJourney;
  previousPath?: string;
  timeOnCurrentPage: number;
  
  // Smart suggestions
  suggestedNextAction?: {
    path: string;
    label: string;
    reason: string;
    icon: string;
  };
  
  // Context preservation
  preservedState: Record<string, any>;
  
  // Actions
  navigateWithContext: (path: string, metadata?: Record<string, any>) => void;
  markStepCompleted: (stepId: string) => void;
  setCurrentGoal: (goal: UserJourney["currentGoal"]) => void;
  preserveState: (key: string, value: any) => void;
  getPreservedState: (key: string) => any;
  clearPreservedState: (key?: string) => void;
}

// Custom hook for localStorage with SSR safety
function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  const setStoredValue = (newValue: T) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue, isLoaded] as const;
}

// Navigation flow definition
const NAVIGATION_FLOW = {
  "/": { step: 0, next: "/challenges", label: "Browse Challenges" },
  "/challenges": { step: 1, next: "/plan", label: "Plan Route" },
  "/plan": { step: 2, next: "/create", label: "Create Challenge" },
  "/create": { step: 3, next: "/profile", label: "Track Progress" },
  "/profile": { step: 4, next: "/leaderboard", label: "View Rankings" },
  "/leaderboard": { step: 5, next: "/challenges", label: "New Challenge" }
};

// Smart suggestion logic based on user behavior
const getSmartSuggestion = (journey: UserJourney, currentPath: string, timeOnPage: number) => {
  const recentSteps = journey.steps.slice(-3);
  const completedActions = journey.preferences.completedActions || [];
  
  // First-time user suggestions
  if (journey.steps.length <= 1) {
    if (currentPath === "/") {
      return {
        path: "/challenges",
        label: "Explore Challenges",
        reason: "Perfect place to start your journey!",
        icon: "🎯"
      };
    }
  }
  
  // User has been on planning page for a while
  if (currentPath === "/plan" && timeOnPage > 120000) { // 2 minutes
    return {
      path: "/challenges",
      label: "Browse Templates",
      reason: "Need inspiration? Check out popular routes!",
      icon: "💡"
    };
  }
  
  // User created challenges but hasn't checked progress
  if (completedActions.includes("challenge-created") && !completedActions.includes("profile-visited")) {
    return {
      path: "/profile",
      label: "Track Progress",
      reason: "See how your challenges are performing!",
      icon: "📊"
    };
  }
  
  // User engaged with social features
  if (completedActions.includes("leaderboard-visited") && !completedActions.includes("challenge-shared")) {
    return {
      path: "/challenges",
      label: "Create Viral Challenge",
      reason: "Share your success with the community!",
      icon: "🔥"
    };
  }
  
  // Default flow progression
  const currentFlow = NAVIGATION_FLOW[currentPath as keyof typeof NAVIGATION_FLOW];
  if (currentFlow) {
    return {
      path: currentFlow.next,
      label: currentFlow.label,
      reason: "Continue your punctuality journey",
      icon: "➡️"
    };
  }
  
  return undefined;
};

export function useNavigationContext(): NavigationContext {
  const pathname = usePathname();
  const router = useRouter();
  
  // Persistent state
  const [journey, setJourney, journeyLoaded] = useLocalStorage<UserJourney>("user_journey", {
    steps: [],
    lastActiveTimestamp: Date.now(),
    preferences: {}
  });
  
  const [preservedState, setPreservedState] = useLocalStorage<Record<string, any>>("navigation_state", {});
  
  // Session state
  const [previousPath, setPreviousPath] = useState<string>();
  const [pageStartTime] = useState(Date.now());
  const [timeOnCurrentPage, setTimeOnCurrentPage] = useState(0);
  
  // Update time on current page
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnCurrentPage(Date.now() - pageStartTime);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pageStartTime]);
  
  // Track navigation changes
  useEffect(() => {
    if (!journeyLoaded) return;
    
    const currentStep: NavigationStep = {
      path: pathname,
      timestamp: Date.now(),
      metadata: {}
    };
    
    // Update previous step duration
    const updatedSteps = [...journey.steps];
    if (updatedSteps.length > 0) {
      const lastStep = updatedSteps[updatedSteps.length - 1];
      lastStep.duration = Date.now() - lastStep.timestamp;
    }
    
    // Add current step
    updatedSteps.push(currentStep);
    
    // Keep only last 20 steps to prevent storage bloat
    const trimmedSteps = updatedSteps.slice(-20);
    
    setJourney({
      ...journey,
      steps: trimmedSteps,
      lastActiveTimestamp: Date.now()
    });
    
    setPreviousPath(journey.steps[journey.steps.length - 1]?.path);
  }, [pathname, journeyLoaded]);
  
  // Calculate current step in flow
  const currentFlow = NAVIGATION_FLOW[pathname as keyof typeof NAVIGATION_FLOW];
  const currentStep = currentFlow?.step || 0;
  const totalSteps = Object.keys(NAVIGATION_FLOW).length - 1; // Exclude home page
  
  // Generate smart suggestion
  const suggestedNextAction = journeyLoaded 
    ? getSmartSuggestion(journey, pathname, timeOnCurrentPage)
    : undefined;
  
  // Actions
  const navigateWithContext = (path: string, metadata?: Record<string, any>) => {
    // Update current step metadata before navigation
    if (journeyLoaded) {
      const updatedSteps = [...journey.steps];
      if (updatedSteps.length > 0) {
        updatedSteps[updatedSteps.length - 1].metadata = {
          ...updatedSteps[updatedSteps.length - 1].metadata,
          ...metadata
        };
      }
      
      setJourney({
        ...journey,
        steps: updatedSteps
      });
    }
    
    router.push(path);
  };
  
  const markStepCompleted = (stepId: string) => {
    if (!journeyLoaded) return;
    
    const completedActions = journey.preferences.completedActions || [];
    if (!completedActions.includes(stepId)) {
      setJourney({
        ...journey,
        preferences: {
          ...journey.preferences,
          completedActions: [...completedActions, stepId]
        }
      });
    }
  };
  
  const setCurrentGoal = (goal: UserJourney["currentGoal"]) => {
    if (!journeyLoaded) return;
    
    setJourney({
      ...journey,
      currentGoal: goal
    });
  };
  
  const preserveStateValue = (key: string, value: any) => {
    setPreservedState({
      ...preservedState,
      [key]: value
    });
  };
  
  const getPreservedState = (key: string) => {
    return preservedState[key];
  };
  
  const clearPreservedState = (key?: string) => {
    if (key) {
      const { [key]: removed, ...rest } = preservedState;
      setPreservedState(rest);
    } else {
      setPreservedState({});
    }
  };
  
  return {
    currentPath: pathname,
    currentStep,
    totalSteps,
    journey,
    previousPath,
    timeOnCurrentPage,
    suggestedNextAction,
    preservedState,
    navigateWithContext,
    markStepCompleted,
    setCurrentGoal,
    preserveState: preserveStateValue,
    getPreservedState,
    clearPreservedState
  };
}