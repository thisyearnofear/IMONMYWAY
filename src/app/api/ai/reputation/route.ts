/**
 * Venice AI Reputation Prediction API
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

const VENICE_API_KEY = process.env.VENICE_API_KEY;

const veniceClient = VENICE_API_KEY ? new OpenAI({
  apiKey: VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
}) : null;

/**
 * POST /api/ai/reputation
 * Generate reputation prediction using Venice AI
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
    const { userId, userData, timeframe } = body;

    if (!userId || !userData || !timeframe) {
      return NextResponse.json({
        error: 'Missing required fields: userId, userData, timeframe'
      }, { status: 400 });
    }

    // Check if user has paid for AI features (0.5 STT)
    const hasPaidForAI = await checkAIPaymentStatus(userId);

    if (!hasPaidForAI) {
      return NextResponse.json({
        error: 'AI features require 0.5 STT payment',
        paymentRequired: true,
        paymentAmount: '0.5',
        fallback: true
      }, { status: 402 }); // Payment Required status
    }

    const prompt = `Analyze this user's betting/reputation history and predict their future reputation score.

User Profile:
- Current Reputation: ${userData.reputation}/1000
- Total Bets: ${userData.totalBets}
- Success Rate: ${(userData.successRate * 100).toFixed(1)}%
- Prediction Timeframe: ${timeframe} days

Recent Performance (last 10 bets):
${userData.recentBets?.map((bet: any, i: number) => `${i+1}. ${bet.outcome} - ${bet.amount} tokens`).join('\n') || 'No recent bets'}

Provide a JSON response with:
- predictedScore: number (0-1000)
- confidence: number (0-1)
- trend: "improving" | "declining" | "stable"
- reasoning: brief explanation

Consider:
- Historical performance patterns
- Recent trends and consistency
- Risk of overfitting to small sample sizes`;

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a financial analyst specializing in reputation-based systems and predictive modeling. Provide data-driven reputation predictions.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    const completion = await veniceClient.chat.completions.create({
      model: 'llama-3.3-70b',
      messages,
      temperature: 0.2,
      max_tokens: 400
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from Venice AI');
    }

    try {
      const parsed = JSON.parse(response);
      return NextResponse.json({
        predictedScore: Math.max(0, Math.min(1000, parsed.predictedScore)),
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        trend: ['improving', 'declining', 'stable'].includes(parsed.trend) ? parsed.trend : 'stable',
        influencingFactors: [
          'AI-powered pattern analysis',
          `Historical performance (${userData.totalBets} bets)`,
          'Trend analysis and prediction'
        ]
      });
    } catch (parseError) {
      console.error('Failed to parse Venice reputation prediction:', parseError);
      return NextResponse.json({
        error: 'Failed to parse AI response',
        fallback: true
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Venice AI reputation prediction error:', error);
    return NextResponse.json({
      error: 'AI service temporarily unavailable',
      fallback: true
    }, { status: 500 });
  }
}
