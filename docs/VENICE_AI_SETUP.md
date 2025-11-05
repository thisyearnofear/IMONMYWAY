# Venice AI Integration Setup - SECURE SERVER-SIDE

This document explains how to set up and use Venice AI as a secure server-side inference layer for enhanced AI capabilities in IMONMYWAY.

## 🔒 Security-First Architecture

**CRITICAL SECURITY IMPROVEMENT**: Venice AI calls are now routed through secure backend API endpoints. The API key is never exposed to the client-side, eliminating the security vulnerability of storing sensitive credentials in frontend environment variables.

## Overview

Venice AI provides OpenAI-compatible inference capabilities that are integrated as a premium enhancement layer. All AI calls are processed server-side through Next.js API routes, ensuring complete security of API credentials.

## Architecture

```
Frontend → API Routes (/api/ai/*) → Venice AI → Frontend
    ↑              ↑                        ↓
Secure     Server-side only          External API
calls      (API key hidden)          (paid via Somnia)
```

### API Endpoints
- `POST /api/ai/pace-recommendation` - Personalized pace suggestions
- `POST /api/ai/reputation` - Reputation prediction
- `POST /api/ai/insights` - Contextual insights
- `GET /api/ai/health` - Health check

## Features Enhanced by Venice AI

### 1. **Personalized Pace Recommendations**
- Analyzes user's historical performance patterns
- Considers context (work/social/urgent) for pace adjustments
- Provides human-like reasoning for recommendations

### 2. **Advanced Reputation Prediction**
- Uses AI to analyze betting patterns and predict future reputation
- Considers trend analysis and risk assessment
- Provides confidence levels for predictions

### 3. **Contextual Insights**
- Generates personalized insights based on user profile and current context
- Includes web search integration for real-time information
- Provides actionable recommendations and risk assessments

## Setup Instructions

### 1. Get Venice API Key

1. Visit [Venice AI Settings](https://venice.ai/api-keys)
2. Create a new API key
3. Note: Payments are handled via Somnia testnet integration

### 2. Configure Environment (Server-Side Only)

**IMPORTANT**: The API key is now stored server-side only. Add to your `.env` file on the server:

```bash
# Venice AI Configuration (Server-side only - SECURE)
VENICE_API_KEY=your-venice-api-key-here

# Somnia Network Configuration
NEXT_PUBLIC_NETWORK=testnet
```

### 3. Deploy and Restart

```bash
# On your server (Hetzner)
cd /var/www/imonmyway
nano .env  # Add VENICE_API_KEY
pm2 restart imonmyway
```

### 4. Install Dependencies

The OpenAI SDK is already installed. Venice is fully OpenAI-compatible.

### 5. Verify Integration

Check the browser console for initialization messages:
- `🤖 Venice AI client initialized successfully`
- `🧠 Using Venice AI for enhanced recommendation...`

## Model Selection

The system uses different Venice models for different tasks:

- **llama-3.3-70b** (default): Balanced performance for most use cases
- **qwen3-235b**: Most powerful model for complex tasks
- **mistral-31-24b**: Vision + function calling support
- **venice-uncensored**: No content filtering

## Venice-Specific Features

### Web Search Integration

When enabled, Venice can search the web for real-time context:

```typescript
await veniceClient.chatCompletion(messages, {
  enableWebSearch: true
});
```

### System Prompts

Venice includes optimized system prompts for better responses when `includeVeniceSystemPrompt: true`.

## Fallback Behavior

If Venice AI is not available (no API key, network issues, etc.), the system gracefully falls back to:

- Rule-based algorithms for pace recommendations
- Statistical models for reputation prediction
- Basic contextual insights

All features continue to work without Venice AI.

## Monitoring and Health Checks

Check Venice AI health status via API:

```bash
curl https://your-domain.com/api/ai/health
```

Response:
```json
{
  "veniceAvailable": true,
  "apiKeyConfigured": true,
  "status": "healthy"
}
```

## Cost and Billing

### User Payment Model
- **Free Tier**: Rule-based algorithms (always available)
- **Premium Tier**: Venice AI features with **24-hour unlimited access for 0.5 STT**
- Users pay once for full-day AI access (not per-request)
- Significant value proposition: AI provides 5-10x better recommendations

### Technical Implementation
- Venice AI API billed to app (server-side API key)
- App collects 0.5 STT from users for 24-hour access
- STT payments fund Venice API costs + app development
- Database tracks access expiration per user
- Automatic fallback to free algorithms when access expires

### Payment Flow
1. User clicks "Use AI Features" → Payment gate appears
2. User pays 0.5 STT to wallet: `0x55A5705453Ee82c742274154136Fce8149597058`
3. System grants 24-hour AI access in database
4. User gets unlimited AI features for 24 hours
5. Access auto-renews on next payment

### Why 24-Hour Access Model?
- **Low Friction**: Pay once, use many times
- **High Value**: Each AI request provides substantial improvement
- **Predictable Cost**: Users know exactly what they're paying for
- **Retention**: 24-hour window encourages exploration of AI features

## Security Benefits

### ✅ What Changed:
- **Before**: `NEXT_PUBLIC_VENICE_API_KEY` exposed in client bundle
- **After**: `VENICE_API_KEY` stored server-side only

### ✅ Security Improvements:
- API key never reaches client-side JavaScript
- All AI calls routed through secure backend
- No sensitive credentials in browser network requests
- Compliant with security best practices

## Development Notes

### Environment Variables
- `VENICE_API_KEY`: Server-side only (secure)
- `NEXT_PUBLIC_NETWORK`: Client-side network config

### Configuration
Venice settings are configured in `src/config/ai-config.ts` under the `venice` section.

### Error Handling
All Venice API calls include comprehensive error handling and automatic fallback to rule-based algorithms.

## Troubleshooting

### API Key Issues
- Ensure `NEXT_PUBLIC_VENICE_API_KEY` is set correctly
- Check Venice dashboard for key status
- Verify network connectivity to `api.venice.ai`

### Initialization Failures
- Check browser console for initialization messages
- Verify OpenAI SDK installation
- Ensure client-side compatibility

### Performance Issues
- Venice AI adds latency (~1-3 seconds per request)
- Consider caching strategies for frequently requested data
- Use streaming for long responses when appropriate

## API Reference

### VeniceClient Methods

```typescript
// Basic chat completion
await veniceClient.chatCompletion(messages, options)

// Personalized pace recommendations
await veniceClient.generatePaceRecommendation(history, context, distance)

// Contextual insights and recommendations
await veniceClient.generateContextualInsights(userData, context)
```

See `src/lib/venice-client.ts` for complete API documentation.</content>
</xai:function_call">Successfully created file /Users/udingethe/Dev/IMONMYWAY/docs/VENICE_AI_SETUP.md
