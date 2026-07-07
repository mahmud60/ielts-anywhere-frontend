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
      {
        // Serve Firebase Auth's handler from our own domain so Google sign-in
        // works on the custom domain — proxied to the ielts-anywhere project's
        // Firebase auth domain.
        source: "/__/auth/:path*",
        destination: "https://ielts-anywhere.firebaseapp.com/__/auth/:path*",
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
