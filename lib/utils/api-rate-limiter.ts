import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from './logger'

const log = createLogger('RATE-LIMIT')

export interface ApiRateLimitConfig {
  /** Maximum requests allowed in the time window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Identifier for logging */
  name?: string
}

interface ClientEntry {
  timestamps: number[]
}

/**
 * In-memory sliding window rate limiter for API endpoints.
 * Tracks requests per client IP with automatic cleanup.
 */
class ApiRateLimiter {
  private clients = new Map<string, ClientEntry>()
  private config: Required<ApiRateLimitConfig>
  private lastCleanup = Date.now()
  private static readonly CLEANUP_INTERVAL_MS = 60_000 // 1 min

  constructor(config: ApiRateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      name: config.name ?? 'API',
    }
  }

  /**
   * Check if a client IP is within the rate limit.
   * Returns { allowed, remaining, resetMs }
   */
  check(clientIp: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now()
    this.maybeCleanup(now)

    let entry = this.clients.get(clientIp)
    if (!entry) {
      entry = { timestamps: [] }
      this.clients.set(clientIp, entry)
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => now - t < this.config.windowMs)

    const remaining = Math.max(0, this.config.maxRequests - entry.timestamps.length)
    const resetMs = entry.timestamps.length > 0
      ? this.config.windowMs - (now - entry.timestamps[0])
      : this.config.windowMs

    if (entry.timestamps.length >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetMs }
    }

    // Record this request
    entry.timestamps.push(now)
    return { allowed: true, remaining: remaining - 1, resetMs }
  }

  /** Periodically remove stale client entries to prevent memory leaks */
  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < ApiRateLimiter.CLEANUP_INTERVAL_MS) return
    this.lastCleanup = now

    const keysToDelete: string[] = []
    this.clients.forEach((entry, ip) => {
      entry.timestamps = entry.timestamps.filter(t => now - t < this.config.windowMs)
      if (entry.timestamps.length === 0) {
        keysToDelete.push(ip)
      }
    })
    keysToDelete.forEach(ip => this.clients.delete(ip))
  }

  /** For testing — reset all state */
  _reset(): void {
    this.clients.clear()
    this.lastCleanup = Date.now()
  }

  /** For testing — get client count */
  _clientCount(): number {
    return this.clients.size
  }
}

// --- Singleton instances per endpoint config ---
const limiters = new Map<string, ApiRateLimiter>()

function getLimiter(config: ApiRateLimitConfig): ApiRateLimiter {
  const key = config.name ?? `${config.maxRequests}/${config.windowMs}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new ApiRateLimiter(config)
    limiters.set(key, limiter)
  }
  return limiter
}

/**
 * Extract client IP from Next.js request.
 * Checks x-forwarded-for (reverse proxy) then x-real-ip, then falls back to 'unknown'.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs — take the first (client)
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Add rate limit headers to a response.
 */
function addRateLimitHeaders(
  response: NextResponse,
  config: ApiRateLimitConfig,
  remaining: number,
  resetMs: number,
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetMs / 1000)))
  return response
}

/**
 * Rate limit check for use at the top of a route handler.
 * Returns a 429 NextResponse if rate limited, or null if allowed.
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const limited = checkRateLimit(request, { maxRequests: 5, windowMs: 60000, name: 'register' })
 *   if (limited) return limited
 *   // ... handle request
 * }
 * ```
 */
export function checkRateLimit(
  request: NextRequest,
  config: ApiRateLimitConfig,
): NextResponse | null {
  const limiter = getLimiter(config)
  const clientIp = getClientIp(request)
  const result = limiter.check(clientIp)

  if (!result.allowed) {
    log.warn('Rate limit exceeded', {
      ip: clientIp,
      endpoint: config.name,
      limit: config.maxRequests,
      windowMs: config.windowMs,
    })

    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
    return addRateLimitHeaders(response, config, 0, result.resetMs)
  }

  return null // Not rate limited — proceed with handler
}

/**
 * Add rate limit headers to a successful response.
 * Call after checkRateLimit() passes to include headers in the response.
 */
export function withRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  config: ApiRateLimitConfig,
): NextResponse {
  const limiter = getLimiter(config)
  const clientIp = getClientIp(request)
  // Re-check to get current stats (request already recorded)
  const entry = limiter['clients'].get(clientIp)
  const now = Date.now()
  const validCount = entry
    ? entry.timestamps.filter((t: number) => now - t < config.windowMs).length
    : 0
  const remaining = Math.max(0, config.maxRequests - validCount)
  const resetMs = entry && entry.timestamps.length > 0
    ? config.windowMs - (now - entry.timestamps[0])
    : config.windowMs

  return addRateLimitHeaders(response, config, remaining, resetMs)
}

// --- Preset configs for common endpoints ---
export const RateLimitPresets = {
  AUTH_REGISTER: { maxRequests: 5, windowMs: 60_000, name: 'auth-register' } as ApiRateLimitConfig,
  AUTH_FORGOT_PASSWORD: { maxRequests: 3, windowMs: 60_000, name: 'auth-forgot-password' } as ApiRateLimitConfig,
  SEARCH: { maxRequests: 30, windowMs: 60_000, name: 'search' } as ApiRateLimitConfig,
  SEARCH_GLOBAL: { maxRequests: 20, windowMs: 60_000, name: 'search-global' } as ApiRateLimitConfig,
  COMMENTS: { maxRequests: 10, windowMs: 60_000, name: 'comments' } as ApiRateLimitConfig,
  CRON: { maxRequests: 4, windowMs: 60_000, name: 'cron' } as ApiRateLimitConfig,
}

// Export for testing
export { ApiRateLimiter as _ApiRateLimiter, getClientIp as _getClientIp }
