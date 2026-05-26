"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import {
  PRIMARY, BORDER, TEXT, TEXT_SUB, MUTED, GREEN, AMBER, RED,
  bandColor, bandBg, cefrLabel,
  CriterionCard, DetailedFeedback,
} from "@/components/report/ReportComponents";

const CRIT_COLORS = {
  task_achievement:  "#ef4444",
  coherence_cohesion: "#f97316",
  lexical_resource:  "#7c3aed",
  grammatical_range: "#0ea5e9",
};

const WRITING_CRITERIA = [
  { key: "task_achievement",  label: "Task Achievement",           color: CRIT_COLORS.task_achievement },
  { key: "coherence_cohesion", label: "Coherence & Cohesion",      color: CRIT_COLORS.coherence_cohesion },
  { key: "lexical_resource",   label: "Lexical Resource",           color: CRIT_COLORS.lexical_resource },
  { key: "grammatical_range",  label: "Grammatical Range & Accuracy", color: CRIT_COLORS.grammatical_range },
];

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function Spinner() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", fontFamily: "system-ui", gap: 16,
      background: "#f8fafc",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: `4px solid ${BORDER}`, borderTopColor: PRIMARY,
        animation: "spin .8s linear infinite",
      }} />
      <p style={{ color: MUTED, fontSize: 14 }}>Loading results…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TaskPanel({ task, attemptDate }) {
  const criteria = WRITING_CRITERIA.map(c => ({
    ...c,
    band: task[c.key],
    summary: task.feedback,
  }));
  const [expanded, setExpanded] = useState({ [criteria[0].key]: true });

  const wordCount = task.word_count ?? 0;
  const band = task.band;

  return (
    <>
      {/* Score hero */}
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
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>CEFR</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{wordCount}</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Words</div>
          </div>
        </div>
      </div>

      {/* Criterion accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {criteria.map(c => (
          <CriterionCard
            key={c.key}
            crit={c}
            expanded={!!expanded[c.key]}
            onToggle={() => setExpanded(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
          />
        ))}
      </div>

      {/* Annotated essay */}
      {task.raw_text && (
        <DetailedFeedback
          text={task.raw_text}
          criteria={criteria}
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
  const router = useRouter();
  const [result, setResult]     = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState(null);
  const [activeTask, setActiveTask] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.pollWritingAttempt(attemptId)
      .then(r => { setResult(r); setFetching(false); })
      .catch(e => { setError(e.message ?? "Could not load results."); setFetching(false); });
  }, [user, attemptId]);

  if (loading || fetching) return <Spinner />;

  if (error || !result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: RED, fontWeight: 600, marginBottom: 16 }}>{error ?? "Results not found."}</p>
          <button onClick={() => router.push("/dashboard")} style={{
            padding: "10px 24px", borderRadius: 8, background: PRIMARY, border: "none",
            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const tasks = result.task_scores ?? [];
  const activeTaskData = tasks[activeTask];
  const overall = result.overall_band;

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
        <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Writing Results</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: MUTED }}>
          Overall Band: <strong style={{ color: bandColor(overall) }}>{overall != null ? Number(overall).toFixed(1) : "–"}</strong>
        </span>
      </div>

      {/* Task tabs */}
      {tasks.length > 1 && (
        <div style={{
          background: "#fff", borderBottom: `1px solid ${BORDER}`,
          padding: "0 24px", display: "flex",
        }}>
          {tasks.map((t, i) => (
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
              Task {t.task_number} — {t.task_type === "task2" ? "Essay" : t.task_type === "task1_general" ? "Letter" : "Graph/Chart"}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 64px" }}>
        {activeTaskData ? (
          <TaskPanel key={activeTask} task={activeTaskData} />
        ) : (
          <p style={{ color: MUTED, fontSize: 14 }}>No results available yet.</p>
        )}

        {result.improvement_tips?.length > 0 && (
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
            padding: "20px 24px", marginTop: 24,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 12 }}>Improvement Tips</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {result.improvement_tips.map((tip, i) => (
                <li key={i} style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}