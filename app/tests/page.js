"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const MODULE_LABELS = ["Listening", "Reading", "Writing", "Speaking"];

function bandColor(b) {
  if (!b) return "#9ca3af";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

const s = {
  wrap: { maxWidth: 680, margin: "0 auto", padding: "48px 24px" },
  h1: { fontSize: 28, fontWeight: 600, marginBottom: 6 },
  sub: { color: "#6b7280", fontSize: 15, marginBottom: 36 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: 500, fontSize: 16, marginBottom: 6 },
  meta: { color: "#9ca3af", fontSize: 13, marginBottom: 10 },
  chips: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { fontSize: 11, padding: "2px 9px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280" },
  btn: { padding: "10px 22px", borderRadius: 8, background: "#0ea5e9", border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
};

function LastResult({ result }) {
  if (!result) return null;
  const { overall_band, module_bands } = result;
  if (!overall_band && !module_bands) return null;

  return (
    <div style={{
      marginTop: 12,
      padding: "10px 14px",
      background: "#f9fafb",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
    }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Last result
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {overall_band != null && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: bandColor(overall_band), fontFamily: "monospace", lineHeight: 1 }}>
              {overall_band.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>overall</span>
          </div>
        )}
        {module_bands && (
          <div style={{ display: "flex", gap: 10 }}>
            {["listening", "reading", "writing", "speaking"].map(m =>
              module_bands[m] != null ? (
                <div key={m} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: bandColor(module_bands[m]), fontFamily: "monospace" }}>
                    {module_bands[m].toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{m}</div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [starting, setStarting] = useState(null);
  const [lastResults, setLastResults] = useState({});

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    api.getAvailableTests().then(data => {
      setTests(data);
      data.forEach(t => {
        api.getTestLastResult(t.id)
          .then(result => setLastResults(prev => ({ ...prev, [t.id]: result })))
          .catch(() => {});
      });
    }).catch(console.error);
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.title}>{t.title}</div>
            <div style={s.meta}>{t.test_type === "academic" ? "Academic" : "General"}{t.is_demo ? " · Demo" : ""}</div>
            <div style={s.chips}>
              {MODULE_LABELS.map(m => <span key={m} style={s.chip}>{m}</span>)}
            </div>
            <LastResult result={lastResults[t.id]} />
          </div>
          <div style={{ marginLeft: 16, flexShrink: 0 }}>
            <button style={{ ...s.btn, opacity: starting === t.id ? 0.6 : 1 }}
              disabled={starting === t.id} onClick={() => start(t.id)}>
              {starting === t.id ? "Starting…" : "Start test"}
            </button>
          </div>
        </div>
      ))}
      {tests.length === 0 && <p style={{ color: "#9ca3af" }}>No tests available.</p>}
    </div>
  );
}
