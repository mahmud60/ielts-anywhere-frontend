"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./AuthContext";
import { getCachedProfile, setCachedProfile } from "./landingAccess";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Profile loader with zero-flash Pro/Free gating.
 *
 * - Reads the cached profile synchronously before the first browser paint, so
 *   pages render the correct Pro/Free state immediately (no loading flash).
 * - Revalidates via `api.getMe()` once Firebase auth is ready, refreshing the
 *   localStorage cache for the next navigation.
 *
 * `ready` flips true after the initial cache read (first layout effect). Gate
 * any Pro/Free-dependent UI on `ready` so SSR emits a neutral shell and the
 * first real paint already reflects the cached state.
 *
 * `settled` flips true once the network revalidation finishes (success OR
 * failure), or immediately when there is no signed-in user. Hard-gate pages
 * that must block on a definitive answer can wait on
 * `profile === null && !settled` — this still renders instantly from cache
 * when a cached profile exists, but avoids bouncing a not-yet-loaded user.
 *
 * @returns {{ profile: object|null, ready: boolean, settled: boolean }}
 */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [fetchSettled, setFetchSettled] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const cached = getCachedProfile();
    if (cached) setProfile(cached);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api
      .getMe()
      .then((d) => {
        if (!cancelled) {
          setProfile(d);
          setCachedProfile(d);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetchSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // With no signed-in user there is nothing to fetch, so we are already
  // "settled". Derived (not stored) to avoid a synchronous setState in effect.
  return { profile, ready, settled: fetchSettled || !user };
}
