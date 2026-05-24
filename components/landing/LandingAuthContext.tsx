"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isAdminUser, isProUser } from "@/lib/landingAccess";

type LandingAuthValue = {
  user: ReturnType<typeof useAuth>["user"];
  authLoading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  isAdmin: boolean;
  /** Auth resolved and profile fetch finished (or skipped for guests). */
  isReady: boolean;
};

const LandingAuthContext = createContext<LandingAuthValue | null>(null);

export function LandingAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    (async () => {
      setProfileLoading(true);
      setProfile(null);
      try {
        const data = await api.getMe();
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isAuthenticated = !!user;
  const effectiveProfile = isAuthenticated ? profile : null;
  const isPro = isProUser(effectiveProfile);
  const isAdmin = isAdminUser(effectiveProfile);
  const isReady = !authLoading && (!isAuthenticated || !profileLoading);

  return (
    <LandingAuthContext.Provider
      value={{
        user,
        authLoading,
        profileLoading,
        isAuthenticated,
        isPro,
        isAdmin,
        isReady,
      }}
    >
      {children}
    </LandingAuthContext.Provider>
  );
}

export function useLandingAuth() {
  const ctx = useContext(LandingAuthContext);
  if (!ctx) {
    throw new Error("useLandingAuth must be used within LandingAuthProvider");
  }
  return ctx;
}
