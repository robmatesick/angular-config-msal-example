import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

/**
 * Log level enum defining the hierarchy of logging levels
 */
export enum LogLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

/**
 * Custom logging service that filters log messages based on configured log level
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private currentLogLevel: LogLevel = LogLevel.INFO; // Default level until config loaded

  constructor(private configService: ConfigService) {
    this.initializeLogLevel();
  }

  /**
   * Initialize the log level from application configuration
   */
  private async initializeLogLevel(): Promise<void> {
    try {
      const logLevelString = await this.configService.getLogLevel();
      this.currentLogLevel = this.getLogLevelFromString(logLevelString);
      this.debug(`Logging initialized with level: ${LogLevel[this.currentLogLevel]}`);
    } catch (error) {
      console.error('Failed to initialize logging level from config:', error);
      // Keep the default log level
    }
  }

  /**
   * Convert string log level from config to LogLevel enum
   */
  private getLogLevelFromString(logLevelString: string): LogLevel {
    const normalizedLevel = logLevelString.toUpperCase();
    
    switch (normalizedLevel) {
      case 'OFF': return LogLevel.OFF;
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default:
        console.warn(`Unknown log level "${logLevelString}", defaulting to INFO`);
        return LogLevel.INFO;
    }
  }

  /**
   * Check if the specified log level is enabled based on current config
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return level <= this.currentLogLevel;
  }

  /**
   * Format the log message with timestamp and optional prefix
   */
  private formatMessage(message: string, prefix?: string): string {
    const timestamp = new Date().toISOString();
    return prefix ? `[${timestamp}] [${prefix}] ${message}` : `[${timestamp}] ${message}`;
  }

  /**
   * Log an error message
   */
  error(message: string, ...data: any[]): void {
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      console.error(this.formatMessage(message, 'ERROR'), ...data);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...data: any[]): void {
    if (this.isLevelEnabled(LogLevel.WARN)) {
      console.warn(this.formatMessage(message, 'WARN'), ...data);
    }
  }

  /**
   * Log an informational message
   */
  info(message: string, ...data: any[]): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      console.info(this.formatMessage(message, 'INFO'), ...data);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...data: any[]): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(message, 'DEBUG'), ...data);
    }
  }

  /**
   * Log a trace message
   */
  trace(message: string, ...data: any[]): void {
    if (this.isLevelEnabled(LogLevel.TRACE)) {
      console.log(this.formatMessage(message, 'TRACE'), ...data);
    }
  }

  /**
   * Log a message at the specified level
   */
  log(level: LogLevel, message: string, ...data: any[]): void {
    switch(level) {
      case LogLevel.ERROR:
        this.error(message, ...data);
        break;
      case LogLevel.WARN:
        this.warn(message, ...data);
        break;
      case LogLevel.INFO:
        this.info(message, ...data);
        break;
      case LogLevel.DEBUG:
        this.debug(message, ...data);
        break;
      case LogLevel.TRACE:
        this.trace(message, ...data);
        break;
      default:
        // Do nothing if level is OFF or unknown
        break;
    }
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  /**
   * Update the log level programmatically
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    this.debug(`Log level updated to: ${LogLevel[level]}`);
  }
} 