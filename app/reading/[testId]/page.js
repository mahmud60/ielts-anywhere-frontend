"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import ReadingModule from "@/components/ReadingModule";
import { getClientApiBase } from "@/lib/clientApiBase";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";
import { analytics } from "@/lib/analytics";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken();
}

export default function StandaloneReadingPage() {
  const { testId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && testId) analytics.capture("test_started", { module: "reading", test_id: testId });
  }, [user, testId]);

  if (loading || !user) {
    return <PetLoader fixed label="is loading your test" accent={MOD_COLORS.reading} />;
  }

  return (
    <ReadingModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={testId}
      onBack={() => router.push("/reading")}
    />
  );
}