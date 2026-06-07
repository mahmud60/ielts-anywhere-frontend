"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Conversation } from "@elevenlabs/react";
import { api } from "@/lib/api";
import { SPEAKING_THEME } from "@/lib/moduleColors";
import PetLoader from "@/components/PetLoader";

const AGENT_ID = "agent_9801ksdjxvqqfkdvsh8acxc4xge5";
const PRIMARY = SPEAKING_THEME.accent;
const BORDER  = "#e2e8f0";
const TEXT    = "#0f172a";
const MUTED   = "#94a3b8";
const GREEN   = "#059669";
const AMBER   = "#d97706";

function MicIcon({ size = 32, color = "currentColor" }) {
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

/**
 * ElevenLabs speaking module for use inside the test session flow.
 * Props:
 *   testSessionId — UUID of the TestSession to link the attempt to
 *   onComplete    — called after scoring succeeds (advances the session)
 *   getToken      — async () => Firebase ID token (unused; api.js handles auth)
 */
export default function ElevenLabsSpeakingModule({ testSessionId, onComplete }) {
  const [phase, setPhase]           = useState("idle");
  const [errorMsg, setErrorMsg]     = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);

  const elSessionId   = useRef(null);
  const submittedRef  = useRef(false);
  const transcriptRef = useRef([]);
  const convRef       = useRef(null);

  const timerRunning = phase === "live";
  const elapsed = useElapsedTimer(timerRunning);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const submitAndComplete = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("scoring");

    const msgs = transcriptRef.current;
    if (msgs.length === 0) {
      onComplete?.();
      return;
    }

    try {
      await api.elSubmitSpeaking(msgs, elSessionId.current, testSessionId);
      onComplete?.();
    } catch (e) {
      setPhase("error");
      setErrorMsg(e.message ?? "Scoring failed. Please try again.");
      submittedRef.current = false;
    }
  }, [testSessionId, onComplete]);

  async function handleStart() {
    setPhase("connecting");
    const doSubmit = submitAndComplete;
    try {
      let sessionOpts;
      try {
        const { signed_url } = await api.elGetSignedUrl();
        sessionOpts = { signedUrl: signed_url };
      } catch {
        sessionOpts = { agentId: AGENT_ID };
      }

      const conv = await Conversation.startSession({
        ...sessionOpts,
        onConnect: ({ conversationId }) => {
          elSessionId.current = conversationId;
          setPhase("live");
        },
        onDisconnect: () => {
          convRef.current = null;
          doSubmit();
        },
        onMessage: ({ message, source }) => {
          setTranscript(prev => [...prev, {
            role: source === "ai" ? "agent" : "user",
            text: message,
            timestamp: Date.now(),
          }]);
        },
        onModeChange: ({ mode }) => setAgentSpeaking(mode === "speaking"),
        onError: (msg) => {
          setPhase("error");
          setErrorMsg(typeof msg === "string" ? msg : "Connection error. Check your microphone and try again.");
        },
      });
      convRef.current = conv;
    } catch (e) {
      const msg = e?.message ?? String(e);
      setErrorMsg(
        msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")
          ? "Microphone access was denied. Please allow microphone access and try again."
          : msg || "Could not connect. Please try again."
      );
      setPhase("error");
    }
  }

  async function handleEnd() {
    setPhase("ending");
    try { await convRef.current?.endSession(); } catch {}
  }

  const isLive       = phase === "live";
  const isConnecting = phase === "connecting" || phase === "ending";
  const isScoring    = phase === "scoring";
  const userSpeaking = isLive && !agentSpeaking;
  const ringColor    = agentSpeaking ? PRIMARY : userSpeaking ? "#a78bfa" : MUTED;
  const micBg        = agentSpeaking ? SPEAKING_THEME.soft : userSpeaking ? "#f5f3ff" : "#f8fafc";
  const micIconColor = agentSpeaking ? PRIMARY   : userSpeaking ? PRIMARY : MUTED;

  if (isScoring) {
    return <PetLoader fixed label="is scoring your speaking test" accent={PRIMARY} />;
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: "24px 0", maxWidth: 600, margin: "0 auto" }}>

      {/* Status bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 32, padding: "10px 16px",
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>IELTS Speaking Test</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 12, fontVariantNumeric: "tabular-nums",
            color: isLive ? TEXT : MUTED, fontWeight: 600,
          }}>{elapsed}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
            color: isLive ? GREEN : isConnecting ? AMBER : MUTED }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isLive ? GREEN : isConnecting ? AMBER : MUTED,
              ...(isLive ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
            }} />
            {isLive ? "Live" : isConnecting ? "Connecting…" : "Ready"}
          </div>
        </div>
      </div>

      {/* Mic circle */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", marginBottom: 20 }}>
          {agentSpeaking && (
            <div style={{
              position: "absolute", inset: -12, borderRadius: "50%",
              border: `2px solid ${PRIMARY}`, opacity: 0.4,
              animation: "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite",
            }} />
          )}
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            background: micBg, border: `3px solid ${ringColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color .2s, background .2s",
            boxShadow: isLive ? `0 0 0 6px ${ringColor}22` : "none",
          }}>
            <MicIcon size={38} color={micIconColor} />
          </div>
        </div>

        <p style={{ fontSize: 15, color: TEXT, fontWeight: 600, marginBottom: 4, textAlign: "center" }}>
          {phase === "idle"       && "Ready to start your speaking test"}
          {phase === "connecting" && "Connecting to AI examiner…"}
          {phase === "live"       && (agentSpeaking ? "Examiner is speaking" : "Your turn to speak")}
          {phase === "ending"     && "Ending session…"}
          {phase === "error"      && "Connection error"}
        </p>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 24, textAlign: "center", maxWidth: 340 }}>
          {phase === "idle"  && "The AI examiner will guide you through all three parts of the IELTS speaking test."}
          {phase === "live"  && (agentSpeaking ? "Listen carefully. Respond when the examiner finishes." : "Speak clearly into your microphone.")}
          {phase === "error" && (errorMsg ?? "")}
        </p>

        {phase === "idle" && (
          <button onClick={handleStart} style={{
            padding: "13px 40px", borderRadius: 10, background: SPEAKING_THEME.gradient, border: "none",
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            boxShadow: `0 12px 28px -12px ${PRIMARY}`,
          }}>
            Start Speaking Test
          </button>
        )}

        {phase === "error" && (
          <button onClick={() => { submittedRef.current = false; setPhase("idle"); setErrorMsg(null); }} style={{
            padding: "11px 28px", borderRadius: 8, background: PRIMARY, border: "none",
            color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            Try Again
          </button>
        )}

        {isLive && (
          <button onClick={handleEnd} style={{
            padding: "11px 28px", borderRadius: 8, background: "#fff",
            border: "1px solid #fca5a5", color: "#dc2626", fontWeight: 600,
            fontSize: 14, cursor: "pointer",
          }}>
            End Test
          </button>
        )}
      </div>

      {/* Live transcript */}
      {transcript.length > 0 && (
        <div style={{
          maxHeight: 260, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 8,
          padding: "12px 0", borderTop: `1px solid ${BORDER}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
            Transcript
          </div>
          {transcript.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "9px 13px", borderRadius: 12,
                fontSize: 13, lineHeight: 1.55,
                background: msg.role === "user" ? SPEAKING_THEME.soft : "#f1f5f9",
                border: msg.role === "user" ? "1px solid #ddd6fe" : "none",
                color: msg.role === "user" ? "#312e81" : TEXT,
                borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                borderBottomLeftRadius:  msg.role === "agent" ? 4 : 12,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {msg.role === "agent" ? "Examiner" : "You"}
                </div>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes ping  { 75%, 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}