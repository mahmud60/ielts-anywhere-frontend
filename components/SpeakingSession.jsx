"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Mic, Volume2, Clock, CheckCircle2,
  Headphones, Wifi, PhoneOff, RotateCcw, Sparkles,
} from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { SPEAKING_THEME } from "@/lib/moduleColors";
import PetLoader from "@/components/PetLoader";

const { accent: ACCENT, soft: SOFT, gradient: GRADIENT } = SPEAKING_THEME;

const PARTS = [
  { id: 1, label: "Part 1", title: "Introduction", secs: 300 },
  { id: 2, label: "Part 2", title: "Long turn", secs: 240 },
  { id: 3, label: "Part 3", title: "Discussion", secs: 300 },
];

const CHECKS = [
  { key: "quiet", label: "Quiet room", icon: Wifi },
  { key: "mic", label: "Mic ready", icon: Mic },
  { key: "time", label: "15 min free", icon: Clock },
];

const CSS = `
@keyframes st-ripple{0%{transform:scale(.92);opacity:.55}100%{transform:scale(1.35);opacity:0}}
@keyframes st-bar{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@keyframes st-glow{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes st-spin{to{transform:rotate(360deg)}}
.st-root{min-height:100vh;display:flex;flex-direction:column;background:#0f0a1a;font-family:var(--font-inter),system-ui,sans-serif;color:#fff}
.st-top{height:58px;padding:0 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(15,10,26,.85);backdrop-filter:blur(12px);position:sticky;top:0;z-index:30}
.st-back{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#cbd5e1;display:flex;align-items:center;justify-content:center;cursor:pointer}
.st-back:disabled{opacity:.35;cursor:not-allowed}
.st-body{flex:1;display:grid;grid-template-columns:1fr;min-height:0}
@media(min-width:900px){.st-body{grid-template-columns:1.1fr .9fr}}
.st-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px 32px;position:relative;overflow:hidden;min-height:420px}
.st-stage.idle{background:radial-gradient(ellipse 80% 60% at 50% 0%,#2e1064 0%,#0f0a1a 70%)}
.st-stage.live{background:radial-gradient(ellipse 90% 70% at 50% 20%,#4c1d95 0%,#0f0a1a 75%)}
.st-stage::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(139,92,246,.12),transparent 50%),radial-gradient(circle at 70% 60%,rgba(124,58,237,.08),transparent 45%);pointer-events:none}
.st-parts{display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap;justify-content:center;position:relative;z-index:2}
.st-part{padding:8px 14px;border-radius:99px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#94a3b8;transition:.2s}
.st-part.done{background:rgba(139,92,246,.25);border-color:rgba(167,139,250,.35);color:#ddd6fe}
.st-part.active{background:${GRADIENT};border-color:transparent;color:#fff;box-shadow:0 0 24px rgba(139,92,246,.45)}
.st-orb-wrap{position:relative;width:200px;height:200px;margin:8px 0 28px;z-index:2}
.st-orb-ring{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(167,139,250,.35);animation:st-ripple 2s ease-out infinite}
.st-orb-ring:nth-child(2){animation-delay:.6s}
.st-orb-ring:nth-child(3){animation-delay:1.2s}
.st-orb{width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;z-index:2;transition:box-shadow .3s,background .3s}
.st-bars{display:flex;align-items:center;justify-content:center;gap:5px;height:48px}
.st-bars span{width:5px;height:28px;border-radius:3px;background:linear-gradient(180deg,#c4b5fd,#8b5cf6);animation:st-bar .9s ease-in-out infinite}
.st-bars span:nth-child(2){animation-delay:.12s}
.st-bars span:nth-child(3){animation-delay:.24s}
.st-bars span:nth-child(4){animation-delay:.36s}
.st-bars span:nth-child(5){animation-delay:.48s}
.st-status{text-align:center;max-width:380px;position:relative;z-index:2}
.st-status h2{font-size:22px;font-weight:800;margin:0 0 8px;letter-spacing:-.02em}
.st-status p{font-size:14px;line-height:1.6;color:#a5b4fc;margin:0 0 24px}
.st-checks{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:24px;position:relative;z-index:2}
.st-check{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;font-size:13px;font-weight:500;color:#cbd5e1;transition:.2s}
.st-check.on{border-color:rgba(167,139,250,.5);background:rgba(139,92,246,.2);color:#fff}
.st-check input{accent-color:#8b5cf6;width:15px;height:15px}
.st-cta{padding:15px 32px;border-radius:14px;border:none;font-weight:700;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;gap:9px;transition:.2s;position:relative;z-index:2}
.st-cta.on{background:${GRADIENT};color:#fff;box-shadow:0 16px 40px -12px rgba(139,92,246,.7)}
.st-cta.off{background:rgba(255,255,255,.08);color:#64748b;cursor:not-allowed}
.st-end{margin-top:8px;padding:10px 20px;border-radius:11px;border:1px solid rgba(248,113,113,.35);background:rgba(248,113,113,.08);color:#fca5a5;font-weight:600;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.st-panel{background:#fff;color:#0f172a;display:flex;flex-direction:column;min-height:320px;border-top:1px solid #edeff4}
@media(min-width:900px){.st-panel{border-top:none;border-left:1px solid #edeff4;min-height:0}}
.st-panel-head{padding:16px 20px;border-bottom:1px solid #edeff4;display:flex;align-items:center;justify-content:space-between;gap:12px}
.st-panel-head h3{font-size:14px;font-weight:700;margin:0;color:#0f172a}
.st-panel-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;min-height:200px;max-height:calc(100vh - 200px)}
.st-panel-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 24px;color:#94a3b8}
.st-msg{display:flex;gap:10px;max-width:100%}
.st-msg.user{flex-direction:row-reverse}
.st-avatar{width:32px;height:32px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}
.st-avatar.agent{background:#f1f5f9;color:#64748b}
.st-avatar.user{background:${SOFT};color:${ACCENT}}
.st-bubble{max-width:78%;padding:11px 14px;border-radius:14px;font-size:13.5px;line-height:1.55}
.st-bubble.agent{background:#f4f5f9;color:#334155;border-bottom-left-radius:4px}
.st-bubble.user{background:${SOFT};color:#312e81;border:1px solid #ddd6fe;border-bottom-right-radius:4px}
.st-bubble-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;opacity:.7}
.st-timer-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:#e9d5ff}
.st-live-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:700}
.st-live-pill.live{background:rgba(16,185,129,.15);color:#6ee7b7;border:1px solid rgba(16,185,129,.3)}
.st-live-pill.wait{background:rgba(251,191,36,.12);color:#fcd34d;border:1px solid rgba(251,191,36,.25)}
.st-live-pill.ready{background:rgba(255,255,255,.06);color:#94a3b8;border:1px solid rgba(255,255,255,.1)}
.st-live-dot{width:7px;height:7px;border-radius:50%;background:currentColor;animation:st-glow 1.4s ease-in-out infinite}
.st-err-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:relative;z-index:2}
.st-btn-sec{padding:11px 22px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#e2e8f0;font-weight:600;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
`;

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
    } else if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, seconds: elapsed };
}

