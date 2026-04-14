"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
console.log("Page loading...");
const MODULE_LABELS = ["Listening", "Reading", "Writing", "Speaking"];

const s = {
  wrap: { maxWidth: 680, margin: "0 auto", padding: "48px 24px" },
  h1: { fontSize: 28, fontWeight: 600, marginBottom: 6 },
  sub: { color: "#6b7280", fontSize: 15, marginBottom: 36 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: 500, fontSize: 16, marginBottom: 6 },
  meta: { color: "#9ca3af", fontSize: 13, marginBottom: 10 },
  chips: { display: "flex", gap: 6 },
  chip: { fontSize: 11, padding: "2px 9px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280" },
  btn: { padding: "10px 22px", borderRadius: 8, background: "#0ea5e9", border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
};

export default function TestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    api.getAvailableTests().then(setTests).catch(console.error);
  }, []);

  const start = async (testId) => {
    setStarting(testId);
    try {
      const session = await api.startSession(testId);
      router.push(`/test/${session.id}`);
    } catch (e) {
      console.error(e);
      setStarting(null);
    }
  };

  if (loading) return <p style={{ padding: 32 }}>Loading…</p>;

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Available tests</h1>
      <p style={s.sub}>Each test contains all four IELTS modules taken in order.</p>
      {tests.map(t => (
        <div key={t.id} style={s.card}>
          <div>
            <div style={s.title}>{t.title}</div>
            <div style={s.meta}>{t.test_type === "academic" ? "Academic" : "General"}{t.is_demo ? " · Demo" : ""}</div>
            <div style={s.chips}>
              {MODULE_LABELS.map(m => <span key={m} style={s.chip}>{m}</span>)}
            </div>
          </div>
          <button style={{ ...s.btn, opacity: starting === t.id ? 0.6 : 1 }}
            disabled={starting === t.id} onClick={() => start(t.id)}>
            {starting === t.id ? "Starting…" : "Start test"}
          </button>
        </div>
      ))}
      {tests.length === 0 && <p style={{ color: "#9ca3af" }}>No tests available.</p>}
    </div>
  );
}