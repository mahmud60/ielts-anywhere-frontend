"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ReadingModule from "@/components/ReadingModule";
import { getClientApiBase } from "@/lib/clientApiBase";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";
import DashboardShell from "@/components/DashboardShell";
import ErrorState from "@/components/ErrorState";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken(true);
}

export default function ReadingResultPage() {
  const { attemptId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getReadingAttempt(attemptId)
      .then(setAttempt)
      .catch(e => setErr(e.message));
  }, [user, attemptId]);

  if (loading || (!attempt && !err)) {
    return <PetLoader fixed label="is opening your report" accent={MOD_COLORS.reading} />;
  }
  if (err) {
    const errType = err.includes("not found") || err.includes("404")
      ? "not_found"
      : err.includes("AI") || err.includes("unavailable")
      ? "ai_unavailable"
      : "error";
    return (
      <DashboardShell title="Reading Results">
        <ErrorState type={errType} message={err} backHref="/reports" backLabel="Back to Reports" />
      </DashboardShell>
    );
  }

  return (
    <ReadingModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={attempt.test_id}
      initialResult={attempt}
      onBack={() => { if (window.history.length > 1) router.back(); else router.push("/reports"); }}
    />
  );
}