// AI-Powered Challenge Generation System
// Single source of truth for dynamic challenge generation
// ENHANCEMENT FIRST: Extends existing template system with AI capabilities
// DRY: Consolidates AI challenge generation logic

import { ChallengeTemplate, ChallengeCondition, ChallengeCommitment } from "./challenge-templates";
import { getAIServiceHealth, aiService } from "./ai-service";

export interface AIChallengePreferences {
  interests: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  timeAvailable: number; // minutes
  preferredConditions: string[];
  location: {
    start: [number, number];
    end: [number, number];
    radius: number; // km
  };
  socialPreference: 'solo' | 'friends' | 'public' | 'competitive';
  viralPreference: 'low' | 'medium' | 'high';
}

export interface AIGeneratedChallenge extends ChallengeTemplate {
  aiGenerationMetadata: {
    confidence: number;
    generationMethod: string;
    userPreferencesMatch: number;
    noveltyScore: number;
  };
  multiplayerOptions?: MultiplayerChallengeOptions;
}

export interface MultiplayerChallengeOptions {
  type: 'cooperative' | 'competitive' | 'hybrid';
  maxParticipants: number;
  teamOptions?: {
    maxTeamSize: number;
    minTeamSize: number;
  };
  bettingMechanics: {
    peerBetting: boolean;
    poolBased: boolean;
    stakeMatching: boolean;
  };
  socialFeatures: {
    progressSharing: boolean;
    teamCommunication: boolean;
    collaborativeProof: boolean;
  };
}

// ENHANCEMENT FIRST: Extends existing verification with multiplayer logic
export interface MultiplayerChallenge extends ChallengeCommitment {
  participants: string[]; // User IDs
  teams?: {
    id: string;
    name: string;
    members: string[];
    progress: number;
  }[];
  multiplayerOptions: MultiplayerChallengeOptions;
  leaderboards?: {
    userId: string;
    progress: number;
    time: number;
    completion: boolean;
  }[];
}

