"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { api } from "@/lib/api";

const AGENT_ID = "agent_9801ksdjxvqqfkdvsh8acxc4xge5";

const PRIMARY = "#0080ff";
const BORDER  = "#e2e8f0";
const TEXT    = "#0f172a";
const MUTED   = "#94a3b8";
const GREEN   = "#059669";
const AMBER   = "#d97706";

/* ─── Mic icon ─────────────────────────────────────────────────────────── */
function MicIcon({ size = 28, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* ─── Elapsed timer ─────────────────────────────────────────────────────── */
function useElapsedTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } else {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    }
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function SpeakingSession() {
  return (
    <ConversationProvider>
      <SpeakingSessionInner />
    </ConversationProvider>
  );
}

function SpeakingSessionInner() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [phase, setPhase]       = useState("idle"); // idle | connecting | live | ending | scoring | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const elSessionId   = useRef(null);
  const submittedRef  = useRef(false);
  const transcriptRef = useRef([]);

  const timerRunning = phase === "live";
  const elapsed = useElapsedTimer(timerRunning);

  // Keep transcriptRef current so callbacks always see the latest messages
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  /* ── Submit transcript → score with Claude → navigate to results ── */
  const submitAndRedirect = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("scoring");

    const msgs = transcriptRef.current;
    if (msgs.length === 0) {
      router.push("/speaking");
      return;
    }

    try {
      const { session_id } = await api.elSubmitSpeaking(msgs, elSessionId.current);
      router.push(`/speaking/results/${session_id}`);
    } catch (e) {
      setPhase("error");
      setErrorMsg(e.message ?? "Scoring failed. Please try again.");
    }
  }, [router]);

  /* ── ElevenLabs conversation hook ── */
  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      elSessionId.current = conversationId;
      setPhase("live");
    },
    onDisconnect: () => {
      // submittedRef prevents double-submission when both agent
      // goodbye and manual End Test trigger onDisconnect
      submitAndRedirect();
    },
    onMessage: ({ message, source }) => {
      setTranscript(prev => [...prev, {
        role: source === "ai" ? "agent" : "user",
        text: message,
        timestamp: Date.now(),
      }]);
    },
    onError: (msg) => {
      setPhase("error");
      setErrorMsg(typeof msg === "string" ? msg : "Connection error. Check your microphone and try again.");
    },
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  /* ── Connect to ElevenLabs agent directly (public agent, no API key needed) ── */
  async function handleStart() {
    setPhase("connecting");
    try {
      await conversation.startSession({ agentId: AGENT_ID });
    } catch (e) {
      const msg = e?.message ?? String(e);
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setErrorMsg("Microphone access was denied. Please allow microphone access in your browser settings and try again.");
      } else {
        setErrorMsg(msg || "Could not connect. Please try again.");
      }
      setPhase("error");
    }
  }

  /* ── End test manually ── */
  async function handleEnd() {
    setPhase("ending");
    try {
      await conversation.endSession();
    } catch {
      // onDisconnect fires regardless; submitAndRedirect handles the rest
    }
  }

  if (loading || !user) return null;

  /* ─── Scoring overlay ─────────────────────────────────────────────────── */
  if (phase === "scoring") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", fontFamily: "system-ui", gap: 20,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: `4px solid ${BORDER}`, borderTopColor: PRIMARY,
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontWeight: 600, color: TEXT, fontSize: 16 }}>Scoring your test…</p>
        <p style={{ color: MUTED, fontSize: 13 }}>This usually takes 10–20 seconds.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─── Main UI ─────────────────────────────────────────────────────────── */
  const isLive       = phase === "live";
  const isConnecting = phase === "connecting" || phase === "ending";
  const agentSpeaking = isLive && conversation.isSpeaking;
  const userSpeaking  = isLive && !conversation.isSpeaking;

  const ringColor    = agentSpeaking ? PRIMARY : userSpeaking ? "#ef4444" : MUTED;
  const micBg        = agentSpeaking ? "#eff6ff" : userSpeaking ? "#fef2f2" : "#f8fafc";
  const micIconColor = agentSpeaking ? PRIMARY   : userSpeaking ? "#ef4444" : MUTED;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "system-ui", background: "#f8fafc",
    }}>
      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => router.push("/speaking")}
          disabled={isLive || isConnecting}
          style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: "4px 8px" }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>IELTS Speaking Test</span>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 600,
          color: isLive ? GREEN : isConnecting ? AMBER : MUTED,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isLive ? GREEN : isConnecting ? AMBER : MUTED,
            ...(isLive ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
          }} />
          {isLive ? "Live" : isConnecting ? "Connecting…" : "Ready"}
        </div>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "32px 24px 40px", maxWidth: 640, margin: "0 auto", width: "100%",
      }}>

        {/* Timer */}
        <div style={{
          fontSize: 13, fontWeight: 600, color: MUTED,
          marginBottom: 32, letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums",
          opacity: isLive ? 1 : 0.4,
        }}>
          {elapsed}
        </div>

        {/* Microphone button */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          {agentSpeaking && (
            <div style={{
              position: "absolute", inset: -12, borderRadius: "50%",
              border: `2px solid ${PRIMARY}`, opacity: 0.4,
              animation: "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite",
            }} />
          )}
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: micBg,
            border: `3px solid ${ringColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color .2s, background .2s",
            boxShadow: isLive ? `0 0 0 6px ${ringColor}22` : "none",
          }}>
            <MicIcon size={40} color={micIconColor} />
          </div>
        </div>

        {/* Status label */}
        <p style={{ fontSize: 14, color: TEXT, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>
          {phase === "idle"       && "Ready to start"}
          {phase === "connecting" && "Connecting to examiner…"}
          {phase === "live"       && (agentSpeaking ? "Examiner is speaking" : "Your turn to speak")}
          {phase === "ending"     && "Ending session…"}
          {phase === "error"      && "Connection error"}
        </p>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 32, textAlign: "center", maxWidth: 360 }}>
          {phase === "idle"  && "Click Start to begin. The AI examiner will guide you through all three parts."}
          {phase === "live"  && (agentSpeaking ? "Listen carefully and respond when the examiner finishes." : "Speak clearly into your microphone.")}
          {phase === "error" && (errorMsg ?? "")}
        </p>

        {/* Action buttons */}
        {phase === "idle" && (
          <button
            onClick={handleStart}
            style={{
              padding: "13px 40px", borderRadius: 10, background: PRIMARY, border: "none",
              color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 16,
            }}
          >
            Start Session
          </button>
        )}

        {phase === "error" && (
          <button
            onClick={() => { submittedRef.current = false; setPhase("idle"); setErrorMsg(null); }}
            style={{
              padding: "11px 28px", borderRadius: 8, background: PRIMARY, border: "none",
              color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 8,
            }}
          >
            Try Again
          </button>
        )}

        {phase === "error" && (
          <button
            onClick={() => router.push("/speaking")}
            style={{
              padding: "11px 28px", borderRadius: 8, background: "#fff",
              border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 600,
              fontSize: 14, cursor: "pointer", marginBottom: 16,
            }}
          >
            ← Back to Speaking
          </button>
        )}

        {isLive && (
          <button
            onClick={handleEnd}
            style={{
              padding: "11px 28px", borderRadius: 8, background: "#fff",
              border: "1px solid #fca5a5", color: "#dc2626", fontWeight: 600,
              fontSize: 14, cursor: "pointer", marginBottom: 24,
            }}
          >
            End Test
          </button>
        )}

        {/* Live transcript */}
        {transcript.length > 0 && (
          <div style={{
            width: "100%", maxHeight: 300, overflowY: "auto",
            display: "flex", flexDirection: "column", gap: 8, paddingTop: 8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
              Transcript
            </div>
            {transcript.map((msg, i) => (
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
        )}
      </div>

      <style>{`
        @keyframes ping  { 75%, 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}