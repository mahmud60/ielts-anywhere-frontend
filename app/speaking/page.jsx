"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, Clock, Sparkles, ArrowRight, Award, Volume2, MessageCircle,
  Headphones, CheckCircle2, Play,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isProUser } from "@/lib/landingAccess";
import { useProfile } from "@/lib/useProfile";
import { SPEAKING_THEME } from "@/lib/moduleColors";
import DashboardShell from "@/components/DashboardShell";

const { accent: ACCENT, soft: SOFT, gradient: GRADIENT } = SPEAKING_THEME;

function bandColor(b) {
  if (!b || b <= 0) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}
function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const PARTS = [
  {
    num: 1,
    title: "Introduction & interview",
    duration: "4–5 min",
    desc: "Short questions about familiar topics — home, work, studies, hobbies.",
    icon: <MessageCircle size={18} />,
  },
  {
    num: 2,
    title: "Individual long turn",
    duration: "3–4 min",
    desc: "1 minute to prepare from a cue card, then speak for 1–2 minutes.",
    icon: <Mic size={18} />,
  },
  {
    num: 3,
    title: "Two-way discussion",
    duration: "4–5 min",
    desc: "Deeper questions linked to your Part 2 topic — opinions and abstract ideas.",
    icon: <Volume2 size={18} />,
  },
];

const STEPS = [
  { label: "Connect", desc: "AI examiner joins via voice" },
  { label: "Respond", desc: "Speak naturally in real time" },
  { label: "Get scored", desc: "Band + criteria feedback" },
];

const CHECKLIST = [
  "Quiet environment recommended",
  "Microphone permission required",
  "Speak clearly at a natural pace",
];

export default function SpeakingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [starting, setStarting] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getSpeakingHistory().then(setHistory).catch(() => {});
  }, [user]);

  const isPro = isProUser(profile);

  const startTest = () => {
    if (!isPro) { router.push("/pricing"); return; }
    setStarting(true);
    router.push("/speaking/start");
  };

  return (
    <DashboardShell title="Speaking">
      {/* Hero */}
      <div style={{
        borderRadius: 20, padding: "28px 30px", marginBottom: 24, background: GRADIENT, color: "#fff",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", boxShadow: `0 18px 40px -18px ${ACCENT}aa`,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, flexShrink: 0, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mic size={30} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Speaking Test</h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, opacity: .92, margin: 0, maxWidth: 520 }}>
            A full 3-part IELTS simulation with a conversational AI examiner and instant band scoring.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { icon: <Clock size={12} />, label: "Duration", value: "11–14 min" },
            { icon: <Sparkles size={12} />, label: "Feedback", value: "4 criteria" },
          ].map((f) => (
            <div key={f.label} style={{ background: "rgba(255,255,255,.14)", borderRadius: 12, padding: "10px 14px", minWidth: 96 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: .85, marginBottom: 4 }}>{f.icon}{f.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginBottom: 24 }}>

        {/* Start card */}
        <div className="da-card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Headphones size={22} color={ACCENT} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>AI Examiner</div>
              <div style={{ fontSize: 12.5, color: "#64748b" }}>Voice conversation · no scheduling</div>
            </div>
          </div>

          {!isPro && profile !== null ? (
            /* Pro paywall */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12, padding: "8px 0 4px" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "#eef2ff", border: "1px solid #c7d2fe",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Award size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>Pro feature</div>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 16px", maxWidth: 260 }}>
                  AI Speaking is available to Pro subscribers. Upgrade to access the full 3-part IELTS simulation with instant band scoring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                style={{
                  width: "100%", padding: "13px 20px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 10px 24px -10px #6366f199",
                }}
              >
                <Award size={16} /> Upgrade to Pro
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 18px", flex: 1 }}>
                Put on headphones, allow microphone access, and the examiner will walk you through Parts 1–3 just like a real test room.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {CHECKLIST.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                    <CheckCircle2 size={15} color={ACCENT} />
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={startTest}
                disabled={starting}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", cursor: starting ? "wait" : "pointer",
                  background: GRADIENT, color: "#fff", fontWeight: 700, fontSize: 15,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: `0 14px 30px -14px ${ACCENT}`, opacity: starting ? 0.7 : 1,
                }}
              >
                {starting ? "Opening…" : <><Play size={17} fill="#fff" /> Start speaking test</>}
              </button>
            </>
          )}
        </div>

        {/* How it works */}
        <div className="da-card" style={{ padding: "24px 26px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", color: "#0f172a" }}>How it works</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: SOFT, color: ACCENT, fontWeight: 800, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 11, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 12.5, color: "#92400e", lineHeight: 1.55 }}>
            Tip: Treat it like a real exam — full sentences, natural pace, and expand your answers with examples.
          </div>
        </div>
      </div>

      {/* Test format timeline */}
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 14px" }}>Test format</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 28 }}>
        {PARTS.map((p) => (
          <div key={p.num} className="da-pcard" style={{ padding: "20px 22px", cursor: "default" }}>
            <div style={{ height: 4, background: GRADIENT, borderRadius: 4, margin: "-20px -22px 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: SOFT, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.icon}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", background: "#f4f5f9", borderRadius: 99, padding: "4px 10px" }}>{p.duration}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Part {p.num}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>{p.title}</div>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0, lineHeight: 1.55 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px" }}>Past results</h2>
          <div className="da-card" style={{ overflow: "hidden", marginBottom: 24 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="da-table">
                <thead>
                  <tr><th>Test</th><th>Date</th><th className="da-col-opt">Summary</th><th>Band</th><th style={{ textAlign: "right" }}>Report</th></tr>
                </thead>
                <tbody>
                  {history.map((a) => (
                    <tr key={a.id} className="clickable" onClick={() => router.push(`/speaking/results/${a.id}`)}>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>Speaking Test</td>
                      <td style={{ color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(a.created_at)}</td>
                      <td className="da-col-opt" style={{ color: "#64748b", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.examiner_summary || "—"}</td>
                      <td><span style={{ fontFamily: "monospace", fontWeight: 700, color: bandColor(a.overall_band) }}>{a.overall_band != null ? Number(a.overall_band).toFixed(1) : "—"}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button className="da-btn da-btn-ghost" style={{ padding: "6px 14px", fontSize: 12.5 }} onClick={(e) => { e.stopPropagation(); router.push(`/speaking/results/${a.id}`); }}>
                          View <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" onClick={() => router.push("/sample-reports?tab=speaking")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e6e8ef", borderRadius: 11, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
          <Award size={16} color={ACCENT} /> See a sample speaking report
        </button>
      </div>
    </DashboardShell>
  );
}
