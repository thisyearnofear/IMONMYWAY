"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { motion } from "framer-motion";

// Import unified components
import { GameifiedInterface } from "../viral/GameifiedInterface";
import { SocialMagnetism } from "../viral/SocialMagnetism";
import { ViralExperience } from "../unified/ViralExperience";

// System State Management
interface SystemState {
  theme: "light" | "dark" | "auto";
  performance: "high" | "medium" | "low";
  features: {
    gamification: boolean;
    socialMagnetism: boolean;
    viralExperience: boolean;
    adaptiveLoading: boolean;
    realTimeStats: boolean;
  };
  user: {
    level: number;
    xp: number;
    achievements: string[];
    preferences: Record<string, any>;
  };
  analytics: {
    interactions: number;
    shareEvents: number;
    viralScore: number;
    sessionTime: number;
  };
}

type SystemAction = 
  | { type: "SET_THEME"; payload: SystemState["theme"] }
  | { type: "SET_PERFORMANCE"; payload: SystemState["performance"] }
  | { type: "TOGGLE_FEATURE"; payload: keyof SystemState["features"] }
  | { type: "UPDATE_USER"; payload: Partial<SystemState["user"]> }
  | { type: "TRACK_INTERACTION"; payload: string }
  | { type: "TRACK_SHARE"; payload: any }
  | { type: "UPDATE_VIRAL_SCORE"; payload: number };

const initialState: SystemState = {
  theme: "auto",
  performance: "high",
  features: {
    gamification: true,
    socialMagnetism: true,
    viralExperience: true,
    adaptiveLoading: true,
    realTimeStats: true
  },
  user: {
    level: 1,
    xp: 0,
    achievements: [],
    preferences: {}
  },
  analytics: {
    interactions: 0,
    shareEvents: 0,
    viralScore: 0,
    sessionTime: 0
  }
};

function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.payload };
    
    case "SET_PERFORMANCE":
      return { ...state, performance: action.payload };
    
    case "TOGGLE_FEATURE":
      return {
        ...state,
        features: {
          ...state.features,
          [action.payload]: !state.features[action.payload]
        }
      };
    
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case "TRACK_INTERACTION":
      return {
        ...state,
        analytics: {
          ...state.analytics,
          interactions: state.analytics.interactions + 1
        }
      };
    
    case "TRACK_SHARE":
      return {
        ...state,
        analytics: {
          ...state.analytics,
          shareEvents: state.analytics.shareEvents + 1,
          viralScore: state.analytics.viralScore + 10
        }
      };
    
    case "UPDATE_VIRAL_SCORE":
      return {
        ...state,
        analytics: {
          ...state.analytics,
          viralScore: action.payload
        }
      };
    
    default:
      return state;
  }
}

// System Context
const SystemContext = createContext<{
  state: SystemState;
  dispatch: React.Dispatch<SystemAction>;
} | null>(null);

// Custom Hooks
export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error("useSystem must be used within SystemProvider");
  }
  return context;
};

export const useViralActions = () => {
  const { dispatch } = useSystem();
  
  return {
    trackInteraction: (type: string) => dispatch({ type: "TRACK_INTERACTION", payload: type }),
    trackShare: (data: any) => dispatch({ type: "TRACK_SHARE", payload: data }),
    updateViralScore: (score: number) => dispatch({ type: "UPDATE_VIRAL_SCORE", payload: score })
  };
};

export const useAdaptivePerformance = () => {
  const { state, dispatch } = useSystem();
  
  useEffect(() => {
    // Auto-adjust performance based on device capabilities
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const memory = (performance as any).memory;
      
      let performanceLevel: SystemState["performance"] = "high";
      
      if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
        performanceLevel = "low";
      } else if (memory?.usedJSHeapSize > memory?.jsHeapSizeLimit * 0.8) {
        performanceLevel = "medium";
      }
      
      if (performanceLevel !== state.performance) {
        dispatch({ type: "SET_PERFORMANCE", payload: performanceLevel });
      }
    };
    
    checkPerformance();
    const interval = setInterval(checkPerformance, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, [state.performance, dispatch]);
  
  return state.performance;
};

// System Provider Component
interface SystemProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<SystemState>;
}

