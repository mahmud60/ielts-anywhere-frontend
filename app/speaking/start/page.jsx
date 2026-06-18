"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isProUser, getCachedProfile, setCachedProfile } from "@/lib/landingAccess";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";

const SpeakingSession = dynamic(
  () => import("@/components/SpeakingSession"),
  { ssr: false }
);

export default function SpeakingStartPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(() => getCachedProfile());
  const [checking, setChecking] = useState(() => getCachedProfile() === null);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!user) return;
    api.getMe()
      .then(me => { setProfile(me); setCachedProfile(me); setChecking(false); })
      .catch(() => setChecking(false));
  }, [user, loading, router]);

  if (loading || checking) {
    return <PetLoader fixed label="is warming up" accent={MOD_COLORS.speaking} />;
  }

  if (!isProUser(profile)) {
    router.replace("/pricing");
    return null;
  }

  return <SpeakingSession />;
}
