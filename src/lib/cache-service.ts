// Generic in-memory cache with TTL
// Used by LLM API route and any service needing short-lived caching

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class CacheService {
  private store = new Map<string, CacheEntry<any>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

export const cacheService = new CacheService()
