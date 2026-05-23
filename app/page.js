"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  return <LandingPage />;
}
