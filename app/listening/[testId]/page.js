"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import ListeningModule from "@/components/ListeningModule";
import { getClientApiBase } from "@/lib/clientApiBase";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken(true);
}

export default function StandaloneListeningPage() {
  const { testId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <ListeningModule
      apiBase={getClientApiBase()}
      getToken={getToken}
      testId={testId}
      onBack={() => router.push("/listening")}
    />
  );
}