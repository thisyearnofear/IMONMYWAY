"use client"

import { useState, useCallback } from 'react'
import type { LLMMessage, LLMResponse } from '@/lib/llm/client'

export function useLLM() {
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (messages: LLMMessage[]): Promise<LLMResponse | null> => {
    setIsThinking(true)
    setError(null)
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data: LLMResponse = await res.json()
      return data
    } catch (err: any) {
      setError(err.message || 'LLM request failed')
      return null
    } finally {
      setIsThinking(false)
    }
  }, [])

  return { generate, isThinking, error }
}
