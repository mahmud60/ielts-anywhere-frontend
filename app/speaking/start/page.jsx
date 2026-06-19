"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/AuthContext";
import { isProUser } from "@/lib/landingAccess";
import { useProfile } from "@/lib/useProfile";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";

const SpeakingSession = dynamic(
  () => import("@/components/SpeakingSession"),
  { ssr: false }
);

export default function SpeakingStartPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { profile, settled } = useProfile();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Block until we have a definitive answer: renders instantly from cache when
  // present, otherwise waits for the network so a Pro user is never bounced.
  if (loading || (profile === null && !settled)) {
    return <PetLoader fixed label="is warming up" accent={MOD_COLORS.speaking} />;
  }

  if (!isProUser(profile)) {
    router.replace("/pricing");
    return null;
  }

  return <SpeakingSession />;
}
