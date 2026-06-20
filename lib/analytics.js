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
  try {
    posthog.init(KEY, {
      api_host: HOST,
      // We send $pageview manually on App Router route changes (see PostHogProvider).
      capture_pageview: false,
      // Only create person profiles for users we identify (keeps anon volume/cost down).
      person_profiles: "identified_only",
    });
    initialized = true;
  } catch {
    // Bad key/host or SDK failure — leave analytics disabled rather than break boot.
  }
}

const ready = () => initialized && typeof window !== "undefined" && KEY;

// Analytics is non-critical telemetry: a PostHog failure must never bubble into
// a click handler, effect, or render. Every SDK call goes through this.
function safe(fn) {
  try {
    fn();
  } catch {
    /* swallow — never let analytics break the app */
  }
}

/**
 * App-wide analytics facade. Import `{ analytics }` and call these anywhere —
 * they silently no-op when PostHog isn't configured, so call sites never need
 * their own guards.
 */
export const analytics = {
  /** Record a custom event, e.g. analytics.capture("upgrade_clicked", { source }). */
  capture(event, props) {
    if (!ready()) return;
    safe(() => posthog.capture(event, props));
  },

  /** Tie subsequent events to a user (Firebase UID) and set/merge person props. */
  identify(id, props) {
    if (!ready() || !id) return;
    safe(() => posthog.identify(id, props));
  },

  /** Merge person properties for the already-identified user. */
  setUserProps(props) {
    if (!ready() || !props) return;
    safe(() => posthog.setPersonProperties(props));
  },

  /** Clear identity on logout so the next user starts a fresh session. */
  reset() {
    if (!ready()) return;
    safe(() => posthog.reset());
  },

  /** Manual pageview (App Router doesn't auto-fire these). */
  pageview() {
    if (!ready()) return;
    safe(() => posthog.capture("$pageview", { $current_url: window.location.href }));
  },
};
