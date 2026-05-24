"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const PRIMARY  = "#0080ff";
const BORDER   = "#e2e8f0";
const PAGE_BG  = "#f8fafc";
const TEXT     = "#0f172a";
const TEXT_SUB = "#475569";
const MUTED    = "#94a3b8";
const GREEN    = "#059669";
const AMBER    = "#d97706";
const RED      = "#dc2626";

function bandColor(b) {
  if (!b || b <= 0) return MUTED;
  if (b >= 8)   return PRIMARY;
  if (b >= 6.5) return GREEN;
  if (b >= 5)   return AMBER;
  return RED;
}

function bandBg(b) {
  if (!b || b <= 0) return "#f1f5f9";
  if (b >= 8)   return "#eff6ff";
  if (b >= 6.5) return "#f0fdf4";
  if (b >= 5)   return "#fffbeb";
  return "#fef2f2";
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const CRITERIA = [
  { key: "fluency_coherence",  label: "Fluency & Coherence" },
  { key: "lexical_resource",   label: "Lexical Resource" },
  { key: "grammatical_range",  label: "Grammatical Range & Accuracy" },
  { key: "pronunciation",      label: "Pronunciation" },
];

export default function SpeakingResultsPage() {
  const { sessionId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [result, setResult]   = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getSpeakingResults(sessionId)
      .then(r => { setResult(r); setFetching(false); })
      .catch(e => { setError(e.message ?? "Could not load results."); setFetching(false); });
  }, [user, sessionId]);

  if (loading || fetching) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", fontFamily: "system-ui", gap: 16,
        background: PAGE_BG,
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

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "system-ui" }}>

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

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Overall band hero */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: "32px 24px", textAlign: "center", marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Overall Band Score
          </div>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1,
            color: bandColor(band), marginBottom: 12,
          }}>
            {band != null ? Number(band).toFixed(1) : "—"}
          </div>
          <div style={{ fontSize: 13, color: TEXT_SUB, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            {result.examiner_summary ?? ""}
          </div>
        </div>

        {/* Criterion cards */}
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
          Criterion Scores
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {CRITERIA.map(c => {
            const cr = result[c.key];
            const b  = cr?.band;
            return (
              <div key={c.key} style={{
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                {/* Band badge */}
                <div style={{
                  flexShrink: 0, width: 52, height: 52, borderRadius: 10,
                  background: bandBg(b),
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: bandColor(b), lineHeight: 1 }}>
                    {b != null ? Number(b).toFixed(1) : "—"}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Band</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: TEXT, marginBottom: 5 }}>{c.label}</div>
                  <p style={{ margin: 0, fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>
                    {cr?.feedback ?? "No feedback available."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transcript */}
        {result.transcript?.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Full Transcript
            </div>
            <div style={{
              background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 32,
            }}>
              {result.transcript.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
                    fontSize: 13, lineHeight: 1.55, color: TEXT,
                    background: msg.role === "user" ? "#eff6ff" : "#f1f5f9",
                    borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                    borderBottomLeftRadius:  msg.role === "agent" ? 4 : 12,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {msg.role === "agent" ? "Examiner" : "You"}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <button
          onClick={() => router.push("/speaking")}
          style={{
            width: "100%", padding: "13px 24px", borderRadius: 10,
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