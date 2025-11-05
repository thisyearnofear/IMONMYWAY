/**
 * Personality Engine - Adds warmth and conversational elements
 * 
 * Generates contextual messages, celebrations, and encouragement based on user state
 * Features: Dynamic messaging, cultural adaptation, surprise moments
 */

import { UserJourney } from "@/hooks/useNavigationContext";

// Personality traits that influence messaging
export interface PersonalityTraits {
  enthusiasm: "low" | "medium" | "high";
  formality: "casual" | "friendly" | "professional";
  humor: "none" | "light" | "playful";
  encouragement: "subtle" | "moderate" | "strong";
}

// User context for personalized messaging
export interface UserContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: "weekday" | "weekend";
  streakDays?: number;
  recentActivity: "active" | "moderate" | "low";
  challengesCompleted: number;
  currentMood?: "motivated" | "frustrated" | "curious" | "confident";
}

// Message categories for different situations
export type MessageCategory = 
  | "welcome" 
  | "encouragement" 
  | "celebration" 
  | "guidance" 
  | "error" 
  | "loading" 
  | "success" 
  | "milestone" 
  | "casual" 
  | "motivation";

// Cultural and time-based context detection
export function getUserContext(): UserContext {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  const timeOfDay = 
    hour < 6 ? "night" :
    hour < 12 ? "morning" :
    hour < 18 ? "afternoon" :
    hour < 22 ? "evening" : "night";
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  return {
    timeOfDay,
    dayOfWeek: isWeekend ? "weekend" : "weekday",
    recentActivity: "moderate", // Would be calculated from actual user data
    challengesCompleted: 0 // Would come from user profile
  };
}

// Default personality - friendly and encouraging
export const DEFAULT_PERSONALITY: PersonalityTraits = {
  enthusiasm: "medium",
  formality: "friendly",
  humor: "light",
  encouragement: "moderate"
};

