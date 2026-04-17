"use client";
import { useEffect, useState, useCallback } from "react";
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

const MODULES = ["listening", "reading", "writing", "speaking"];
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

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current }) {
  const idx = MODULES.indexOf(current);
  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #e5e7eb",
      padding: "0 24px", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
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
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600,
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
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

// ── Time expired screen ───────────────────────────────────────────────────────
function TimeExpiredScreen({ moduleName, onRestart, restarting }) {
  const color = MOD_COLOR[moduleName] || "#6366f1";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", padding: "40px 24px",
      textAlign: "center", fontFamily: "system-ui, sans-serif",
    }}>
      {/* Clock icon */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#fee2e2", border: "2px solid #fca5a5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 24,
      }}>
        ⏱
      </div>

      <h2 style={{
        fontSize: 24, fontWeight: 600, marginBottom: 8,
        color: "#111827",
      }}>
        Time's up
      </h2>

      <p style={{
        fontSize: 15, color: "#6b7280", marginBottom: 6,
        maxWidth: 400, lineHeight: 1.6,
      }}>
        Your {MOD_DURATION[moduleName]} for the{" "}
        <span style={{ color, fontWeight: 500, textTransform: "capitalize" }}>
          {moduleName}
        </span>{" "}
        module has ended.
      </p>

      <p style={{
        fontSize: 13, color: "#9ca3af", marginBottom: 36,
        maxWidth: 380, lineHeight: 1.6,
      }}>
        You can restart this module from the beginning.
        Your timer will reset and you'll get a fresh attempt.
      </p>

      {/* Restart button */}
      <button
        onClick={onRestart}
        disabled={restarting}
        style={{
          padding: "12px 32px", borderRadius: 10,
          background: color, border: "none",
          color: "#fff", fontSize: 15, fontWeight: 600,
          cursor: restarting ? "not-allowed" : "pointer",
          opacity: restarting ? 0.6 : 1,
          fontFamily: "system-ui",
          transition: "opacity .15s",
          marginBottom: 16,
        }}
      >
        {restarting ? "Restarting…" : `Restart ${moduleName}`}
      </button>

      <p style={{ fontSize: 12, color: "#9ca3af" }}>
        Or continue to the next module if you prefer to skip this one.
      </p>
    </div>
  );
}

// ── Final results ─────────────────────────────────────────────────────────────
function Results({ sessionId }) {
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
      padding: "40px 24px", fontFamily: "system-ui, sans-serif",
    }}>
      <h1 style={{ marginBottom: 4 }}>Test complete</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        All modules submitted.
      </p>

      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: 28, textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          Overall band score
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, color: "#0ea5e9", lineHeight: 1 }}>
          {overall_band?.toFixed(1) ?? "—"}
        </div>
      </div>

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
            <div style={{ fontSize: 28, fontWeight: 600, color: MOD_COLOR[m] }}>
              {module_bands?.[m]?.toFixed(1) ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {Object.entries(improvement_tips || {}).map(([mod, tips]) =>
        tips?.length > 0 && (
          <div key={mod} style={{ marginBottom: 16 }}>
            <div style={{
              fontWeight: 500, textTransform: "capitalize",
              marginBottom: 8, fontSize: 14,
            }}>
              {mod} — tips
            </div>
            {tips.map((tip, i) => (
              <div key={i} style={{
                padding: "9px 12px", background: "#f9fafb",
                borderRadius: 8, fontSize: 13, color: "#4b5563",
                marginBottom: 6, borderLeft: `3px solid ${MOD_COLOR[mod]}`,
              }}>
                {tip}
              </div>
            ))}
          </div>
        )
      )}

      <button
        onClick={() => router.push("/tests")}
        style={{
          width: "100%", padding: 12, borderRadius: 8,
          background: "#0ea5e9", border: "none",
          color: "#fff", fontWeight: 600, cursor: "pointer",
          fontSize: 14, marginTop: 16, fontFamily: "system-ui",
        }}
      >
        Back to tests
      </button>
    </div>
  );
}

// ── Main session page ─────────────────────────────────────────────────────────
export default function SessionPage() {
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [session, setSession]       = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [restarting, setRestarting] = useState(false);

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
    } catch (e) {
      console.error("complete-module failed:", e);
    } finally {
      setTransitioning(false);
    }
  }, [sessionId]);

  // Called when student clicks "Restart" on the expired screen
  const handleRestart = useCallback(async () => {
    setRestarting(true);
    try {
      const updated = await api.resetModule(sessionId);
      setSession(updated);
      // isExpired will become false automatically because
      // the timer hook re-initialises when session updates
    } catch (e) {
      console.error("reset-module failed:", e);
    } finally {
      setRestarting(false);
    }
  }, [sessionId]);

  const current = session?.current_module;

  // Timer — no onExpire callback, just exposes isExpired
  const { formatted, isWarning, isDanger, isExpired } = useModuleTimer({
    sessionId,
    currentModule: current,
    enabled: !!session && current !== "complete",
  });

  if (authLoading || pageLoading) {
    return (
      <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>
    );
  }
  if (!session) return null;

  const showExpiredScreen = isExpired && current !== "complete";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {current !== "complete" && <ProgressBar current={current} />}

      {/* Timer strip — hidden on expired screen (the screen replaces it) */}
      {current !== "complete" && !showExpiredScreen && (
        <div style={{
          maxWidth: 960, margin: "0 auto",
          padding: "12px 24px 0",
        }}>
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

        {/* Time expired — show restart screen instead of module */}
        {showExpiredScreen && (
          <TimeExpiredScreen
            moduleName={current}
            onRestart={handleRestart}
            restarting={restarting}
          />
        )}

        {/* Transitioning between modules */}
        {!showExpiredScreen && transitioning && (
          <p style={{
            padding: 40, textAlign: "center",
            color: "#6b7280", fontFamily: "system-ui",
          }}>
            Saving…
          </p>
        )}

        {/* Module content */}
        {!showExpiredScreen && !transitioning && current === "listening" && (
          <ListeningModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {!showExpiredScreen && !transitioning && current === "reading" && (
          <ReadingModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {!showExpiredScreen && !transitioning && current === "writing" && (
          <WritingModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {!showExpiredScreen && !transitioning && current === "speaking" && (
          <SpeakingModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
          />
        )}
        {current === "complete" && (
          <Results sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}