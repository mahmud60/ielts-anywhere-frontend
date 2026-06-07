"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, Sparkles, ArrowRight, Award, Search,
  Headphones, BookOpen, PenLine, Mic, CheckCircle2, Target,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { filterTestsByMode } from "@/lib/testsMode";
import { DIAGNOSTIC_THEME, MODULE_META } from "@/lib/moduleColors";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

const { accent: ACCENT, soft: SOFT, gradient: GRADIENT } = DIAGNOSTIC_THEME;

const MODULES = [
  { key: "listening", icon: Headphones, ...MODULE_META.listening },
  { key: "reading", icon: BookOpen, ...MODULE_META.reading },
  { key: "writing", icon: PenLine, ...MODULE_META.writing },
  { key: "speaking", icon: Mic, ...MODULE_META.speaking },
];

const STEPS = [
  { label: "Complete all four modules", desc: "Listening, Reading, Writing, and Speaking in one guided session." },
  { label: "Get estimated bands", desc: "See your level per skill and an overall snapshot." },
  { label: "Know what to practice", desc: "Use results to focus on your weakest areas first." },
];

function bandColor(b) {
  if (!b || b <= 0) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

function LastResult({ result }) {
  if (!result) return null;
  const { overall_band, module_bands } = result;
  if (overall_band == null && !module_bands) return null;

  return (
    <div style={{
      marginTop: 14, padding: "12px 14px", borderRadius: 11,
      background: "#f8fafc", border: "1px solid #edeff4",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Your last result
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {overall_band != null && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: bandColor(overall_band), fontFamily: "monospace", lineHeight: 1 }}>
              {Number(overall_band).toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>overall</span>
          </div>
        )}
        {module_bands && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODULES.map((m) => {
              const b = module_bands[m.key];
              if (b == null) return null;
              return (
                <span key={m.key} style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 8,
                  background: m.bg, color: m.color,
                }}>
                  {m.label.slice(0, 3)} {Number(b).toFixed(1)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiagnosticPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState(null);
  const [lastResults, setLastResults] = useState({});
  const [starting, setStarting] = useState(null);
  const [startError, setStartError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.getAvailableTests()
      .then((list) => {
        if (cancelled) return;
        const diagnostic = filterTestsByMode(list, "diagnostic");
        setTests(diagnostic);
        diagnostic.forEach((t) => {
          api.getTestLastResult(t.id)
            .then((r) => setLastResults((prev) => ({ ...prev, [t.id]: r })))
            .catch(() => {});
        });
      })
      .catch(() => { if (!cancelled) setTests([]); });
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    if (!tests) return [];
    const q = query.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.test_type || "").toLowerCase().includes(q)
    );
  }, [tests, query]);

  const start = async (testId) => {
    setStarting(testId);
    setStartError("");
    try {
      const session = await api.startSession(testId);
      router.push(`/test/${session.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start diagnostic.";
      setStartError(msg);
      setStarting(null);
    }
  };

  if (loading || tests === null) {
    return (
      <DashboardShell title="Diagnostic">
        <PetLoader fullScreen label="is loading diagnostics" accent={ACCENT} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Diagnostic">
      {/* Hero */}
      <div style={{
        borderRadius: 20, padding: "28px 30px", marginBottom: 24, background: GRADIENT, color: "#fff",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        boxShadow: `0 18px 40px -18px ${ACCENT}aa`,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ClipboardList size={30} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Free Diagnostic</h1>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em",
              background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.35)",
              borderRadius: 99, padding: "4px 10px",
            }}>
              No Pro required
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, opacity: .92, margin: 0, maxWidth: 520 }}>
            A short full-skills assessment to estimate your IELTS level and show where to focus next.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { icon: <Clock size={12} />, label: "Duration", value: "~2.5 hrs" },
            { icon: <Sparkles size={12} />, label: "Modules", value: "All 4" },
          ].map((f) => (
            <div key={f.label} style={{ background: "rgba(255,255,255,.14)", borderRadius: 12, padding: "10px 14px", minWidth: 96 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: .85, marginBottom: 4 }}>{f.icon}{f.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginBottom: 28 }}>
        {/* Module pipeline */}
        <div className="da-card" style={{ padding: "24px 26px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>What you&apos;ll complete</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 11,
                    background: m.bg, border: `1px solid ${m.color}33`,
                  }}>
                    <Icon size={15} color={m.color} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{m.label}</span>
                  </div>
                  {i < MODULES.length - 1 && <ArrowRight size={14} color="#cbd5e1" />}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.55 }}>
            Taken in order during one session — the same flow as a real IELTS exam day.
          </p>
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
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 18, padding: "12px 14px", borderRadius: 11,
            background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 12.5, color: "#166534", lineHeight: 1.55,
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <Target size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            Best for first-time users — finish one diagnostic before diving into single-module practice.
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>Available diagnostics</h2>
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{filtered.length}</span>
        </div>
        <div style={{ position: "relative", flex: "0 1 280px" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search diagnostics…"
            style={{
              width: "100%", padding: "10px 12px 10px 36px", borderRadius: 11,
              border: "1px solid #e6e8ef", background: "#fff", fontSize: 13.5,
              color: "#0f172a", outline: "none",
            }}
          />
        </div>
      </div>

      {startError && (
        <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{startError}</p>
      )}

      {tests.length === 0 ? (
        <div className="da-card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <ClipboardList size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>No diagnostics available yet</div>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 auto", maxWidth: 360 }}>
            Check back soon, or explore Listening and Reading practice in the meantime.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="da-card" style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
          No diagnostics match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginBottom: 28 }}>
          {filtered.map((t, i) => {
            const isStarting = starting === t.id;
            const hasResult = lastResults[t.id];
            return (
              <div
                key={t.id}
                className="da-pcard"
                onClick={() => !isStarting && start(t.id)}
                style={{ padding: 0, overflow: "hidden", opacity: isStarting ? 0.65 : 1 }}
              >
                <div style={{ height: 6, background: GRADIENT }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, background: SOFT,
                      color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span style={{
                      fontSize: 11.5, fontWeight: 600, color: "#64748b",
                      background: "#f4f5f9", borderRadius: 99, padding: "5px 11px",
                    }}>
                      {t.test_type === "academic" ? "Academic" : "General"}
                    </span>
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.35 }}>
                    {t.title}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: hasResult ? 0 : 16 }}>
                    {MODULES.map((m) => (
                      <span key={m.key} style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 8,
                        background: m.bg, color: m.color,
                      }}>
                        {m.label}
                      </span>
                    ))}
                  </div>

                  <LastResult result={lastResults[t.id]} />

                  <div style={{
                    marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: GRADIENT, color: "#fff", borderRadius: 11,
                    padding: "11px 16px", fontSize: 14, fontWeight: 700,
                  }}>
                    {isStarting ? "Starting…" : hasResult ? "Retake diagnostic" : "Start diagnostic"}
                    {!isStarting && <ArrowRight size={16} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => router.push("/reports")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1px solid #e6e8ef", borderRadius: 11,
            padding: "10px 18px", fontSize: 13.5, fontWeight: 600, color: "#475569", cursor: "pointer",
          }}
        >
          <Award size={16} color={ACCENT} /> View your results
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: SOFT, border: `1px solid #c7d2fe`, borderRadius: 11,
            padding: "10px 18px", fontSize: 13.5, fontWeight: 600, color: ACCENT, cursor: "pointer",
          }}
        >
          <CheckCircle2 size={16} /> Back to dashboard
        </button>
      </div>
    </DashboardShell>
  );
}
