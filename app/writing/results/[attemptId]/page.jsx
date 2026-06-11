"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import { api } from "@/lib/api";
import {
  PRIMARY, BORDER, TEXT, TEXT_SUB, MUTED, RED,
  bandColor, cefrLabel,
  CriterionCard, DetailedFeedback, PaywallGate,
} from "@/components/report/ReportComponents";
import { isProUser } from "@/lib/landingAccess";
import PetLoader from "@/components/PetLoader";
import { MOD_COLORS } from "@/lib/moduleColors";

const CRIT_COLORS = {
  task_achievement:  "#ef4444",
  coherence_cohesion: "#f97316",
  lexical_resource:  "#7c3aed",
  grammatical_range: "#0ea5e9",
};

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function Spinner() {
  return <PetLoader fixed label="is opening your report" accent={MOD_COLORS.writing} />;
}

function TaskPanel({ task, criteria }) {
  const { t } = useLang();
  const critCards = criteria.map(c => ({
    ...c,
    band: task[c.key],
    summary: task.feedback,
  }));
  const [expanded, setExpanded] = useState({ [critCards[0].key]: true });

  const wordCount = task.word_count ?? 0;
  const band = task.band;

  return (
    <>
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: "24px 24px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, color: bandColor(band), lineHeight: 1 }}>
            {band != null ? Number(band).toFixed(1) : "–"}
            <span style={{ fontSize: 22, fontWeight: 600, color: MUTED }}>/9.0</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{cefrLabel(band)}</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.cefrLabel}</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{wordCount}</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.wordsLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {critCards.map(c => (
          <CriterionCard
            key={c.key}
            crit={c}
            expanded={!!expanded[c.key]}
            onToggle={() => setExpanded(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
          />
        ))}
      </div>

      {task.raw_text && (
        <DetailedFeedback
          text={task.raw_text}
          criteria={critCards}
          errorsMap={task.errors ?? {}}
          taskPrompt={task.task_prompt}
        />
      )}
    </>
  );
}

export default function WritingResultsPage() {
  const { attemptId } = useParams();
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [result, setResult]     = useState(null);
  const [profile, setProfile]   = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState(null);
  const [activeTask, setActiveTask] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.pollWritingAttempt(attemptId),
      api.getMe().catch(() => null),
    ]).then(([r, p]) => { setResult(r); setProfile(p); setFetching(false); })
      .catch(e => { setError(e.message ?? "Could not load results."); setFetching(false); });
  }, [user, attemptId]);

  const writingCriteria = [
    { key: "task_achievement",  label: t.critTaskAchievement,   color: CRIT_COLORS.task_achievement },
    { key: "coherence_cohesion", label: t.critCoherenceCohesion, color: CRIT_COLORS.coherence_cohesion },
    { key: "lexical_resource",   label: t.critLexicalResource,   color: CRIT_COLORS.lexical_resource },
    { key: "grammatical_range",  label: t.critGrammaticalRange,  color: CRIT_COLORS.grammatical_range },
  ];

  if (loading || fetching) return <Spinner />;

  if (error || !result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: RED, fontWeight: 600, marginBottom: 16 }}>{error ?? t.resultsNotFound}</p>
          <button onClick={() => router.push("/dashboard")} style={{
            padding: "10px 24px", borderRadius: 8, background: PRIMARY, border: "none",
            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>{t.backToDashboard}</button>
        </div>
      </div>
    );
  }

  const tasks = result.task_scores ?? [];
  const activeTaskData = tasks[activeTask];
  const overall = result.overall_band;

  const getTaskTypeLabel = (taskType) => {
    if (taskType === "task2") return t.essayType;
    if (taskType === "task1_general") return t.letterType;
    return t.graphChartType;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui" }}>

      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <button
          onClick={() => router.back()}
          style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: "4px 8px" }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>{t.writingResults}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: MUTED }}>
          {t.overallBandLabel}: <strong style={{ color: bandColor(overall) }}>{overall != null ? Number(overall).toFixed(1) : "–"}</strong>
        </span>
      </div>

      {/* Task tabs — only shown to Pro users */}
      {isProUser(profile) && tasks.length > 1 && (
        <div style={{
          background: "#fff", borderBottom: `1px solid ${BORDER}`,
          padding: "0 24px", display: "flex",
        }}>
          {tasks.map((task, i) => (
            <button
              key={i}
              onClick={() => setActiveTask(i)}
              style={{
                padding: "14px 20px", fontSize: 13, fontWeight: 600,
                border: "none", background: "none", cursor: "pointer",
                color: activeTask === i ? PRIMARY : TEXT_SUB,
                borderBottom: activeTask === i ? `2px solid ${PRIMARY}` : "2px solid transparent",
              }}
            >
              {t.taskLabel} {task.task_number} — {getTaskTypeLabel(task.task_type)}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 64px" }}>
        {isProUser(profile) ? (
          <>
            {activeTaskData ? (
              <TaskPanel key={activeTask} task={activeTaskData} criteria={writingCriteria} />
            ) : (
              <p style={{ color: MUTED, fontSize: 14 }}>{t.noResultsYet}</p>
            )}

            {result.improvement_tips?.length > 0 && (
              <div style={{
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: "20px 24px", marginTop: 24,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 12 }}>{t.improvementTips}</div>
                <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.improvement_tips.map((tip, i) => (
                    <li key={i} style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <PaywallGate band={result.overall_band} module="writing" />
        )}
      </div>
    </div>
  );
}