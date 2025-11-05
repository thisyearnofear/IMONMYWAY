// Challenge Template System Definition
// Single source of truth for all challenge templates
// ENHANCEMENT FIRST: Extends existing commitment system
// DRY: Single definition system for all challenge templates

export interface ChallengeCondition {
  type: 'distance' | 'time' | 'mode' | 'proof' | 'behavior' | 'location' | 'speed';
  value: number | string | string[];
  unit?: string;
  description: string;
  verificationMethod: 'gps' | 'photo' | 'video' | 'manual' | 'blockchain' | 'ai';
  required: boolean;
}

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'adventure' | 'fitness' | 'social' | 'creative' | 'charity' | 'viral';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  estimatedTime: number; // in minutes
  estimatedDistance: number; // in kilometers
  stakeAmount: { min: number; max: number; suggested: number };
  conditions: ChallengeCondition[];
  proofRequirements: string[];
  rewards: {
    tokenReward?: number;
    achievement?: string;
    multiplier?: number;
  };
  socialImpact: boolean;
  viralFactor: number; // 1-10 scale
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedBy?: string;
  popularityScore?: number;
}

// ENHANCEMENT FIRST: Extends existing commitment interface
export interface ChallengeCommitment extends ChallengeTemplate {
  commitmentId: string;
  userId: string;
  startTime: Date;
  deadline: Date;
  currentProgress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'verified';
  actualCompletionTime?: Date;
  proofSubmissions?: ProofSubmission[];
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  totalBetsFor?: number;
  totalBetsAgainst?: number;
  finalOutcome?: 'success' | 'failure';
}

export interface ProofSubmission {
  id: string;
  type: 'photo' | 'video' | 'gps' | 'document' | 'ai-verified';
  data: string | object; // URL, GPS coordinates, AI verification data
  timestamp: Date;
  verified: boolean;
  verifier?: string; // User ID or AI system ID
  verificationNotes?: string;
}

