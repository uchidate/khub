import { describe, it, expect, beforeEach, vi } from 'vitest'
import { _ApiRateLimiter } from '../api-rate-limiter'

// Mock the logger to avoid side effects
vi.mock('../logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('ApiRateLimiter', () => {
  let limiter: InstanceType<typeof _ApiRateLimiter>

  beforeEach(() => {
    limiter = new _ApiRateLimiter({
      maxRequests: 3,
      windowMs: 10_000,
      name: 'test',
    })
  })

  describe('check()', () => {
    it('allows requests within the limit', () => {
      const r1 = limiter.check('1.2.3.4')
      expect(r1.allowed).toBe(true)
      expect(r1.remaining).toBe(2)

      const r2 = limiter.check('1.2.3.4')
      expect(r2.allowed).toBe(true)
      expect(r2.remaining).toBe(1)

      const r3 = limiter.check('1.2.3.4')
      expect(r3.allowed).toBe(true)
      expect(r3.remaining).toBe(0)
    })

    it('blocks requests above the limit', () => {
      limiter.check('1.2.3.4')
      limiter.check('1.2.3.4')
      limiter.check('1.2.3.4')

      const r4 = limiter.check('1.2.3.4')
      expect(r4.allowed).toBe(false)
      expect(r4.remaining).toBe(0)
      expect(r4.resetMs).toBeGreaterThan(0)
    })

    it('tracks different IPs independently', () => {
      limiter.check('1.1.1.1')
      limiter.check('1.1.1.1')
      limiter.check('1.1.1.1')

      // Different IP should still be allowed
      const result = limiter.check('2.2.2.2')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('allows requests after window expires', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      limiter.check('1.2.3.4')
      limiter.check('1.2.3.4')
      limiter.check('1.2.3.4')

      // 4th request blocked
      expect(limiter.check('1.2.3.4').allowed).toBe(false)

      // Advance past the window
      vi.spyOn(Date, 'now').mockReturnValue(now + 11_000)

      const result = limiter.check('1.2.3.4')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)

      vi.restoreAllMocks()
    })

    it('returns correct resetMs', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      limiter.check('1.2.3.4')
      limiter.check('1.2.3.4')
      limiter.check('1.2.3.4')

      const result = limiter.check('1.2.3.4')
      expect(result.allowed).toBe(false)
      // resetMs should be close to windowMs since we just made the first request
      expect(result.resetMs).toBeLessThanOrEqual(10_000)
      expect(result.resetMs).toBeGreaterThan(0)

      vi.restoreAllMocks()
    })
  })

  describe('cleanup', () => {
    it('removes stale client entries', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      limiter.check('1.1.1.1')
      limiter.check('2.2.2.2')
      expect(limiter._clientCount()).toBe(2)

      // Advance past window + cleanup interval (60s)
      vi.spyOn(Date, 'now').mockReturnValue(now + 70_000)

      // Trigger cleanup via a check call
      limiter.check('3.3.3.3')

      // Old entries should be cleaned up, new one added
      expect(limiter._clientCount()).toBe(1)

      vi.restoreAllMocks()
    })
  })

  describe('_reset()', () => {
    it('clears all state', () => {
      limiter.check('1.1.1.1')
      limiter.check('2.2.2.2')
      expect(limiter._clientCount()).toBe(2)

      limiter._reset()
      expect(limiter._clientCount()).toBe(0)

      // After reset, should be able to make requests again
      const result = limiter.check('1.1.1.1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })
  })
})
