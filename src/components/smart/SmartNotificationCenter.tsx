"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAnimation } from "@/hooks/useAnimation";
import { useSmartDefaults } from "@/hooks/useSmartDefaults";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

interface SmartNotification {
  id: string;
  type: 'tip' | 'achievement' | 'warning' | 'celebration' | 'insight';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'low' | 'medium' | 'high';
  context?: any;
  dismissible?: boolean;
  autoHide?: boolean;
  duration?: number;
}

export function SmartNotificationCenter() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  const { toasts } = useUIStore();
  const { getAnimationClass, triggerCelebration } = useAnimation();
  const { preferences, recordUserAction } = useSmartDefaults();
  const { isConnected, address } = useWallet();

  // Generate contextual notifications based on user behavior
  useEffect(() => {
    if (isConnected && address) {
      generateSmartNotifications();
    }
  }, [isConnected, address, preferences]);

  const generateSmartNotifications = () => {
    const newNotifications: SmartNotification[] = [];

    // First-time user tips
    if (preferences.successRate === 0.75) { // Default value indicates new user
      newNotifications.push({
        id: 'welcome-tip',
        type: 'tip',
        title: '👋 Welcome to Punctuality Protocol!',
        message: 'Start with small stakes to build your reputation. Your success rate affects betting odds.',
        priority: 'high',
        dismissible: true,
        autoHide: false
      });
    }

    // High performer insights
    if (preferences.successRate > 0.85) {
      newNotifications.push({
        id: 'high-performer',
        type: 'insight',
        title: '🌟 You\'re a Punctuality Pro!',
        message: `With ${(preferences.successRate * 100).toFixed(0)}% success rate, you could increase your stakes for higher rewards.`,
        priority: 'medium',
        dismissible: true,
        autoHide: true,
        duration: 8000
      });
    }

    // Improvement suggestions
    if (preferences.successRate < 0.6 && preferences.successRate > 0) {
      newNotifications.push({
        id: 'improvement-tip',
        type: 'tip',
        title: '💡 Improve Your Success Rate',
        message: 'Try adding more time buffer to your commitments or choose closer destinations.',
        priority: 'medium',
        dismissible: true,
        autoHide: true,
        duration: 10000
      });
    }

    // Streak celebrations
    const daysSinceLastCommitment = 0; // This would come from actual data
    if (daysSinceLastCommitment === 0) {
      newNotifications.push({
        id: 'daily-streak',
        type: 'celebration',
        title: '🔥 Daily Streak!',
        message: 'You\'ve made commitments 3 days in a row! Keep it up!',
        priority: 'medium',
        dismissible: true,
        autoHide: true,
        duration: 5000
      });
    }

    // Risk tolerance insights
    if (preferences.riskTolerance === 'conservative' && preferences.successRate > 0.8) {
      newNotifications.push({
        id: 'risk-suggestion',
        type: 'insight',
        title: '📈 Consider Higher Stakes',
        message: 'Your high success rate suggests you could handle moderate risk for better rewards.',
        action: {
          label: 'Update Risk Profile',
          onClick: () => {
            // This would open risk tolerance settings
            console.log('Opening risk tolerance settings');
          }
        },
        priority: 'low',
        dismissible: true,
        autoHide: false
      });
    }

    setNotifications(prev => {
      // Merge with existing, avoiding duplicates
      const existing = prev.filter(n => !newNotifications.find(nn => nn.id === n.id));
      return [...existing, ...newNotifications];
    });

    if (newNotifications.length > 0) {
      setIsVisible(true);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Record dismissal for learning
    recordUserAction({
      type: 'notification_dismissed' as any,
      data: { notificationId: id }
    });
  };

  const handleNotificationAction = (notification: SmartNotification) => {
    if (notification.action) {
      notification.action.onClick();
      
      // Record action for learning
      recordUserAction({
        type: 'notification_action_taken' as any,
        data: { notificationId: notification.id }
      });
      
      dismissNotification(notification.id);
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.autoHide && notification.duration) {
        setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.duration);
      }
    });
  }, [notifications]);

  // Hide center when no notifications
  useEffect(() => {
    if (notifications.length === 0) {
      setIsVisible(false);
    }
  }, [notifications]);

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type: SmartNotification['type']) => {
    const icons = {
      tip: '💡',
      achievement: '🏆',
      warning: '⚠️',
      celebration: '🎉',
      insight: '📊'
    };
    return icons[type];
  };

  const getNotificationColors = (type: SmartNotification['type']) => {
    const colors = {
      tip: 'bg-blue-50 border-blue-200 text-blue-800',
      achievement: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      warning: 'bg-orange-50 border-orange-200 text-orange-800',
      celebration: 'bg-green-50 border-green-200 text-green-800',
      insight: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[type];
  };

  return (
    <div className="fixed top-20 right-4 z-40 w-80 max-w-sm space-y-3">
      {notifications
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .map((notification, index) => (
          <div
            key={notification.id}
            className={cn(
              "rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm",
              "transform transition-all duration-300 ease-out",
              getNotificationColors(notification.type),
              getAnimationClass('enter', 'medium')
            )}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  {notification.message}
                </p>
                
                {notification.action && (
                  <button
                    onClick={() => handleNotificationAction(notification)}
                    className="mt-3 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-medium transition-colors"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              
              {notification.dismissible && (
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

// Hook for triggering smart notifications from components
export function useSmartNotifications() {
  const { preferences } = useSmartDefaults();
  const { triggerCelebration } = useAnimation();

  const triggerContextualNotification = (
    context: 'commitment_created' | 'bet_placed' | 'achievement_unlocked' | 'streak_milestone',
    data?: any
  ) => {
    // This would integrate with the notification center
    // For now, we'll use celebrations
    
    switch (context) {
      case 'commitment_created':
        if (preferences.successRate > 0.8) {
          triggerCelebration({
            type: 'success',
            intensity: 'intense',
            haptic: true
          });
        } else {
          triggerCelebration({
            type: 'success',
            intensity: 'medium',
            haptic: true
          });
        }
        break;
        
      case 'achievement_unlocked':
        triggerCelebration({
          type: 'achievement',
          intensity: 'intense',
          haptic: true
        });
        break;
        
      case 'streak_milestone':
        triggerCelebration({
          type: 'success',
          intensity: 'intense',
          haptic: true
        });
        break;
    }
  };

  return {
    triggerContextualNotification
  };
}