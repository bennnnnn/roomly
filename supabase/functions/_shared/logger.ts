type LogLevel = 'info' | 'warn' | 'error';

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ?? {}),
  };
  // Edge Functions route console.log to the Supabase logs dashboard.
  // console.error for errors so they surface in the error-rate metric.
  const fn = level === 'error' ? console.error : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => formatLog('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => formatLog('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    formatLog('error', message, context),
};
