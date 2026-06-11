"use client";

import { Headphones, Layers, ListChecks, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import ExamListPage from "@/components/ExamListPage";

const ACCENT = "#0ea5e9";

export default function ListeningTestsPage() {
  const { t } = useLang();
  return (
    <ExamListPage
      moduleKey="listening"
      title={t.listeningTestsTitle}
      subtitle={t.listeningSubtitle}
      accent={ACCENT}
      accentSoft="#e0f2fe"
      gradient="linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)"
      icon={<Headphones size={30} color="#fff" />}
      duration={t.approxMin30}
      facts={[
        { icon: <Clock size={12} />, label: t.duration, value: t.min30 },
        { icon: <Sparkles size={12} />, label: t.scoring, value: t.instant },
      ]}
      fetchTests={() => api.getListeningTests()}
      startPath={(test) => `/listening/${test.id}`}
      getDescription={(test) => test.description || ""}
      getMeta={(test) => [
        { icon: <Layers size={12} />, label: `${test.section_count} ${test.section_count !== 1 ? t.sectionPluralNoun : t.sectionNoun}` },
        { icon: <ListChecks size={12} />, label: `${test.question_count} ${test.question_count !== 1 ? t.questionPluralNoun : t.questionNoun}` },
      ]}
    />
  );
}