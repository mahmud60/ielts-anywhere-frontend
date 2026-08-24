"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect, useRef, useCallback } from "react";
import ReadingModule from "@/components/ReadingModule";
import { getClientApiBase } from "@/lib/clientApiBase";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";
import { analytics } from "@/lib/analytics";
import { useStandaloneTimer } from "@/lib/useStandaloneTimer";
import { STANDALONE_TIME_LIMITS } from "@/lib/standaloneTimeLimits";

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

  // Time-up submits the answers, as in a real exam. ReadingModule points this
  // ref at its own handleSubmit once the test has loaded.
  const autoSubmitRef = useRef(null);
  const handleExpire = useCallback(() => { autoSubmitRef.current?.(); }, []);

  const { formatted, isWarning, isDanger } = useStandaloneTimer({
    seconds: STANDALONE_TIME_LIMITS.reading,
    enabled: !!user && !!testId,
    onExpire: handleExpire,
  });

  if (loading || !user) {
    return <PetLoader fixed label="is loading your test" accent={MOD_COLORS.reading} />;
  }

  return (
    <ReadingModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={testId}
      autoSubmitRef={autoSubmitRef}
      timerFormatted={formatted}
      timerWarning={isWarning}
      timerDanger={isDanger}
      onBack={() => router.push("/reading")}
    />
  );
}