function estimatePart(seconds) {
  if (seconds < PARTS[0].secs) return 1;
  if (seconds < PARTS[0].secs + PARTS[1].secs) return 2;
  return 3;
}

function VoiceOrb({ agentSpeaking, userSpeaking, connecting, active }) {
  const glow = agentSpeaking
    ? "0 0 60px rgba(139,92,246,.55), 0 0 100px rgba(124,58,237,.25)"
    : userSpeaking
      ? "0 0 50px rgba(167,139,250,.45)"
      : "0 0 30px rgba(139,92,246,.15)";

  return (
    <div className="st-orb-wrap">
      {active && (
        <>
          <div className="st-orb-ring" />
          <div className="st-orb-ring" />
          <div className="st-orb-ring" />
        </>
      )}
      <div
        className="st-orb"
        style={{
          background: agentSpeaking
            ? "linear-gradient(145deg,#7c3aed,#5b21b6)"
            : userSpeaking
              ? "linear-gradient(145deg,#8b5cf6,#6d28d9)"
              : "linear-gradient(145deg,#3b2667,#1e1535)",
          boxShadow: glow,
          border: `2px solid ${active ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.08)"}`,
        }}
      >
        {connecting ? (
          <div className="st-bars"><span /><span /><span /><span /><span /></div>
        ) : agentSpeaking ? (
          <div className="st-bars"><span /><span /><span /><span /><span /></div>
        ) : (
          <Mic size={52} color={userSpeaking ? "#fff" : "#a78bfa"} strokeWidth={1.5} />
        )}
      </div>
    </div>
  );
}

