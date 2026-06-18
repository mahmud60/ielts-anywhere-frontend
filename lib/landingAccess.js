/**
 * Defensive helpers for landing-page CTAs and navbar.
 * Aligns with dashboard `is_pro` and admin `is_admin` from api.getMe().
 */

const PROFILE_CACHE_KEY = "ielts_profile_cache";

export function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || "null"); } catch { return null; }
}

export function setCachedProfile(profile) {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)); } catch {}
}

export function isProUser(profile) {
  if (!profile) return false;
  if (profile.is_pro === true || profile.isPro === true) return true;

  const possibleTier =
    profile.subscription_tier ||
    profile.subscriptionTier ||
    profile.subscription ||
    profile.plan ||
    profile.tier;

  const tier = String(possibleTier || "").toLowerCase();
  return tier === "pro" || tier === "premium";
}

export function isAdminUser(profile) {
  if (!profile) return false;
  return profile.is_admin === true || profile.isAdmin === true;
}

/** Guest → login; authenticated → diagnostic tests route. */
export function getDiagnosticHref(isAuthenticated) {
  return isAuthenticated ? "/diagnostic" : "/login";
}

/** Pro → full mock; Free authenticated → pricing; guest → login. */
export function getFullMockHref(isAuthenticated, isPro, profileReady) {
  if (!isAuthenticated) return "/login";
  if (!profileReady) return "/dashboard";
  return isPro ? "/tests?mode=full_mock" : "/pricing";
}

export function getListeningCta(isAuthenticated) {
  if (!isAuthenticated) {
    return { href: "/login", label: "Start Practice" };
  }
  return { href: "/listening", label: "Practice Listening" };
}

export function getReadingCta(isAuthenticated) {
  if (!isAuthenticated) {
    return { href: "/login", label: "Start Practice" };
  }
  return { href: "/reading", label: "Practice Reading" };
}

export function getWritingSpeakingCta(isAuthenticated, isPro, profileReady) {
  if (!isAuthenticated) {
    return { href: "/login", label: "Try in Full Mock" };
  }
  if (!profileReady) {
    return { href: "/dashboard", label: "Go to Dashboard" };
  }
  if (isPro) {
    return { href: "/tests?mode=full_mock", label: "Start Full Mock" };
  }
  return { href: "/pricing", label: "Unlock AI Feedback" };
}
