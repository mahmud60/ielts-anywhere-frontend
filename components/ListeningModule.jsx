/**
 * ListeningModule.jsx
 *
 * Full IELTS listening module — fetches from FastAPI backend,
 * authenticates via Firebase, handles all 4 question types.
 *
 * Props:
 *   apiBase  — your FastAPI URL, e.g. "http://localhost:8000"
 *   getToken — async function that returns a Firebase ID token string
 *              e.g. () => auth.currentUser.getIdToken(true)
 *
 * Standalone demo: if no props are passed, uses built-in mock data
 * so you can preview it here without a running backend.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#080c18",
  surface: "#0f1623",
  card: "#131d2e",
  cardHover: "#172034",
  border: "#1c2d47",
  borderHover: "#2a4060",
  accent: "#00c8f8",
  accentDim: "#003d4d",
  accentHover: "#00e0ff",
  gold: "#f0b429",
  goldDim: "#352800",
  green: "#00df76",
  greenDim: "#00210f",
  red: "#ff4d4d",
  redDim: "#2a0000",
  purple: "#a78bfa",
  purpleDim: "#1e1040",
  text: "#dce8fc",
  muted: "#4e6a8a",
  mutedLight: "#7a96b4",
};

const SECTION_COLORS = {
  1: C.accent,
  2: C.gold,
  3: C.purple,
  4: C.green,
};


// ─── CSS injected once ────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  .lm-root *, .lm-root *::before, .lm-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lm-root { font-family: 'Sora', sans-serif; background: ${C.bg}; color: ${C.text}; min-height: 100vh; }
  .lm-root ::-webkit-scrollbar { width: 3px; height: 3px; }
  .lm-root ::-webkit-scrollbar-track { background: ${C.surface}; }
  .lm-root ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  @keyframes lm-fadeup { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lm-spin { to { transform:rotate(360deg); } }
  @keyframes lm-wave { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
  @keyframes lm-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .lm-fadeup { animation: lm-fadeup .35s ease both; }
  .lm-card { background:${C.card}; border:1px solid ${C.border}; border-radius:12px; }
  .lm-card-hover:hover { background:${C.cardHover}; border-color:${C.borderHover}; cursor:pointer; transition:all .15s; }
  .lm-btn { font-family:'Sora',sans-serif; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; padding:9px 20px; transition:all .15s; }
  .lm-btn-primary { background:${C.accent}; color:#000; }
  .lm-btn-primary:hover { background:${C.accentHover}; }
  .lm-btn-primary:disabled { opacity:.45; cursor:not-allowed; }
  .lm-btn-outline { background:transparent; color:${C.accent}; border:1px solid ${C.accent}44; }
  .lm-btn-outline:hover { background:${C.accent}12; border-color:${C.accent}88; }
  .lm-btn-ghost { background:transparent; color:${C.muted}; }
  .lm-btn-ghost:hover { color:${C.text}; }
  .lm-radio { display:flex; align-items:center; gap:10px; padding:9px 14px; border-radius:9px; border:1px solid ${C.border}; cursor:pointer; transition:all .15s; font-size:13.5px; }
  .lm-radio:hover { border-color:${C.borderHover}; background:${C.surface}; }
  .lm-radio-selected { background:${C.accentDim}; border-color:${C.accent}55; color:${C.accent}; }
  .lm-radio-correct { background:${C.greenDim}; border-color:${C.green}55; color:${C.green}; }
  .lm-radio-wrong { background:${C.redDim}; border-color:${C.red}55; color:${C.red}; }
  .lm-input { background:${C.surface}; border:1px solid ${C.border}; border-radius:8px; color:${C.text}; font-family:'Sora',sans-serif; font-size:13.5px; padding:9px 13px; transition:border-color .15s; width:100%; }
  .lm-input:focus { outline:none; border-color:${C.accent}66; }
  .lm-input-correct { border-color:${C.green}55; background:${C.greenDim}; }
  .lm-input-wrong { border-color:${C.red}55; background:${C.redDim}; }
  .lm-badge { border-radius:99px; font-size:11px; font-weight:600; letter-spacing:.06em; padding:2px 10px; text-transform:uppercase; display:inline-block; }
  .lm-spinner { width:18px; height:18px; border:2px solid ${C.border}; border-top-color:${C.accent}; border-radius:50%; animation:lm-spin .7s linear infinite; display:inline-block; }
`;

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Badge({ children, color = C.accent }) {
  return (
    <span className="lm-badge" style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

function Spinner() {
  return <span className="lm-spinner" />;
}

function ProgressBar({ value, color = C.accent, height = 4 }) {
  return (
    <div style={{ background: C.border, borderRadius: 4, height, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s ease" }} />
    </div>
  );
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ section }) {
  const audioRef = useRef(null);
  const mockTimerRef = useRef(null);

  const hasRealAudio = Boolean(section.audio_url);
  const color = SECTION_COLORS[section.section_number];

  // Playback state
  const [playing, setPlaying]   = useState(false);
  const [time, setTime]         = useState(0);
  const [duration, setDuration] = useState(
    section.audio_duration_seconds || 120
  );
  const [audioReady, setAudioReady] = useState(!hasRealAudio); // mock is always ready
  const [audioError, setAudioError] = useState(false);

  // ── Real audio event wiring ───────────────────────────────────────────────
  useEffect(() => {
    if (!hasRealAudio) return;
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate    = () => setTime(Math.floor(el.currentTime));
    const onDuration      = () => {
      if (isFinite(el.duration)) setDuration(Math.floor(el.duration));
    };
    const onEnded         = () => setPlaying(false);
    const onCanPlay       = () => setAudioReady(true);
    const onError         = () => { setAudioError(true); setAudioReady(false); };

    el.addEventListener("timeupdate",      onTimeUpdate);
    el.addEventListener("durationchange",  onDuration);
    el.addEventListener("ended",           onEnded);
    el.addEventListener("canplay",         onCanPlay);
    el.addEventListener("error",           onError);

    return () => {
      el.removeEventListener("timeupdate",     onTimeUpdate);
      el.removeEventListener("durationchange", onDuration);
      el.removeEventListener("ended",          onEnded);
      el.removeEventListener("canplay",        onCanPlay);
      el.removeEventListener("error",          onError);
    };
  }, [hasRealAudio]);

  // ── Mock timer (no audio URL — demo mode) ─────────────────────────────────
  useEffect(() => {
    if (hasRealAudio) return; // real audio handles its own timing
    if (playing) {
      mockTimerRef.current = setInterval(() => {
        setTime(t => {
          if (t >= duration) {
            setPlaying(false);
            return duration;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      clearInterval(mockTimerRef.current);
    }
    return () => clearInterval(mockTimerRef.current);
  }, [playing, duration, hasRealAudio]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (audioError) return;
    if (hasRealAudio && audioRef.current) {
      playing
        ? audioRef.current.pause()
        : audioRef.current.play().catch(() => setAudioError(true));
    }
    setPlaying(p => !p);
  };

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = Math.round(
      ((e.clientX - rect.left) / rect.width) * duration
    );
    setTime(newTime);
    if (hasRealAudio && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleReset = () => {
    setTime(0);
    setPlaying(false);
    if (hasRealAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = s =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Stable waveform bar heights derived from section number so they
  // look different per section but never change on re-render
  const bars = Array.from({ length: 72 }, (_, i) => {
    const h =
      28 +
      Math.sin(i * 0.9) * 22 +
      Math.cos(i * 1.7 + section.section_number) * 14;
    return Math.max(10, Math.round(h));
  });

  // Status badge
  const statusBadge = audioError
    ? { label: "Audio unavailable", color: C.red }
    : hasRealAudio && !audioReady
    ? { label: "Loading…", color: C.muted }
    : hasRealAudio
    ? { label: "Audio ready", color: C.green }
    : { label: "Demo — no audio", color: C.muted };

  return (
    <div className="lm-card" style={{ padding: "18px 20px", marginBottom: 20 }}>

      {/* Hidden real audio element — all controls are custom */}
      {hasRealAudio && (
        <audio
          ref={audioRef}
          src={section.audio_url}
          preload="metadata"
          style={{ display: "none" }}
        />
      )}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 10, marginBottom: 14,
      }}>
        <Badge color={color}>Section {section.section_number}</Badge>
        <span style={{ color: C.mutedLight, fontSize: 13 }}>
          {section.title}
        </span>
        <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
        <span style={{
          marginLeft: "auto", fontSize: 12,
          color: C.muted, fontFamily: "'JetBrains Mono'",
        }}>
          {fmt(time)} / {fmt(duration)}
        </span>
      </div>

      {/* Waveform — bars turn active colour as audio progresses */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 2, height: 48, marginBottom: 14,
      }}>
        {bars.map((h, i) => {
          const active = (i / bars.length) * 100 <= pct;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 2,
                background: active ? color : C.border,
                animation:
                  playing && active
                    ? `lm-wave ${0.4 + (i % 7) * 0.08}s ease-in-out infinite`
                    : "none",
                animationDelay: `${(i % 5) * 0.06}s`,
                transition: "background .15s",
              }}
            />
          );
        })}
      </div>

      {/* Transport bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Play / pause button */}
        <button
          className="lm-btn"
          onClick={togglePlay}
          disabled={!audioReady && hasRealAudio}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: audioError ? C.red : color,
            padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, flexShrink: 0,
            opacity: !audioReady && hasRealAudio ? 0.45 : 1,
            border: "none", cursor: "pointer",
          }}
        >
          {audioError ? "!" : playing ? "⏸" : "▶"}
        </button>

        {/* Scrub track */}
        <div
          style={{
            flex: 1, height: 5, background: C.border,
            borderRadius: 5, position: "relative",
            cursor: "pointer",
          }}
          onClick={handleScrub}
        >
          {/* Filled portion */}
          <div style={{
            width: `${pct}%`, height: "100%",
            background: color, borderRadius: 5,
          }} />
          {/* Thumb */}
          <div style={{
            position: "absolute",
            top: -4,
            left: `${pct}%`,
            width: 13, height: 13,
            borderRadius: "50%",
            background: color,
            transform: "translateX(-50%)",
            boxShadow: `0 0 0 3px ${color}33`,
            transition: "left .1s",
          }} />
        </div>

        {/* Reset */}
        <button
          className="lm-btn lm-btn-ghost"
          onClick={handleReset}
          style={{ padding: "4px 8px", fontSize: 12, border: "none", cursor: "pointer" }}
        >
          ↺
        </button>
      </div>

      {/* Section context shown below controls */}
      {section.context && (
        <div style={{
          marginTop: 14, padding: "10px 14px",
          background: C.surface, borderRadius: 8,
          fontSize: 12.5, color: C.mutedLight, lineHeight: 1.65,
          borderLeft: `2px solid ${color}55`,
        }}>
          {section.context}
        </div>
      )}

      {/* Error message */}
      {audioError && (
        <div style={{
          marginTop: 10, padding: "9px 13px",
          background: C.redDim, borderRadius: 8,
          fontSize: 12.5, color: C.red,
          border: `1px solid ${C.red}33`,
          lineHeight: 1.6,
        }}>
          Could not load audio. Check that the file was uploaded in the admin
          panel and that your R2 bucket has public access enabled.
        </div>
      )}
    </div>
  );
}

