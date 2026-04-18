/**
 * SpeakingModule.jsx
 *
 * IELTS Speaking module — 3-part format with AI examiner conversation.
 * Text-based now, structured for easy voice upgrade later.
 *
 * Props:
 *   apiBase   — FastAPI URL e.g. "http://localhost:8000"
 *   getToken  — async () => Firebase ID token string
 *   sessionId — UUID string of the current TestSession
 *   onComplete— callback fired after grading completes
 *
 * Architecture note:
 *   This component collects exchanges (question + answer pairs) for all
 *   three parts, then submits the full transcript at the end.
 *   The AI examiner persona is purely frontend — it displays each question
 *   in sequence and waits for the student's response.
 *   Grading is async: submit → poll until complete → show results.
 *
 * Voice upgrade path:
 *   Replace the <textarea> in AnswerInput with a MediaRecorder hook.
 *   Send audio blob to POST /speaking/transcribe (Whisper endpoint).
 *   Use the returned transcript string as the answer.
 *   Everything else — submission, polling, results — stays identical.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#1a1f2e",
  card: "#1e2536",
  border: "#2a3547",
  borderHover: "#3a4a62",
  accent: "#6366f1",
  accentDim: "#1e2051",
  accentLight: "#818cf8",
  green: "#10b981",
  greenDim: "#022c22",
  gold: "#f59e0b",
  goldDim: "#2d1f02",
  red: "#ef4444",
  redDim: "#2d0a0a",
  text: "#e2e8f0",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  examiner: "#1e3a5f",
  examinerBorder: "#2563eb44",
  student: "#1a2d1a",
  studentBorder: "#16a34a44",
};

const PART_INFO = {
  1: {
    label: "Part 1",
    subtitle: "Introduction & Interview",
    color: "#6366f1",
    duration: "4–5 minutes",
    icon: "👤",
  },
  2: {
    label: "Part 2",
    subtitle: "Individual Long Turn",
    color: "#06b6d4",
    duration: "3–4 minutes",
    icon: "🗣️",
  },
  3: {
    label: "Part 3",
    subtitle: "Two-way Discussion",
    color: "#8b5cf6",
    duration: "4–5 minutes",
    icon: "💬",
  },
};

const CRITERIA = [
  { key: "fluency_coherence", label: "Fluency & Coherence" },
  { key: "lexical_resource", label: "Lexical Resource" },
  { key: "grammatical_range", label: "Grammatical Range" },
  { key: "pronunciation", label: "Pronunciation" },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  .sm-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .sm-root { font-family: 'Inter', sans-serif; color: ${C.text}; background: ${C.bg}; min-height: 100vh; }
  .sm-root ::-webkit-scrollbar { width: 3px; }
  .sm-root ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  @keyframes sm-fadeup { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sm-spin { to { transform: rotate(360deg); } }
  @keyframes sm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes sm-typing { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
  @keyframes sm-record-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.18);opacity:.65} }
  .sm-fadeup { animation: sm-fadeup .25s ease both; }
  .sm-card { background:${C.card}; border:1px solid ${C.border}; border-radius:12px; }
  .sm-spinner { width:18px; height:18px; border:2px solid ${C.border}; border-top-color:${C.accent}; border-radius:50%; animation:sm-spin .7s linear infinite; display:inline-block; }
  .sm-btn { font-family:'Inter',sans-serif; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; padding:9px 20px; transition:all .15s; }
  .sm-btn-primary { background:${C.accent}; color:#fff; }
  .sm-btn-primary:hover { background:#4f46e5; }
  .sm-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .sm-btn-outline { background:transparent; color:${C.accentLight}; border:1px solid ${C.accent}44; }
  .sm-btn-outline:hover { background:${C.accentDim}; }
  .sm-btn-ghost { background:transparent; color:${C.muted}; border:none; }
  .sm-bubble-examiner { background:${C.examiner}; border:1px solid ${C.examinerBorder}; border-radius:12px 12px 12px 4px; padding:12px 16px; font-size:14px; line-height:1.65; color:${C.text}; max-width:85%; }
  .sm-bubble-student { background:${C.student}; border:1px solid ${C.studentBorder}; border-radius:12px 12px 4px 12px; padding:12px 16px; font-size:14px; line-height:1.65; color:${C.text}; max-width:85%; }
  .sm-textarea { width:100%; font-family:'Inter',sans-serif; font-size:14px; line-height:1.7; color:${C.text}; background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; padding:14px 16px; resize:none; transition:border-color .15s; }
  .sm-textarea:focus { outline:none; border-color:${C.accent}; }
  .sm-textarea::placeholder { color:${C.muted}; }
  .sm-badge { border-radius:99px; font-size:11px; font-weight:600; letter-spacing:.05em; padding:2px 10px; text-transform:uppercase; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function bandColor(b) {
  return b >= 7 ? C.green : b >= 5.5 ? C.gold : C.red;
}

function Spinner() { return <span className="sm-spinner" />; }

function Badge({ children, color }) {
  return (
    <span className="sm-badge" style={{
      background: color + "20", color,
      border: `1px solid ${color}44`,
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}

// ─── Countdown timer ──────────────────────────────────────────────────────────
function Timer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onDone?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = (remaining / seconds) * 100;
  const color = remaining > 20 ? C.green : remaining > 10 ? C.gold : C.red;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 36, height: 36 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke={C.border} strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${pct * 0.942} 94.2`}
            strokeDashoffset="23.55"
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray .9s linear, stroke .3s" }}
          />
        </svg>
        <span style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 9, fontFamily: "'JetBrains Mono'", color,
        }}>
          {remaining}
        </span>
      </div>
      <span style={{ fontSize: 13, color, fontFamily: "'JetBrains Mono'" }}>
        {fmt(remaining)}
      </span>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 14px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: C.mutedLight,
          animation: `sm-typing .9s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Part intro screen ────────────────────────────────────────────────────────
function PartIntro({ part, onStart }) {
  const info = PART_INFO[part.part_number];
  return (
    <div className="sm-fadeup" style={{ maxWidth: 540, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>{info.icon}</div>
      <Badge color={info.color}>{info.label}</Badge>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginTop: 12, marginBottom: 6 }}>
        {info.subtitle}
      </h2>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
        {part.instructions}
      </p>

      {/* Cue card for Part 2 */}
      {part.cue_card && (
        <div style={{
          background: C.surface, border: `1px solid ${info.color}44`,
          borderRadius: 12, padding: "20px 24px", marginBottom: 28,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 12, color: info.color, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Task Card
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.8, whiteSpace: "pre-line", color: C.text }}>
            {part.cue_card}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        <div style={{ padding: "8px 16px", background: C.surface, borderRadius: 8, fontSize: 13, color: C.muted }}>
          {info.duration}
        </div>
        <div style={{ padding: "8px 16px", background: C.surface, borderRadius: 8, fontSize: 13, color: C.muted }}>
          {part.questions.length} question{part.questions.length !== 1 ? "s" : ""}
        </div>
        {part.prep_time_seconds > 0 && (
          <div style={{ padding: "8px 16px", background: C.goldDim, borderRadius: 8, fontSize: 13, color: C.gold, border: `1px solid ${C.gold}33` }}>
            {part.prep_time_seconds}s preparation time
          </div>
        )}
      </div>

      <button className="sm-btn sm-btn-primary" onClick={onStart}
        style={{ padding: "11px 32px", fontSize: 14 }}>
        Begin Part {part.part_number}
      </button>
    </div>
  );
}

