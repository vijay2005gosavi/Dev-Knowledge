/**
 * Singleton logger utility for application logging.
 * @description Provides centralized logging with different levels and timestamps.
 */
export class LoggerUtils {
  /** Singleton instance of the logger */
  private static instance: LoggerUtils

  /**
   * Private constructor for singleton pattern.
   * @description Prevents direct instantiation.
   */
  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Gets the singleton instance of LoggerUtils.
   * @description Creates and returns the single instance.
   * @returns The singleton LoggerUtils instance
   */
  static getInstance(): LoggerUtils {
    LoggerUtils.instance ??= new LoggerUtils()
    return LoggerUtils.instance
  }

  /**
   * Formats log messages with timestamp and level.
   * @description Creates formatted log message with ISO timestamp.
   * @param level - The log level (DEBUG, INFO, WARN, ERROR)
   * @param message - The log message to format
   * @returns Formatted log message string
   */
  private formatMessage(level: string, message: string): string {
    const timestamp: string = new Date().toISOString()
    return `(${timestamp}) [${level}] ${message}`
  }

  /**
   * Logs a debug message.
   * @description Outputs debug level log message.
   * @param message - The debug message to log
   * @param args - Additional arguments to include in the log
   */
  debug(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage('DEBUG', message), ...args)
  }

  /**
   * Logs an info message.
   * @description Outputs info level log message.
   * @param message - The info message to log
   * @param args - Additional arguments to include in the log
   */
  info(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage('INFO', message), ...args)
  }

  /**
   * Logs a warning message.
   * @description Outputs warning level log message.
   * @param message - The warning message to log
   * @param args - Additional arguments to include in the log
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('WARN', message), ...args)
  }

  /**
   * Logs an error message.
   * @description Outputs error level log message.
   * @param message - The error message to log
   * @param args - Additional arguments to include in the log
   */
  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('ERROR', message), ...args)
  }
}
