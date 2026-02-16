/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger, Logger, _shouldLog, _getMinLevel } from '../logger'

// Helper to safely set NODE_ENV in tests (readonly in TS but writable at runtime)
const env = process.env as Record<string, string | undefined>

describe('Logger', () => {
  const originalNodeEnv = env.NODE_ENV
  const originalLogLevel = env.LOG_LEVEL

  beforeEach(() => {
    env.NODE_ENV = 'development'
    delete env.LOG_LEVEL
  })

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv
    if (originalLogLevel !== undefined) {
      env.LOG_LEVEL = originalLogLevel
    } else {
      delete env.LOG_LEVEL
    }
    vi.restoreAllMocks()
  })

  describe('createLogger', () => {
    it('creates a Logger instance', () => {
      const logger = createLogger('TEST')
      expect(logger).toBeInstanceOf(Logger)
    })
  })

  describe('log levels', () => {
    it('defaults to debug in development', () => {
      env.NODE_ENV = 'development'
      delete env.LOG_LEVEL
      expect(_getMinLevel()).toBe('debug')
    })

    it('defaults to info in production', () => {
      env.NODE_ENV = 'production'
      delete env.LOG_LEVEL
      expect(_getMinLevel()).toBe('info')
    })

    it('respects LOG_LEVEL env var', () => {
      env.LOG_LEVEL = 'warn'
      expect(_getMinLevel()).toBe('warn')
    })

    it('filters debug when level is info', () => {
      env.LOG_LEVEL = 'info'
      expect(_shouldLog('debug')).toBe(false)
      expect(_shouldLog('info')).toBe(true)
      expect(_shouldLog('warn')).toBe(true)
      expect(_shouldLog('error')).toBe(true)
    })

    it('filters below warn when level is warn', () => {
      env.LOG_LEVEL = 'warn'
      expect(_shouldLog('debug')).toBe(false)
      expect(_shouldLog('info')).toBe(false)
      expect(_shouldLog('warn')).toBe(true)
      expect(_shouldLog('error')).toBe(true)
    })
  })

  describe('output', () => {
    it('logs info messages in dev format', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger('CRON')

      logger.info('Lock acquired')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0]).toContain('[CRON]')
      expect(spy.mock.calls[0][0]).toContain('Lock acquired')
    })

    it('logs error messages via console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const logger = createLogger('DB')

      logger.error('Connection failed')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0]).toContain('[DB]')
      expect(spy.mock.calls[0][0]).toContain('Connection failed')
    })

    it('logs warn messages via console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const logger = createLogger('API')

      logger.warn('Rate limited')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0]).toContain('[API]')
    })

    it('includes context in dev output', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger('CRON')

      logger.info('Job done', { duration: 1500, requestId: 'abc-123' })

      expect(spy.mock.calls[0][0]).toContain('duration')
      expect(spy.mock.calls[0][0]).toContain('1500')
    })

    it('outputs JSON in production', () => {
      env.NODE_ENV = 'production'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger('CRON')

      logger.info('Job started')

      const output = spy.mock.calls[0][0]
      const parsed = JSON.parse(output)
      expect(parsed.level).toBe('info')
      expect(parsed.service).toBe('CRON')
      expect(parsed.message).toBe('Job started')
      expect(parsed.timestamp).toBeDefined()
    })

    it('skips debug in production without LOG_LEVEL override', () => {
      env.NODE_ENV = 'production'
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger('TEST')

      logger.debug('Should not appear')

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
