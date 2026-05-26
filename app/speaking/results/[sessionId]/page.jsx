"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import {
  PRIMARY, BORDER, TEXT, TEXT_SUB, MUTED, RED,
  bandColor, bandBg, cefrLabel,
  CriterionCard, SpeakingErrorPanel,
} from "@/components/report/ReportComponents";

const CRIT_COLORS = {
  fluency_coherence: "#ef4444",
  lexical_resource:  "#7c3aed",
  grammatical_range: "#0ea5e9",
  pronunciation:     "#10b981",
};

const CRITERIA_META = [
  { key: "fluency_coherence",  label: "Fluency & Coherence",         color: CRIT_COLORS.fluency_coherence },
  { key: "lexical_resource",   label: "Lexical Resource",             color: CRIT_COLORS.lexical_resource },
  { key: "grammatical_range",  label: "Grammatical Range & Accuracy", color: CRIT_COLORS.grammatical_range },
  { key: "pronunciation",      label: "Pronunciation",                color: CRIT_COLORS.pronunciation },
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

export default function SpeakingResultsPage() {
  const { sessionId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [result, setResult]     = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState({ fluency_coherence: true });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getSpeakingResults(sessionId)
      .then(r => { setResult(r); setFetching(false); })
      .catch(e => { setError(e.message ?? "Could not load results."); setFetching(false); });
  }, [user, sessionId]);

  if (loading || fetching) return <Spinner />;

  if (error || !result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: RED, fontWeight: 600, marginBottom: 16 }}>{error ?? "Results not found."}</p>
          <button onClick={() => router.push("/speaking")} style={{
            padding: "10px 24px", borderRadius: 8, background: PRIMARY, border: "none",
            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>Back to Speaking</button>
        </div>
      </div>
    );
  }

  const band = result.overall_band;

  const criteria = CRITERIA_META.map(c => ({
    ...c,
    band: result[c.key]?.band,
    summary: result[c.key]?.feedback,
  }));

  const errorsMap = Object.fromEntries(
    CRITERIA_META.map(c => [c.key, result[c.key]?.errors ?? []])
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui" }}>

      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <button
          onClick={() => router.push("/speaking")}
          style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: "4px 8px" }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Speaking Results</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: MUTED }}>{fmtDate(result.created_at)}</span>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 64px" }}>

        {/* Overall band hero */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: "28px 24px 24px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 52, fontWeight: 900, color: bandColor(band), lineHeight: 1 }}>
              {band != null ? Number(band).toFixed(1) : "–"}
              <span style={{ fontSize: 22, fontWeight: 600, color: MUTED }}>/9.0</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>{cefrLabel(band)}</div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>CEFR</div>
          </div>
          {result.examiner_summary && (
            <p style={{ flex: 1, margin: 0, fontSize: 13, color: TEXT_SUB, lineHeight: 1.6, minWidth: 200 }}>
              {result.examiner_summary}
            </p>
          )}
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

        {/* Transcript + errors panel */}
        {result.transcript?.length > 0 && (
          <SpeakingErrorPanel
            transcript={result.transcript}
            criteria={criteria}
            errorsMap={errorsMap}
          />
        )}

        <button
          onClick={() => router.push("/speaking")}
          style={{
            marginTop: 28, width: "100%", padding: "13px 24px", borderRadius: 10,
            background: PRIMARY, border: "none",
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
          }}
        >
          Start New Test
        </button>
      </div>
    </div>
  );
}