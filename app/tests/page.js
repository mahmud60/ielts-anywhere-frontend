"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isProUser } from "@/lib/landingAccess";
import { filterTestsByMode, getTestsPageCopy, parseTestsMode } from "@/lib/testsMode";
import { MOD_COLORS } from "@/lib/moduleColors";
import PetLoader from "@/components/PetLoader";
import DashboardShell from "@/components/DashboardShell";
import { Crown, ClipboardList, ArrowRight, RotateCcw, TrendingUp, PlayCircle, Lock } from "lucide-react";

const ACCENT = "#6366f1";
const GRADIENT = "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)";

const MODULE_CHIPS = [
  { key: "listening", label: "Listening",  color: MOD_COLORS.listening },
  { key: "reading",   label: "Reading",    color: MOD_COLORS.reading },
  { key: "writing",   label: "Writing",    color: MOD_COLORS.writing },
  { key: "speaking",  label: "Speaking",   color: MOD_COLORS.speaking },
];

function bandColor(b) {
  if (!b) return "#9ca3af";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

function ModuleChips() {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {MODULE_CHIPS.map(m => (
        <span key={m.key} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11.5, padding: "3px 9px", borderRadius: 99,
          fontWeight: 600, background: "#f4f5f9", color: "#475569",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
          {m.label}
        </span>
      ))}
    </div>
  );
}

