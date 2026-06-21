import * as Sentry from "@sentry/nextjs";

// No DSN → Sentry.init is a no-op, so this is safe before Sentry is configured.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Errors only — no performance-tracing overhead or cost.
  tracesSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
