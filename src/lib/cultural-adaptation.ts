/**
 * Cultural Adaptation Engine - Personalized experiences based on cultural context
 * 
 * Adapts messaging, preferences, and suggestions based on user's cultural background,
 * time zone, language preferences, and behavioral patterns
 */

import { PersonalityTraits } from "./personality-engine";

// Cultural context detection
export interface CulturalContext {
  region: "NA" | "EU" | "APAC" | "LATAM" | "MENA" | "AF";
  country?: string;
  timezone: string;
  language: string;
  currency: string;
  measurementSystem: "metric" | "imperial";
  workingDays: number[]; // 0=Sunday, 1=Monday, etc.
  culturalValues: {
    individualismScore: number; // 0-100
    hierarchyScore: number; // 0-100
    uncertaintyAvoidance: number; // 0-100
    timeOrientation: "monochronic" | "polychronic";
  };
}

// User preference learning
export interface UserPreferences {
  communicationStyle: "direct" | "diplomatic" | "encouraging" | "casual";
  motivationTriggers: string[]; // "competition", "achievement", "social", "personal"
  preferredChallengeTypes: string[];
  activityTimes: string[]; // "morning", "afternoon", "evening"
  experienceLevel: "beginner" | "intermediate" | "advanced";
  personalityAdaptations: Partial<PersonalityTraits>;
  
  // Learned behaviors
  averageResponseTime: number;
  preferredSessionLength: number;
  dropOffPatterns: string[];
  successPatterns: string[];
}

// Cultural messaging templates
const CULTURAL_MESSAGES = {
  NA: {
    encouragement: [
      "You've got this! 💪 Time to crush those goals!",
      "Let's make it happen! 🚀 Your future self will thank you!",
      "Ready to level up? 📈 Every step counts!"
    ],
    celebration: [
      "Boom! 💥 That's what I'm talking about!",
      "Absolutely crushing it! 🔥 Keep this momentum going!",
      "You're on fire! 🌟 This is how champions are made!"
    ],
    guidance: [
      "Pro tip: Start small and build momentum! 💡",
      "Here's a game-changer: consistency beats perfection! ⚡",
      "Success hack: Make it so easy you can't say no! 🎯"
    ]
  },
  EU: {
    encouragement: [
      "Excellent progress! 👏 Your dedication is inspiring!",
      "Well done! 🌟 You're building something remarkable!",
      "Brilliant work! 💫 Each step brings you closer!"
    ],
    celebration: [
      "Outstanding achievement! 🏆 Your commitment has paid off!",
      "Magnificent! ✨ You've truly earned this success!",
      "Exceptional work! 🎉 This is the result of your dedication!"
    ],
    guidance: [
      "A thoughtful approach: balance ambition with sustainability 🌱",
      "Consider this: steady progress often outpaces rushed efforts 🎯",
      "Wisdom from experience: preparation is half the victory 📋"
    ]
  },
  APAC: {
    encouragement: [
      "Your perseverance is admirable! 🌸 Keep moving forward!",
      "Step by step, you're creating harmony! ⚖️ Well done!",
      "Your dedication honors your commitment! 🙏 Continue strongly!"
    ],
    celebration: [
      "Honorable achievement! 🏮 Your efforts have borne fruit!",
      "Excellent balance achieved! ⚡ Success through harmony!",
      "Worthy accomplishment! 🌟 Your persistence has succeeded!"
    ],
    guidance: [
      "Ancient wisdom: The journey of a thousand miles begins with one step 🛤️",
      "Balance brings success: neither too fast nor too slow ⚖️",
      "Respect the process: small, consistent actions create lasting change 🌱"
    ]
  },
  LATAM: {
    encouragement: [
      "¡Vamos! 🔥 Your energy is contagious!",
      "¡Qué increíble! 🌟 You're inspiring everyone around you!",
      "¡Sigue así! 💃 Your passion is your superpower!"
    ],
    celebration: [
      "¡Fantástico! 🎉 Time to celebrate this amazing victory!",
      "¡Increíble! 🏆 Your joy is infectious - share this moment!",
      "¡Perfecto! ✨ This calls for a celebration with friends!"
    ],
    guidance: [
      "Con amor: Share your journey - success is sweeter together! 💕",
      "Sabiduría: Let your passion guide you, but plan for success! 🎯",
      "Remember: Your community believes in you - lean on their support! 🤝"
    ]
  }
};

// Cultural preference defaults
const CULTURAL_DEFAULTS = {
  NA: {
    communicationStyle: "encouraging" as const,
    motivationTriggers: ["achievement", "competition", "personal"],
    timeOrientation: "monochronic" as const,
    preferredChallengeTypes: ["fitness", "productivity", "adventure"]
  },
  EU: {
    communicationStyle: "diplomatic" as const,
    motivationTriggers: ["achievement", "personal", "social"],
    timeOrientation: "monochronic" as const,
    preferredChallengeTypes: ["wellness", "learning", "sustainability"]
  },
  APAC: {
    communicationStyle: "diplomatic" as const,
    motivationTriggers: ["personal", "social", "harmony"],
    timeOrientation: "polychronic" as const,
    preferredChallengeTypes: ["mindfulness", "balance", "community"]
  },
  LATAM: {
    communicationStyle: "encouraging" as const,
    motivationTriggers: ["social", "celebration", "community"],
    timeOrientation: "polychronic" as const,
    preferredChallengeTypes: ["social", "adventure", "celebration"]
  }
};

