"use client";

import dynamic from "next/dynamic";

const SpeakingSession = dynamic(
  () => import("@/components/SpeakingSession"),
  { ssr: false }
);

export default function SpeakingStartPage() {
  return <SpeakingSession />;
}
