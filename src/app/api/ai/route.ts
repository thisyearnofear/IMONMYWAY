/**
 * Venice AI API Routes - Server-side secure API calls
 * Routes Venice AI requests through backend to keep API key secure
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

/**
 * Check if user has paid for AI features (24-hour access)
 */
async function checkAIPaymentStatus(userAddress: string): Promise<boolean> {
  try {
    const { dbService } = await import('@/lib/db-service');
    return await dbService.checkUserAIAccess(userAddress);
  } catch (error) {
    console.error('Error checking AI payment status:', error);
    return false;
  }
}

// Venice AI client (server-side only)
const VENICE_API_KEY = process.env.VENICE_API_KEY; // Server-side only, not NEXT_PUBLIC_

if (!VENICE_API_KEY) {
  console.warn('⚠️ VENICE_API_KEY not found. Venice AI features will not work.');
}

const veniceClient = VENICE_API_KEY ? new OpenAI({
  apiKey: VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
}) : null;

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/ai/health
 * Check Venice AI service health
 */
export async function GET() {
  const veniceAvailable = !!VENICE_API_KEY;
  const apiKeyConfigured = !!VENICE_API_KEY;

  return NextResponse.json({
    veniceAvailable,
    apiKeyConfigured,
    status: veniceAvailable ? 'healthy' : 'unavailable'
  });
}

/**
 * POST /api/ai/pace-recommendation
 * Generate personalized pace recommendations using Venice AI
 */
export async function POST(request: NextRequest) {
  try {
    if (!veniceClient) {
      return NextResponse.json({
        error: 'Venice AI not configured',
        fallback: true
      }, { status: 503 });
    }

    const body = await request.json();
    const { userAddress, userHistory, context, distance } = body;

    // Check if user has paid for AI features (0.5 STT)
    const hasPaidForAI = await checkAIPaymentStatus(userAddress);

    if (!hasPaidForAI) {
      return NextResponse.json({
        error: 'AI features require 0.5 STT payment',
        paymentRequired: true,
        paymentAmount: '0.5',
        fallback: true
      }, { status: 402 }); // Payment Required status
    }

    // Validate required fields
    if (!userHistory || !context || !distance) {
      return NextResponse.json({
        error: 'Missing required fields: userHistory, context, distance'
      }, { status: 400 });
    }

    // Prepare user history summary
    const historySummary = userHistory.slice(-5).map((h: any) => ({
      success: h.successful,
      pace: h.estimatedPace,
      distance: h.estimatedDistance,
      onTime: h.actualArrivalTime <= h.arrivalDeadline
    }));

    const prompt = `Based on this user's punctuality history and the current context, recommend an optimal running pace in seconds per meter for a ${distance.toFixed(1)}km route.

User History (last 5 commitments):
${historySummary.map((h: any) => `- ${h.success ? 'SUCCESS' : 'FAILED'}: ${h.pace.toFixed(3)} sec/m for ${h.distance.toFixed(1)}km (${h.onTime ? 'on time' : 'late'})`).join('\n')}

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

    const completion = await veniceClient.chat.completions.create({
      model: 'llama-3.3-70b',
      messages,
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from Venice AI');
    }

    try {
      const parsed = JSON.parse(response);
      return NextResponse.json({
        recommendedPace: Math.max(0.05, Math.min(0.2, parsed.recommendedPace)), // Clamp to realistic range
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        reasoning: parsed.reasoning || 'AI-generated recommendation'
      });
    } catch (parseError) {
      console.error('Failed to parse Venice pace recommendation:', parseError);
      return NextResponse.json({
        error: 'Failed to parse AI response',
        fallback: true
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Venice AI pace recommendation error:', error);
    return NextResponse.json({
      error: 'AI service temporarily unavailable',
      fallback: true
    }, { status: 500 });
  }
}