// Detect user's cultural context
export function detectCulturalContext(): CulturalContext {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language || 'en-US';
  
  // Simple region detection based on timezone (in real app, use more sophisticated detection)
  let region: CulturalContext["region"] = "NA";
  if (timezone.includes("Europe")) region = "EU";
  else if (timezone.includes("Asia") || timezone.includes("Pacific")) region = "APAC";
  else if (timezone.includes("America")) {
    region = language.startsWith("es") || language.startsWith("pt") ? "LATAM" : "NA";
  }
  
  // Detect measurement system
  const measurementSystem = ["US", "LR", "MM"].includes(language.split("-")[1]) ? "imperial" : "metric";
  
  // Default working days (Monday-Friday for most cultures)
  const workingDays = [1, 2, 3, 4, 5];
  
  return {
    region,
    timezone,
    language,
    currency: getCurrencyForRegion(region),
    measurementSystem,
    workingDays,
    culturalValues: getCulturalValues(region)
  };
}

function getCurrencyForRegion(region: CulturalContext["region"]): string {
  switch (region) {
    case "EU": return "EUR";
    case "APAC": return "USD"; // Default, would detect specific countries
    case "LATAM": return "USD"; // Default, would detect specific countries
    default: return "USD";
  }
}

function getCulturalValues(region: CulturalContext["region"]) {
  // Simplified cultural dimensions (based on Hofstede's research)
  const values = {
    NA: { individualismScore: 85, hierarchyScore: 40, uncertaintyAvoidance: 45, timeOrientation: "monochronic" as const },
    EU: { individualismScore: 65, hierarchyScore: 35, uncertaintyAvoidance: 65, timeOrientation: "monochronic" as const },
    APAC: { individualismScore: 25, hierarchyScore: 75, uncertaintyAvoidance: 60, timeOrientation: "polychronic" as const },
    LATAM: { individualismScore: 45, hierarchyScore: 65, uncertaintyAvoidance: 75, timeOrientation: "polychronic" as const },
    MENA: { individualismScore: 35, hierarchyScore: 80, uncertaintyAvoidance: 70, timeOrientation: "polychronic" as const },
    AF: { individualismScore: 30, hierarchyScore: 70, uncertaintyAvoidance: 60, timeOrientation: "polychronic" as const }
  };
  
  return values[region] || values.NA;
}

// Cultural adaptation engine
export class CulturalAdaptationEngine {
  private culturalContext: CulturalContext;
  private userPreferences: UserPreferences;
  
  constructor(
    culturalContext?: CulturalContext,
    userPreferences?: Partial<UserPreferences>
  ) {
    this.culturalContext = culturalContext || detectCulturalContext();
    this.userPreferences = this.initializePreferences(userPreferences);
  }
  
  private initializePreferences(partial?: Partial<UserPreferences>): UserPreferences {
    const defaults = CULTURAL_DEFAULTS[this.culturalContext.region] || CULTURAL_DEFAULTS.NA;
    
    return {
      communicationStyle: defaults.communicationStyle,
      motivationTriggers: defaults.motivationTriggers,
      preferredChallengeTypes: defaults.preferredChallengeTypes,
      activityTimes: this.getDefaultActivityTimes(),
      experienceLevel: "beginner",
      personalityAdaptations: {},
      averageResponseTime: 5000,
      preferredSessionLength: 300000, // 5 minutes
      dropOffPatterns: [],
      successPatterns: [],
      ...partial
    };
  }
  
  private getDefaultActivityTimes(): string[] {
    // Cultural defaults for activity preferences
    switch (this.culturalContext.region) {
      case "EU": return ["morning", "afternoon"];
      case "APAC": return ["morning", "evening"];
      case "LATAM": return ["afternoon", "evening"];
      default: return ["morning", "evening"];
    }
  }
  