function LastResult({ result }) {
  if (!result?.overall_band && !result?.module_bands) return null;
  const { overall_band, module_bands } = result;
  return (
    <div style={{
      marginTop: 14, padding: "12px 16px", borderRadius: 10,
      background: "#f8fafc", border: "1px solid #edeff4",
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", align: "center", gap: 6 }}>
        <TrendingUp size={13} color="#94a3b8" style={{ marginTop: 1 }} />
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Last result</span>
      </div>
      {overall_band != null && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: bandColor(overall_band), fontFamily: "monospace", lineHeight: 1 }}>
            {overall_band.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>overall</span>
        </div>
      )}
      {module_bands && (
        <div style={{ display: "flex", gap: 12 }}>
          {["listening", "reading", "writing", "speaking"].map(m =>
            module_bands[m] != null ? (
              <div key={m} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: bandColor(module_bands[m]), fontFamily: "monospace" }}>
                  {module_bands[m].toFixed(1)}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{m.slice(0, 3)}</div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function TestCard({ test, lastResult, isPro, showProGate, mode, onStart, starting }) {
  const isStarting = starting === test.id;
  const locked = showProGate;

  return (
    <div className="da-card" style={{ padding: "22px 24px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: locked ? "#f1f5f9" : "#eef2ff",
          border: locked ? "1px solid #e2e8f0" : "1px solid #c7d2fe",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {locked
            ? <Lock size={20} color="#94a3b8" />
            : <ClipboardList size={20} color={ACCENT} />}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{test.title}</span>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
              background: test.is_demo ? "#f0f9ff" : "#f0fdf4",
              color: test.is_demo ? "#0369a1" : "#166534",
              border: `1px solid ${test.is_demo ? "#bae6fd" : "#bbf7d0"}`,
            }}>
              {test.is_demo ? "Diagnostic" : "Full mock"}
            </span>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
              background: "#faf5ff", color: "#7c3aed", border: "1px solid #ddd6fe",
            }}>
              {test.test_type === "academic" ? "Academic" : "General"}
            </span>
          </div>

          <ModuleChips />
          <LastResult result={lastResult} />
        </div>

        {/* CTA */}
        <div style={{ flexShrink: 0, marginLeft: 8 }}>
          {locked ? (
            <button
              onClick={() => onStart(test.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: GRADIENT, color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 6px 18px -6px #6366f199",
              }}
            >
              <Crown size={14} /> Upgrade
            </button>
          ) : lastResult ? (
            <button
              onClick={() => onStart(test.id)}
              disabled={isStarting}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "#334155", fontWeight: 700, fontSize: 13,
                cursor: isStarting ? "wait" : "pointer",
                opacity: isStarting ? .6 : 1,
              }}
            >
              <RotateCcw size={14} /> {isStarting ? "Starting…" : "Retake"}
            </button>
          ) : (
            <button
              onClick={() => onStart(test.id)}
              disabled={isStarting}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: "#0ea5e9", color: "#fff",
                fontWeight: 700, fontSize: 13,
                cursor: isStarting ? "wait" : "pointer",
                opacity: isStarting ? .6 : 1,
                boxShadow: "0 6px 18px -6px #0ea5e999",
              }}
            >
              <PlayCircle size={15} /> {isStarting ? "Starting…" : "Start test"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<PetLoader fullScreen label="is loading your tests" />}>
      <TestsPageContent />
    </Suspense>
  );
}

function TestsPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseTestsMode(searchParams);

  const [tests, setTests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [starting, setStarting] = useState(null);
  const [lastResults, setLastResults] = useState({});
  const [startError, setStartError] = useState("");

  const isPro = isProUser(profile);
  const copy = getTestsPageCopy(mode);
  const visibleTests = useMemo(() => filterTestsByMode(tests, mode), [tests, mode]);
  const showProGate = mode === "full_mock" && !isPro;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (mode === "diagnostic") router.replace("/diagnostic");
  }, [mode, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    Promise.all([api.getAvailableTests(), api.getMe()])
      .then(([testList, me]) => {
        if (cancelled) return;
        setTests(testList);
        setProfile(me);
        testList.forEach(t => {
          api.getTestLastResult(t.id)
            .then(result => setLastResults(prev => ({ ...prev, [t.id]: result })))
            .catch(() => {});
        });
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [user]);

  const start = async (testId) => {
    if (showProGate) { router.push("/pricing"); return; }
    setStarting(testId);
    setStartError("");
    try {
      const session = await api.startSession(testId);
      router.push(`/test/${session.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start test.";
      if (msg.includes("403") || msg.toLowerCase().includes("pro")) {
        router.push("/pricing");
      } else {
        setStartError(msg);
      }
      setStarting(null);
    }
  };

  if (mode === "diagnostic") return <PetLoader fullScreen label="is loading diagnostics" />;

  const heroGradient = mode === "full_mock"
    ? GRADIENT
    : mode === "diagnostic"
    ? "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)"
    : "linear-gradient(135deg,#475569 0%,#334155 100%)";

  const heroIcon = mode === "full_mock"
    ? <Crown size={26} color="#fff" />
    : <ClipboardList size={26} color="#fff" />;

  return (
    <DashboardShell title={copy.title}>
      {(loading || fetching) && <PetLoader fullScreen label="is loading your tests" />}

      {!loading && !fetching && (
        <>
          {/* Hero */}
          <div style={{
            borderRadius: 20, padding: "24px 28px", marginBottom: 24,
            background: heroGradient, color: "#fff",
            display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            boxShadow: "0 16px 36px -16px #6366f155",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {heroIcon}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 5px" }}>{copy.title}</h1>
              <p style={{ fontSize: 13.5, opacity: .9, margin: 0, lineHeight: 1.5, maxWidth: 520 }}>
                {copy.subtitle}
              </p>
            </div>
            {mode === "full_mock" && !isPro && (
              <button
                onClick={() => router.push("/pricing")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "11px 22px", borderRadius: 11,
                  background: "rgba(255,255,255,.95)", border: "none",
                  color: ACCENT, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                }}
              >
                <Crown size={15} /> Upgrade to Pro
              </button>
            )}
          </div>

          {/* Pro gate banner */}
          {showProGate && (
            <div style={{
              background: "#fff", border: "1px solid #edeff4", borderRadius: 16,
              padding: "20px 24px", marginBottom: 24,
              display: "flex", alignItems: "flex-start", gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#eef2ff",
                border: "1px solid #c7d2fe", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}>
                <Crown size={20} color={ACCENT} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
                  Pro required for full mock tests
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#64748b", lineHeight: 1.6 }}>
                  Full mock tests include all four modules, AI Writing and Speaking feedback, and detailed band score reports.
                </p>
                <button
                  onClick={() => router.push("/pricing")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 20px", borderRadius: 9, border: "none",
                    background: GRADIENT, color: "#fff",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    boxShadow: "0 6px 18px -6px #6366f199",
                  }}
                >
                  <Crown size={14} /> Upgrade to Pro <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {startError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13.5, color: "#dc2626" }}>
              {startError}
            </div>
          )}

          {/* Test list */}
          {visibleTests.length > 0 ? (
            visibleTests.map(t => (
              <TestCard
                key={t.id}
                test={t}
                lastResult={lastResults[t.id]}
                isPro={isPro}
                showProGate={showProGate}
                mode={mode}
                onStart={start}
                starting={starting}
              />
            ))
          ) : (
            <div style={{
              textAlign: "center", padding: "56px 24px",
              background: "#fff", borderRadius: 20, border: "1px solid #edeff4",
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{copy.emptyMessage}</p>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
