"use client";

import { BookOpen, FileText, ListChecks, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { READING_THEME } from "@/lib/moduleColors";
import { useLang } from "@/lib/i18n";
import ExamListPage from "@/components/ExamListPage";

export default function ReadingTestsPage() {
  const { lang, t } = useLang();
  return (
    <ExamListPage
      moduleKey="reading"
      title={t.readingTestsTitle}
      subtitle={t.readingSubtitle}
      accent={READING_THEME.accent}
      accentSoft={READING_THEME.soft}
      gradient={READING_THEME.gradient}
      icon={<BookOpen size={30} color="#fff" />}
      duration={t.approxMin60}
      facts={[
        { icon: <Clock size={12} />, label: t.duration, value: t.min60 },
        { icon: <Sparkles size={12} />, label: t.scoring, value: t.instant },
      ]}
      fetchTests={() => api.getReadingTests()}
      startPath={(test) => `/reading/${test.id}`}
      getDescription={(test) => (test.test_type === "academic"
        ? (lang === "bn" ? "একাডেমিক রিডিং" : "Academic Reading")
        : (lang === "bn" ? "জেনারেল ট্রেনিং রিডিং" : "General Training Reading"))}
      getMeta={(test) => [
        { icon: <FileText size={12} />, label: `${test.passage_count} ${test.passage_count !== 1 ? t.passagePluralNoun : t.passageNoun}` },
        { icon: <ListChecks size={12} />, label: `${test.question_count} ${test.question_count !== 1 ? t.questionPluralNoun : t.questionNoun}` },
      ]}
    />
  );
}