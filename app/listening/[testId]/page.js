"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import ListeningModule from "@/components/ListeningModule";
import PetLoader from "@/components/PetLoader";
import { getClientApiBase } from "@/lib/clientApiBase";
import { MOD_COLORS } from "@/lib/moduleColors";
import { analytics } from "@/lib/analytics";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken();
}

export default function StandaloneListeningPage() {
  const { testId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && testId) analytics.capture("test_started", { module: "listening", test_id: testId });
  }, [user, testId]);

  if (loading || !user) {
    return <PetLoader fixed label="is loading your test" accent={MOD_COLORS.listening} />;
  }

  return (
    <ListeningModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={testId}
      onBack={() => router.push("/listening")}
    />
  );
}