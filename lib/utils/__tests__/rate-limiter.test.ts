import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter, RateLimiterPresets } from '../rate-limiter'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  describe('basic acquire', () => {
    beforeEach(() => {
      limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        minDelayMs: 0,
        bufferMs: 0,
        name: 'Test',
      })
    })

    it('allows requests within limit', async () => {
      await limiter.acquire()
      await limiter.acquire()
      await limiter.acquire()

      const stats = limiter.getStats()
      expect(stats.totalRequests).toBe(3)
      expect(stats.requestsInWindow).toBe(3)
    })

    it('tracks statistics correctly', async () => {
      const stats0 = limiter.getStats()
      expect(stats0.totalRequests).toBe(0)
      expect(stats0.requestsInWindow).toBe(0)
      expect(stats0.percentUsed).toBe(0)

      await limiter.acquire()
      const stats1 = limiter.getStats()
      expect(stats1.totalRequests).toBe(1)
      expect(stats1.requestsInWindow).toBe(1)
      expect(stats1.maxAllowed).toBe(3)
      expect(stats1.percentUsed).toBeCloseTo(33.33, 0)
    })
  })

  describe('canAcquireImmediately', () => {
    it('returns true when under limit', () => {
      limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        name: 'Test',
      })
      expect(limiter.canAcquireImmediately()).toBe(true)
    })

    it('returns false when minDelay not met', async () => {
      limiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 10000,
        minDelayMs: 5000, // 5s between requests
        name: 'Test',
      })

      await limiter.acquire()
      // Immediately after, should not be able to acquire
      expect(limiter.canAcquireImmediately()).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears all state', async () => {
      limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 10000,
        name: 'Test',
      })

      await limiter.acquire()
      await limiter.acquire()

      expect(limiter.getStats().totalRequests).toBe(2)

      limiter.reset()

      const stats = limiter.getStats()
      expect(stats.totalRequests).toBe(0)
      expect(stats.requestsInWindow).toBe(0)
      expect(stats.lastRequestTime).toBe(0)
    })
  })

  describe('sliding window', () => {
    it('allows new requests after window expires', async () => {
      limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 50, // 50ms window
        minDelayMs: 0,
        bufferMs: 10,
        name: 'Test',
      })

      await limiter.acquire()
      await limiter.acquire()
      // Window is full (2/2)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 70))

      // Should be able to acquire again
      expect(limiter.canAcquireImmediately()).toBe(true)
      await limiter.acquire()
      expect(limiter.getStats().totalRequests).toBe(3)
    })
  })

  describe('presets', () => {
    it('TMDB preset has correct values', () => {
      expect(RateLimiterPresets.TMDB.maxRequests).toBe(20)
      expect(RateLimiterPresets.TMDB.windowMs).toBe(10000)
      expect(RateLimiterPresets.TMDB.minDelayMs).toBe(500)
    })

    it('OLLAMA preset has correct values', () => {
      expect(RateLimiterPresets.OLLAMA.maxRequests).toBe(10)
      expect(RateLimiterPresets.OLLAMA.windowMs).toBe(1000)
    })

    it('all presets can create valid RateLimiter instances', () => {
      for (const [name, config] of Object.entries(RateLimiterPresets)) {
        const rl = new RateLimiter(config)
        expect(rl.getStats().maxAllowed).toBe(config.maxRequests)
      }
    })
  })
})
