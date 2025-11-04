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

// PREVENT BLOAT: Consolidated challenge templates to reduce redundancy
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'london-to-france-eco',
    name: 'London to France Eco Challenge',
    description: 'Get from London to France with specific eco-friendly conditions',
    category: 'adventure',
    difficulty: 'hard',
    estimatedTime: 720, // 12 hours
    estimatedDistance: 500,
    stakeAmount: { min: 10, max: 100, suggested: 30 },
    conditions: [
      {
        type: 'mode',
        value: 30,
        unit: 'percentage',
        description: '30% of journey must be by bicycle',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'mode',
        value: 20,
        unit: 'percentage',
        description: '20% of journey must be on foot',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'time',
        value: 720,
        unit: 'minutes',
        description: 'Complete within 12 hours',
        verificationMethod: 'blockchain',
        required: true
      }
    ],
    proofRequirements: [
      'GPS tracking showing bicycle and walking segments',
      'Photos at major checkpoints',
      'Final destination verification'
    ],
    rewards: {
      achievement: 'Eco Adventurer',
      multiplier: 2.5
    },
    socialImpact: true,
    viralFactor: 8,
    tags: ['adventure', 'eco', 'bicycle', 'multi-modal', 'europe'],
    isActive: true,
    createdAt: new Date('2025-01-15'),
    popularityScore: 95
  },

  {
    id: 'lands-end-to-john-ogroats-backwards',
    name: 'Lands End to John O\'Groats Backwards',
    description: 'Walk the entire length of Great Britain... backwards!',
    category: 'fitness',
    difficulty: 'extreme',
    estimatedTime: 10080, // 7 days
    estimatedDistance: 874,
    stakeAmount: { min: 50, max: 500, suggested: 200 },
    conditions: [
      {
        type: 'behavior',
        value: 'walking backwards',
        description: 'At least 50% of walking segments must be done backwards',
        verificationMethod: 'video',
        required: true
      },
      {
        type: 'distance',
        value: 874,
        unit: 'kilometers',
        description: 'Complete the full route',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'location',
        value: ['Penzance', 'Bath', 'Birmingham', 'Edinburgh', 'John O\'Groats'],
        description: 'Must pass through all checkpoint locations',
        verificationMethod: 'photo',
        required: true
      }
    ],
    proofRequirements: [
      'Video evidence of walking backwards',
      'GPS tracking of the route',
      'Photo verification at checkpoints',
      'Daily progress updates'
    ],
    rewards: {
      achievement: 'Backwards Brit',
      tokenReward: 500
    },
    socialImpact: false,
    viralFactor: 9,
    tags: ['fitness', 'britain', 'walking', 'creative', 'extreme'],
    isActive: true,
    createdAt: new Date('2025-01-10'),
    popularityScore: 88
  },

  {
    id: 'zero-carbon-commute',
    name: 'Zero Carbon Commute Challenge',
    description: 'Get to work with zero carbon emissions for a week',
    category: 'social',
    difficulty: 'medium',
    estimatedTime: 420, // 7 hours cumulative
    estimatedDistance: 70, // 10km per day x 7 days
    stakeAmount: { min: 5, max: 50, suggested: 15 },
    conditions: [
      {
        type: 'mode',
        value: ['bicycle', 'foot', 'public transport'],
        description: 'No private motor vehicle usage',
        verificationMethod: 'ai',
        required: true
      },
      {
        type: 'time',
        value: 7,
        unit: 'days',
        description: 'Complete challenge for 7 consecutive days',
        verificationMethod: 'blockchain',
        required: true
      },
      {
        type: 'behavior',
        value: 'no shortcuts',
        description: 'Must take the longest viable route',
        verificationMethod: 'gps',
        required: false
      }
    ],
    proofRequirements: [
      'Daily GPS tracking',
      'Transport mode verification',
      'Streak continuity proof'
    ],
    rewards: {
      achievement: 'Carbon Zero',
      multiplier: 2.0
    },
    socialImpact: true,
    viralFactor: 6,
    tags: ['social', 'eco', 'commute', 'sustainability'],
    isActive: true,
    createdAt: new Date('2025-01-05'),
    popularityScore: 75
  },

  {
    id: 'speed-of-sound',
    name: 'Speed of Sound Challenge',
    description: 'Travel 100 meters in under 1 minute (or as close as possible)',
    category: 'creative',
    difficulty: 'medium',
    estimatedTime: 1,
    estimatedDistance: 0.1,
    stakeAmount: { min: 2, max: 20, suggested: 5 },
    conditions: [
      {
        type: 'speed',
        value: 1.667, // km/h equivalent of 100m in 1 minute
        unit: 'km/h',
        description: 'Average speed must exceed 6 km/h (100m per minute)',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'distance',
        value: 0.1,
        unit: 'kilometers',
        description: 'Distance must be exactly 100 meters',
        verificationMethod: 'gps',
        required: true
      },
      {
        type: 'time',
        value: 60,
        unit: 'seconds',
        description: 'Must complete within 1 minute',
        verificationMethod: 'blockchain',
        required: true
      }
    ],
    proofRequirements: [
      'High-precision GPS tracking',
      'Start and end time verification',
      'Speed tracking throughout'
    ],
    rewards: {
      achievement: 'Lightning Fast',
      multiplier: 3.0
    },
    socialImpact: false,
    viralFactor: 7,
    tags: ['creative', 'speed', 'running', 'fitness'],
    isActive: true,
    createdAt: new Date('2025-01-20'),
    popularityScore: 82
  },

  {
    id: 'around-the-world-in-80-places',
    name: 'Around the World in 80 Places',
    description: 'Visit 80 significant locations around the world in 80 days',
    category: 'adventure',
    difficulty: 'extreme',
    estimatedTime: 115200, // 80 days
    estimatedDistance: 40000,
    stakeAmount: { min: 100, max: 1000, suggested: 400 },
    conditions: [
      {
        type: 'location',
        value: 80,
        unit: 'locations',
        description: 'Must visit exactly 80 designated locations',
        verificationMethod: 'photo',
        required: true
      },
      {
        type: 'time',
        value: 80,
        unit: 'days',
        description: 'Complete within 80 days',
        verificationMethod: 'blockchain',
        required: true
      },
      {
        type: 'proof',
        value: ['photo', 'gps'],
        description: 'Photo and GPS proof required for each location',
        verificationMethod: 'manual',
        required: true
      }
    ],
    proofRequirements: [
      'Photo evidence at each location',
      'GPS verification',
      'Time stamps for each visit',
      'Geographic spread validation'
    ],
    rewards: {
      achievement: 'Global Explorer',
      tokenReward: 1000
    },
    socialImpact: true,
    viralFactor: 10,
    tags: ['adventure', 'world', 'travel', 'achievement'],
    isActive: true,
    createdAt: new Date('2025-01-25'),
    popularityScore: 92
  }
];

// AGGRESSIVE CONSOLIDATION: Single source of truth for challenge creation
export function createChallengeFromTemplate(
  templateId: string,
  userId: string,
  customSettings?: Partial<ChallengeTemplate>
): ChallengeCommitment | null {
  const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const now = new Date();
  const deadline = new Date(now.getTime() + (template.estimatedTime * 60000)); // Convert minutes to milliseconds

  return {
    ...template,
    ...customSettings,
    commitmentId: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    startTime: now,
    deadline,
    currentProgress: 0,
    status: 'pending',
    proofSubmissions: [],
    verificationStatus: 'pending',
    totalBetsFor: 0,
    totalBetsAgainst: 0
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