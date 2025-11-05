/**
 * Venice AI Health Check API
 */

import { NextResponse } from 'next/server';

const VENICE_API_KEY = process.env.VENICE_API_KEY;

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
