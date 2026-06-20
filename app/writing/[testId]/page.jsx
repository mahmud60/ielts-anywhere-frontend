"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import WritingModule from "@/components/WritingModule";
import { getClientApiBase } from "@/lib/clientApiBase";
import { api } from "@/lib/api";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";
import { analytics } from "@/lib/analytics";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken();
}

function isProUser(profile) {
  if (!profile) return false;
  if (profile.is_pro === true || profile.isPro === true) return true;
  const tier = String(
    profile.subscription_tier || profile.subscriptionTier ||
    profile.subscription || profile.plan || profile.tier || ""
  ).toLowerCase();
  return tier === "pro" || tier === "premium";
}

export default function StandaloneWritingPage() {
  const { testId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getMe()
      .then(setProfile)
      .catch(() => setProfile({}))
      .finally(() => setProfileLoading(false));
  }, [user]);

  useEffect(() => {
    if (!profileLoading && profile !== null && !isProUser(profile)) {
      router.replace("/pricing");
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (testId && !profileLoading && isProUser(profile)) {
      analytics.capture("test_started", { module: "writing", test_id: testId });
    }
  }, [testId, profileLoading, profile]);

  if (loading || profileLoading || !user) {
    return <PetLoader fixed label="is loading your test" accent={MOD_COLORS.writing} />;
  }
  if (!isProUser(profile)) return null;

  return (
    <WritingModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={testId}
    />
  );
}