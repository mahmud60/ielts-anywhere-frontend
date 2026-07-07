import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "https://fastapi-xbk5edja3a-uc.a.run.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

// Only apply Sentry's build plugin when a DSN is configured, so local and
// not-yet-configured builds are unaffected. Source maps upload only when a
// SENTRY_AUTH_TOKEN is present (otherwise it's silently skipped).
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
    })
  : nextConfig;
