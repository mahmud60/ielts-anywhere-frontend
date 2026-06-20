import posthog from "posthog-js";

// PostHog "Project API Key" — write-only, safe to expose to the browser.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/** True once a key is configured; everything below no-ops without it. */
export const isAnalyticsConfigured = Boolean(KEY);

let initialized = false;

/** Initialize PostHog once, on the client. Safe to call repeatedly. */
export function initAnalytics() {
  if (initialized || typeof window === "undefined" || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    // We send $pageview manually on App Router route changes (see PostHogProvider).
    capture_pageview: false,
    // Only create person profiles for users we identify (keeps anon volume/cost down).
    person_profiles: "identified_only",
  });
  initialized = true;
}

const ready = () => initialized && typeof window !== "undefined" && KEY;

/**
 * App-wide analytics facade. Import `{ analytics }` and call these anywhere —
 * they silently no-op when PostHog isn't configured, so call sites never need
 * their own guards.
 */
export const analytics = {
  /** Record a custom event, e.g. analytics.capture("upgrade_clicked", { source }). */
  capture(event, props) {
    if (!ready()) return;
    posthog.capture(event, props);
  },

  /** Tie subsequent events to a user (Firebase UID) and set/merge person props. */
  identify(id, props) {
    if (!ready() || !id) return;
    posthog.identify(id, props);
  },

  /** Merge person properties for the already-identified user. */
  setUserProps(props) {
    if (!ready() || !props) return;
    posthog.setPersonProperties(props);
  },

  /** Clear identity on logout so the next user starts a fresh session. */
  reset() {
    if (!ready()) return;
    posthog.reset();
  },

  /** Manual pageview (App Router doesn't auto-fire these). */
  pageview() {
    if (!ready()) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  },
};