// ─── Question components ──────────────────────────────────────────────────────
function MCQQuestion({ question, value, onChange, result, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {question.options.map((opt, oi) => {
        const selected = value === oi;
        const isCorrect = result && oi === result.correct_answer;
        const isWrong = result && selected && !result.is_correct;
        let cls = "lm-radio";
        if (result) {
          if (isCorrect) cls += " lm-radio-correct";
          else if (isWrong) cls += " lm-radio-wrong";
          else if (selected) cls += " lm-radio-selected";
        } else if (selected) {
          cls += " lm-radio-selected";
        }
        return (
          <label key={oi} className={cls} style={{ userSelect: "none" }}>
            <input type="radio" style={{ display: "none" }} checked={selected}
              disabled={!!result} onChange={() => !result && onChange(oi)} />
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${isCorrect ? C.green : isWrong ? C.red : selected ? color : C.border}`,
              background: selected || isCorrect ? (isCorrect ? C.green : isWrong ? C.red : color) : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {selected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#000" }} />}
            </span>
            <span style={{ flex: 1 }}>{opt}</span>
            {isCorrect && <span style={{ fontSize: 11, color: C.green, marginLeft: "auto" }}>✓ correct</span>}
            {isWrong && <span style={{ fontSize: 11, color: C.red, marginLeft: "auto" }}>✗ wrong</span>}
          </label>
        );
      })}
    </div>
  );
}

function FillQuestion({ question, value, onChange, result }) {
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;
  return (
    <div>
      <input
        className={`lm-input ${result ? (isCorrect ? "lm-input-correct" : "lm-input-wrong") : ""}`}
        value={value || ""}
        disabled={!!result}
        onChange={e => !result && onChange(e.target.value)}
        placeholder="Type your answer…"
      />
      {isWrong && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.mutedLight }}>
          Correct answer: <span style={{ color: C.green, fontFamily: "'JetBrains Mono'" }}>{result.correct_answer}</span>
        </div>
      )}
    </div>
  );
}

function TFNGQuestion({ question, value, onChange, result, color }) {
  // TFNG reuses MCQ logic — options are ["True", "False", "Not Given"]
  return <MCQQuestion question={question} value={value} onChange={onChange} result={result} color={color} />;
}

function MatchingQuestion({ question, value = {}, onChange, result }) {
  const pool = question.matching_pool || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {question.options.map((item, idx) => {
        const userAns = value[idx];
        const correctAns = result?.correct_answer?.[idx];
        const isCorrect = result && String(userAns || "").toLowerCase() === String(correctAns || "").toLowerCase();
        const isWrong = result && !isCorrect;
        return (
          <div key={idx} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
            background: result ? (isCorrect ? C.greenDim : isWrong ? C.redDim : C.surface) : C.surface,
            border: `1px solid ${result ? (isCorrect ? C.green + "44" : isWrong ? C.red + "44" : C.border) : C.border}`,
            borderRadius: 9,
          }}>
            {/* Item label */}
            <span style={{ fontSize: 13, flex: 1, color: C.text }}>{item}</span>
            <span style={{ color: C.muted, fontSize: 18, flexShrink: 0 }}>→</span>
            {/* Dropdown selector */}
            <select
              disabled={!!result}
              value={userAns || ""}
              onChange={e => !result && onChange({ ...value, [idx]: e.target.value })}
              style={{
                background: C.card, border: `1px solid ${C.border}`, color: C.text,
                borderRadius: 7, padding: "6px 10px", fontSize: 13, fontFamily: "'Sora'",
                cursor: result ? "default" : "pointer", minWidth: 140,
              }}
            >
              <option value="">— Select —</option>
              {pool.map((p, pi) => (
                <option key={pi} value={p}>{p}</option>
              ))}
            </select>
            {result && (
              <span style={{ fontSize: 12, color: isCorrect ? C.green : C.red, marginLeft: 4, flexShrink: 0 }}>
                {isCorrect ? "✓" : `✗ → ${correctAns}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Question({ question, answers, setAnswers, results, color, index }) {
  const value = answers[question.id];
  const result = results?.[question.id];

  const onChange = useCallback(val => {
    setAnswers(a => ({ ...a, [question.id]: val }));
  }, [question.id, setAnswers]);

  const typeLabelMap = { mcq: "Multiple choice", fill: "Fill in the blank", tfng: "True / False / Not Given", matching: "Matching" };
  const typeColorMap = { mcq: C.accent, fill: C.gold, tfng: C.purple, matching: C.green };
  const typeColor = typeColorMap[question.question_type] || C.accent;

  return (
    <div className="lm-card lm-fadeup" style={{ padding: "18px 20px", animationDelay: `${index * 0.04}s` }}>
      {/* Question header */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{
          background: color + "22", color, border: `1px solid ${color}44`,
          borderRadius: 6, padding: "2px 9px", fontSize: 12,
          fontFamily: "'JetBrains Mono'", flexShrink: 0, fontWeight: 500,
        }}>Q{index + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 6 }}>{question.question_text}</div>
          <Badge color={typeColor}>{typeLabelMap[question.question_type]}</Badge>
        </div>
      </div>

      {/* Input */}
      {question.question_type === "mcq" && (
        <MCQQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}
      {question.question_type === "fill" && (
        <FillQuestion question={question} value={value} onChange={onChange} result={result} />
      )}
      {question.question_type === "tfng" && (
        <TFNGQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}
      {question.question_type === "matching" && (
        <MatchingQuestion question={question} value={value} onChange={onChange} result={result} />
      )}

      {/* Tip */}
      {result && !result.is_correct && result.tip && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: 8, fontSize: 12.5, color: C.mutedLight, lineHeight: 1.6 }}>
          <span style={{ color: C.gold }}>Tip: </span>{result.tip}
        </div>
      )}
    </div>
  );
}

// ─── Results panel ────────────────────────────────────────────────────────────
function ResultsPanel({ result }) {
  const bandColor = b => b >= 7 ? C.green : b >= 5.5 ? C.gold : C.red;
  const bc = bandColor(result.overall_band);

  return (
    <div className="lm-fadeup" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overall */}
      <div className="lm-card" style={{ padding: 24, borderColor: bc + "55", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Overall Band</div>
          <div style={{ fontSize: 56, fontWeight: 600, color: bc, fontFamily: "'JetBrains Mono'", lineHeight: 1 }}>
            {result.overall_band.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{result.correct} / {result.total} correct</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
            {result.overall_band >= 7 ? "Strong performance — well done!" : result.overall_band >= 5.5 ? "Developing — keep practising" : "Needs significant improvement"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(result.section_scores).map(([secNum, data]) => {
              const sc = SECTION_COLORS[parseInt(secNum)] || C.accent;
              return (
                <div key={secNum}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.mutedLight }}>Section {secNum}</span>
                    <span style={{ fontSize: 12, color: sc, fontFamily: "'JetBrains Mono'" }}>
                      {data.correct}/{data.total} — Band {data.band.toFixed(1)}
                    </span>
                  </div>
                  <ProgressBar value={(data.correct / data.total) * 100} color={sc} height={5} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tips */}
      {result.improvement_tips?.length > 0 && (
        <div className="lm-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Improvement tips</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.improvement_tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 9, borderLeft: `3px solid ${C.gold}` }}>
                <span style={{ color: C.gold, fontSize: 14, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 13.5, color: C.mutedLight, lineHeight: 1.65 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ListeningModule({ apiBase, getToken, sessionId, onComplete, autoSubmitRef }) {
  // Inject CSS once
  useEffect(() => {
    const id = "lm-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const isMock = !apiBase;

  // State
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState("test"); // "test" | "results"

  // Load test
  useEffect(() => {
    async function load() {
      if (!apiBase || !sessionId) {
        // Demo mode — use mock data
        await new Promise(r => setTimeout(r, 600));
        setTest(MOCK_TEST);
        setLoading(false);
        return;
      }
      try {
        const token = await getToken();
        const res = await fetch(
          `${apiBase}/listening/for-session/${sessionId}`,
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
    load();
  }, [apiBase, sessionId]);

  // Answer completion tracking
  const section = test?.sections[activeSection];
  const answeredInSection = section
    ? section.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length
    : 0;
  const totalAnswered = test
    ? test.sections.reduce((acc, s) => acc + s.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length, 0)
    : 0;
  const totalQuestions = test
    ? test.sections.reduce((acc, s) => acc + s.questions.length, 0)
    : 0;

  // Build results map keyed by question_id for fast lookup
  const resultsMap = result
    ? Object.fromEntries(result.question_results.map(r => [r.question_id, r]))
    : null;

  // Submit answers
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isMock) {
        // Simulate scoring locally using mock answers
        await new Promise(r => setTimeout(r, 1200));
        const mockResult = buildMockResult(test, answers);
        setResult(mockResult);
        setView("results");
        if (onComplete) onComplete();
        setSubmitting(false);
        return;
      }

      const token = await getToken();
      const res = await fetch(`${apiBase}/listening/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ test_id: test.id, answers }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();
      setResult(data);
      setView("results");
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  // ✅ ADD THIS RIGHT AFTER handleSubmit:
  useEffect(() => {
    if (autoSubmitRef) {
      autoSubmitRef.current = handleSubmit;
    }
  }, [autoSubmitRef, handleSubmit]);
  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="lm-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <div style={{ color: C.muted, fontSize: 13, marginTop: 12 }}>Loading test…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lm-root" style={{ padding: 32 }}>
        <div className="lm-card" style={{ padding: 20, borderColor: C.red + "44", color: C.red, fontSize: 13 }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="lm-root" style={{ padding: 32 }}>
        <div className="lm-card" style={{ padding: 20, color: C.muted, fontSize: 13 }}>No tests available.</div>
      </div>
    );
  }

  // ── Results view ──
  if (view === "results" && result) {
    return (
      <div className="lm-root" style={{ padding: "24px 0" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "0 2px" }}>
          <button className="lm-btn lm-btn-ghost" style={{ padding: "6px 12px" }}
            onClick={() => { setView("test"); setResult(null); setAnswers({}); setActiveSection(0); }}>
            ← New attempt
          </button>
          <div style={{ fontFamily: "'Sora'", fontSize: 22, fontWeight: 500 }}>Results</div>
          <Badge color={C.accent}>{test.title}</Badge>
        </div>

        <ResultsPanel result={result} />

        {/* Review answers per section */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Review your answers</div>
          {test.sections.map((sec, si) => (
            <div key={sec.id} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Badge color={SECTION_COLORS[sec.section_number]}>Section {sec.section_number}</Badge>
                <span style={{ color: C.mutedLight, fontSize: 13 }}>{sec.title}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sec.questions.map((q, qi) => (
                  <Question key={q.id} question={q} answers={answers} setAnswers={() => {}}
                    results={resultsMap} color={SECTION_COLORS[sec.section_number]}
                    index={sec.questions.slice(0, qi).length + qi} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Test view ──
  const sectionColor = SECTION_COLORS[section?.section_number] || C.accent;

  return (
    <div className="lm-root" style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Listening Test</div>
          <div style={{ color: C.muted, fontSize: 13 }}>{test.title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: C.mutedLight }}>
            <span style={{ color: C.accent, fontFamily: "'JetBrains Mono'" }}>{totalAnswered}</span>
            <span> / {totalQuestions} answered</span>
          </div>
          <button
            className="lm-btn lm-btn-primary"
            disabled={totalAnswered < totalQuestions || submitting}
            onClick={handleSubmit}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 22px" }}
          >
            {submitting ? <><Spinner /> Submitting…</> : "Submit test"}
          </button>
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ marginBottom: 20 }}>
        <ProgressBar value={(totalAnswered / totalQuestions) * 100} color={C.accent} height={3} />
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22, overflowX: "auto", paddingBottom: 2 }}>
        {test.sections.map((sec, si) => {
          const sc = SECTION_COLORS[sec.section_number];
          const secAnswered = sec.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length;
          const secTotal = sec.questions.length;
          const isActive = si === activeSection;
          return (
            <button
              key={sec.id}
              className="lm-btn"
              onClick={() => setActiveSection(si)}
              style={{
                padding: "8px 16px", flexShrink: 0,
                background: isActive ? sc + "22" : "transparent",
                color: isActive ? sc : C.muted,
                border: `1px solid ${isActive ? sc + "55" : C.border}`,
                position: "relative",
              }}
            >
              Section {sec.section_number}
              <span style={{
                marginLeft: 6, fontSize: 11, color: secAnswered === secTotal ? sc : C.muted,
                fontFamily: "'JetBrains Mono'",
              }}>
                {secAnswered}/{secTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section body */}
      {section && (
        <div className="lm-fadeup" key={section.id}>
          {/* Audio player */}
          <AudioPlayer section={section} />

          {/* Section progress */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.mutedLight }}>
              {answeredInSection} of {section.questions.length} questions answered in this section
            </div>
            <ProgressBar value={(answeredInSection / section.questions.length) * 100} color={sectionColor} height={3} />
          </div>

          {/* Questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {section.questions.map((q, qi) => (
              <Question key={q.id} question={q} answers={answers} setAnswers={setAnswers}
                results={null} color={sectionColor} index={qi} />
            ))}
          </div>

          {/* Section nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, alignItems: "center" }}>
            <button className="lm-btn lm-btn-ghost"
              disabled={activeSection === 0}
              onClick={() => setActiveSection(s => s - 1)}
              style={{ padding: "9px 18px" }}>
              ← Previous section
            </button>
            <span style={{ fontSize: 12, color: C.muted }}>
              {activeSection + 1} of {test.sections.length}
            </span>
            {activeSection < test.sections.length - 1 ? (
              <button className="lm-btn lm-btn-outline"
                onClick={() => setActiveSection(s => s + 1)}
                style={{ padding: "9px 18px" }}>
                Next section →
              </button>
            ) : (
              <button
                className="lm-btn lm-btn-primary"
                disabled={totalAnswered < totalQuestions || submitting}
                onClick={handleSubmit}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 22px" }}
              >
                {submitting ? <><Spinner /> Submitting…</> : "Submit test"}
              </button>
            )}
          </div>
        </div>
      )}

      {isMock && (
        <div style={{ marginTop: 28, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted, textAlign: "center" }}>
          Running in demo mode — connect <code style={{ color: C.accent, fontFamily: "'JetBrains Mono'" }}>apiBase</code> prop to your FastAPI backend to persist results
        </div>
      )}
    </div>
  );
}

// ─── Mock scoring (demo only — real scoring happens server-side) ──────────────
function buildMockResult(test, userAnswers) {
  const correctAnswers = {
    q1: 1, q2: "thompson", q3: "march", q4: 1,
    q5: 0, q6: 1, q7: 2,
    q8: { 0: "Student A", 1: "Supervisor", 2: "Student B" }, q9: 1,
    q10: "10", q11: 2, q12: "2.3",
  };

  const tips = {
    fill: "For fill-in-the-blank: proper nouns are often spelled out in the audio — listen carefully for letter-by-letter spelling.",
    tfng: "For Not Given: if you cannot find any evidence in either direction, choose Not Given rather than guessing True or False.",
    mcq: "For MCQ: read all options before the audio plays. The correct answer is usually a paraphrase, not an exact match.",
    matching: "For matching: listen for synonyms. Speakers rarely use the exact words from the question sheet.",
  };

  const sectionScores = {};
  const questionResults = [];

  test.sections.forEach(sec => {
    let secCorrect = 0;
    sec.questions.forEach(q => {
      const userAns = userAnswers[q.id];
      const correctAns = correctAnswers[q.id];
      let isCorrect = false;

      if (q.question_type === "fill") {
        isCorrect = String(userAns || "").toLowerCase().trim() === String(correctAns).toLowerCase();
      } else if (q.question_type === "matching") {
        isCorrect = typeof userAns === "object" && userAns !== null &&
          Object.entries(correctAns).every(([k, v]) =>
            String(userAns[k] || "").toLowerCase() === String(v).toLowerCase()
          );
      } else {
        isCorrect = userAns === correctAns;
      }

      if (isCorrect) secCorrect++;
      questionResults.push({
        question_id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        user_answer: userAns,
        correct_answer: correctAns,
        is_correct: isCorrect,
        tip: isCorrect ? null : tips[q.question_type],
      });
    });

    const ratio = secCorrect / sec.questions.length;
    const band = ratio >= 0.875 ? 8.0 : ratio >= 0.75 ? 7.0 : ratio >= 0.625 ? 6.0 : ratio >= 0.5 ? 5.0 : 4.0;
    sectionScores[sec.section_number] = { correct: secCorrect, total: sec.questions.length, band };
  });

  const totalCorrect = Object.values(sectionScores).reduce((a, s) => a + s.correct, 0);
  const totalQ = Object.values(sectionScores).reduce((a, s) => a + s.total, 0);
  const ratio = totalCorrect / totalQ;
  const overall = ratio >= 0.875 ? 8.0 : ratio >= 0.75 ? 7.0 : ratio >= 0.625 ? 6.0 : ratio >= 0.5 ? 5.5 : 4.5;

  const wrongTypes = [...new Set(questionResults.filter(r => !r.is_correct).map(r => r.question_type))];
  const improvement_tips = wrongTypes.map(t => tips[t]).filter(Boolean);
  if (!improvement_tips.length) improvement_tips.push("Excellent! Practise Sections 3 and 4 to maintain your score under academic lecture conditions.");

  return {
    attempt_id: "demo-attempt-1",
    correct: totalCorrect,
    total: totalQ,
    overall_band: overall,
    section_scores: sectionScores,
    question_results: questionResults,
    improvement_tips,
  };
}