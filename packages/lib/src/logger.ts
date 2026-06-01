/**
 * Logger with a pluggable adapter slot.
 *
 * Construct a logger by passing zero or more adapters. With no adapters
 * the logger is a no-op — safe default for tests, CI, and pre-env-var dev.
 * Slice 1D will plug in Sentry (warn/error) and PostHog (info/debug as
 * events) adapters; no app code imports those SDKs directly so we can swap
 * providers without a sweep.
 *
 * Loggers MUST NOT throw into business code, ever. An adapter that throws
 * is silently dropped for that one call (visible by adding a console
 * fallback adapter in dev).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Free-form structured context. Adapter is responsible for serializing safely. */
export type LogContext = Record<string, unknown>;

export interface LogAdapter {
  log(level: LogLevel, message: string, context?: LogContext): void;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export interface CreateLoggerOptions {
  adapters?: LogAdapter[];
  /** Minimum level emitted. Default `'info'` (debug requires explicit opt-in). */
  minLevel?: LogLevel;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const adapters = opts.adapters ?? [];
  const minLevel = opts.minLevel ?? 'info';
  const threshold = LEVEL_PRIORITY[minLevel];

  function emit(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_PRIORITY[level] < threshold) return;
    for (const adapter of adapters) {
      try {
        adapter.log(level, message, context);
      } catch {
        // Deliberate: a broken adapter must not crash the caller. The error
        // is unobservable here — surface it by adding a console adapter
        // alongside the failing one.
      }
    }
  }

  return {
    debug: (m, c) => emit('debug', m, c),
    info: (m, c) => emit('info', m, c),
    warn: (m, c) => emit('warn', m, c),
    error: (m, c) => emit('error', m, c),
  };
}

/**
 * Convenience: a console adapter (useful as a dev fallback).
 *
 * This module is the one place in the codebase that legitimately routes to
 * console methods on purpose — every other call site should go through the
 * logger. The targeted disable below documents that exemption.
 */
/* eslint-disable no-console */
export const consoleAdapter: LogAdapter = {
  log(level, message, context) {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.info;
    if (context === undefined) fn(`[${level}] ${message}`);
    else fn(`[${level}] ${message}`, context);
  },
};
/* eslint-enable no-console */
