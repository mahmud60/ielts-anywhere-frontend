"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

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

export default function ListeningTestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getListeningTests().then(setTests).catch(console.error);
  }, [user]);

  const start = (testId) => {
    setStarting(testId);
    router.push(`/listening/${testId}`);
  };

  if (loading) return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>;

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Listening Tests</h1>
      <p style={s.sub}>Practice IELTS Listening — choose a test below.</p>

      {tests.length === 0 && (
        <p style={{ color: "#94a3b8" }}>No listening tests available yet.</p>
      )}

      {tests.map((t) => (
        <div key={t.id} style={s.card}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.title}>{t.title}</div>
            {t.description && (
              <div style={s.meta}>{t.description}</div>
            )}
            <div style={{ marginTop: 6 }}>
              <span style={s.chip}>{t.section_count} section{t.section_count !== 1 ? "s" : ""}</span>
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