export const SystemProvider: React.FC<SystemProviderProps> = ({ 
  children, 
  initialConfig 
}) => {
  const [state, dispatch] = useReducer(systemReducer, {
    ...initialState,
    ...initialConfig
  });
  
  // Session time tracking
  useEffect(() => {
    const startTime = Date.now();
    
    const updateSessionTime = () => {
      const sessionTime = Date.now() - startTime;
      dispatch({ 
        type: "UPDATE_USER", 
        payload: { preferences: { ...state.user.preferences, sessionTime } }
      });
    };
    
    const interval = setInterval(updateSessionTime, 60000); // Update every minute
    
    return () => {
      clearInterval(interval);
      updateSessionTime();
    };
  }, [state.user.preferences]);
  
  // Auto-save state to localStorage
  useEffect(() => {
    const saveState = () => {
      try {
        localStorage.setItem("system_state", JSON.stringify({
          theme: state.theme,
          features: state.features,
          user: state.user
        }));
      } catch (error) {
        console.warn("Failed to save system state:", error);
      }
    };
    
    const timeoutId = setTimeout(saveState, 1000);
    return () => clearTimeout(timeoutId);
  }, [state]);
  
  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("system_state");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        dispatch({ type: "SET_THEME", payload: parsed.theme });
        dispatch({ type: "UPDATE_USER", payload: parsed.user });
        Object.keys(parsed.features).forEach(feature => {
          if (parsed.features[feature] !== state.features[feature as keyof SystemState["features"]]) {
            dispatch({ type: "TOGGLE_FEATURE", payload: feature as keyof SystemState["features"] });
          }
        });
      }
    } catch (error) {
      console.warn("Failed to load system state:", error);
    }
  }, [state.features]);
  
  return (
    <SystemContext.Provider value={{ state, dispatch }}>
      {children}
    </SystemContext.Provider>
  );
};

// Main System Component
interface ComponentSystemProps {
  children: React.ReactNode;
  enableAll?: boolean;
  customConfig?: Partial<SystemState>;
}

export const ComponentSystem: React.FC<ComponentSystemProps> = ({
  children,
  enableAll = true,
  customConfig
}) => {
  return (
    <SystemProvider initialConfig={customConfig}>
      <SystemWrapper enableAll={enableAll}>
        {children}
      </SystemWrapper>
    </SystemProvider>
  );
};

// System Wrapper with conditional rendering
const SystemWrapper: React.FC<{ children: React.ReactNode; enableAll: boolean }> = ({
  children,
  enableAll
}) => {
  const { state } = useSystem();
  const viralActions = useViralActions();
  const performance = useAdaptivePerformance();
  
  // Performance-based rendering
  const shouldRenderFeature = (feature: keyof SystemState["features"]) => {
    if (!enableAll || !state.features[feature]) return false;
    
    // Disable heavy features on low performance
    if (performance === "low") {
      return !["socialMagnetism", "viralExperience"].includes(feature);
    }
    
    return true;
  };
  
  const handleViralMoment = (type: string, data: any) => {
    viralActions.trackShare(data);
    viralActions.updateViralScore(state.analytics.viralScore + 25);
  };
  
  // Compose the component tree based on enabled features
  let wrappedChildren = children;
  
  // Layer 1: Viral Experience (innermost) - Skip since it doesn't accept children
  // ViralExperience is a standalone component, not a wrapper
  
  // Layer 2: Social Magnetism
  if (shouldRenderFeature("socialMagnetism")) {
    wrappedChildren = (
      <SocialMagnetism
        onViralAction={handleViralMoment}
        enableRealTimeStats={shouldRenderFeature("realTimeStats")}
        enableSocialProof={performance !== "low"}
        enableViralChallenges={performance === "high"}
      >
        {wrappedChildren}
      </SocialMagnetism>
    );
  }
  
  // Layer 3: Gamified Interface (outermost)
  if (shouldRenderFeature("gamification")) {
    wrappedChildren = (
      <GameifiedInterface
        onViralMoment={handleViralMoment}
        enableAchievements={performance !== "low"}
        enableStreaks={performance === "high"}
        enableSocialSharing={true}
      >
        {wrappedChildren}
      </GameifiedInterface>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen transition-all duration-300 ${
        state.theme === "dark" ? "dark" : ""
      }`}
      onClick={() => viralActions.trackInteraction("click")}
    >
      {wrappedChildren}
      
      {/* Viral Experience as overlay component */}
      {shouldRenderFeature("viralExperience") && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <ViralExperience userId={state.user.preferences.userId} />
        </div>
      )}
      
      {/* Performance Indicator (dev mode) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Performance: {performance} | Features: {Object.values(state.features).filter(Boolean).length}/5
        </div>
      )}
    </motion.div>
  );
};

// Utility Components
export const SystemStats: React.FC = () => {
  const { state } = useSystem();
  
  return (
    <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 text-white">
      <h3 className="font-bold mb-2">System Stats</h3>
      <div className="space-y-1 text-sm">
        <div>Level: {state.user.level}</div>
        <div>XP: {state.user.xp}</div>
        <div>Interactions: {state.analytics.interactions}</div>
        <div>Viral Score: {state.analytics.viralScore}</div>
        <div>Performance: {state.performance}</div>
      </div>
    </div>
  );
};

export const FeatureToggle: React.FC<{ 
  feature: keyof SystemState["features"];
  label: string;
}> = ({ feature, label }) => {
  const { state, dispatch } = useSystem();
  
  return (
    <label className="flex items-center gap-2 text-white">
      <input
        type="checkbox"
        checked={state.features[feature]}
        onChange={() => dispatch({ type: "TOGGLE_FEATURE", payload: feature })}
        className="rounded"
      />
      {label}
    </label>
  );
};

export default ComponentSystem;