export class AIChallengeGenerator {
  static async generateChallengeFromPreferences(
    userId: string,
    preferences: AIChallengePreferences
  ): Promise<AIGeneratedChallenge | null> {
    try {
      // Check if AI service is available
      const health = await getAIServiceHealth();
      if (!health.featuresEnabled) {
        // Fallback to template selection
        return this.selectTemplateBasedOnPreferences(preferences);
      }

      // Generate challenge using AI (simplified implementation)
      const challengeData = {
        name: `AI Generated ${preferences.interests[0] || 'Adventure'} Challenge`,
        description: `A personalized challenge based on your preferences`,
        estimatedDistance: this.estimateDistance(preferences),
        minStake: 5,
        maxStake: 50,
        suggestedStake: this.estimateStake(preferences),
        conditions: this.generateConditions(preferences),
        proofRequirements: this.generateProofRequirements(preferences),
        rewards: this.generateRewards(preferences),
        confidence: 0.8,
        noveltyScore: 0.7
      };

      // Apply multiplayer options based on social preference
      const multiplayerOptions = this.determineMultiplayerOptions(preferences);

      // Calculate viral factor based on preferences
      const viralFactor = this.calculateViralFactor(preferences);

      const aiChallenge: AIGeneratedChallenge = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: challengeData.name,
        description: challengeData.description,
        category: this.determineCategory(preferences),
        difficulty: this.estimateDifficulty(preferences),
        estimatedTime: preferences.timeAvailable,
        estimatedDistance: challengeData.estimatedDistance || this.estimateDistance(preferences),
        stakeAmount: {
          min: challengeData.minStake || 1,
          max: challengeData.maxStake || 100,
          suggested: challengeData.suggestedStake || this.estimateStake(preferences)
        },
        conditions: challengeData.conditions || this.generateConditions(preferences),
        proofRequirements: challengeData.proofRequirements || this.generateProofRequirements(preferences),
        rewards: challengeData.rewards || this.generateRewards(preferences),
        socialImpact: preferences.socialPreference !== 'solo',
        viralFactor: viralFactor,
        tags: [...preferences.interests, preferences.fitnessLevel],
        isActive: true,
        createdAt: new Date(),
        popularityScore: 0,

        // AI-specific metadata
        aiGenerationMetadata: {
          confidence: challengeData.confidence || 0.8,
          generationMethod: 'preference_matching',
          userPreferencesMatch: this.calculatePreferenceMatch(preferences, challengeData),
          noveltyScore: challengeData.noveltyScore || 0.7
        },

        // Multiplayer options
        multiplayerOptions
      };

      return aiChallenge;
    } catch (error) {
      console.error('AI Challenge generation error:', error);
      // Fallback to template selection
      return this.selectTemplateBasedOnPreferences(preferences);
    }
  }

  static async generateMultiplayerChallenge(
    userId: string,
    preferences: AIChallengePreferences,
    participantIds: string[],
    inviteCode?: string
  ): Promise<MultiplayerChallenge | null> {
    try {
      // Generate base challenge
      const baseChallenge = await this.generateChallengeFromPreferences(userId, preferences);
      if (!baseChallenge) return null;

      // Create multiplayer version
      const multiplayerChallenge: MultiplayerChallenge = {
        ...baseChallenge,
        commitmentId: `multi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        participants: [userId, ...participantIds],
        startTime: new Date(),
        deadline: new Date(Date.now() + (baseChallenge.estimatedTime * 60000)),
        currentProgress: 0,
        status: 'pending',
        proofSubmissions: [],
        verificationStatus: 'pending',
        totalBetsFor: 0,
        totalBetsAgainst: 0,

        // Multiplayer specific
        multiplayerOptions: baseChallenge.multiplayerOptions!,
        leaderboards: participantIds.map(id => ({
          userId: id,
          progress: 0,
          time: 0,
          completion: false
        }))
      };

      return multiplayerChallenge;
    } catch (error) {
      console.error('Multiplayer challenge generation error:', error);
      return null;
    }
  }

  private static selectTemplateBasedOnPreferences(preferences: AIChallengePreferences): AIGeneratedChallenge | null {
    // Filter templates based on preferences
    const filteredTemplates = this.filterTemplatesByPreferences(preferences);

    if (filteredTemplates.length === 0) {
      return null;
    }

    // Select most appropriate template
    const selectedTemplate = filteredTemplates[0]; // Could be more sophisticated

    // Generate multiplayer options
    const multiplayerOptions = this.determineMultiplayerOptions(preferences);

    return {
      ...selectedTemplate,
      id: `template-${selectedTemplate.id}-ai-${Date.now()}`,
      aiGenerationMetadata: {
        confidence: 0.7,
        generationMethod: 'template_matching',
        userPreferencesMatch: 0.8,
        noveltyScore: 0.5
      },
      multiplayerOptions
    };
  }

  private static filterTemplatesByPreferences(preferences: AIChallengePreferences): ChallengeTemplate[] {
    // This would filter the existing templates based on user preferences
    // For now, returning all templates
    // In a real implementation, this would be more sophisticated
    const { CHALLENGE_TEMPLATES } = require('./challenge-templates');
    return CHALLENGE_TEMPLATES.filter((template: any) => {
      // Filter by interests
      const interestsMatch = preferences.interests.some(interest =>
        template.tags.includes(interest) || template.name.toLowerCase().includes(interest) || template.description.toLowerCase().includes(interest)
      );

      // Filter by difficulty
      const difficultyMatch = this.isDifficultyCompatible(template.difficulty, preferences.fitnessLevel);

      // Filter by time
      const timeMatch = template.estimatedTime <= preferences.timeAvailable;

      return interestsMatch && difficultyMatch && timeMatch;
    });
  }

  private static isDifficultyCompatible(templateDifficulty: string, userFitness: string): boolean {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3,
      'extreme': 4
    };

    const templateLevel = difficultyMap[templateDifficulty] || 0;
    const userLevel = difficultyMap[userFitness] || 2;

    // Allow some flexibility (user can handle 1 level above or below)
    return Math.abs(templateLevel - userLevel) <= 1;
  }

  private static determineMultiplayerOptions(preferences: AIChallengePreferences): MultiplayerChallengeOptions {
    const type = preferences.socialPreference === 'competitive' ? 'competitive' :
      preferences.socialPreference === 'friends' ? 'cooperative' : 'hybrid';

    const maxParticipants = preferences.socialPreference === 'public' ? 100 :
      preferences.socialPreference === 'competitive' ? 10 : 5;

    return {
      type,
      maxParticipants,
      bettingMechanics: {
        peerBetting: true,
        poolBased: preferences.socialPreference === 'public',
        stakeMatching: true
      },
      socialFeatures: {
        progressSharing: true,
        teamCommunication: preferences.socialPreference === 'friends',
        collaborativeProof: preferences.socialPreference === 'friends'
      }
    };
  }

  private static calculateViralFactor(preferences: AIChallengePreferences): number {
    let viralScore = 5; // Base score

    // Increase for creative/unique challenges
    if (preferences.interests.some(i => ['creative', 'unique', 'fun', 'entertaining'].includes(i))) {
      viralScore += 2;
    }

    // Increase for social challenges
    if (preferences.socialPreference !== 'solo') {
      viralScore += 1;
    }

    // Increase for outdoor/location-based challenges
    if (preferences.viralPreference === 'high') {
      viralScore += 2;
    }

    return Math.min(10, Math.max(1, viralScore));
  }

  private static determineCategory(preferences: AIChallengePreferences): 'adventure' | 'fitness' | 'social' | 'creative' | 'charity' | 'viral' {
    if (preferences.interests.includes('adventure')) return 'adventure';
    if (preferences.interests.includes('fitness') || preferences.interests.includes('exercise')) return 'fitness';
    if (preferences.interests.includes('social')) return 'social';
    if (preferences.interests.includes('creative') || preferences.interests.includes('fun')) return 'creative';
    if (preferences.interests.includes('charity')) return 'charity';
    if (preferences.viralPreference === 'high') return 'viral';
    return 'adventure';
  }

  private static estimateDifficulty(preferences: AIChallengePreferences): 'easy' | 'medium' | 'hard' | 'extreme' {
    if (preferences.fitnessLevel === 'beginner') return 'easy';
    if (preferences.fitnessLevel === 'intermediate') return 'medium';
    return 'hard';
  }

  private static estimateDistance(preferences: AIChallengePreferences): number {
    // Base distance on time available and fitness level
    const timeHours = preferences.timeAvailable / 60;
    let baseSpeed = 5; // km/h

    if (preferences.fitnessLevel === 'beginner') baseSpeed = 3;
    else if (preferences.fitnessLevel === 'intermediate') baseSpeed = 4;
    else if (preferences.fitnessLevel === 'advanced') baseSpeed = 6;

    return timeHours * baseSpeed;
  }

  private static estimateStake(preferences: AIChallengePreferences): number {
    // Base stake on difficulty, time, and social preference
    let baseStake = 5;

    if (preferences.fitnessLevel === 'advanced') baseStake *= 1.5;
    if (preferences.timeAvailable > 120) baseStake *= 1.3; // 2+ hours
    if (preferences.socialPreference !== 'solo') baseStake *= 1.2; // Social challenges

    return Math.round(baseStake * 100) / 100;
  }

  private static generateConditions(preferences: AIChallengePreferences): ChallengeCondition[] {
    const conditions: ChallengeCondition[] = [
      {
        type: 'time',
        value: preferences.timeAvailable,
        unit: 'minutes',
        description: `Complete within ${preferences.timeAvailable} minutes`,
        verificationMethod: 'blockchain',
        required: true
      }
    ];

    // Add location-based condition if location is provided
    if (preferences.location) {
      conditions.push({
        type: 'distance',
        value: this.estimateDistance(preferences),
        unit: 'kilometers',
        description: `Travel approximately ${this.estimateDistance(preferences).toFixed(1)} km`,
        verificationMethod: 'gps',
        required: true
      });
    }

    // Add social condition if applicable
    if (preferences.socialPreference === 'friends') {
      conditions.push({
        type: 'behavior',
        value: 'team coordination',
        description: 'Coordinate with team members',
        verificationMethod: 'manual',
        required: false
      });
    }

    return conditions;
  }

  private static generateProofRequirements(preferences: AIChallengePreferences): string[] {
    const requirements: string[] = [
      'GPS tracking throughout the journey',
      'Periodic check-in photos/videos'
    ];

    if (preferences.socialPreference !== 'solo') {
      requirements.push('Team collaboration proof');
    }

    return requirements;
  }

  private static generateRewards(preferences: AIChallengePreferences): { tokenReward?: number; achievement?: string; multiplier?: number } {
    return {
      multiplier: preferences.socialPreference !== 'solo' ? 1.5 : 1.2,
      achievement: preferences.socialPreference !== 'solo' ? 'Team Player' : 'Solo Adventurer'
    };
  }

  private static calculatePreferenceMatch(preferences: AIChallengePreferences, challengeData: any): number {
    // Simplified matching algorithm
    return 0.8;
  }
}

// AGGRESSIVE CONSOLIDATION: Single service for AI challenges
export const aiChallengeService = {
  generateChallenge: AIChallengeGenerator.generateChallengeFromPreferences,
  generateMultiplayerChallenge: AIChallengeGenerator.generateMultiplayerChallenge
};

// DRY: Reusable interface for challenge customization
export interface ChallengeCustomizer {
  adjustDifficulty: (challenge: ChallengeTemplate, targetDifficulty: 'easy' | 'medium' | 'hard' | 'extreme') => ChallengeTemplate;
  modifyConditions: (challenge: ChallengeTemplate, newConditions: Partial<ChallengeCondition>[]) => ChallengeTemplate;
  scaleStakes: (challenge: ChallengeTemplate, multiplier: number) => ChallengeTemplate;
  addMultiplayerFeatures: (challenge: ChallengeTemplate, options: MultiplayerChallengeOptions) => AIGeneratedChallenge;
}

// ORGANIZED: Domain-driven challenge customization
export const challengeCustomizer: ChallengeCustomizer = {
  adjustDifficulty: (challenge, targetDifficulty) => {
    // Adjust time, distance, and conditions based on difficulty
    const adjustment = targetDifficulty === 'easy' ? 0.7 :
      targetDifficulty === 'medium' ? 1.0 :
        targetDifficulty === 'hard' ? 1.3 : 1.6;

    return {
      ...challenge,
      estimatedTime: Math.round(challenge.estimatedTime * adjustment),
      estimatedDistance: challenge.estimatedDistance * adjustment,
      conditions: challenge.conditions.map(condition => ({
        ...condition,
        value: typeof condition.value === 'number' ? condition.value * adjustment : condition.value
      }))
    };
  },

  modifyConditions: (challenge, newConditions) => {
    return {
      ...challenge,
      conditions: challenge.conditions.map(condition => {
        const updatedCondition = newConditions.find(nc => nc.type === condition.type);
        return updatedCondition ? { ...condition, ...updatedCondition } : condition;
      })
    };
  },

  scaleStakes: (challenge, multiplier) => {
    return {
      ...challenge,
      stakeAmount: {
        ...challenge.stakeAmount,
        suggested: Math.round(challenge.stakeAmount.suggested * multiplier * 100) / 100,
        min: Math.round(challenge.stakeAmount.min * multiplier * 100) / 100,
        max: Math.round(challenge.stakeAmount.max * multiplier * 100) / 100
      }
    };
  },

  addMultiplayerFeatures: (challenge, options) => {
    return {
      ...challenge,
      multiplayerOptions: options,
      aiGenerationMetadata: {
        confidence: 0.9,
        generationMethod: 'multiplayer_extension',
        userPreferencesMatch: 1.0,
        noveltyScore: 0.8
      }
    };
  }
};