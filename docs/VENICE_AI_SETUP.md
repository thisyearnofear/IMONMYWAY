# Venice AI Integration Setup

This document explains how to set up and use Venice AI as an additional inference layer for enhanced AI capabilities in IMONMYWAY.

## Overview

Venice AI provides OpenAI-compatible inference capabilities that are integrated as a premium enhancement layer on top of our existing rule-based algorithms. When available, Venice AI provides more sophisticated analysis and personalized recommendations.

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

### 2. Configure Environment

Create or update your `.env.local` file:

```bash
# Venice AI Configuration
NEXT_PUBLIC_VENICE_API_KEY=your-venice-api-key-here

# Somnia Network Configuration
NEXT_PUBLIC_NETWORK=testnet
```

### 3. Install Dependencies

The OpenAI SDK is already installed. Venice is fully OpenAI-compatible.

### 4. Verify Integration

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

Check Venice AI health status:

```typescript
import { getVeniceHealth } from '@/lib/venice-client';

const health = getVeniceHealth();
// Returns: { available, apiKeyConfigured, initialized }
```

## Cost and Billing

- Venice AI usage is paid via Somnia testnet integration
- Costs are billed based on tokens used
- Monitor usage through Venice dashboard
- Free tier available for testing

## Development Notes

### Environment Variables
- `NEXT_PUBLIC_VENICE_API_KEY`: Your Venice API key
- `NEXT_PUBLIC_NETWORK`: Set to 'testnet' for development

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