export default function SpeakingSession() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [checks, setChecks] = useState({ quiet: false, mic: false, time: false });

  const roomNameRef = useRef(null);
  const submittedRef = useRef(false);
  const transcriptRef = useRef([]);
  const roomRef = useRef(null);
  const audioElRef = useRef(null);
  const transcriptEndRef = useRef(null);

  const isLive = phase === "live";
  const isConnecting = phase === "connecting" || phase === "ending";
  const { display: elapsed, seconds } = useElapsedTimer(isLive);
  const activePart = estimatePart(seconds);
  const userSpeaking = isLive && !agentSpeaking;
  const allChecked = checks.quiet && checks.mic && checks.time;
  const stageActive = isLive || isConnecting;

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

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
      const { session_id } = await api.submitSpeaking(msgs, roomNameRef.current);
      router.push(`/speaking/results/${session_id}`);
    } catch (e) {
      setPhase("error");
      setErrorMsg(e.message ?? "Scoring failed. Please try again.");
      submittedRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Cleanup LiveKit room and audio element on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      if (audioElRef.current) { audioElRef.current.remove(); audioElRef.current = null; }
    };
  }, []);

  async function handleStart() {
    setPhase("connecting");
    const doSubmit = submitAndRedirect;
    try {
      const { token, room_name, ws_url } = await api.lkGetToken();
      roomNameRef.current = room_name;

      const room = new Room({
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      roomRef.current = room;

      // Receive transcript entries sent by the agent via data channel
      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.role && msg.text) {
            setTranscript((prev) => [...prev, { role: msg.role, text: msg.text, timestamp: msg.timestamp }]);
          }
        } catch { /* ignore malformed packets */ }
      });

      // Track which participant is actively speaking for the voice orb
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setAgentSpeaking(speakers.some((p) => !p.isLocal));
      });

      // Subscribe to agent audio and play it through a hidden <audio> element
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (track.kind === Track.Kind.Audio && !participant.isLocal) {
          const el = track.attach();
          el.autoplay = true;
          document.body.appendChild(el);
          audioElRef.current = el;
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
      });

      room.on(RoomEvent.Disconnected, () => {
        roomRef.current = null;
        doSubmit();
      });

      room.on(RoomEvent.MediaDevicesError, (e) => {
        setPhase("error");
        setErrorMsg("Microphone access was denied. Allow microphone access in your browser settings, then try again.");
      });

      await room.connect(ws_url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setPhase("live");
    } catch (e) {
      const msg = e?.message ?? String(e);
      setErrorMsg(
        msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")
          ? "Microphone access was denied. Allow microphone access in your browser settings, then try again."
          : msg || "Could not connect. Please try again."
      );
      setPhase("error");
    }
  }

  async function handleEnd() {
    setPhase("ending");
    try { await roomRef.current?.disconnect(); } catch { /* RoomEvent.Disconnected handles submit */ }
  }

  if (loading || !user) {
    return <PetLoader fixed label="is loading your test" accent={ACCENT} bg="#0f0a1a" />;
  }
  if (phase === "scoring") {
    return <PetLoader fixed label="is scoring your speaking test" accent={ACCENT} bg="#0f0a1a" />;
  }

  const status = {
    idle: { title: "IELTS Speaking Test", hint: "Your AI examiner is ready. Confirm you're set up, then begin the full 3-part test." },
    connecting: { title: "Connecting…", hint: "Establishing a secure voice line with your examiner." },
    live: agentSpeaking
      ? { title: "Listen to the examiner", hint: "Wait until they finish, then respond in full sentences." }
      : { title: "Your turn to speak", hint: "Speak clearly and naturally — your answers are recorded live." },
    ending: { title: "Finishing up", hint: "Saving your session and preparing your band score." },
    error: { title: "Connection issue", hint: errorMsg ?? "Something went wrong. Please try again." },
  }[phase] || { title: "", hint: "" };

  const livePillClass = isLive ? "live" : isConnecting ? "wait" : "ready";
  const livePillLabel = isLive ? "Live session" : isConnecting ? "Connecting" : "Ready";

  return (
    <div className="st-root">
      <style>{CSS}</style>

      {/* Top bar */}
      <header className="st-top">
        <button
          type="button"
          className="st-back"
          onClick={() => router.push("/speaking")}
          disabled={isLive || isConnecting}
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>IELTS Speaking</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>AI examiner · Parts 1–3</div>
        </div>
        <div className="st-timer-pill">
          <Clock size={13} />
          {elapsed}
        </div>
        <div className={`st-live-pill ${livePillClass}`}>
          <span className="st-live-dot" />
          {livePillLabel}
        </div>
      </header>

      <div className="st-body">
        {/* Stage — immersive dark panel */}
        <section className={`st-stage ${stageActive ? "live" : "idle"}`}>
          {/* Part pills */}
          <div className="st-parts">
            {PARTS.map((p) => {
              const done = isLive && p.id < activePart;
              const active = isLive && p.id === activePart;
              return (
                <span key={p.id} className={`st-part ${done ? "done" : ""} ${active ? "active" : ""}`}>
                  {p.label} · {p.title}
                </span>
              );
            })}
          </div>

          <VoiceOrb
            agentSpeaking={agentSpeaking}
            userSpeaking={userSpeaking}
            connecting={isConnecting}
            active={stageActive}
          />

          <div className="st-status">
            <h2>{status.title}</h2>
            <p>{status.hint}</p>
          </div>

          {/* Idle: quick checks + start */}
          {phase === "idle" && (
            <>
              <div className="st-checks">
                {CHECKS.map((c) => {
                  const Icon = c.icon;
                  const on = checks[c.key];
                  return (
                    <label key={c.key} className={`st-check ${on ? "on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setChecks((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                      />
                      <Icon size={14} />
                      {c.label}
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                className={`st-cta ${allChecked ? "on" : "off"}`}
                onClick={handleStart}
                disabled={!allChecked}
              >
                <Headphones size={17} /> Begin speaking test
              </button>
            </>
          )}

          {phase === "error" && (
            <div className="st-err-actions">
              <button type="button" className="st-cta on" onClick={() => { submittedRef.current = false; setPhase("idle"); setErrorMsg(null); }}>
                <RotateCcw size={15} /> Try again
              </button>
              <button type="button" className="st-btn-sec" onClick={() => router.push("/speaking")}>
                <ChevronLeft size={15} /> Exit
              </button>
            </div>
          )}

          {isLive && (
            <button type="button" className="st-end" onClick={handleEnd}>
              <PhoneOff size={15} /> End test early
            </button>
          )}
        </section>

        {/* Transcript panel */}
        <aside className="st-panel">
          <div className="st-panel-head">
            <h3>Live transcript</h3>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              {transcript.length} message{transcript.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="st-panel-body">
            {transcript.length === 0 ? (
              <div className="st-panel-empty">
                <Volume2 size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: "#64748b", marginBottom: 6 }}>Conversation will appear here</div>
                <div style={{ fontSize: 13, lineHeight: 1.55, maxWidth: 260 }}>
                  Once you start, examiner questions and your responses show up in real time.
                </div>
              </div>
            ) : (
              transcript.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`st-msg ${isUser ? "user" : ""}`}>
                    <div className={`st-avatar ${isUser ? "user" : "agent"}`}>
                      {isUser ? "You" : "Ex"}
                    </div>
                    <div className={`st-bubble ${isUser ? "user" : "agent"}`}>
                      <div className="st-bubble-label">{isUser ? "Your answer" : "Examiner"}</div>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>

          {isLive && (
            <div style={{ padding: "12px 18px", borderTop: "1px solid #edeff4", background: "#fafbff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#64748b" }}>
                <Sparkles size={14} color={ACCENT} />
                {agentSpeaking ? "Examiner is speaking — listen before you reply" : "Microphone active — speak when ready"}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
