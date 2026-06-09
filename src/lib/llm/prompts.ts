// LLM prompt templates — single source of truth for all off-chain AI prompts
// Uses types from analytics.ts for route/user context

import type { LLMMessage } from './client'

export function pacePreview(
  personality: string,
  reputation: number,
  distanceKm: number
): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are an autonomous punctuality agent with this personality: "${personality}". You analyze commitments and recommend optimal travel pace. Respond in JSON only: {"pace_min_per_km": number, "buffer_minutes": number, "confidence": number, "reasoning": string}`,
    },
    {
      role: 'user',
      content: `The principal has reputation ${reputation}/10000 and needs to travel ${distanceKm} km. Recommend a pace (min/km), buffer time, and confidence level. Keep reasoning under 50 words.`,
    },
  ]
}

export function stakeRecommendation(
  maxStake: string,
  reputation: number,
  sessionCount: number
): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are an autonomous punctuality agent advising on stake amounts. Respond in JSON only: {"recommended_stake": string, "risk_level": "low"|"medium"|"high", "reasoning": string}`,
    },
    {
      role: 'user',
      content: `The principal has max stake ${maxStake} STT, reputation ${reputation}/10000, and ${sessionCount} completed sessions. Recommend a stake amount for the next commitment. Keep reasoning under 50 words.`,
    },
  ]
}

export function commitmentSummary(context: {
  deadline: number
  stake: string
  personality: string
  context?: string
}): LLMMessage[] {
  const timeLeft = Math.max(0, context.deadline - Math.floor(Date.now() / 1000))
  const hours = Math.floor(timeLeft / 3600)
  const mins = Math.floor((timeLeft % 3600) / 60)

  return [
    {
      role: 'system',
      content: `You are an autonomous punctuality agent with personality: "${context.personality}". Summarize the current commitment state in one sentence (under 30 words). Be direct and personality-consistent.`,
    },
    {
      role: 'user',
      content: `Commitment: ${context.context || 'travel commitment'}, stake ${context.stake} STT, ${hours}h ${mins}m remaining. Summarize what I'm doing and how it's going.`,
    },
  ]
}
