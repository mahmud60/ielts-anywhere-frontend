"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useModuleTimer } from "@/lib/useModuleTimer";
import ModuleTimer from "@/components/ModuleTimer";
import ListeningModule from "@/components/ListeningModule";
import ReadingModule from "@/components/ReadingModule";
import WritingModule from "@/components/WritingModule";
import SpeakingModule from "@/components/SpeakingModule";

const MODULES   = ["listening", "reading", "writing", "speaking"];
const MOD_COLOR = {
  listening: "#0ea5e9",
  reading:   "#f59e0b",
  writing:   "#10b981",
  speaking:  "#8b5cf6",
};
const MOD_DURATION = {
  listening: "30 minutes",
  reading:   "60 minutes",
  writing:   "60 minutes",
  speaking:  "15 minutes",
};

// ── helpers ───────────────────────────────────────────────────────────────────
function bandColor(b) {
  if (!b) return "#9ca3af";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

// ── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current }) {
  const idx = MODULES.indexOf(current);
  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #e5e7eb",
      padding: "0 24px", height: 52,
      display: "flex", alignItems: "center",
      position: "sticky", top: 0, zIndex: 100,
      fontFamily: "system-ui",
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {MODULES.map((m, i) => {
          const done   = i < idx;
          const active = m === current;
          const color  = MOD_COLOR[m];
          return (
            <div key={m} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 99,
                background: active ? color + "18" : "transparent",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: done ? "#10b981" : active ? color : "#e5e7eb",
                  color: done || active ? "#fff" : "#9ca3af",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11, fontWeight: 600,
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? color : "#9ca3af",
                  textTransform: "capitalize",
                }}>
                  {m}
                </span>
              </div>
              {i < MODULES.length - 1 && (
                <div style={{
                  width: 24, height: 1,
                  background: i < idx ? "#10b981" : "#e5e7eb",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── time expired screen ───────────────────────────────────────────────────────
function TimeExpiredScreen({ moduleName, sessionId, onRestart, onRetakeAll, restarting, retaking }) {
  const [scores, setScores] = useState(null);
  const [loadingScores, setLoadingScores] = useState(true);
  const color = MOD_COLOR[moduleName] || "#6366f1";

  useEffect(() => {
    api.getLastScores(sessionId)
      .then(data => setScores(data))
      .catch(console.error)
      .finally(() => setLoadingScores(false));
  }, [sessionId]);

  const moduleScore = scores?.scores?.[moduleName];
  const moduleTips  = scores?.tips?.[moduleName] || [];

  return (
    <div style={{
      maxWidth: 560, margin: "0 auto",
      padding: "48px 24px", textAlign: "center",
      fontFamily: "system-ui",
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#fee2e2", border: "2px solid #fca5a5",
        display: "flex", alignItems: "center",
        justifyContent: "center",
        fontSize: 30, margin: "0 auto 24px",
      }}>
        ⏱
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
        Time's up
      </h2>
      <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 }}>
        Your {MOD_DURATION[moduleName]} for{" "}
        <span style={{ color, fontWeight: 500, textTransform: "capitalize" }}>
          {moduleName}
        </span>{" "}
        has ended.
      </p>

      {/* Last score card */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: "20px 24px",
        marginBottom: 24, textAlign: "left",
      }}>
        <div style={{
          fontSize: 12, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: "0.06em", marginBottom: 12,
        }}>
          Your last score for this module
        </div>

        {loadingScores ? (
          <div style={{ color: "#9ca3af", fontSize: 14, padding: "8px 0" }}>
            Loading…
          </div>
        ) : moduleScore ? (
          <>
            {/* Band score */}
            <div style={{
              display: "flex", alignItems: "center",
              gap: 16, marginBottom: 16,
            }}>
              <div style={{
                fontSize: 52, fontWeight: 700,
                color: bandColor(moduleScore),
                fontFamily: "monospace", lineHeight: 1,
              }}>
                {moduleScore.toFixed(1)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                  Band score
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                </div>
              </div>
            </div>

            {/* Tips */}
            {moduleTips.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>
                  Improvement tips
                </div>
                {moduleTips.slice(0, 2).map((tip, i) => (
                  <div key={i} style={{
                    padding: "8px 12px",
                    background: "#fffbeb",
                    borderRadius: 8,
                    fontSize: 13, color: "#78350f",
                    borderLeft: "3px solid #f59e0b",
                    lineHeight: 1.55, textAlign: "left",
                  }}>
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: "12px 0", color: "#9ca3af",
            fontSize: 14, lineHeight: 1.6,
          }}>
            No score recorded — the timer expired before you submitted answers.
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Restart this module */}
        <button
          onClick={onRestart}
          disabled={restarting || retaking}
          style={{
            width: "100%", padding: "13px",
            borderRadius: 10, border: "none",
            background: color, color: "#fff",
            fontSize: 15, fontWeight: 600,
            cursor: restarting || retaking ? "not-allowed" : "pointer",
            opacity: restarting || retaking ? 0.6 : 1,
            fontFamily: "system-ui", transition: "opacity .15s",
          }}
        >
          {restarting
            ? "Restarting…"
            : `Restart ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}`}
        </button>

        {/* Retake entire test */}
        <button
          onClick={onRetakeAll}
          disabled={restarting || retaking}
          style={{
            width: "100%", padding: "13px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff", color: "#374151",
            fontSize: 14, fontWeight: 500,
            cursor: restarting || retaking ? "not-allowed" : "pointer",
            opacity: restarting || retaking ? 0.6 : 1,
            fontFamily: "system-ui", transition: "all .15s",
          }}
          onMouseEnter={e => {
            if (!restarting && !retaking) {
              e.currentTarget.style.background = "#f9fafb";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#fff";
          }}
        >
          {retaking ? "Resetting…" : "Retake full test from the beginning"}
        </button>
      </div>

      <p style={{
        fontSize: 12, color: "#9ca3af",
        marginTop: 20, lineHeight: 1.6,
      }}>
        Restarting a single module resets only that module's timer and answers.
        Retaking the full test resets all four modules.
      </p>
    </div>
  );
}

// ── final results ─────────────────────────────────────────────────────────────
function Results({ sessionId, onRetakeAll, retaking }) {
  const [data, setData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    api.getResults(sessionId).then(setData).catch(console.error);
  }, [sessionId]);

  if (!data) return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading results…</p>;

  const { overall_band, module_bands, improvement_tips } = data;

  return (
    <div style={{
      maxWidth: 600, margin: "0 auto",
      padding: "40px 24px", fontFamily: "system-ui",
    }}>
      <h1 style={{ marginBottom: 4 }}>Test complete</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>All modules submitted.</p>

      {/* Overall */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: 28,
        textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          Overall band score
        </div>
        <div style={{
          fontSize: 72, fontWeight: 700,
          color: bandColor(overall_band), lineHeight: 1,
          fontFamily: "monospace",
        }}>
          {overall_band?.toFixed(1) ?? "—"}
        </div>
      </div>

      {/* Module bands */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, marginBottom: 28,
      }}>
        {MODULES.map(m => (
          <div key={m} style={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "14px 16px",
          }}>
            <div style={{
              fontSize: 12, color: "#9ca3af",
              textTransform: "capitalize", marginBottom: 6,
            }}>
              {m}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 600,
              color: bandColor(module_bands?.[m]),
              fontFamily: "monospace",
            }}>
              {module_bands?.[m]?.toFixed(1) ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {Object.entries(improvement_tips || {}).map(([mod, tips]) =>
        tips?.length > 0 && (
          <div key={mod} style={{ marginBottom: 16 }}>
            <div style={{
              fontWeight: 500, textTransform: "capitalize",
              marginBottom: 8, fontSize: 14,
            }}>
              {mod} — improvement tips
            </div>
            {tips.map((tip, i) => (
              <div key={i} style={{
                padding: "9px 12px", background: "#f9fafb",
                borderRadius: 8, fontSize: 13, color: "#4b5563",
                marginBottom: 6,
                borderLeft: `3px solid ${MOD_COLOR[mod]}`,
              }}>
                {tip}
              </div>
            ))}
          </div>
        )
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <button
          onClick={onRetakeAll}
          disabled={retaking}
          style={{
            width: "100%", padding: 12, borderRadius: 8,
            background: "#6366f1", border: "none",
            color: "#fff", fontWeight: 600,
            cursor: retaking ? "not-allowed" : "pointer",
            fontSize: 14, fontFamily: "system-ui",
            opacity: retaking ? 0.6 : 1,
          }}
        >
          {retaking ? "Resetting…" : "Retake this test"}
        </button>
        <button
          onClick={() => router.push("/tests")}
          style={{
            width: "100%", padding: 12, borderRadius: 8,
            border: "1px solid #e5e7eb", background: "#fff",
            color: "#374151", fontWeight: 500,
            cursor: "pointer", fontSize: 14, fontFamily: "system-ui",
          }}
        >
          Choose a different test
        </button>
      </div>
    </div>
  );
}

// ── main session page ─────────────────────────────────────────────────────────
export default function SessionPage() {
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [session,     setSession]     = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [restarting,  setRestarting]  = useState(false);
  const [retaking,    setRetaking]    = useState(false);

  // resetKey forces module components to fully remount after a reset.
  // Incrementing it changes the `key` prop which makes React destroy
  // and recreate the component — reinitialising all state including the timer.
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.getSession(sessionId)
      .then(s => { setSession(s); setPageLoading(false); })
      .catch(() => router.push("/tests"));
  }, [sessionId, user, router]);

  const handleModuleComplete = useCallback(async () => {
    setTransitioning(true);
    try {
      const updated = await api.completeModule(sessionId);
      setSession(updated);
      // Increment resetKey so the next module mounts fresh
      setResetKey(k => k + 1);
    } catch (e) {
      console.error("complete-module failed:", e);
    } finally {
      setTransitioning(false);
    }
  }, [sessionId]);

  // Restart just this module — resets timer, keeps other modules intact
  const handleRestart = useCallback(async () => {
    setRestarting(true);
    try {
      await api.resetModule(sessionId);
      // Increment resetKey — this remounts the current module component
      // which re-runs useModuleTimer from scratch, fetching the fresh timer
      setResetKey(k => k + 1);
      // Re-fetch session to sync any state changes
      const updated = await api.getSession(sessionId);
      setSession(updated);
    } catch (e) {
      console.error("reset-module failed:", e);
    } finally {
      setRestarting(false);
    }
  }, [sessionId]);

  // Retake the full test — resets all modules and timer
  const handleRetakeAll = useCallback(async () => {
    if (!confirm("Reset the entire test? All your progress will be cleared.")) return;
    setRetaking(true);
    try {
      const updated = await api.restartSession(sessionId);
      setSession(updated);
      // Fresh key so all module components reinitialise
      setResetKey(k => k + 1);
    } catch (e) {
      console.error("restart-session failed:", e);
    } finally {
      setRetaking(false);
    }
  }, [sessionId]);

  const current = session?.current_module;

  const { formatted, isWarning, isDanger, isExpired } = useModuleTimer({
    sessionId,
    currentModule: current,
    enabled: !!session && current !== "complete",
    resetKey,
  });

  if (authLoading || pageLoading) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>;
  }
  if (!session) return null;

  const showExpired = isExpired && current !== "complete";

  // The key for module components — changes on every reset/complete
  // so React fully recreates the component, reinitialising the timer hook
  const moduleKey = `${current}-${resetKey}`;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {current !== "complete" && <ProgressBar current={current} />}

      {/* Timer — hidden when expired (expired screen takes over) */}
      {current !== "complete" && !showExpired && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 24px 0" }}>
          <ModuleTimer
            formatted={formatted}
            isWarning={isWarning}
            isDanger={isDanger}
            isExpired={false}
            moduleName={current
              ? current.charAt(0).toUpperCase() + current.slice(1)
              : ""}
          />
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>

        {/* Time expired screen */}
        {showExpired && (
          <TimeExpiredScreen
            moduleName={current}
            sessionId={sessionId}
            onRestart={handleRestart}
            onRetakeAll={handleRetakeAll}
            restarting={restarting}
            retaking={retaking}
          />
        )}

        {/* Saving indicator */}
        {!showExpired && transitioning && (
          <p style={{
            padding: 40, textAlign: "center",
            color: "#6b7280", fontFamily: "system-ui",
          }}>
            Saving…
          </p>
        )}

        {/* Module components — key prop forces full remount on reset */}
        {!showExpired && !transitioning && current === "listening" && (
          <ListeningModule
            key={moduleKey}
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {!showExpired && !transitioning && current === "reading" && (
          <ReadingModule
            key={moduleKey}
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {!showExpired && !transitioning && current === "writing" && (
          <WritingModule
            key={moduleKey}
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {!showExpired && !transitioning && current === "speaking" && (
          <SpeakingModule
            key={moduleKey}
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}

        {/* Final results */}
        {current === "complete" && (
          <Results
            sessionId={sessionId}
            onRetakeAll={handleRetakeAll}
            retaking={retaking}
          />
        )}
      </div>
    </div>
  );
}