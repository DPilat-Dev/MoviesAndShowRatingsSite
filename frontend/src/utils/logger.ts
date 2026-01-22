/**
 * Logging utility for consistent logging across the application
 * Can be extended to send logs to external services in production
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private isProduction: boolean = import.meta.env.PROD
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  private constructor() {
    // Set log level from environment variable if available
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL
    if (envLogLevel && Object.values(LogLevel).includes(envLogLevel as LogLevel)) {
      this.logLevel = envLogLevel as LogLevel
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private addLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    }

    // Add to in-memory logs
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log to console in development
    if (!this.isProduction) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' :
                          level === LogLevel.WARN ? 'warn' :
                          level === LogLevel.INFO ? 'info' : 'debug'
      
      const prefix = `[${level.toUpperCase()}]`
      if (error) {
        console[consoleMethod](prefix, message, context || '', error)
      } else if (context) {
        console[consoleMethod](prefix, message, context)
      } else {
        console[consoleMethod](prefix, message)
      }
    }

    // In production, you could send logs to external service here
    if (this.isProduction && level === LogLevel.ERROR) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(_entry: LogEntry): void {
    // This is where you would integrate with external logging services
    // like Sentry, LogRocket, Datadog, etc.
    // For now, we'll just keep it in memory
    // Example: Sentry.captureException(entry.error || new Error(entry.message))
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(LogLevel.DEBUG, message, context)
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(LogLevel.INFO, message, context)
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(LogLevel.WARN, message, context)
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(LogLevel.ERROR, message, context, error)
    }
  }

  // API request logging
  logApiRequest(method: string, url: string, status: number, duration?: number): void {
    const context = {
      method,
      url,
      status,
      duration,
    }
    
    if (status >= 500) {
      this.error(`API Error ${status}: ${method} ${url}`, undefined, context)
    } else if (status >= 400) {
      this.warn(`API Client Error ${status}: ${method} ${url}`, context)
    } else {
      this.info(`API ${method} ${url} - ${status}`, context)
    }
  }

  // User action logging
  logUserAction(action: string, userId?: string, details?: Record<string, any>): void {
    const context = {
      action,
      userId,
      ...details,
    }
    this.info(`User Action: ${action}`, context)
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(limit: number = 50): LogEntry[] {
    return this.logs.slice(-limit)
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  // Get current log level
  getLogLevel(): LogLevel {
    return this.logLevel
  }
}

// Export singleton instance
export const logger = Logger.getInstance()