"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, analytics } from "@/lib/analytics";

/**
 * Boots PostHog on mount and records a pageview on every App Router navigation.
 * Autocapture (clicks, inputs) is handled automatically by posthog-js once
 * initialized — this only adds the SPA pageviews the App Router doesn't emit.
 *
 * Uses usePathname only (not useSearchParams) so it doesn't force a Suspense
 * boundary around the whole app; window.location.href still carries any query.
 */
export default function PostHogProvider({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    analytics.pageview();
  }, [pathname]);

  return children;
}
