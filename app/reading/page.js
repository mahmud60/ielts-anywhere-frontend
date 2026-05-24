"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

function bandColor(b) {
  if (!b) return "#9ca3af";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

const s = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui" },
  h1: { fontSize: 28, fontWeight: 700, marginBottom: 6, color: "#0f172a" },
  sub: { color: "#64748b", fontSize: 15, marginBottom: 36 },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "20px 24px", marginBottom: 12,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 16,
  },
  title: { fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#0f172a" },
  meta: { color: "#94a3b8", fontSize: 13 },
  chip: {
    display: "inline-block", fontSize: 11, padding: "2px 9px",
    borderRadius: 99, background: "#f1f5f9", color: "#64748b",
    marginRight: 6, marginTop: 6,
  },
  btn: {
    padding: "9px 20px", borderRadius: 8, background: "#0080ff",
    border: "none", color: "#fff", fontWeight: 600, fontSize: 13,
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  },
};

export default function ReadingTestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getReadingTests().then(setTests).catch(console.error);
    api.getReadingAttempts().then(setAttempts).catch(() => {});
  }, [user]);

  // Map latest attempt band by... we only have attempts without test_id link,
  // so just show the most recent attempt overall as a sidebar summary.
  const lastAttempt = attempts[0] ?? null;

  const start = (testId) => {
    setStarting(testId);
    router.push(`/reading/${testId}`);
  };

  if (loading) return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>;

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Reading Tests</h1>
      <p style={s.sub}>Practice IELTS Academic Reading — choose a test below.</p>

      {lastAttempt && (
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
          padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Last attempt
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace", color: bandColor(lastAttempt.overall_band), lineHeight: 1 }}>
              {lastAttempt.overall_band?.toFixed(1)}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {lastAttempt.subscores?.correct}/{lastAttempt.subscores?.total} correct
            </div>
          </div>
          {lastAttempt.improvement_tips?.slice(0, 1).map((tip, i) => (
            <div key={i} style={{
              flex: 1, fontSize: 13, color: "#78350f", background: "#fffbeb",
              border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6,
            }}>
              {tip}
            </div>
          ))}
        </div>
      )}

      {tests.length === 0 && (
        <p style={{ color: "#94a3b8" }}>No reading tests available yet.</p>
      )}

      {tests.map((t, i) => (
        <div key={t.id} style={s.card}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.title}>{t.title}</div>
            <div style={s.meta}>
              {t.test_type === "academic" ? "Academic" : "General Training"}
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={s.chip}>{t.passage_count} passage{t.passage_count !== 1 ? "s" : ""}</span>
              <span style={s.chip}>{t.question_count} questions</span>
            </div>
          </div>
          <button
            style={{ ...s.btn, opacity: starting === t.id ? 0.6 : 1 }}
            disabled={starting === t.id}
            onClick={() => start(t.id)}
          >
            {starting === t.id ? "Opening…" : "Start"}
          </button>
        </div>
      ))}
    </div>
  );
}