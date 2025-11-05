/**
 * Venice AI Contextual Insights API
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const VENICE_API_KEY = process.env.VENICE_API_KEY;

const veniceClient = VENICE_API_KEY ? new OpenAI({
  apiKey: VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
}) : null;

/**
 * POST /api/ai/insights
 * Generate contextual insights using Venice AI
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
    const { userData, context } = body;

    if (!userData || !context) {
      return NextResponse.json({
        error: 'Missing required fields: userData, context'
      }, { status: 400 });
    }

    const prompt = `Analyze this user's punctuality profile and current context to provide personalized insights and recommendations.

User Profile:
- Reputation Score: ${userData.reputation}/1000
- Total Commitments: ${userData.totalCommitments}
- Success Rate: ${(userData.successRate * 100).toFixed(1)}%
- Average Pace: ${(userData.averagePace * 60).toFixed(1)} min/mile

Current Context:
- Type: ${context.type}
- Time: ${context.timeOfDay}
- Location: ${context.location}
${context.weather ? `- Weather: ${context.weather}` : ''}

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

    const completion = await veniceClient.chat.completions.create({
      model: 'llama-3.3-70b',
      messages,
      temperature: 0.4,
      max_tokens: 600
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from Venice AI');
    }

    try {
      const parsed = JSON.parse(response);
      return NextResponse.json({
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3) : [],
        riskAssessment: ['low', 'medium', 'high'].includes(parsed.riskAssessment) ? parsed.riskAssessment : 'medium'
      });
    } catch (parseError) {
      console.error('Failed to parse Venice contextual insights:', parseError);
      return NextResponse.json({
        error: 'Failed to parse AI response',
        fallback: true
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Venice AI contextual insights error:', error);
    return NextResponse.json({
      error: 'AI service temporarily unavailable',
      fallback: true
    }, { status: 500 });
  }
}
