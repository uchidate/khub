/**
 * Generic Rate Limiter using Sliding Window + Token Bucket hybrid approach
 *
 * Features:
 * - Sliding window for tracking requests over time
 * - Minimum delay between consecutive requests
 * - Configurable limits per service
 * - Thread-safe with mutex-like queueing
 * - Statistics tracking
 *
 * Usage:
 * ```ts
 * const limiter = new RateLimiter({
 *   maxRequests: 40,
 *   windowMs: 10000,
 *   minDelayMs: 250
 * });
 *
 * await limiter.acquire(); // Wait if necessary
 * // ... make API call
 * ```
 */

export interface RateLimiterConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Minimum delay between consecutive requests (ms)
   * Helps prevent bursts
   */
  minDelayMs?: number;

  /**
   * Buffer time (ms) added when waiting for window to reset
   * Prevents edge cases near window boundary
   */
  bufferMs?: number;

  /**
   * Name for logging/debugging
   */
  name?: string;
}

export interface RateLimiterStats {
  requestsInWindow: number;
  maxAllowed: number;
  percentUsed: number;
  lastRequestTime: number;
  totalRequests: number;
}

export class RateLimiter {
  private config: Required<RateLimiterConfig>;
  private requestTimestamps: number[] = [];
  private lastRequestTime: number = 0;
  private totalRequests: number = 0;
  private pendingQueue: Array<() => void> = [];
  private isProcessing: boolean = false;

  constructor(config: RateLimiterConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      minDelayMs: config.minDelayMs ?? 0,
      bufferMs: config.bufferMs ?? 100,
      name: config.name ?? 'RateLimiter',
    };
  }

  /**
   * Acquire permission to make a request
   * Will wait if rate limit is reached
   */
  async acquire(): Promise<void> {
    // Add to queue
    return new Promise<void>((resolve) => {
      this.pendingQueue.push(resolve);
      this.processQueue();
    });
  }

  /**
   * Process the queue of pending requests
   */
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing || this.pendingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.pendingQueue.length > 0) {
        await this.waitForRateLimit();
        const resolve = this.pendingQueue.shift();
        if (resolve) {
          this.lastRequestTime = Date.now();
          this.requestTimestamps.push(this.lastRequestTime);
          this.totalRequests++;
          resolve();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Wait if necessary to respect rate limits
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean up old timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    // Check if we've hit the limit in this window
    if (this.requestTimestamps.length >= this.config.maxRequests) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = this.config.windowMs - (now - oldestRequest) + this.config.bufferMs;

      if (waitTime > 0) {
        console.log(
          `[${this.config.name}] ⏳ Rate limit reached (${this.requestTimestamps.length}/${this.config.maxRequests}). Waiting ${(waitTime / 1000).toFixed(1)}s...`
        );
        await this.sleep(waitTime);
      }
    }

    // Ensure minimum delay between consecutive requests
    if (this.config.minDelayMs > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.minDelayMs) {
        const delayNeeded = this.config.minDelayMs - timeSinceLastRequest;
        await this.sleep(delayNeeded);
      }
    }
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): RateLimiterStats {
    const now = Date.now();
    const validTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    return {
      requestsInWindow: validTimestamps.length,
      maxAllowed: this.config.maxRequests,
      percentUsed: (validTimestamps.length / this.config.maxRequests) * 100,
      lastRequestTime: this.lastRequestTime,
      totalRequests: this.totalRequests,
    };
  }

  /**
   * Reset the rate limiter (clears all timestamps)
   */
  reset(): void {
    this.requestTimestamps = [];
    this.lastRequestTime = 0;
    this.totalRequests = 0;
    this.pendingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Check if a request can be made immediately without waiting
   */
  canAcquireImmediately(): boolean {
    const now = Date.now();
    const validTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    if (validTimestamps.length >= this.config.maxRequests) {
      return false;
    }

    if (this.config.minDelayMs > 0) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.minDelayMs) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Preset configurations for common APIs
 */
export const RateLimiterPresets = {
  /**
   * TMDB API: 40 requests per 10 seconds
   * Using conservative 20 req/10s with 500ms min delay
   */
  TMDB: {
    maxRequests: 20,
    windowMs: 10000,
    minDelayMs: 500,
    name: 'TMDB',
  } as RateLimiterConfig,

  /**
   * Gemini Free Tier: 15 RPM (requests per minute)
   * = 1 request every 4 seconds
   */
  GEMINI_FREE: {
    maxRequests: 15,
    windowMs: 60000,
    minDelayMs: 4000,
    name: 'Gemini-Free',
  } as RateLimiterConfig,

  /**
   * OpenAI: 3 RPM for free tier
   */
  OPENAI_FREE: {
    maxRequests: 3,
    windowMs: 60000,
    minDelayMs: 20000,
    name: 'OpenAI-Free',
  } as RateLimiterConfig,

  /**
   * Ollama: Local, no limits but avoid overwhelming
   */
  OLLAMA: {
    maxRequests: 10,
    windowMs: 1000,
    minDelayMs: 100,
    name: 'Ollama',
  } as RateLimiterConfig,

  /**
   * Generic conservative rate limiter
   */
  CONSERVATIVE: {
    maxRequests: 10,
    windowMs: 60000,
    minDelayMs: 6000,
    name: 'Conservative',
  } as RateLimiterConfig,
};