// ─── Part 2 preparation screen ────────────────────────────────────────────────
function PrepScreen({ part, onDone }) {
  return (
    <div className="sm-fadeup" style={{ maxWidth: 540, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
      <Badge color={C.gold}>Preparation time</Badge>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 14, marginBottom: 6 }}>
        Prepare your response
      </h2>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
        Make notes if you wish. You will speak for 1–2 minutes.
      </p>
      <div style={{ marginBottom: 32 }}>
        <Timer seconds={part.prep_time_seconds} onDone={onDone} />
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.gold}33`,
        borderRadius: 12, padding: "20px 24px", textAlign: "left",
        fontSize: 14.5, lineHeight: 1.8, whiteSpace: "pre-line", color: C.text,
      }}>
        {part.cue_card}
      </div>
      <button className="sm-btn sm-btn-outline" onClick={onDone}
        style={{ marginTop: 24 }}>
        I'm ready — skip timer
      </button>
    </div>
  );
}

// ─── Voice + text answer input ────────────────────────────────────────────────
function AnswerInput({ value, onChange, onSend, isLast, apiBase, getToken }) {
  const [recState, setRecState] = useState("idle"); // idle | recording | transcribing
  const [canRecord, setCanRecord] = useState(true);
  const [hint, setHint] = useState("");
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") setCanRecord(false);
  }, []);

  useEffect(() => {
    if (recState === "idle") setTimeout(() => textareaRef.current?.focus(), 80);
  }, [recState]);

  const startRecording = async () => {
    setHint("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecState("transcribing");
        let transcribed = false;
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const token = await getToken();
          const res = await fetch(`${apiBase}/speaking/transcribe`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.transcript) {
              onChange(data.transcript);
              transcribed = true;
            }
          }
        } catch (e) {
          console.warn("Transcription error:", e.message);
        } finally {
          if (!transcribed) setHint("Transcription unavailable — please type your answer below.");
          setRecState("idle");
        }
      };

      mr.start(200);
      setRecState("recording");
    } catch {
      setCanRecord(false);
    }
  };

  const stopRecording = () => mrRef.current?.stop();

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  if (recState === "recording") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "18px 20px", background: C.redDim,
        border: `1px solid ${C.red}44`, borderRadius: 10,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: C.red,
          animation: "sm-record-pulse 1s ease-in-out infinite", flexShrink: 0,
        }} />
        <span style={{ flex: 1, fontSize: 14, color: C.red }}>Recording… speak now</span>
        <button className="sm-btn sm-btn-primary" onClick={stopRecording}
          style={{ background: C.red, padding: "8px 18px" }}>
          Stop
        </button>
      </div>
    );
  }

  if (recState === "transcribing") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 20px", background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 10,
      }}>
        <Spinner />
        <span style={{ fontSize: 14, color: C.muted }}>Transcribing your response…</span>
      </div>
    );
  }

  return (
    <div>
      {hint && (
        <div style={{ fontSize: 12, color: C.gold, marginBottom: 8, paddingLeft: 2 }}>
          {hint}
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="sm-textarea"
        rows={3}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type your response… (Enter to submit, Shift+Enter for new line)"
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: C.muted }}>Enter to send · Shift+Enter for new line</span>
        <div style={{ display: "flex", gap: 8 }}>
          {canRecord && (
            <button className="sm-btn sm-btn-outline" onClick={startRecording}
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </svg>
              Record
            </button>
          )}
          <button className="sm-btn sm-btn-primary" disabled={!value.trim()} onClick={onSend}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isLast ? "Finish part" : "Send"}
            <span style={{ opacity: 0.7, fontSize: 11 }}>{isLast ? "→" : "↵"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Conversation UI ──────────────────────────────────────────────────────────
function ConversationView({ part, onPartComplete, apiBase, getToken }) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [exchanges, setExchanges] = useState([]);
  const [showTyping, setShowTyping] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const chatEndRef = useRef(null);

  const info = PART_INFO[part.part_number];
  const currentQuestion = part.questions[questionIdx];
  const totalQuestions = part.questions.length;
  const isLast = questionIdx === totalQuestions - 1;

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, showTyping]);

  // Simulate examiner "typing" before showing each question
  useEffect(() => {
    setShowTyping(true);
    const t = setTimeout(() => setShowTyping(false), 900);
    return () => clearTimeout(t);
  }, [questionIdx]);

  const handleSend = useCallback(() => {
    if (!answer.trim() || showTyping) return;
    setSubmittingAnswer(true);

    const newExchange = { question: currentQuestion, answer: answer.trim() };
    const newExchanges = [...exchanges, newExchange];
    setExchanges(newExchanges);
    setAnswer("");

    setTimeout(() => {
      setSubmittingAnswer(false);
      if (isLast) {
        onPartComplete(newExchanges);
      } else {
        setQuestionIdx(i => i + 1);
      }
    }, 400);
  }, [answer, currentQuestion, exchanges, isLast, onPartComplete, showTyping]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", maxWidth: 680, margin: "0 auto" }}>
      {/* Part header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 16, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge color={info.color}>{info.label}</Badge>
          <span style={{ fontSize: 13, color: C.muted }}>{info.subtitle}</span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: "'JetBrains Mono'" }}>
          {questionIdx + 1} / {totalQuestions}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
        {/* Completed exchanges */}
        {exchanges.map((ex, i) => (
          <div key={i} className="sm-fadeup" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Examiner bubble */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: C.examiner, border: `1px solid ${info.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: info.color, fontWeight: 600,
              }}>E</div>
              <div className="sm-bubble-examiner">{ex.question}</div>
            </div>
            {/* Student bubble */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: "row-reverse" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: C.student, border: `1px solid ${C.green}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: C.green, fontWeight: 600,
              }}>U</div>
              <div className="sm-bubble-student">{ex.answer}</div>
            </div>
          </div>
        ))}

        {/* Current question */}
        {!submittingAnswer && (
          <div className="sm-fadeup" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: C.examiner, border: `1px solid ${info.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: info.color, fontWeight: 600,
            }}>E</div>
            {showTyping
              ? <div className="sm-bubble-examiner"><TypingIndicator /></div>
              : <div className="sm-bubble-examiner sm-fadeup">{currentQuestion}</div>
            }
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {!showTyping && !submittingAnswer && (
        <div className="sm-fadeup" style={{ paddingTop: 14, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSend={handleSend}
            isLast={isLast}
            apiBase={apiBase}
            getToken={getToken}
          />
        </div>
      )}
    </div>
  );
}

