/**
 * Structured Logger
 *
 * Centralized logging with levels, structured output, and correlation IDs.
 * - JSON output in production for log aggregation
 * - Human-readable output in development
 * - Configurable via LOG_LEVEL env var
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

export interface LogContext {
  service?: string
  requestId?: string
  duration?: number
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  context?: Record<string, unknown>
}

function getMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase()
  if (envLevel && envLevel in LOG_LEVELS) return envLevel as LogLevel
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()]
}

function formatDev(entry: LogEntry): string {
  const levelIcons: Record<LogLevel, string> = {
    debug: '🔍',
    info: '📋',
    warn: '⚠️',
    error: '❌',
  }

  const icon = levelIcons[entry.level]
  const prefix = `[${entry.service}]`
  const contextStr = entry.context && Object.keys(entry.context).length > 0
    ? ` ${JSON.stringify(entry.context)}`
    : ''

  return `${icon} ${prefix} ${entry.message}${contextStr}`
}

export class Logger {
  private service: string

  constructor(service: string) {
    this.service = service
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      context: context ? { ...context } : undefined,
    }

    if (isProduction()) {
      // JSON structured output for log aggregation
      const output = level === 'error' || level === 'warn' ? console.error : console.log
      output(JSON.stringify(entry))
    } else {
      // Human-readable output for development
      const formatted = formatDev(entry)
      switch (level) {
        case 'error': console.error(formatted); break
        case 'warn': console.warn(formatted); break
        default: console.log(formatted)
      }
    }
  }
}

/**
 * Create a logger instance for a specific service
 */
export function createLogger(service: string): Logger {
  return new Logger(service)
}

// Re-export for convenience
export { shouldLog as _shouldLog, getMinLevel as _getMinLevel }
