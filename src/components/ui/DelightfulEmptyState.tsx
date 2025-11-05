/**
 * Delightful Empty State - Engaging and Actionable Empty States
 * 
 * Consolidates all empty states across the platform with personality and guidance
 * Features: Contextual messaging, actionable suggestions, animations
 */

"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/PremiumButton";

interface DelightfulEmptyStateProps {
  // Visual elements
  icon?: string;
  title: string;
  description: string;
  
  // Personality and context
  mood?: "friendly" | "encouraging" | "playful" | "supportive";
  context?: "first-time" | "no-results" | "loading" | "error";
  
  // Actionable elements
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  
  // Suggestions
  suggestions?: Array<{
    icon: string;
    text: string;
    onClick?: () => void;
  }>;
  
  // Visual customization
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
  gradient?: boolean;
}

// Contextual messaging based on mood and context
const getPersonalityMessage = (mood: string, context: string) => {
  const messages = {
    "friendly-first-time": "Welcome! Let's get you started on your punctuality journey! 🌟",
    "friendly-no-results": "Hmm, we couldn't find what you're looking for. Let's try something else! 🔍",
    "encouraging-first-time": "You're about to create something amazing! Every expert was once a beginner. 💪",
    "encouraging-no-results": "No matches yet, but that's okay! Great things take time to discover. ⭐",
    "playful-first-time": "Ready to turn punctuality into a superpower? Let's make it fun! 🎮",
    "playful-no-results": "Oops! Looks like we're still searching for the perfect match. Adventure awaits! 🗺️",
    "supportive-first-time": "We're here to help you succeed. Take it one step at a time. 🤝",
    "supportive-no-results": "Don't worry, we've all been there. Let's find another path forward. 🌱"
  };
  
  return messages[`${mood}-${context}` as keyof typeof messages] || "Let's make something great happen! ✨";
};

// Contextual suggestions based on the current context
const getContextualSuggestions = (context: string) => {
  const suggestions = {
    "first-time": [
      { icon: "🎯", text: "Browse popular challenges to get inspired" },
      { icon: "🗺️", text: "Plan your first route with our smart tools" },
      { icon: "👥", text: "See what others are achieving" }
    ],
    "no-results": [
      { icon: "🔍", text: "Try different search terms" },
      { icon: "🎲", text: "Explore random challenges" },
      { icon: "📅", text: "Create your own custom challenge" }
    ],
    "loading": [
      { icon: "⚡", text: "Almost there! Good things take time" },
      { icon: "🧠", text: "Our AI is finding the perfect match" },
      { icon: "🎨", text: "Preparing something awesome for you" }
    ],
    "error": [
      { icon: "🔄", text: "Try refreshing the page" },
      { icon: "🐛", text: "Report this issue to help us improve" },
      { icon: "🏠", text: "Go back to the homepage" }
    ]
  };
  
  return suggestions[context as keyof typeof suggestions] || suggestions["first-time"];
};

export function DelightfulEmptyState({
  icon = "🌟",
  title,
  description,
  mood = "friendly",
  context = "first-time",
  primaryAction,
  secondaryAction,
  suggestions: customSuggestions,
  size = "md",
  showAnimation = true,
  gradient = false
}: DelightfulEmptyStateProps) {
  const suggestions = customSuggestions || getContextualSuggestions(context);
  const personalityMessage = getPersonalityMessage(mood, context);
  
  const sizeClasses = {
    sm: "py-8 px-4",
    md: "py-16 px-6",
    lg: "py-24 px-8"
  };
  
  const iconSizes = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl"
  };

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0, y: 20 } : {}}
      animate={showAnimation ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={`text-center ${sizeClasses[size]} ${
        gradient 
          ? "bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-xl border border-violet-500/20" 
          : ""
      }`}
    >
      {/* Animated Icon */}
      <motion.div
        initial={showAnimation ? { scale: 0, rotate: -180 } : {}}
        animate={showAnimation ? { scale: 1, rotate: 0 } : {}}
        transition={{ 
          delay: 0.2, 
          type: "spring", 
          stiffness: 200, 
          damping: 10 
        }}
        className={`${iconSizes[size]} mb-6`}
      >
        {showAnimation ? (
          <motion.span
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {icon}
          </motion.span>
        ) : (
          <span>{icon}</span>
        )}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={showAnimation ? { opacity: 0, y: 10 } : {}}
        animate={showAnimation ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/70 max-w-md mx-auto mb-4">{description}</p>
        <p className="text-violet-300 text-sm font-medium">{personalityMessage}</p>
      </motion.div>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={showAnimation ? { opacity: 0, y: 10 } : {}}
          animate={showAnimation ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
        >
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium px-6 py-3 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200"
            >
              {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              className="text-white/80 border border-white/20 hover:bg-white/10 px-6 py-3 rounded-xl"
            >
              {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}

      {/* Helpful Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={showAnimation ? { opacity: 0 } : {}}
          animate={showAnimation ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <p className="text-white/60 text-sm font-medium mb-4">💡 Here's what you can do:</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={showAnimation ? { opacity: 0, x: -10 } : {}}
                animate={showAnimation ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.9 + index * 0.1 }}
                className={`flex items-center gap-3 text-left p-3 rounded-lg transition-all duration-200 ${
                  suggestion.onClick 
                    ? "cursor-pointer hover:bg-white/5 border border-transparent hover:border-violet-500/30" 
                    : ""
                }`}
                onClick={suggestion.onClick}
              >
                <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                <span className="text-white/80 text-sm">{suggestion.text}</span>
                {suggestion.onClick && (
                  <span className="ml-auto text-violet-400 text-xs">→</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Convenient presets for common empty states
export const EmptyStatePresets = {
  noChallenges: (onCreateChallenge: () => void, onBrowseChallenges: () => void) => ({
    icon: "🎯",
    title: "No challenges yet!",
    description: "Your punctuality journey is about to begin. Let's create your first challenge!",
    mood: "encouraging" as const,
    context: "first-time" as const,
    primaryAction: {
      label: "Create First Challenge",
      onClick: onCreateChallenge,
      icon: "🚀"
    },
    secondaryAction: {
      label: "Browse Examples",
      onClick: onBrowseChallenges,
      icon: "👀"
    }
  }),
  
  noSearchResults: (onClearSearch: () => void, onCreateNew: () => void) => ({
    icon: "🔍",
    title: "No matches found",
    description: "We couldn't find any challenges matching your search. How about creating one?",
    mood: "playful" as const,
    context: "no-results" as const,
    primaryAction: {
      label: "Create New Challenge",
      onClick: onCreateNew,
      icon: "✨"
    },
    secondaryAction: {
      label: "Clear Search",
      onClick: onClearSearch,
      icon: "🔄"
    }
  }),
  
  noRoute: (onPlanRoute: () => void, onUseTemplate: () => void) => ({
    icon: "🗺️",
    title: "Ready to plan your route?",
    description: "A great journey starts with a single step. Let's map out your path to success!",
    mood: "friendly" as const,
    context: "first-time" as const,
    primaryAction: {
      label: "Plan My Route",
      onClick: onPlanRoute,
      icon: "🧭"
    },
    secondaryAction: {
      label: "Use Template",
      onClick: onUseTemplate,
      icon: "📋"
    }
  })
};