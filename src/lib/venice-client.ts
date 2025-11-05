/**
 * Venice AI Client
 *
 * OpenAI-compatible client for Venice AI API integration
 * Provides inference capabilities powered by Venice models
 * Paid via Somnia testnet integration
 */

import { OpenAI } from 'openai';
import { aiConfig } from '@/config/ai-config';

// ============================================================================
// VENICE CLIENT CONFIGURATION
// ============================================================================

const VENICE_API_KEY = process.env.NEXT_PUBLIC_VENICE_API_KEY;

if (!VENICE_API_KEY) {
  console.warn('⚠️ VENICE_API_KEY not found. Venice AI features will use fallback algorithms.');
}

// ============================================================================
// VENICE CLIENT CLASS
// ============================================================================

export class VeniceClient {
  private client: OpenAI | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!VENICE_API_KEY) {
      console.log('⏭️ Skipping Venice client initialization - no API key');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: VENICE_API_KEY,
        baseURL: aiConfig.venice.baseUrl,
        dangerouslyAllowBrowser: true, // Required for client-side usage
      });

      this.initialized = true;
      console.log('🤖 Venice AI client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Venice client:', error);
    }
  }

  /**
   * Check if Venice client is available
   */
  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Make a chat completion request to Venice
   */
  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      enableWebSearch?: boolean;
      stream?: boolean;
    } = {}
  ): Promise<string | null> {
    if (!this.isAvailable()) {
      console.log('⏭️ Venice client not available, skipping inference');
      return null;
    }

    try {
      const {
        model = aiConfig.venice.defaultModel,
        temperature = aiConfig.venice.parameters.temperature,
        maxTokens = aiConfig.venice.parameters.maxTokens,
        enableWebSearch = false,
        stream = false
      } = options;

      const completion = await this.client!.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
        extra_body: enableWebSearch ? {
          venice_parameters: {
            enable_web_search: 'auto',
            include_venice_system_prompt: aiConfig.venice.parameters.includeVeniceSystemPrompt
          }
        } : undefined
      });

      if (stream) {
        // Handle streaming response
        let fullContent = '';
        for await (const chunk of completion as any) {
          if (chunk.choices && chunk.choices[0]?.delta?.content) {
            fullContent += chunk.choices[0].delta.content;
          }
        }
        return fullContent;
      } else {
        // Handle regular response
        return (completion as any).choices[0]?.message?.content || null;
      }
    } catch (error) {
      console.error('❌ Venice API error:', error);
      return null;
    }
  }

  /**
   * Generate personalized pace recommendation using Venice AI
   */
  async generatePaceRecommendation(
    userHistory: Array<{
      commitmentId: string;
      estimatedDistance: number;
      estimatedPace: number;
      actualArrivalTime: number;
      arrivalDeadline: number;
      successful: boolean;
      timestamp: number;
    }>,
    context: 'work' | 'social' | 'urgent',
    distance: number
  ): Promise<{
    recommendedPace: number;
    confidence: number;
    reasoning: string;
  } | null> {
    if (!this.isAvailable()) return null;

    try {
      const historySummary = userHistory.slice(-5).map(h => ({
        success: h.successful,
        pace: h.estimatedPace,
        distance: h.estimatedDistance,
        onTime: h.actualArrivalTime <= h.arrivalDeadline
      }));

      const prompt = `Based on this user's punctuality history and the current context, recommend an optimal running pace in seconds per meter for a ${distance.toFixed(1)}km route.

User History (last 5 commitments):
${historySummary.map(h => `- ${h.success ? 'SUCCESS' : 'FAILED'}: ${h.pace.toFixed(3)} sec/m for ${h.distance.toFixed(1)}km (${h.onTime ? 'on time' : 'late'})`).join('\n')}

Context: ${context} (work = professional urgency, social = flexible, urgent = maximum speed needed)
Distance: ${distance.toFixed(1)}km

Provide a JSON response with:
- recommendedPace: number (seconds per meter, e.g., 0.083 = ~12 min/mile)
- confidence: number (0-1, based on history reliability)
- reasoning: string (brief explanation)

Consider:
- User's historical performance patterns
- Context-appropriate adjustments (${context} context)
- Realistic pace for ${distance.toFixed(1)}km distance
- Risk of over/under estimation`;

      const messages = [
        {
          role: 'system' as const,
          content: 'You are an expert running coach and data analyst specializing in punctuality optimization. Provide precise, evidence-based pace recommendations.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const response = await this.chatCompletion(messages, {
        model: aiConfig.venice.models.balanced,
        temperature: 0.3, // Lower temperature for consistent recommendations
        enableWebSearch: false
      });

      if (!response) return null;

      try {
        const parsed = JSON.parse(response);
        return {
          recommendedPace: Math.max(0.05, Math.min(0.2, parsed.recommendedPace)), // Clamp to realistic range
          confidence: Math.max(0, Math.min(1, parsed.confidence)),
          reasoning: parsed.reasoning || 'AI-generated recommendation'
        };
      } catch (parseError) {
        console.error('Failed to parse Venice pace recommendation:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error generating Venice pace recommendation:', error);
      return null;
    }
  }

  /**
   * Generate contextual insights using Venice AI
   */
  async generateContextualInsights(
    userData: {
      reputation: number;
      totalCommitments: number;
      successRate: number;
      averagePace: number;
    },
    currentContext: {
      type: 'work' | 'social' | 'urgent';
      timeOfDay: string;
      location: string;
      weather?: string;
    }
  ): Promise<{
    insights: string[];
    recommendations: string[];
    riskAssessment: 'low' | 'medium' | 'high';
  } | null> {
    if (!this.isAvailable()) return null;

    try {
      const prompt = `Analyze this user's punctuality profile and current context to provide personalized insights and recommendations.

User Profile:
- Reputation Score: ${userData.reputation}/1000
- Total Commitments: ${userData.totalCommitments}
- Success Rate: ${(userData.successRate * 100).toFixed(1)}%
- Average Pace: ${(userData.averagePace * 60).toFixed(1)} min/mile

Current Context:
- Type: ${currentContext.type}
- Time: ${currentContext.timeOfDay}
- Location: ${currentContext.location}
${currentContext.weather ? `- Weather: ${currentContext.weather}` : ''}

Provide a JSON response with:
- insights: array of 2-3 key observations about the user's patterns
- recommendations: array of 2-3 actionable suggestions
- riskAssessment: "low" | "medium" | "high" based on likelihood of success

Focus on:
- Pattern recognition from user data
- Context-appropriate advice
- Realistic risk assessment
- Motivational and practical recommendations`;

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a behavioral economist and sports psychologist specializing in motivation and punctuality. Provide insightful, actionable advice.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const response = await this.chatCompletion(messages, {
        model: aiConfig.venice.models.balanced,
        temperature: 0.4,
        enableWebSearch: true // Enable web search for current context awareness
      });

      if (!response) return null;

      try {
        const parsed = JSON.parse(response);
        return {
          insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3) : [],
          riskAssessment: ['low', 'medium', 'high'].includes(parsed.riskAssessment) ? parsed.riskAssessment : 'medium'
        };
      } catch (parseError) {
        console.error('Failed to parse Venice contextual insights:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error generating Venice contextual insights:', error);
      return null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const veniceClient = new VeniceClient();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isVeniceAvailable(): boolean {
  return veniceClient.isAvailable();
}

export function getVeniceHealth(): {
  available: boolean;
  apiKeyConfigured: boolean;
  initialized: boolean;
} {
  return {
    available: veniceClient.isAvailable(),
    apiKeyConfigured: !!VENICE_API_KEY,
    initialized: true // Client always tries to initialize
  };
}
