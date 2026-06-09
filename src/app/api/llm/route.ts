import { NextResponse } from 'next/server'
import { chatWithFallback, type LLMMessage } from '@/lib/llm/client'

const cache = new Map<string, { response: any; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000

function hashMessages(messages: LLMMessage[]): string {
  return messages.map(m => `${m.role}:${m.content}`).join('|').slice(0, 200)
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    const cacheKey = hashMessages(messages)
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.response)
    }

    const apiKeys: Record<string, string> = {}
    if (process.env.VENICE_API_KEY) apiKeys.venice = process.env.VENICE_API_KEY
    if (process.env.FEATHERLESS_API_KEY) apiKeys.featherless = process.env.FEATHERLESS_API_KEY

    if (Object.keys(apiKeys).length === 0) {
      return NextResponse.json(
        { content: 'No LLM API keys configured. Add VENICE_API_KEY or FEATHERLESS_API_KEY to .env.local', model: 'none', provider: 'none' },
        { status: 200 }
      )
    }

    const response = await chatWithFallback(messages as LLMMessage[], apiKeys)

    cache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('LLM API error:', error)
    return NextResponse.json(
      { error: error.message || 'LLM request failed' },
      { status: 502 }
    )
  }
}