// ─── Grading screen ───────────────────────────────────────────────────────────
function GradingScreen() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "80px 24px", maxWidth: 480, margin: "0 auto" }}>
      <Spinner />
      <h2 style={{ fontSize: 20, fontWeight: 500, marginTop: 20, marginBottom: 10 }}>
        Evaluating your speaking{dots}
      </h2>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
        Our AI examiner is reviewing your full transcript against the official
        IELTS band descriptors across all three parts.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 260, margin: "0 auto" }}>
        {CRITERIA.map((c, i) => (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: C.accentLight,
              animation: `sm-pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
            }} />
            <span style={{ fontSize: 12, color: C.mutedLight }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ResultsScreen({ result, onRetry }) {
  const [activeTab, setActiveTab] = useState("scores");   // "scores" | "transcript"
  const bc = bandColor(result.overall_band);

  return (
    <div className="sm-fadeup" style={{ maxWidth: 680, margin: "0 auto", padding: "24px 0" }}>
      {/* Overall */}
      <div className="sm-card" style={{
        padding: "24px 28px", marginBottom: 16,
        borderColor: bc + "55",
        display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Overall band
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: bc, fontFamily: "'JetBrains Mono'", lineHeight: 1 }}>
            {result.overall_band.toFixed(1)}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>
            {result.overall_band >= 7
              ? "Strong performance across all three parts"
              : result.overall_band >= 6
              ? "Competent — good foundation to build on"
              : "Developing — focus on fluency and vocabulary range"}
          </div>
          {result.improvement_tips?.map((tip, i) => (
            <div key={i} style={{
              fontSize: 13, color: C.mutedLight, lineHeight: 1.6,
              paddingLeft: 12, borderLeft: `2px solid ${C.gold}`,
              marginBottom: 6,
            }}>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[{ key: "scores", label: "Part scores" }, { key: "transcript", label: "Transcript" }].map(t => (
          <button key={t.key} className="sm-btn"
            onClick={() => setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? C.accentDim : "transparent",
              color: activeTab === t.key ? C.accentLight : C.muted,
              border: `1px solid ${activeTab === t.key ? C.accent + "55" : C.border}`,
              padding: "7px 16px",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Part scores */}
      {activeTab === "scores" && result.part_scores?.map(ps => {
        const info = PART_INFO[ps.part_number];
        const pbc = bandColor(ps.band);
        return (
          <div key={ps.part_number} className="sm-card sm-fadeup" style={{ padding: "18px 22px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Badge color={info.color}>{info.label}</Badge>
              <span style={{ color: C.muted, fontSize: 13 }}>{info.subtitle}</span>
              <span style={{ marginLeft: "auto", fontSize: 28, fontWeight: 700, color: pbc, fontFamily: "'JetBrains Mono'" }}>
                {ps.band.toFixed(1)}
              </span>
            </div>

            {/* Criteria bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 14 }}>
              {CRITERIA.map(c => (
                <div key={c.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11.5, color: C.mutedLight }}>{c.label}</span>
                    <span style={{ fontSize: 12, color: bandColor(ps[c.key]), fontFamily: "'JetBrains Mono'" }}>
                      {ps[c.key].toFixed(1)}
                    </span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 3 }}>
                    <div style={{
                      width: `${(ps[c.key] / 9) * 100}%`, height: "100%",
                      background: bandColor(ps[c.key]), borderRadius: 3,
                      transition: "width .5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Examiner feedback */}
            <div style={{
              padding: "10px 14px", background: C.accentDim,
              borderRadius: 8, fontSize: 13, lineHeight: 1.65,
              color: C.accentLight, borderLeft: `3px solid ${C.accent}`,
              marginBottom: ps.examiner_notes ? 8 : 0,
            }}>
              {ps.feedback}
            </div>
            {ps.examiner_notes && (
              <div style={{
                padding: "8px 12px", background: C.surface,
                borderRadius: 8, fontSize: 12.5, color: C.muted,
                lineHeight: 1.6, marginTop: 8,
              }}>
                <span style={{ color: C.gold }}>Note: </span>{ps.examiner_notes}
              </div>
            )}
          </div>
        );
      })}

      {/* Transcript tab */}
      {activeTab === "transcript" && (
        <div className="sm-card sm-fadeup" style={{ padding: "18px 22px" }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Full transcript
          </div>
          {[1, 2, 3].map(partNum => {
            const partExchanges = result.transcript?.filter(t => t.part === partNum) || [];
            if (!partExchanges.length) return null;
            const info = PART_INFO[partNum];
            return (
              <div key={partNum} style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>
                  <Badge color={info.color}>{info.label} — {info.subtitle}</Badge>
                </div>
                {partExchanges.map((ex, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: C.accentLight, marginBottom: 3 }}>
                      Examiner:
                    </div>
                    <div style={{ fontSize: 13.5, color: C.mutedLight, marginBottom: 6, paddingLeft: 12 }}>
                      {ex.question}
                    </div>
                    <div style={{ fontSize: 12, color: C.green, marginBottom: 3 }}>
                      You:
                    </div>
                    <div style={{ fontSize: 13.5, color: C.text, paddingLeft: 12, lineHeight: 1.65 }}>
                      {ex.answer}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <button className="sm-btn sm-btn-ghost" onClick={onRetry}
        style={{ marginTop: 16, fontSize: 13 }}>
        ← Retake speaking test
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SpeakingModule({ apiBase, getToken, sessionId, onComplete, autoSubmitRef }) {
  useEffect(() => {
    const id = "sm-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation state
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [phase, setPhase] = useState("intro");
  // "intro" | "prep" | "conversation" | "grading" | "results"

  // Collected exchanges per part
  const [partExchanges, setPartExchanges] = useState({});

  // Grading state
  const [, setAttemptId] = useState(null);
  const [result, setResult] = useState(null);
  const pollRef = useRef(null);

  // Load test
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(
          `${apiBase}/speaking/for-session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(await res.text());
        setTest(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (apiBase && sessionId) load();
  }, [apiBase, sessionId, getToken]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = useCallback((aid) => {
    pollRef.current = setInterval(async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBase}/speaking/attempts/${aid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "complete") {
          clearInterval(pollRef.current);
          setResult(data);
          setPhase("results");
          if (onComplete) onComplete();
        } else if (data.status === "failed") {
          clearInterval(pollRef.current);
          setError("Grading failed — please try again.");
          setPhase("intro");
          setCurrentPartIdx(0);
        }
      } catch (e) {
        console.warn("Poll error:", e.message);
      }
    }, 2000);
  }, [apiBase, getToken, onComplete]);

  // Called when a part's conversation finishes
  const handlePartComplete = useCallback(async (exchanges) => {
    const part = test.parts[currentPartIdx];
    const updatedExchanges = { ...partExchanges, [part.part_number]: exchanges };
    setPartExchanges(updatedExchanges);

    if (currentPartIdx < test.parts.length - 1) {
      // Move to next part intro
      setCurrentPartIdx(i => i + 1);
      setPhase("intro");
    } else {
      // All parts done — submit
      setPhase("grading");
      try {
        const token = await getToken();
        const partResponses = test.parts.map(p => ({
          part_number: p.part_number,
          exchanges: updatedExchanges[p.part_number] || [],
        }));

        const res = await fetch(`${apiBase}/speaking/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            test_id: test.id,
            part_responses: partResponses,
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAttemptId(data.attempt_id);
        startPolling(data.attempt_id);
      } catch (e) {
        setError(e.message);
        setPhase("intro");
        setCurrentPartIdx(0);
      }
    }
  }, [test, currentPartIdx, partExchanges, apiBase, getToken, startPolling]);

    // ✅ ADD THIS RIGHT AFTER handleSubmit:
  useEffect(() => {
    if (autoSubmitRef) {
      autoSubmitRef.current = handlePartComplete;
    }
  }, [autoSubmitRef, handlePartComplete]);

  const handleRetry = () => {
    setPhase("intro");
    setCurrentPartIdx(0);
    setPartExchanges({});
    setResult(null);
    setAttemptId(null);
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="sm-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <div style={{ color: C.muted, fontSize: 13, marginTop: 12 }}>Loading speaking test…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sm-root" style={{ padding: 24 }}>
        <div style={{ padding: 16, background: C.redDim, borderRadius: 10, color: C.red, fontSize: 13 }}>
          {error}
        </div>
        <button className="sm-btn sm-btn-ghost" style={{ marginTop: 12 }} onClick={() => setError(null)}>
          Try again
        </button>
      </div>
    );
  }

  if (!test) return null;

  const currentPart = test.parts[currentPartIdx];

  return (
    <div className="sm-root" style={{ padding: "24px 0" }}>
      {/* Header — only show during test phases */}
      {phase !== "results" && phase !== "grading" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>Speaking Test</h2>
            <div style={{ fontSize: 13, color: C.muted }}>{test.title} · 11–14 minutes</div>
          </div>
          {/* Part progress dots */}
          <div style={{ display: "flex", gap: 8 }}>
            {test.parts.map((p, i) => {
              const info = PART_INFO[p.part_number];
              const done = i < currentPartIdx || phase === "grading" || phase === "results";
              const active = i === currentPartIdx;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: done ? C.green : active ? info.color : C.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, color: "#fff",
                    transition: "all .3s",
                  }}>
                    {done ? "✓" : p.part_number}
                  </div>
                  {i < test.parts.length - 1 && (
                    <div style={{ width: 20, height: 1, background: i < currentPartIdx ? C.green : C.border }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase renders */}
      {phase === "intro" && currentPart && (
        <PartIntro
          part={currentPart}
          onStart={() => {
            if (currentPart.prep_time_seconds > 0) {
              setPhase("prep");
            } else {
              setPhase("conversation");
            }
          }}
        />
      )}

      {phase === "prep" && currentPart && (
        <PrepScreen
          part={currentPart}
          onDone={() => setPhase("conversation")}
        />
      )}

      {phase === "conversation" && currentPart && (
        <ConversationView
          key={`part-${currentPart.part_number}`}
          part={currentPart}
          onPartComplete={handlePartComplete}
          apiBase={apiBase}
          getToken={getToken}
        />
      )}

      {phase === "grading" && <GradingScreen />}

      {phase === "results" && result && (
        <ResultsScreen result={result} onRetry={handleRetry} />
      )}
    </div>
  );
}