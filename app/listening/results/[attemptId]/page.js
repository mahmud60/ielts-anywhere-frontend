"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ListeningModule from "@/components/ListeningModule";
import { getClientApiBase } from "@/lib/clientApiBase";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken(true);
}

export default function ListeningResultPage() {
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
    api.getListeningAttempt(attemptId)
      .then(setAttempt)
      .catch(e => setErr(e.message));
  }, [user, attemptId]);

  if (loading || (!attempt && !err)) {
    return <PetLoader fixed label="is opening your report" accent={MOD_COLORS.listening} />;
  }
  if (err) return <p style={{ padding: 32, fontFamily: "system-ui", color: "#dc2626" }}>{err}</p>;

  return (
    <ListeningModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={attempt.test_id}
      initialResult={attempt}
      onBack={() => { if (window.history.length > 1) router.back(); else router.push("/reports"); }}
    />
  );
}