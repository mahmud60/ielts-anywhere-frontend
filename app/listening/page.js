"use client";

import { Headphones, Layers, ListChecks, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import ExamListPage from "@/components/ExamListPage";

const ACCENT = "#0ea5e9";

export default function ListeningTestsPage() {
  return (
    <ExamListPage
      moduleKey="listening"
      title="Listening Tests"
      subtitle="Train with authentic, exam-style audio and a full range of IELTS question types — at your own pace."
      accent={ACCENT}
      accentSoft="#e0f2fe"
      gradient="linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)"
      icon={<Headphones size={30} color="#fff" />}
      duration="~30 min"
      facts={[
        { icon: <Clock size={12} />, label: "Duration", value: "30 min" },
        { icon: <Sparkles size={12} />, label: "Scoring", value: "Instant band" },
      ]}
      fetchTests={() => api.getListeningTests()}
      startPath={(test) => `/listening/${test.id}`}
      getDescription={(test) => test.description || ""}
      getMeta={(test) => [
        { icon: <Layers size={12} />, label: `${test.section_count} section${test.section_count !== 1 ? "s" : ""}` },
        { icon: <ListChecks size={12} />, label: `${test.question_count} question${test.question_count !== 1 ? "s" : ""}` },
      ]}
    />
  );
}