  // Get culturally adapted message
  getCulturalMessage(
    category: keyof typeof CULTURAL_MESSAGES.NA,
    fallback?: string
  ): string {
    const regionMessages = CULTURAL_MESSAGES[this.culturalContext.region];
    if (!regionMessages || !regionMessages[category]) {
      return fallback || CULTURAL_MESSAGES.NA[category]?.[0] || "Keep going! ✨";
    }
    
    const messages = regionMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // Adapt challenge recommendations based on culture
  adaptChallengeRecommendations(challenges: any[]): any[] {
    const culturalPrefs = CULTURAL_DEFAULTS[this.culturalContext.region];
    
    return challenges
      .map(challenge => ({
        ...challenge,
        culturalRelevance: this.calculateCulturalRelevance(challenge),
        adaptedDescription: this.adaptDescription(challenge.description),
        culturalTags: this.addCulturalTags(challenge)
      }))
      .sort((a, b) => b.culturalRelevance - a.culturalRelevance);
  }
  
  private calculateCulturalRelevance(challenge: any): number {
    let relevance = 0;
    
    // Category preference
    if (this.userPreferences.preferredChallengeTypes.includes(challenge.category)) {
      relevance += 30;
    }
    
    // Time orientation
    if (this.culturalContext.culturalValues.timeOrientation === "monochronic" && 
        challenge.tags?.includes("structured")) {
      relevance += 20;
    } else if (this.culturalContext.culturalValues.timeOrientation === "polychronic" && 
               challenge.tags?.includes("flexible")) {
      relevance += 20;
    }
    
    // Social vs individual
    if (this.culturalContext.culturalValues.individualismScore > 60 && 
        challenge.tags?.includes("personal")) {
      relevance += 15;
    } else if (this.culturalContext.culturalValues.individualismScore < 40 && 
               challenge.tags?.includes("social")) {
      relevance += 15;
    }
    
    return Math.min(relevance, 100);
  }
  
  private adaptDescription(description: string): string {
    // Add cultural context to descriptions
    const region = this.culturalContext.region;
    
    if (region === "APAC" && !description.includes("balance")) {
      return description + " Find harmony and balance in your journey.";
    } else if (region === "LATAM" && !description.includes("community")) {
      return description + " Share the joy with your community!";
    } else if (region === "EU" && !description.includes("sustainable")) {
      return description + " Build sustainable, long-term success.";
    }
    
    return description;
  }
  
  private addCulturalTags(challenge: any): string[] {
    const baseTags = challenge.tags || [];
    const culturalTags = [];
    
    const region = this.culturalContext.region;
    if (region === "APAC") culturalTags.push("mindful", "balanced");
    else if (region === "LATAM") culturalTags.push("energetic", "social");
    else if (region === "EU") culturalTags.push("thoughtful", "sustainable");
    else culturalTags.push("goal-oriented", "achievement");
    
    return [...baseTags, ...culturalTags];
  }
  
  // Learn from user behavior
  updatePreferences(behaviorData: {
    action: string;
    timestamp: number;
    duration?: number;
    success?: boolean;
    context?: Record<string, any>;
  }) {
    // Track response times
    if (behaviorData.duration) {
      this.userPreferences.averageResponseTime = 
        (this.userPreferences.averageResponseTime + behaviorData.duration) / 2;
    }
    
    // Learn from success patterns
    if (behaviorData.success) {
      this.userPreferences.successPatterns.push(behaviorData.action);
      
      // Adapt communication style based on what works
      if (behaviorData.context?.messageStyle) {
        // Gradually adapt to successful message styles
      }
    }
    
    // Track drop-off patterns
    if (behaviorData.action.includes("abandon") || behaviorData.action.includes("exit")) {
      this.userPreferences.dropOffPatterns.push(behaviorData.context?.page || "unknown");
    }
  }
  
  // Get adapted personality traits
  getAdaptedPersonality(): PersonalityTraits {
    const basePersonality: PersonalityTraits = {
      enthusiasm: "medium",
      formality: "friendly",
      humor: "light",
      encouragement: "moderate"
    };
    
    // Cultural adaptations
    if (this.culturalContext.region === "EU") {
      basePersonality.formality = "professional";
      basePersonality.humor = "light";
    } else if (this.culturalContext.region === "APAC") {
      basePersonality.formality = "professional";
      basePersonality.encouragement = "subtle";
    } else if (this.culturalContext.region === "LATAM") {
      basePersonality.enthusiasm = "high";
      basePersonality.formality = "casual";
    }
    
    // User preference overrides
    return { ...basePersonality, ...this.userPreferences.personalityAdaptations };
  }
  
  // Format numbers according to cultural preferences
  formatNumber(value: number, type: "distance" | "time" | "currency"): string {
    switch (type) {
      case "distance":
        if (this.culturalContext.measurementSystem === "imperial") {
          return `${(value * 0.621371).toFixed(1)} mi`;
        }
        return `${value.toFixed(1)} km`;
        
      case "time":
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        if (this.culturalContext.region === "EU") {
          return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutes`;
        }
        return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
      case "currency":
        return new Intl.NumberFormat(this.culturalContext.language, {
          style: 'currency',
          currency: this.culturalContext.currency
        }).format(value);
        
      default:
        return value.toString();
    }
  }
  
  // Get current context
  getContext(): { cultural: CulturalContext; preferences: UserPreferences } {
    return {
      cultural: this.culturalContext,
      preferences: this.userPreferences
    };
  }
}

// Global instance
export const culturalAdaptation = new CulturalAdaptationEngine();