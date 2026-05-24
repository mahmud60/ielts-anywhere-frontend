"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import ReadingModule from "@/components/ReadingModule";

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

  if (loading || !user) return null;

  return (
    <ReadingModule
      apiBase={process.env.NEXT_PUBLIC_API_BASE}
      getToken={getToken}
      testId={testId}
      onBack={() => router.push("/reading")}
    />
  );
}