import * as Sentry from "@sentry/nextjs";

// No DSN → no-op. Captures errors in the edge runtime (middleware, etc.).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
});
