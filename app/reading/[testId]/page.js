"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import ReadingModule from "@/components/ReadingModule";
import { getClientApiBase } from "@/lib/clientApiBase";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";

function getToken() {
  if (!auth?.currentUser) return Promise.reject(new Error("Not signed in"));
  return auth.currentUser.getIdToken(true);
}

export default function StandaloneReadingPage() {
  const { testId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

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