// Message templates organized by category and personality
const MESSAGE_TEMPLATES = {
  welcome: {
    casual: {
      morning: [
        "Good morning! ☀️ Ready to make today count?",
        "Hey there! 👋 Let's start this day with purpose!",
        "Morning, punctuality champion! 🌅 What's on today's agenda?"
      ],
      afternoon: [
        "Hey! 🌞 Perfect timing to plan something awesome!",
        "Afternoon! 👋 Ready to turn intentions into actions?",
        "Great to see you! ✨ Let's make the rest of today amazing!"
      ],
      evening: [
        "Evening! 🌙 Planning tomorrow or tackling tonight?",
        "Hey night owl! 🦉 Let's set you up for success!",
        "Perfect evening for some thoughtful planning! 🌃"
      ]
    },
    friendly: {
      morning: [
        "Good morning! 🌟 I'm excited to help you plan something great today!",
        "Hello there! ☀️ What punctuality goals shall we tackle this morning?",
        "Morning! 🌅 Ready to turn your time management dreams into reality?"
      ],
      afternoon: [
        "Good afternoon! 🌞 I hope your day has been productive so far!",
        "Hey there! 👋 Ready to make the most of the rest of your day?",
        "Afternoon! ✨ Let's create something meaningful together!"
      ],
      evening: [
        "Good evening! 🌙 Whether you're planning ahead or wrapping up, I'm here to help!",
        "Evening! 🌃 Perfect time for reflection and forward planning!",
        "Hello! 🌆 Let's make your time management goals crystal clear!"
      ]
    }
  },
  
  encouragement: {
    low_streak: [
      "Every expert was once a beginner. You're building something great! 💪",
      "Small steps lead to big victories. Keep going! 🎯",
      "You're closer than you think. One more step! ⭐",
      "Progress isn't always visible, but you're definitely moving forward! 🚀"
    ],
    medium_streak: [
      "Look at you go! 🔥 You're really finding your rhythm!",
      "Impressive consistency! 📈 Your future self will thank you!",
      "This is how success is built - one commitment at a time! ✨",
      "You're proving that punctuality is a superpower! ⚡"
    ],
    high_streak: [
      "Absolutely phenomenal! 🏆 You're an inspiration to others!",
      "This is legendary status! 👑 You've mastered the art of punctuality!",
      "Incredible dedication! 🌟 You're redefining what's possible!",
      "You're not just meeting goals, you're exceeding them! 🚀"
    ]
  },
  
  celebration: {
    first_challenge: [
      "🎉 Congratulations on creating your first challenge! This is where legends begin!",
      "🚀 First challenge complete! You've just taken the most important step!",
      "✨ Amazing! Your punctuality journey officially starts now!",
      "🌟 Welcome to the challenge creators club! This is just the beginning!"
    ],
    milestone: [
      "🏆 Milestone achieved! You're officially on fire!",
      "🎯 Bulls-eye! Another goal conquered!",
      "💎 That's what we call excellence in action!",
      "⚡ Supercharged performance! Keep this energy flowing!"
    ],
    streak: [
      "🔥 Streak power activated! You're unstoppable!",
      "📈 Your consistency is paying off in a big way!",
      "⭐ Star performer alert! This is how success looks!",
      "🌪️ You're on a roll! Momentum is building!"
    ]
  },
  
  guidance: {
    planning: [
      "💡 Pro tip: Start with a route you know well for your first challenge!",
      "🎯 The sweet spot is challenging but achievable - aim for 80% confidence!",
      "🗺️ Real-time preview will help you fine-tune before committing!",
      "⚡ Don't forget to account for traffic patterns at your planned time!"
    ],
    creating: [
      "🧠 Let your past performance guide your pace estimate!",
      "📊 Conservative estimates build confidence, aggressive ones build character!",
      "🎲 Try different challenge types to keep things interesting!",
      "💫 The best challenges have just the right amount of difficulty!"
    ],
    tracking: [
      "📱 Enable notifications to stay on top of your commitments!",
      "🎪 Share your victories - success is meant to be celebrated!",
      "📈 Track patterns in your performance to optimize future challenges!",
      "🔄 Regular challenges build the punctuality habit faster!"
    ]
  },
  
  loading: [
    "🔍 Searching for the perfect route... Almost there!",
    "⚡ Crunching the numbers... Good things take time!",
    "🧠 Our AI is thinking... This is going to be great!",
    "🎯 Calculating optimal paths... Excellence in progress!",
    "✨ Preparing something awesome... Just a moment!",
    "🚀 Loading your personalized experience... Ready soon!"
  ],
  
  error: {
    gentle: [
      "Oops! 😅 Something didn't go as planned, but we'll figure it out together!",
      "Hmm... 🤔 Let's try a different approach! No worries at all!",
      "Whoops! 🙈 Even the best plans need adjustments sometimes!",
      "Oh! 😊 Looks like we hit a tiny bump. Let's smooth it out!"
    ],
    encouraging: [
      "No problem! 💪 Every challenge is just a setup for a comeback!",
      "Plot twist! 🎭 This is just life keeping things interesting!",
      "Adventure mode activated! 🗺️ Let's find another path forward!",
      "Temporary detour! 🔄 Great stories always have unexpected moments!"
    ]
  },
  
  success: {
    quick: [
      "Boom! 💥", "Yes! 🙌", "Perfect! ✨", "Nailed it! 🎯", 
      "Awesome! 🔥", "Brilliant! 💡", "Fantastic! ⭐", "Outstanding! 🏆"
    ],
    detailed: [
      "🎉 Absolutely fantastic! You've just achieved something amazing!",
      "🌟 Outstanding work! This is exactly how success is built!",
      "🚀 Incredible job! You're really mastering this punctuality game!",
      "✨ Phenomenal! Your dedication is truly paying off!"
    ]
  }
};

// Surprise and delight moments
const SURPRISE_MOMENTS = [
  {
    trigger: "challenge_created_friday",
    message: "🎉 Friday challenge created! Weekend warrior mode activated!",
    animation: "celebration"
  },
  {
    trigger: "perfect_week",
    message: "🏆 Perfect week! You're officially a punctuality legend!",
    animation: "confetti"
  },
  {
    trigger: "early_bird",
    message: "🐦 Early bird gets the worm! Morning challenges are your superpower!",
    animation: "sunrise"
  },
  {
    trigger: "night_owl",
    message: "🦉 Night owl energy! Late planning sessions show true dedication!",
    animation: "stars"
  },
  {
    trigger: "rainy_day",
    message: "🌧️ Rainy day commitment! Weather won't stop your determination!",
    animation: "rainbow"
  }
];

// Main personality engine class
export class PersonalityEngine {
  private personality: PersonalityTraits;
  private context: UserContext;
  
  constructor(personality: PersonalityTraits = DEFAULT_PERSONALITY) {
    this.personality = personality;
    this.context = getUserContext();
  }
  