// CULTURAL TIME INTELLIGENCE: Universal, localized challenges
// Based on Hofstede cultural dimensions and running speed intelligence
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // Buenos Aires DevConnect Challenges
  {
    id: 'ba-train-hop',
    name: 'Buenos Aires Train-Hop',
    description: 'Get off at Retiro station, run to Once station, catch the same train within 4 minutes',
    category: 'adventure',
    difficulty: 'medium',
    estimatedTime: 5,
    estimatedDistance: 1.2,
    stakeAmount: { min: 2, max: 20, suggested: 5 },
    conditions: [
      {
        type: 'mode',
        value: 'running',
        description: 'Must run between stations',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'time',
        value: 4,
        unit: 'minutes',
        description: 'Back on train within 4 minutes',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'location',
        value: ['Retiro', 'Once'],
        description: 'Must visit both stations',
        verificationMethod: 'gps',
        required: true
      }
    ],
    proofRequirements: [
      'GPS track between stations',
      'Train schedule verification',
      'Timestamped location proof'
    ],
    rewards: {
      achievement: 'BA Express',
      multiplier: 1.5
    },
    socialImpact: false,
    viralFactor: 7,
    tags: ['ba', 'train', 'running', 'local', 'devconnect'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 85
  },

  // Beat Google Maps Challenges
  {
    id: 'beat-google-easy',
    name: 'Beat Google Maps (Easy)',
    description: 'Run any route 1.5x faster than Google Maps walking estimate',
    category: 'fitness',
    difficulty: 'easy',
    estimatedTime: 15,
    estimatedDistance: 1,
    stakeAmount: { min: 1, max: 10, suggested: 3 },
    conditions: [
      {
        type: 'speed',
        value: 1.5,
        unit: 'multiplier',
        description: 'Run 1.5x faster than walking estimate',
        verificationMethod: 'gps',
        required: true
      }
    ],
    proofRequirements: [
      'GPS speed tracking',
      'Google Maps baseline comparison'
    ],
    rewards: {
      achievement: 'Speed Walker',
      multiplier: 1.2
    },
    socialImpact: false,
    viralFactor: 5,
    tags: ['running', 'speed', 'google-maps', 'universal'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 78
  },

  {
    id: 'beat-google-extreme',
    name: 'Beat Google Maps (Extreme)',
    description: 'Run any route 3x faster than Google Maps walking estimate',
    category: 'fitness',
    difficulty: 'extreme',
    estimatedTime: 10,
    estimatedDistance: 2,
    stakeAmount: { min: 5, max: 50, suggested: 15 },
    conditions: [
      {
        type: 'speed',
        value: 3.0,
        unit: 'multiplier',
        description: 'Run 3x faster than walking estimate',
        verificationMethod: 'gps',
        required: true
      }
    ],
    proofRequirements: [
      'GPS speed tracking',
      'Google Maps baseline comparison',
      'Video proof of running'
    ],
    rewards: {
      achievement: 'Speed Demon',
      multiplier: 3.0
    },
    socialImpact: false,
    viralFactor: 8,
    tags: ['running', 'speed', 'google-maps', 'extreme'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 92
  },

  // Cultural Time Challenges
  {
    id: 'cultural-adaptation',
    name: 'Cultural Time Adaptation',
    description: 'Arrive according to local cultural expectations for punctuality',
    category: 'social',
    difficulty: 'medium',
    estimatedTime: 30,
    estimatedDistance: 2,
    stakeAmount: { min: 3, max: 25, suggested: 8 },
    conditions: [
      {
        type: 'behavior',
        value: 'cultural_timing',
        description: 'Arrive within cultural expectations',
        verificationMethod: 'ai',
        required: true
      }
    ],
    proofRequirements: [
      'Cultural profile verification',
      'Arrival time tracking',
      'Peer review validation'
    ],
    rewards: {
      achievement: 'Cultural Ambassador',
      multiplier: 2.0
    },
    socialImpact: true,
    viralFactor: 6,
    tags: ['cultural', 'social', 'adaptation', 'universal'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 73
  },

  // Airport Terminal Challenges
  {
    id: 'airport-terminal-sprint',
    name: 'Airport Terminal Sprint',
    description: 'Navigate between terminals faster than shuttle service',
    category: 'adventure',
    difficulty: 'hard',
    estimatedTime: 12,
    estimatedDistance: 1.5,
    stakeAmount: { min: 5, max: 30, suggested: 12 },
    conditions: [
      {
        type: 'location',
        value: 'airport',
        description: 'Must be at major international airport',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'speed',
        value: 'shuttle_time',
        description: 'Faster than airport shuttle',
        verificationMethod: 'gps',
        required: true
      }
    ],
    proofRequirements: [
      'Airport location verification',
      'Terminal-to-terminal GPS track',
      'Shuttle schedule comparison'
    ],
    rewards: {
      achievement: 'Terminal Runner',
      multiplier: 2.2
    },
    socialImpact: false,
    viralFactor: 7,
    tags: ['airport', 'terminal', 'travel', 'universal'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 81
  },

  // Daily Micro-Challenges
  {
    id: 'morning-routine-master',
    name: 'Morning Routine Master',
    description: 'Complete full morning routine within your cultural time expectations',
    category: 'social',
    difficulty: 'easy',
    estimatedTime: 20,
    estimatedDistance: 0,
    stakeAmount: { min: 1, max: 8, suggested: 3 },
    conditions: [
      {
        type: 'time',
        value: 20,
        unit: 'minutes',
        description: 'Complete routine in under 20 minutes',
        verificationMethod: 'manual',
        required: true
      }
    ],
    proofRequirements: [
      'Start and end timestamps',
      'Routine completion checklist'
    ],
    rewards: {
      achievement: 'Morning Pro',
      multiplier: 1.2
    },
    socialImpact: false,
    viralFactor: 3,
    tags: ['daily', 'routine', 'universal', 'micro'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 65
  },

  {
    id: 'commute-optimizer',
    name: 'Commute Optimizer',
    description: 'Beat your usual commute time using any combination of transport',
    category: 'social',
    difficulty: 'medium',
    estimatedTime: 25,
    estimatedDistance: 3,
    stakeAmount: { min: 2, max: 15, suggested: 6 },
    conditions: [
      {
        type: 'time',
        value: 'personal_best',
        description: 'Faster than your average commute',
        verificationMethod: 'gps',
        required: true
      }
    ],
    proofRequirements: [
      'Historical commute data',
      'GPS tracking of route',
      'Transport mode verification'
    ],
    rewards: {
      achievement: 'Commute Master',
      multiplier: 1.5
    },
    socialImpact: true,
    viralFactor: 4,
    tags: ['commute', 'optimization', 'universal', 'daily'],
    isActive: true,
    createdAt: new Date(),
    popularityScore: 70
  }
];

// AGGRESSIVE CONSOLIDATION: Single source of truth for challenge creation
export function createChallengeFromTemplate(
  templateId: string,
  userId: string,
  locations: {
    start: { latitude: number; longitude: number };
    target: { latitude: number; longitude: number };
  },
  customSettings?: Partial<ChallengeTemplate>
) {
  const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const now = new Date();
  const deadline = new Date(now.getTime() + (template.estimatedTime * 60000));

  const finalTemplate = { ...template, ...customSettings };

  // Returns an object matching the dbService.createCommitment parameter type
  return {
    userId,
    commitmentId: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    stakeAmount: finalTemplate.stakeAmount.suggested.toString(),
    deadline,
    startLatitude: locations.start.latitude,
    startLongitude: locations.start.longitude,
    targetLatitude: locations.target.latitude,
    targetLongitude: locations.target.longitude,
    estimatedDistance: finalTemplate.estimatedDistance, // km
    estimatedPace: 8, // Default pace for templates
  };
}

// MODULAR: Reusable challenge utilities
export function getChallengeByCategory(category: string): ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES.filter(t => t.category === category);
}

export function getPopularChallenges(limit: number = 5): ChallengeTemplate[] {
  return [...CHALLENGE_TEMPLATES]
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
    .slice(0, limit);
}

export function searchChallenges(query: string): ChallengeTemplate[] {
  const term = query.toLowerCase();
  return CHALLENGE_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(term) ||
    template.description.toLowerCase().includes(term) ||
    template.tags.some(tag => tag.toLowerCase().includes(term))
  );
}

// ORGANIZED: Domain-driven challenge management
export const challengeService = {
  getTemplates: () => CHALLENGE_TEMPLATES,
  getTemplate: (id: string) => CHALLENGE_TEMPLATES.find(t => t.id === id),
  createChallenge: createChallengeFromTemplate,
  getByCategory: getChallengeByCategory,
  getPopular: getPopularChallenges,
  search: searchChallenges
};