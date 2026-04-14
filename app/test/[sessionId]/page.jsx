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

const MODULES = ["listening", "reading", "writing", "speaking"];
const MOD_COLOR = {
  listening: "#0ea5e9", reading: "#f59e0b",
  writing: "#10b981", speaking: "#8b5cf6",
};

function ProgressBar({ current }) {
  const idx = MODULES.indexOf(current);
  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #e5e7eb",
      padding: "10px 24px", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {MODULES.map((m, i) => {
            const done = i < idx;
            const active = m === current;
            const color = MOD_COLOR[m];
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
                  <span style={{ fontSize: 12, color: active ? color : "#9ca3af", fontWeight: active ? 600 : 400, textTransform: "capitalize" }}>
                    {m}
                  </span>
                </div>
                {i < MODULES.length - 1 && (
                  <div style={{ width: 24, height: 1, background: i < idx ? "#10b981" : "#e5e7eb" }} />
                )}
              </div>
            );
          })}
        </div>
        {/* Timer slot — filled by child */}
        <div id="module-timer-slot" />
      </div>
    </div>
  );
}

function Results({ sessionId }) {
  const [data, setData] = useState(null);
  const router = useRouter();
  useEffect(() => { api.getResults(sessionId).then(setData).catch(console.error); }, [sessionId]);
  if (!data) return <p style={{ padding: 32 }}>Loading results…</p>;
  const { overall_band, module_bands, improvement_tips } = data;
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ marginBottom: 4 }}>Test complete</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>All four modules submitted.</p>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 28, textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Overall band score</div>
        <div style={{ fontSize: 72, fontWeight: 700, color: "#0ea5e9", lineHeight: 1 }}>
          {overall_band?.toFixed(1) ?? "—"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {MODULES.map(m => (
          <div key={m} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "capitalize", marginBottom: 6 }}>{m}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: MOD_COLOR[m] }}>{module_bands?.[m]?.toFixed(1) ?? "—"}</div>
          </div>
        ))}
      </div>
      {Object.entries(improvement_tips || {}).map(([mod, tips]) =>
        tips?.length > 0 && (
          <div key={mod} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, textTransform: "capitalize", marginBottom: 8, fontSize: 14 }}>{mod} — tips</div>
            {tips.map((tip, i) => (
              <div key={i} style={{ padding: "9px 12px", background: "#f9fafb", borderRadius: 8, fontSize: 13, color: "#4b5563", marginBottom: 6, borderLeft: `3px solid ${MOD_COLOR[mod]}` }}>{tip}</div>
            ))}
          </div>
        )
      )}
      <button onClick={() => router.push("/tests")} style={{ width: "100%", padding: 12, borderRadius: 8, background: "#0ea5e9", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, marginTop: 16 }}>
        Back to tests
      </button>
    </div>
  );
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // Each module component exposes a submit trigger via ref
  // When the timer expires, we call this to auto-submit
  const autoSubmitRef = useRef(null);

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

  // Called by the timer when time expires
  const handleTimeExpired = useCallback(() => {
    if (autoSubmitRef.current) {
      autoSubmitRef.current();
    }
  }, []);

  const current = session?.current_module;

  const { formatted, isWarning, isDanger, isExpired } = useModuleTimer({
    sessionId,
    currentModule: current,
    onExpire: handleTimeExpired,
    enabled: !!session && current !== "complete",
  });

  if (authLoading || pageLoading) return <p style={{ padding: 32 }}>Loading…</p>;
  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {current !== "complete" && <ProgressBar current={current} />}

      {/* Timer — rendered below the sticky bar, above module content */}
      {current !== "complete" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 24px 0" }}>
          <ModuleTimer
            formatted={formatted}
            isWarning={isWarning}
            isDanger={isDanger}
            isExpired={isExpired}
            moduleName={current ? current.charAt(0).toUpperCase() + current.slice(1) : ""}
          />
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        {transitioning && <p style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Saving…</p>}

        {!transitioning && current === "listening" && (
          <ListeningModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
            autoSubmitRef={autoSubmitRef}
          />
        )}
        {!transitioning && current === "reading" && (
          <ReadingModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
            autoSubmitRef={autoSubmitRef}
          />
        )}
        {!transitioning && current === "writing" && (
          <WritingModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
            autoSubmitRef={autoSubmitRef}
          />
        )}
        {!transitioning && current === "speaking" && (
          <SpeakingModule
            apiBase={process.env.NEXT_PUBLIC_API_BASE}
            getToken={() => auth.currentUser.getIdToken(true)}
            sessionId={sessionId}
            onComplete={handleModuleComplete}
            autoSubmitRef={autoSubmitRef}
          />
        )}
        {!transitioning && current === "complete" && <Results sessionId={sessionId} />}
      </div>
    </div>
  );
}