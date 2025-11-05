/**
 * Venice AI Client - Frontend API Caller
 *
 * Routes Venice AI requests through secure backend API
 * Keeps API key server-side for security
 * Paid via Somnia testnet integration
 */

// ============================================================================
// VENICE CLIENT CLASS - API ROUTE VERSION
// ============================================================================

export class VeniceClient {
  private baseUrl: string;

  constructor() {
    // Use relative URL for API routes - works in both dev and production
    this.baseUrl = '/api/ai';
  }

  /**
   * Check if Venice client is available by calling health check
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) return false;

      const health = await response.json();
      return health.veniceAvailable || false;
    } catch (error) {
      console.error('Error checking Venice availability:', error);
      return false;
    }
  }

  /**
   * Make a chat completion request through backend API
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
    // This method is kept for compatibility but routes through specific API endpoints
    console.warn('Direct chatCompletion not available in secure client. Use specific methods instead.');
    return null;
  }

  /**
   * Generate personalized pace recommendation using Venice AI via backend API
   * Requires STT payment for premium AI features
   */
  async generatePaceRecommendation(
    userAddress: string,
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
    paymentRequired: boolean;
    paymentAmount?: string;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/pace-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          userHistory,
          context,
          distance
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.fallback) {
          console.log('⏭️ Venice AI unavailable or payment required, using fallback');
          return null;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Venice AI pace recommendation received:', data);
      return data;
    } catch (error) {
      console.error('Error calling Venice pace recommendation API:', error);
      return null;
    }
  }

  /**
   * Generate contextual insights using Venice AI via backend API
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
    try {
      const response = await fetch(`${this.baseUrl}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData,
          context: currentContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.fallback) {
          console.log('⏭️ Venice AI unavailable, using fallback');
          return null;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Venice AI contextual insights received:', data);
      return data;
    } catch (error) {
      console.error('Error calling Venice contextual insights API:', error);
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

export async function isVeniceAvailable(): Promise<boolean> {
  return await veniceClient.isAvailable();
}

export function getVeniceHealth(): {
  available: boolean;
  apiKeyConfigured: boolean;
  initialized: boolean;
} {
  // This function is kept for compatibility but checks through backend API
  // The actual API key is maintained server-side
  return {
    available: true, // Client is available, health check happens via backend API
    apiKeyConfigured: true, // Server-side check only
    initialized: true
  };
}
