import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Sample 10% of transactions for performance
  tracesSampleRate: 0.1,

  // Don't send PII
  sendDefaultPii: false,
})