  // Generate contextual message
  getMessage(
    category: MessageCategory, 
    context?: Partial<UserContext>,
    metadata?: Record<string, any>
  ): string {
    const currentContext = { ...this.context, ...context };
    
    switch (category) {
      case "welcome":
        return this.getWelcomeMessage(currentContext);
      case "encouragement":
        return this.getEncouragementMessage(currentContext);
      case "celebration":
        return this.getCelebrationMessage(metadata);
      case "guidance":
        return this.getGuidanceMessage(metadata?.area || "general");
      case "loading":
        return this.getRandomMessage(MESSAGE_TEMPLATES.loading);
      case "error":
        return this.getErrorMessage();
      case "success":
        return this.getSuccessMessage(metadata?.detailed);
      default:
        return "Let's make something great happen! ✨";
    }
  }
  
  private getWelcomeMessage(context: UserContext): string {
    const formality = this.personality.formality;
    const timeOfDay = context.timeOfDay;
    
    const messages = MESSAGE_TEMPLATES.welcome[formality]?.[timeOfDay] || 
                    MESSAGE_TEMPLATES.welcome.friendly[timeOfDay];
    
    return this.getRandomMessage(messages);
  }
  
  private getEncouragementMessage(context: UserContext): string {
    const streakLevel = 
      (context.streakDays || 0) < 3 ? "low_streak" :
      (context.streakDays || 0) < 10 ? "medium_streak" : "high_streak";
    
    return this.getRandomMessage(MESSAGE_TEMPLATES.encouragement[streakLevel]);
  }
  
  private getCelebrationMessage(metadata?: Record<string, any>): string {
    const type = metadata?.type || "milestone";
    return this.getRandomMessage(MESSAGE_TEMPLATES.celebration[type] || MESSAGE_TEMPLATES.celebration.milestone);
  }
  
  private getGuidanceMessage(area: string): string {
    const guidance = MESSAGE_TEMPLATES.guidance[area as keyof typeof MESSAGE_TEMPLATES.guidance];
    return this.getRandomMessage(guidance || MESSAGE_TEMPLATES.guidance.planning);
  }
  
  private getErrorMessage(): string {
    const style = this.personality.humor === "none" ? "gentle" : "encouraging";
    return this.getRandomMessage(MESSAGE_TEMPLATES.error[style]);
  }
  
  private getSuccessMessage(detailed?: boolean): string {
    const type = detailed ? "detailed" : "quick";
    return this.getRandomMessage(MESSAGE_TEMPLATES.success[type]);
  }
  
  private getRandomMessage(messages: string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // Check for surprise moments
  checkForSurprises(userJourney: UserJourney, currentAction?: string): string | null {
    const context = this.context;
    
    // Friday challenge creation
    if (currentAction === "challenge_created" && context.dayOfWeek === "weekday" && new Date().getDay() === 5) {
      return SURPRISE_MOMENTS.find(m => m.trigger === "challenge_created_friday")?.message || null;
    }
    
    // Early bird (before 7 AM)
    if (context.timeOfDay === "morning" && new Date().getHours() < 7) {
      return SURPRISE_MOMENTS.find(m => m.trigger === "early_bird")?.message || null;
    }
    
    // Night owl (after 10 PM)
    if (context.timeOfDay === "night" && new Date().getHours() > 22) {
      return SURPRISE_MOMENTS.find(m => m.trigger === "night_owl")?.message || null;
    }
    
    return null;
  }
  
  // Generate contextual toast notification
  generateToast(
    type: "success" | "info" | "warning" | "error",
    action?: string,
    metadata?: Record<string, any>
  ) {
    let message = "";
    let duration = 3000;
    
    switch (type) {
      case "success":
        message = this.getMessage("success", undefined, metadata);
        break;
      case "info":
        message = this.getMessage("guidance", undefined, metadata);
        duration = 4000;
        break;
      case "error":
        message = this.getMessage("error");
        duration = 5000;
        break;
      default:
        message = "Something happened! ✨";
    }
    
    return { message, duration, type };
  }
}

// Global personality engine instance
export const personalityEngine = new PersonalityEngine();

// Convenience functions for common use cases
export const getWelcomeMessage = () => personalityEngine.getMessage("welcome");
export const getEncouragementMessage = (streakDays?: number) => 
  personalityEngine.getMessage("encouragement", { streakDays });
export const getCelebrationMessage = (type: string) => 
  personalityEngine.getMessage("celebration", undefined, { type });
export const getLoadingMessage = () => personalityEngine.getMessage("loading");
export const getErrorMessage = () => personalityEngine.getMessage("error");
export const getSuccessMessage = (detailed = false) => 
  personalityEngine.getMessage("success", undefined, { detailed });