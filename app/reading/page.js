"use client";

import { BookOpen, FileText, ListChecks, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { READING_THEME } from "@/lib/moduleColors";
import ExamListPage from "@/components/ExamListPage";

export default function ReadingTestsPage() {
  return (
    <ExamListPage
      moduleKey="reading"
      title="Reading Tests"
      subtitle="Practice IELTS Academic Reading passages with every question type and detailed answer review."
      accent={READING_THEME.accent}
      accentSoft={READING_THEME.soft}
      gradient={READING_THEME.gradient}
      icon={<BookOpen size={30} color="#fff" />}
      duration="~60 min"
      facts={[
        { icon: <Clock size={12} />, label: "Duration", value: "60 min" },
        { icon: <Sparkles size={12} />, label: "Scoring", value: "Instant band" },
      ]}
      fetchTests={() => api.getReadingTests()}
      fetchAttempts={() => api.getReadingAttempts()}
      startPath={(test) => `/reading/${test.id}`}
      getDescription={(test) => (test.test_type === "academic" ? "Academic Reading" : "General Training Reading")}
      getMeta={(test) => [
        { icon: <FileText size={12} />, label: `${test.passage_count} passage${test.passage_count !== 1 ? "s" : ""}` },
        { icon: <ListChecks size={12} />, label: `${test.question_count} question${test.question_count !== 1 ? "s" : ""}` },
      ]}
    />
  );
}
