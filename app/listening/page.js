"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const PRIMARY = "#0080ff";
const BORDER  = "#e2e8f0";
const TEXT    = "#0f172a";
const MUTED   = "#94a3b8";

const s = {
  wrap:  { maxWidth: 760, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui" },
  h1:    { fontSize: 28, fontWeight: 700, marginBottom: 6, color: TEXT },
  sub:   { color: "#64748b", fontSize: 15, marginBottom: 36 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 },
  card:  {
    background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: "18px 22px", marginBottom: 10,
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
  },
  title: { fontWeight: 600, fontSize: 15, marginBottom: 3, color: TEXT },
  meta:  { color: MUTED, fontSize: 13 },
  chip:  { display: "inline-block", fontSize: 11, padding: "2px 9px", borderRadius: 99, background: "#f1f5f9", color: "#64748b", marginRight: 6, marginTop: 4 },
  btn:   { padding: "9px 20px", borderRadius: 8, background: PRIMARY, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  btnOutline: { padding: "7px 16px", borderRadius: 8, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
};

export default function ListeningTestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests,    setTests]    = useState([]);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getListeningTests().then(setTests).catch(console.error);
  }, [user]);

  if (loading) return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>;

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Listening Tests</h1>
      <p style={s.sub}>Practice IELTS Listening — choose a test below.</p>

      {/* Available tests */}
      <div style={s.sectionLabel}>Available Tests</div>
      {tests.length === 0 && <p style={{ color: MUTED, marginBottom: 32 }}>No listening tests available yet.</p>}
      {tests.map(t => (
        <div key={t.id} style={s.card}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.title}>{t.title}</div>
            {t.description && <div style={s.meta}>{t.description}</div>}
            <div style={{ marginTop: 4 }}>
              <span style={s.chip}>{t.section_count} section{t.section_count !== 1 ? "s" : ""}</span>
              <span style={s.chip}>{t.question_count} questions</span>
            </div>
          </div>
          <button
            style={{ ...s.btn, opacity: starting === t.id ? 0.6 : 1 }}
            disabled={starting === t.id}
            onClick={() => { setStarting(t.id); router.push(`/listening/${t.id}`); }}
          >
            {starting === t.id ? "Opening…" : "Start"}
          </button>
        </div>
      ))}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button style={{ ...s.btnOutline, fontSize: 13 }} onClick={() => router.push("/reports")}>
          View past results →
        </button>
      </div>
    </div>
  );
}