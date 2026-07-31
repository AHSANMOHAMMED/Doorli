import * as Sentry from '@sentry/node';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  enabled?: boolean;
}

const defaultConfig: SentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
};

export function initSentry(config: SentryConfig = {}): void {
  const mergedConfig = { ...defaultConfig, ...config };

  if (!mergedConfig.dsn && !mergedConfig.enabled) {
    console.log('[Sentry] Disabled (no DSN provided)');
    return;
  }

  Sentry.init({
    dsn: mergedConfig.dsn,
    environment: mergedConfig.environment,
    tracesSampleRate: mergedConfig.tracesSampleRate,
    enabled: mergedConfig.enabled,
  });

  console.log(`[Sentry] Initialized for ${mergedConfig.environment}`);
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

export { Sentry };
