import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAIEngine } from '@/hooks/useAIEngine';
import { aiConfig, isFeatureEnabled } from '@/config/ai-config';

// ============================================================================
// SMART DEFAULTS TYPES
// ============================================================================

interface SmartDefaults {
  stakeAmount: string;
  routePreference: 'fastest' | 'shortest' | 'scenic';
  privacyLevel: 'public' | 'friends_only' | 'private';
  notificationPreferences: {
    arrivalReminders: boolean;
    betNotifications: boolean;
    achievementNotifications: boolean;
  };
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
}

interface SmartDefaultOptions {
  commitmentType?: 'personal' | 'work' | 'social';
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  dayOfWeek?: string; // 'monday', 'tuesday', etc.
  urgency?: 'low' | 'medium' | 'high';
  historicalData?: any;
}

// ============================================================================
// SMART DEFAULTS HOOK (ENHANCED WITH AI)
// ============================================================================

export function useSmartDefaults() {
  const { address: walletAddress } = useWallet();
  const { getStakeRecommendation, predictReputation, isFeatureEnabled: isAIEnabled } = useAIEngine();
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get default stake amount (enhanced with AI)
  const getDefaultStake = useCallback(async (options: SmartDefaultOptions = {}): Promise<string> => {
    if (!walletAddress) {
      return '1.00'; // Default stake when not connected
    }

    try {
      // If AI stake recommendations are enabled, use them
      if (isAIEnabled('enableStakeRecommendations') && walletAddress) {
        const commitmentData = {
          estimatedTime: options.urgency === 'high' ? 1800 : options.urgency === 'medium' ? 3600 : 7200, // 30 min, 1 hr, 2 hrs
          distance: 5, // Placeholder distance
          targetLocation: { lat: 0, lng: 0 }, // Placeholder coordinates
          deadline: new Date(Date.now() + (options.urgency === 'high' ? 3600000 : 7200000)) // 1 or 2 hours from now
        };

        const recommendation = await getStakeRecommendation(walletAddress, commitmentData);
        return recommendation.suggestedStake;
      } 
      // Fallback to rule-based defaults
      else {
        // Rule-based stake amount based on various factors
        let baseStake = 1.0;
        
        // Increase stake for high urgency
        if (options.urgency === 'high') baseStake += 0.5;
        if (options.urgency === 'medium') baseStake += 0.25;
        
        // Increase stake based on commitment type
        if (options.commitmentType === 'work') baseStake += 0.5;
        if (options.commitmentType === 'social') baseStake += 0.25;
        
        // Risk tolerance adjustments
        if (options.historicalData?.riskTolerance === 'aggressive') baseStake *= 1.5;
        else if (options.historicalData?.riskTolerance === 'conservative') baseStake *= 0.7;
        
        return baseStake.toFixed(2);
      }
    } catch (err) {
      console.error('Error getting default stake:', err);
      return '1.00'; // Fallback to default
    }
  }, [walletAddress, getStakeRecommendation, isAIEnabled]);

  // Get default route preference (enhanced with AI)
  const getDefaultRoutePreference = useCallback((options: SmartDefaultOptions = {}): 'fastest' | 'shortest' | 'scenic' => {
    if (options.urgency === 'high') return 'fastest';
    if (options.commitmentType === 'work') return 'fastest';
    if (options.commitmentType === 'social' && options.timeOfDay === 'evening') return 'scenic';
    return 'fastest'; // Default
  }, []);

  // Get default privacy level (rule-based)
  const getDefaultPrivacyLevel = useCallback((options: SmartDefaultOptions = {}): 'public' | 'friends_only' | 'private' => {
    if (options.commitmentType === 'work') return 'private';
    if (options.commitmentType === 'personal') return 'friends_only';
    return 'public'; // Default
  }, []);

  // Get default notification preferences (rule-based)
  const getDefaultNotificationPreferences = useCallback((options: SmartDefaultOptions = {}): SmartDefaults['notificationPreferences'] => {
    return {
      arrivalReminders: true,
      betNotifications: true,
      achievementNotifications: options.commitmentType !== 'work' // Don't show achievement notifications for work commitments
    };
  }, []);

  // Get default risk tolerance (enhanced with AI)
  const getDefaultRiskTolerance = useCallback(async (): Promise<'conservative' | 'balanced' | 'aggressive'> => {
    if (!walletAddress) {
      return 'balanced'; // Default when not connected
    }

    try {
      // If AI reputation prediction is enabled, use it to inform risk tolerance
      if (isAIEnabled('enableReputationPrediction') && walletAddress) {
        const prediction = await predictReputation(walletAddress);
        
        // Suggest risk tolerance based on predicted reputation
        if (prediction.predictedScore > 850) {
          // High reputation users might be more willing to take risks
          return 'aggressive';
        } else if (prediction.predictedScore > 700) {
          // Medium reputation users are balanced
          return 'balanced';
        } else {
          // Lower reputation users are conservative
          return 'conservative';
        }
      } 
      // Fallback to rule-based
      else {
        // Default to balanced risk for unknown users
        return 'balanced';
      }
    } catch (err) {
      console.error('Error getting default risk tolerance:', err);
      return 'balanced'; // Fallback to balanced
    }
  }, [walletAddress, predictReputation, isAIEnabled]);

  // Get smart defaults with all AI enhancements
  const getSmartDefaults = useCallback(async (options: SmartDefaultOptions = {}): Promise<SmartDefaults> => {
    setLoading(true);
    setError(null);

    try {
      // Get all defaults in parallel
      const [
        stakeAmount,
        routePreference,
        privacyLevel,
        notificationPreferences,
        riskTolerance
      ] = await Promise.all([
        getDefaultStake(options),
        getDefaultRoutePreference(options),
        getDefaultPrivacyLevel(options),
        getDefaultNotificationPreferences(options),
        getDefaultRiskTolerance()
      ]);

      const defaults: SmartDefaults = {
        stakeAmount,
        routePreference,
        privacyLevel,
        notificationPreferences,
        riskTolerance
      };

      setSmartDefaults(defaults);
      return defaults;
    } catch (err) {
      console.error('Error getting smart defaults:', err);
      setError('Failed to load smart defaults');
      
      // Return fallback defaults
      const fallbackDefaults: SmartDefaults = {
        stakeAmount: '1.00',
        routePreference: 'fastest',
        privacyLevel: 'friends_only',
        notificationPreferences: {
          arrivalReminders: true,
          betNotifications: true,
          achievementNotifications: true
        },
        riskTolerance: 'balanced'
      };
      
      setSmartDefaults(fallbackDefaults);
      return fallbackDefaults;
    } finally {
      setLoading(false);
    }
  }, [
    getDefaultStake, 
    getDefaultRoutePreference, 
    getDefaultPrivacyLevel, 
    getDefaultNotificationPreferences, 
    getDefaultRiskTolerance
  ]);

  // Update a specific default value
  const updateDefault = useCallback((key: keyof SmartDefaults, value: any) => {
    setSmartDefaults(prev => prev ? { ...prev, [key]: value } : null);
  }, []);

  // Enhanced defaults persistence with database integration
  const saveDefaults = useCallback(async (defaults: SmartDefaults) => {
    try {
      // Save to localStorage for immediate access
      localStorage.setItem('smartDefaults', JSON.stringify(defaults));
      
      // Save to database if user is connected
      if (walletAddress) {
        const { dbService } = await import('@/lib/db-service');
        await dbService.updateUser(walletAddress, { 
          smartDefaults: defaults,
          lastDefaultsUpdate: Date.now()
        });
      }
    } catch (err) {
      console.error('Error saving defaults:', err);
    }
  }, [walletAddress]);

  // Enhanced defaults loading with database fallback
  const loadDefaults = useCallback(async (): Promise<SmartDefaults | null> => {
    try {
      // Try database first if user is connected
      if (walletAddress) {
        const { dbService } = await import('@/lib/db-service');
        const user = await dbService.getUserByWallet(walletAddress);
        if (user?.smartDefaults) {
          // Update localStorage with database data
          localStorage.setItem('smartDefaults', JSON.stringify(user.smartDefaults));
          return user.smartDefaults;
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('smartDefaults');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Error loading defaults:', err);
      return null;
    }
  }, [walletAddress]);

  // Initialize smart defaults on hook mount if wallet is connected
  useEffect(() => {
    if (walletAddress) {
      const loadAndSetDefaults = async () => {
        // Try to load saved defaults first
        const savedDefaults = await loadDefaults();
        if (savedDefaults) {
          setSmartDefaults(savedDefaults);
          setLoading(false);
          return;
        }

        // If no saved defaults, get new smart defaults
        await getSmartDefaults();
      };

      loadAndSetDefaults();
    } else {
      // Set default values when not connected
      setSmartDefaults({
        stakeAmount: '1.00',
        routePreference: 'fastest',
        privacyLevel: 'friends_only',
        notificationPreferences: {
          arrivalReminders: true,
          betNotifications: true,
          achievementNotifications: true
        },
        riskTolerance: 'balanced'
      });
      setLoading(false);
    }
  }, [walletAddress, loadDefaults, getSmartDefaults]);

  // Return the enhanced smart defaults with AI features
  return {
    smartDefaults,
    loading,
    error,
    getSmartDefaults,
    updateDefault,
    saveDefaults,
    getDefaultStake,
    getDefaultRoutePreference,
    getDefaultPrivacyLevel,
    getDefaultNotificationPreferences,
    getDefaultRiskTolerance,
    // AI-specific methods
    refreshDefaults: getSmartDefaults,
    updateWithAI: getSmartDefaults
  };
}