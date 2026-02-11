import { env } from '../config/env';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

function normalizeLevel(level: string): LogLevel {
  const upper = level.toUpperCase();
  if (upper === 'DEBUG' || upper === 'INFO' || upper === 'WARN' || upper === 'ERROR') {
    return upper;
  }
  return 'INFO';
}

class Logger {
  private readonly minLevel: LogLevel;

  constructor(level: string) {
    this.minLevel = normalizeLevel(level);
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
  }

  private write(level: LogLevel, context: string, message: string, meta?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
      time: new Date().toISOString(),
      level,
      context,
      message,
      meta
    };

    const payload = JSON.stringify(entry);

    if (level === 'ERROR') {
      console.error(payload);
      return;
    }

    if (level === 'WARN') {
      console.warn(payload);
      return;
    }

    console.log(payload);
  }

  debug(context: string, message: string, meta?: unknown): void {
    this.write('DEBUG', context, message, meta);
  }

  info(context: string, message: string, meta?: unknown): void {
    this.write('INFO', context, message, meta);
  }

  warn(context: string, message: string, meta?: unknown): void {
    this.write('WARN', context, message, meta);
  }

  error(context: string, message: string, meta?: unknown): void {
    this.write('ERROR', context, message, meta);
  }
}

export const logger = new Logger(env.LOG_LEVEL);
