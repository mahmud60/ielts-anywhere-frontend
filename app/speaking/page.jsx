"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const PRIMARY = "#0080ff";
const BORDER  = "#e2e8f0";
const TEXT    = "#0f172a";
const MUTED   = "#94a3b8";
const GREEN   = "#059669";
const AMBER   = "#d97706";
const RED     = "#dc2626";

function bandColor(b) {
  if (!b || b <= 0) return MUTED;
  if (b >= 8) return PRIMARY;
  if (b >= 6.5) return GREEN;
  if (b >= 5) return AMBER;
  return RED;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const PARTS = [
  {
    num: 1,
    title: "Part 1 — Introduction",
    duration: "4–5 min",
    desc: "The examiner asks familiar questions about yourself, your home, family, work, studies, and interests.",
  },
  {
    num: 2,
    title: "Part 2 — Long Turn",
    duration: "3–4 min",
    desc: "You receive a cue card with a topic and have 1 minute to prepare, then speak for 1–2 minutes.",
  },
  {
    num: 3,
    title: "Part 3 — Discussion",
    duration: "4–5 min",
    desc: "A two-way discussion with the examiner on abstract themes related to the Part 2 topic.",
  },
];

export default function SpeakingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory]   = useState([]);
  const [starting, setStarting] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getSpeakingHistory().then(setHistory).catch(() => {});
  }, [user]);

  async function startTest() {
    setStarting(true);
    setError(null);
    try {
      const { signed_url, session_id } = await api.getSpeakingSessionToken();
      sessionStorage.setItem(`speaking_token_${session_id}`, signed_url);
      router.push(`/speaking/${session_id}`);
    } catch (e) {
      setError(e.message ?? "Could not start session. Please try again.");
      setStarting(false);
    }
  }

  if (loading) return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 64px", fontFamily: "system-ui" }}>

      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, color: TEXT }}>Speaking Test</h1>
      <p style={{ color: "#64748b", fontSize: 15, marginBottom: 36 }}>
        Practice your IELTS Speaking with an AI examiner. The full test takes 11–14 minutes.
      </p>

      {/* Format cards */}
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
        Test Format
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
        {PARTS.map(p => (
          <div key={p.num} style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start",
          }}>
            <div style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 8,
              background: "#eff6ff", color: PRIMARY,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 16,
            }}>
              {p.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>{p.title}</span>
                <span style={{
                  fontSize: 11, padding: "2px 9px", borderRadius: 99,
                  background: "#f1f5f9", color: "#64748b", fontWeight: 600,
                }}>{p.duration}</span>
              </div>
              <p style={{ color: "#475569", fontSize: 13, margin: 0, lineHeight: 1.55 }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Microphone tip */}
      <div style={{
        background: "#fffbeb", border: `1px solid #fde68a`, borderRadius: 10,
        padding: "12px 16px", marginBottom: 32, fontSize: 13, color: "#92400e",
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ flexShrink: 0, fontSize: 16 }}>🎤</span>
        <span>Make sure you are in a quiet place and your microphone is working. The AI examiner will guide you through all three parts.</span>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fef2f2", border: `1px solid #fecaca`, borderRadius: 10,
          padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c",
        }}>
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={startTest}
        disabled={starting}
        style={{
          width: "100%", padding: "14px 24px", borderRadius: 10,
          background: starting ? "#93c5fd" : PRIMARY, border: "none",
          color: "#fff", fontWeight: 700, fontSize: 15, cursor: starting ? "not-allowed" : "pointer",
          marginBottom: 40, transition: "background .15s",
        }}
      >
        {starting ? "Starting…" : "Start Speaking Test"}
      </button>

      {/* Past attempts */}
      {history.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Past Results
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map(a => (
              <div key={a.id} style={{
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: TEXT, marginBottom: 2 }}>
                    IELTS Speaking Test
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>{fmtDate(a.created_at)}</div>
                  {a.examiner_summary && (
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4, lineHeight: 1.5, maxWidth: 460,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.examiner_summary}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: bandColor(a.overall_band), lineHeight: 1 }}>
                    {a.overall_band != null ? Number(a.overall_band).toFixed(1) : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Band</div>
                </div>
                <button
                  onClick={() => router.push(`/speaking/results/${a.id}`)}
                  style={{
                    flexShrink: 0, padding: "8px 16px", borderRadius: 8,
                    background: "#fff", border: `1px solid ${BORDER}`,
                    color: TEXT, fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}