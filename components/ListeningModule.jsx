/**
 * ListeningModule.jsx — IELTS Listening (light theme)
 *
 * Props:
 *   apiBase      — FastAPI base URL
 *   getToken     — async () => firebase id token string
 *   sessionId    — test session UUID
 *   onComplete   — called after successful submission
 *   autoSubmitRef — ref wired up by parent timer
 *   timeLeft     — optional seconds remaining (shown in top bar)
 *   onBack       — optional callback for ← button
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Pause, Play, Volume2, VolumeX } from "lucide-react";

const PRIMARY       = "#0080ff";
const PRIMARY_HOVER = "#006bd6";
const PRIMARY_LIGHT = "#e6f2ff";
const PRIMARY_MUTED = "#bfdbfe";
const ACCENT        = PRIMARY;
const ACCENT_LIGHT  = PRIMARY_LIGHT;
const PAGE_BG       = "#F8FAFC";
const BORDER        = "#E2E8F0";
const SURFACE       = "#FFFFFF";
const SURFACE_ALT   = "#F1F5F9";
const TEXT          = "#0F172A";
const TEXT_SUB      = "#475569";
const MUTED         = "#64748B";
const MUTED_LIGHT   = "#94A3B8";
const GREEN         = "#059669";
const GREEN_BG      = "#ECFDF5";
const RED           = "#DC2626";
const RED_BG        = "#FEF2F2";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  .lm *, .lm *::before, .lm *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lm {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${PAGE_BG}; color: ${TEXT}; min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  .lm-blank {
    border: 1px solid ${BORDER}; border-radius: 8px;
    padding: 4px 12px; font-size: 14px; font-family: inherit;
    width: 128px; background: ${SURFACE}; vertical-align: middle;
    display: inline-block; outline: none; color: ${TEXT};
    transition: border-color .15s, box-shadow .15s, background .15s;
  }
  .lm-blank:focus {
    border-color: ${PRIMARY};
    background: ${SURFACE};
    box-shadow: 0 0 0 3px ${PRIMARY_MUTED};
  }
  .lm-blank:disabled { cursor: default; opacity: 0.85; }
  .lm-blank.ok  { border-color: ${GREEN} !important; background: ${GREEN_BG} !important; box-shadow: none !important; }
  .lm-blank.bad { border-color: ${RED} !important; background: ${RED_BG} !important; box-shadow: none !important; }
  .lm-opt {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;
    border: 1px solid ${BORDER}; cursor: pointer;
    font-size: 14px; user-select: none; background: ${SURFACE};
    transition: border-color .15s, background .15s, box-shadow .15s; color: ${TEXT_SUB};
  }
  label.lm-opt:hover { border-color: #7dd3fc; background: ${PRIMARY_LIGHT}; }
  .lm-opt.sel  { border-color: ${PRIMARY}; background: ${PRIMARY_LIGHT}; color: ${PRIMARY}; }
  .lm-opt.ok   { border-color: ${GREEN}; background: ${GREEN_BG}; color: ${GREEN}; }
  .lm-opt.bad  { border-color: ${RED}; background: ${RED_BG}; color: ${RED}; }
  @keyframes lm-spin { to { transform: rotate(360deg); } }
  .lm-spinner {
    width: 20px; height: 20px; border: 2px solid ${BORDER};
    border-top-color: ${PRIMARY}; border-radius: 50%;
    animation: lm-spin .7s linear infinite; display: inline-block;
  }
  @keyframes lm-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }
  .lm-fadein { animation: lm-fadein .28s ease both; }
  .lm-card {
    background: ${SURFACE};
    border: 1px solid ${BORDER};
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }
  .lm-btn-primary {
    background: ${PRIMARY}; color: #fff; border: none;
    border-radius: 10px; padding: 8px 18px; font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: background .15s, opacity .15s;
  }
  .lm-btn-primary:hover:not(:disabled) { background: ${PRIMARY_HOVER}; }
  .lm-btn-primary:disabled { opacity: 0.65; cursor: default; }
  .lm-btn-ghost {
    border: 1px solid ${BORDER}; background: ${SURFACE}; border-radius: 10px;
    padding: 8px 18px; font-size: 13px; color: ${TEXT_SUB};
    cursor: pointer; transition: background .15s, border-color .15s;
  }
  .lm-btn-ghost:hover:not(:disabled) { background: ${SURFACE_ALT}; border-color: #CBD5E1; }
  .lm-btn-ghost:disabled { color: ${MUTED_LIGHT}; cursor: default; }
  .lm-btn-outline {
    border: 1px solid #93c5fd; background: ${PRIMARY_LIGHT}; border-radius: 10px;
    padding: 8px 18px; font-size: 13px; color: ${PRIMARY}; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .lm-btn-outline:hover { background: ${PRIMARY_MUTED}; }
  .lm-exam-topbar {
    position: sticky; top: 0; z-index: 100;
    background: ${SURFACE}; border-bottom: 1px solid ${BORDER};
  }
  .lm-exam-topbar-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 16px; height: 60px;
    display: flex; align-items: center; gap: 10px;
    flex-wrap: nowrap; overflow: hidden;
  }
  .lm-exam-context {
    border-top: 1px solid ${BORDER};
    background: ${SURFACE};
  }
  .lm-exam-context-inner {
    max-width: 800px; margin: 0 auto;
    padding: 9px 20px;
    font-size: 13px; font-weight: 500; color: ${TEXT_SUB};
  }
  .lm-exam-brand {
    font-size: 15px; font-weight: 700; flex-shrink: 0;
    white-space: nowrap; letter-spacing: -0.02em; line-height: 1;
  }
  .lm-exam-brand-ielts { color: ${PRIMARY}; }
  .lm-exam-brand-anywhere { color: ${TEXT}; }
  .lm-exam-brand-sep {
    width: 1px; height: 20px; background: ${BORDER}; flex-shrink: 0;
  }
  .lm-exam-answered {
    font-size: 12px; font-weight: 600; color: ${PRIMARY};
    background: ${PRIMARY_LIGHT}; border: 1px solid ${PRIMARY_MUTED};
    border-radius: 999px; padding: 5px 11px; white-space: nowrap; flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .lm-exam-answered-short { display: none; }
  .lm-exam-back {
    border: none; background: none; cursor: pointer;
    color: ${MUTED}; padding: 6px; border-radius: 8px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    transition: color .15s, background .15s;
  }
  .lm-exam-back:hover { color: ${TEXT}; background: ${SURFACE_ALT}; }
  .lm-exam-audio {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px;
  }
  .lm-exam-time {
    font-size: 12px; color: ${MUTED}; font-variant-numeric: tabular-nums;
    min-width: 36px; flex-shrink: 0; font-weight: 500;
  }
  .lm-exam-play {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: ${PRIMARY}; color: #fff; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s, opacity .15s;
    box-shadow: 0 2px 8px rgba(0, 128, 255, 0.28);
  }
  .lm-exam-play:hover:not(:disabled) { background: ${PRIMARY_HOVER}; }
  .lm-exam-play:disabled { opacity: 0.45; cursor: default; }
  .lm-exam-play.is-error { background: ${RED}; box-shadow: none; }
  .lm-exam-track {
    flex: 1; min-width: 48px; height: 4px; background: ${SURFACE_ALT};
    border-radius: 999px; position: relative; cursor: pointer;
  }
  .lm-exam-track-fill {
    height: 100%; background: ${PRIMARY}; border-radius: 999px;
    transition: width .1s linear;
  }
  .lm-exam-track-thumb {
    position: absolute; top: 50%; width: 12px; height: 12px;
    border-radius: 50%; background: ${PRIMARY};
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 3px ${PRIMARY_LIGHT};
    transition: left .1s linear; pointer-events: none;
  }
  .lm-exam-volume {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  }
  .lm-exam-vol-btn {
    border: none; background: none; cursor: pointer; color: ${MUTED};
    padding: 4px; border-radius: 6px; display: inline-flex;
    transition: color .15s, background .15s;
  }
  .lm-exam-vol-btn:hover { color: ${TEXT}; background: ${SURFACE_ALT}; }
  .lm-vol-slider {
    -webkit-appearance: none; appearance: none;
    width: 72px; height: 4px; border-radius: 999px;
    background: ${SURFACE_ALT}; outline: none; cursor: pointer;
  }
  .lm-vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 12px; height: 12px;
    border-radius: 50%; background: ${PRIMARY}; cursor: pointer;
    box-shadow: 0 0 0 2px ${PRIMARY_LIGHT};
  }
  .lm-vol-slider::-moz-range-thumb {
    width: 12px; height: 12px; border: none; border-radius: 50%;
    background: ${PRIMARY}; cursor: pointer;
  }
  .lm-btn-finish {
    border-radius: 999px; padding: 8px 16px; font-size: 13px;
  }
  @media (max-width: 640px) {
    .lm-vol-slider { display: none; }
    .lm-exam-topbar-inner { gap: 6px; padding: 0 10px; height: 56px; }
    .lm-btn-finish { padding: 7px 11px; font-size: 12px; }
    .lm-exam-brand { font-size: 13px; }
    .lm-exam-answered-long { display: none; }
    .lm-exam-answered-short { display: inline; }
    .lm-exam-brand-sep { display: none; }
  }
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("lm-css")) return;
  const s = document.createElement("style");
  s.id = "lm-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Number bubble (supports single number or range e.g. "17–18") ─────────────
function Bubble({ label, size = 22 }) {
  const text = String(label ?? "");
  const isRange = text.includes("–") || text.includes("-");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: isRange ? 40 : size, height: size,
      padding: isRange ? "0 8px" : 0,
      borderRadius: isRange ? 999 : "50%",
      background: PRIMARY, color: "#fff",
      fontSize: isRange ? 10 : (size <= 20 ? 10 : 11), fontWeight: 700,
      flexShrink: 0, verticalAlign: "middle", lineHeight: 1,
      boxShadow: "0 1px 2px rgba(0, 128, 255, 0.2)",
      whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

// ─── Inline blank (number bubble + input) ─────────────────────────────────────
function InlineBlank({ label, value, onChange, disabled, result }) {
  const isOk  = result?.is_correct;
  const isBad = result && !isOk;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, verticalAlign: "middle" }}>
      <Bubble label={label} />
      <input
        className={`lm-blank${isBad ? " bad" : isOk ? " ok" : ""}`}
        value={value ?? ""}
        onChange={e => !disabled && onChange(e.target.value)}
        disabled={disabled}
      />
    </span>
  );
}

// ─── Stem renderer — splits on </blank> ───────────────────────────────────────
function Stem({ text, label, questionId, value, onChange, disabled, result }) {
  if (!text) return null;
  const parts = text.split("</blank>");
  if (parts.length < 2) {
    return <span style={{ fontSize: 14, lineHeight: 1.75, color: TEXT_SUB }}>{text}</span>;
  }
  return (
    <span style={{ fontSize: 14.5, lineHeight: 2.15, color: TEXT_SUB }}>
      {parts.map((part, i) => (
        <span key={`blank-part-${questionId}-${i}`}>
          {part}
          {i < parts.length - 1 && (
            <InlineBlank
              label={label} value={value} onChange={onChange}
              disabled={disabled} result={result}
            />
          )}
        </span>
      ))}
    </span>
  );
}

// ─── Instruction — bolds ALL-CAPS runs (word limit instructions) ──────────────
function Instruction({ text }) {
  if (!text) return null;
  const parts = text.split(/(\b[A-Z][A-Z /]+[A-Z]\b)/g);
  return (
    <p style={{ fontSize: 14, color: TEXT_SUB, lineHeight: 1.7, marginBottom: 6 }}>
      {parts.map((p, i) =>
        /^[A-Z][A-Z /]+[A-Z]$/.test(p.trim())
          ? <strong key={`cap-${i}`} style={{ color: TEXT, fontWeight: 700 }}>{p}</strong>
          : <span key={`txt-${i}`}>{p}</span>
      )}
    </p>
  );
}

// ─── Exam top bar (brand + back + audio + volume + overview + finish) ────────
function ListeningExamTopBar({
  section, partLabel, onBack, onSubmit, submitting,
  totalAnswered = 0, totalQuestions = 0,
}) {
  const audioRef = useRef(null);
  const mockRef  = useRef(null);
  const hasAudio = Boolean(section?.audio);

  const [playing, setPlaying]   = useState(false);
  const [time, setTime]         = useState(0);
  const [duration, setDuration] = useState(section?.audio_duration_seconds || 240);
  const [ready, setReady]       = useState(!hasAudio);
  const [audioErr, setAudioErr] = useState(false);
  const [volume, setVolume]     = useState(1);
  const [muted, setMuted]       = useState(false);

  useEffect(() => {
    if (!hasAudio) return;
    const el = audioRef.current;
    if (!el) return;
    const h = {
      timeupdate:     () => setTime(Math.floor(el.currentTime)),
      durationchange: () => isFinite(el.duration) && setDuration(Math.floor(el.duration)),
      ended:          () => setPlaying(false),
      canplay:        () => setReady(true),
      error:          () => setAudioErr(true),
    };
    Object.entries(h).forEach(([e, fn]) => el.addEventListener(e, fn));
    return () => Object.entries(h).forEach(([e, fn]) => el.removeEventListener(e, fn));
  }, [hasAudio, section?.id, section?.audio]);

  useEffect(() => {
    setTime(0);
    setPlaying(false);
    setAudioErr(false);
    setDuration(section?.audio_duration_seconds || 240);
    setReady(!section?.audio);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [section?.id, section?.audio, section?.audio_duration_seconds]);

  useEffect(() => {
    if (hasAudio) return;
    if (playing) {
      mockRef.current = setInterval(() => {
        setTime(t => {
          if (t >= duration) { setPlaying(false); return duration; }
          return t + 1;
        });
      }, 1000);
    } else {
      clearInterval(mockRef.current);
    }
    return () => clearInterval(mockRef.current);
  }, [playing, duration, hasAudio]);

  const togglePlay = () => {
    if (audioErr) return;
    if (hasAudio && audioRef.current) {
      playing
        ? audioRef.current.pause()
        : audioRef.current.play().catch(() => setAudioErr(true));
    }
    setPlaying(p => !p);
  };

  const scrub = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.round(((e.clientX - r.left) / r.width) * duration);
    setTime(t);
    if (hasAudio && audioRef.current) audioRef.current.currentTime = t;
  };

  const handleVolume = e => {
    const next = Number(e.target.value);
    setVolume(next);
    setMuted(next === 0);
    if (audioRef.current) audioRef.current.volume = next;
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (audioRef.current) audioRef.current.volume = nextMuted ? 0 : volume || 1;
  };

  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <header className="lm-exam-topbar">
      <div className="lm-exam-topbar-inner">
        <span className="lm-exam-brand" aria-label="IELTSAnywhere">
          <span className="lm-exam-brand-ielts">IELTS</span>
          <span className="lm-exam-brand-anywhere">Anywhere</span>
        </span>

        <span className="lm-exam-brand-sep" aria-hidden="true" />

        <button
          type="button"
          className="lm-exam-back"
          onClick={onBack}
          aria-label="Go back"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        <span className="lm-exam-time">{fmt(time)}</span>

        <div className="lm-exam-audio">
          {hasAudio && (
            <audio ref={audioRef} src={section.audio} preload="metadata" style={{ display: "none" }} />
          )}

          <button
            type="button"
            className={`lm-exam-play${audioErr ? " is-error" : ""}`}
            onClick={togglePlay}
            disabled={hasAudio && !ready}
            aria-label={playing ? "Pause audio" : "Play audio"}
          >
            {playing
              ? <Pause size={16} fill="currentColor" />
              : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>

          <button
            type="button"
            className="lm-exam-track"
            onClick={scrub}
            aria-label="Seek audio"
          >
            <div className="lm-exam-track-fill" style={{ width: `${pct}%` }} />
            <span className="lm-exam-track-thumb" style={{ left: `${pct}%` }} />
          </button>

          <span className="lm-exam-time" style={{ textAlign: "right" }}>{fmt(duration)}</span>
        </div>

        <div className="lm-exam-volume">
          <button
            type="button"
            className="lm-exam-vol-btn"
            onClick={toggleMute}
            aria-label={muted ? "Unmute audio" : "Mute audio"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={handleVolume}
            className="lm-vol-slider"
            aria-label="Audio volume"
          />
        </div>

        <span className="lm-exam-answered" aria-live="polite">
          <span className="lm-exam-answered-long">{totalAnswered}/{totalQuestions} answered</span>
          <span className="lm-exam-answered-short">{totalAnswered}/{totalQuestions}</span>
        </span>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="lm-btn-primary lm-btn-finish"
        >
          {submitting ? "Submitting…" : "Finish Test"}
        </button>
      </div>

      {partLabel && (
        <div className="lm-exam-context">
          <div className="lm-exam-context-inner">{partLabel}</div>
        </div>
      )}
    </header>
  );
}

// ─── MCQ options ──────────────────────────────────────────────────────────────
function MCQOpts({ question, value, onChange, result, disabled }) {
  const opts = (question.options ?? []).map((o, i) =>
    typeof o === "string" ? { order: i, option: o } : o
  );
  return (
    <div style={{ marginTop: 10 }}>
      {opts.map((opt, oi) => {
        const sel   = value === opt.order;
        const isOk  = result && (
          Array.isArray(result.correct_answer)
            ? result.correct_answer.some(a => String(a).toLowerCase().trim() === String(opt.option).toLowerCase().trim())
            : opt.order === result.correct_answer
        );
        const isBad = result && sel && !result.is_correct;
        return (
          <label key={`option-${question.id}-${opt.order ?? oi}-${oi}`} className={`lm-opt${isOk ? " ok" : isBad ? " bad" : sel ? " sel" : ""}`}>
            <input
              type="radio" style={{ display: "none" }}
              disabled={disabled || !!result}
              checked={sel}
              onChange={() => !result && !disabled && onChange(opt.order)}
            />
            <span style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              border: "2px solid currentColor",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {sel && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />}
            </span>
            <span>{opt.option}</span>
            {isOk  && <span style={{ marginLeft: "auto", fontSize: 11 }}>✓</span>}
            {isBad && <span style={{ marginLeft: "auto", fontSize: 11 }}>✗</span>}
          </label>
        );
      })}
    </div>
  );
}

// ─── Multi-select options ─────────────────────────────────────────────────────
function MultiSelectOpts({ question, value = [], onChange, result, disabled }) {
  const opts    = (question.options ?? []).map((o, i) =>
    typeof o === "string" ? { order: i, option: o } : o
  );
  const sel     = new Set(Array.isArray(value) ? value : []);
  const correct = result
    ? new Set((Array.isArray(result.correct_answer) ? result.correct_answer : [result.correct_answer]).map(a => String(a).toLowerCase().trim()))
    : null;

  const toggle = order => {
    if (result || disabled) return;
    const max = Number(question.max_selected_options) || 1;
    const next = new Set(sel);
    if (next.has(order)) next.delete(order);
    else if (next.size < max) next.add(order);
    onChange([...next]);
  };

  return (
    <div style={{ marginTop: 10 }}>
      {opts.map((opt, oi) => {
        const isSel = sel.has(opt.order);
        const isOk  = result && correct?.has(String(opt.option).toLowerCase().trim());
        const isBad = result && isSel && !isOk;
        return (
          <label
            key={`option-${question.id}-${opt.order ?? oi}-${oi}`}
            className={`lm-opt${isOk ? " ok" : isBad ? " bad" : isSel ? " sel" : ""}`}
            onClick={() => toggle(opt.order)}
          >
            <span style={{
              width: 15, height: 15, borderRadius: 3, flexShrink: 0,
              border: "2px solid currentColor",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isSel && <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </span>
            <span>{opt.option}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Dropdown (matching / dropdown question type) ─────────────────────────────
function DropdownOpt({ question, value, onChange, result, disabled }) {
  const opts  = (question.options ?? []).map((o, i) =>
    typeof o === "string" ? { order: i, option: o } : o
  );
  const isOk  = result?.is_correct;
  const isBad = result && !isOk;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "middle" }}>
      <select
        disabled={disabled || !!result}
        value={value ?? ""}
        onChange={e => !result && !disabled && onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        style={{
          border: `1px solid ${isBad ? RED : isOk ? GREEN : BORDER}`,
          borderRadius: 8, padding: "5px 10px", fontSize: 13.5, fontFamily: "inherit",
          background: isBad ? RED_BG : isOk ? GREEN_BG : SURFACE,
          cursor: disabled || result ? "default" : "pointer", outline: "none",
          color: TEXT,
          transition: "border-color .15s, box-shadow .15s",
        }}
      >
        <option value="">— Select —</option>
        {opts.map((o, oi) => <option key={`option-${question.id}-${o.order ?? oi}-${oi}`} value={o.order}>{o.option}</option>)}
      </select>
      {result && (
        <span style={{ fontSize: 12, color: isOk ? GREEN : RED }}>
          {isOk
            ? "✓"
            : `✗ → ${opts.find(o => String(o.order) === String(result.correct_answer))?.option ?? result.correct_answer}`}
        </span>
      )}
    </span>
  );
}

// ─── Subsection heading (Questions X–Y + instruction + title) ─────────────────
function SubHead({ sub, numbering }) {
  const qs = subsectionQuestions(sub);
  if (qs.length === 0) return null;
  const start = numbering.questionNumberStartById[qs[0].id];
  const end   = numbering.questionNumberEndById[qs[qs.length - 1].id];
  const range = start === end ? `Question ${start}` : `Questions ${start}–${end}`;
  return (
    <div style={{ marginBottom: 18, paddingBottom: 4 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 10, letterSpacing: "-0.01em" }}>{range}</h3>
      {sub.text && sub.text.split("\n").map((line, i) => (
        <Instruction key={`instr-${sub.id ?? "sub"}-${i}`} text={line} />
      ))}
      {sub.title && (
        <p style={{
          fontSize: 13, fontWeight: 700, color: TEXT, marginTop: 10,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {sub.title.toUpperCase()}
        </p>
      )}
    </div>
  );
}

// ─── Form subsection ──────────────────────────────────────────────────────────
// Renders questions as lines of text with inline blanks inside a bordered box.
function FormSubsection({ sectionId, sub, answers, setAnswers, results, numbering, disabled }) {
  const qs = subsectionQuestions(sub);
  return (
    <div className="lm-card" style={{ marginBottom: 32 }}>
      <SubHead sub={sub} numbering={numbering} />
      <div style={{
        border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: "18px 22px", background: SURFACE_ALT,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {sub.visual && (
          <img src={sub.visual} alt="" style={{ maxWidth: "100%", borderRadius: 6, marginBottom: 8 }} />
        )}
        {qs.map((q, i) => {
          const qLabel   = numbering.questionNumberLabelById[q.id] ?? String(i + 1);
          const value    = answers[q.id];
          const result   = results?.[String(q.id)];
          const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));

          if (q.question_type === "fill_in_the_blank") {
            return (
              <div key={`question-${sectionId}-${sub.id ?? "root"}-${q.id}-${i}`} data-qid={q.id} style={{ lineHeight: 2.1 }}>
                <Stem text={q.text} label={qLabel} questionId={q.id} value={value} onChange={onChange} disabled={disabled} result={result} />
                {result && !result.is_correct && (
                  <span style={{ fontSize: 12, color: MUTED, marginLeft: 8 }}>
                    → <span style={{ color: GREEN }}>{result.correct_answer}</span>
                  </span>
                )}
              </div>
            );
          }
          return (
            <div key={`question-${sectionId}-${sub.id ?? "root"}-${q.id}-${i}`} data-qid={q.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ paddingTop: 2 }}><Bubble label={qLabel} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: TEXT_SUB, lineHeight: 1.7, marginBottom: 4 }}>{q.text}</p>
                {q.question_type === "multiple_choices" && <MCQOpts question={q} value={value} onChange={onChange} result={result} disabled={disabled} />}
                {q.question_type === "multiple_select"  && <MultiSelectOpts question={q} value={value} onChange={onChange} result={result} disabled={disabled} />}
                {q.question_type === "dropdown"         && <DropdownOpt question={q} value={value} onChange={onChange} result={result} disabled={disabled} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grid subsection ──────────────────────────────────────────────────────────
// Renders a table; cells that reference question IDs show the question stem with inline blanks.
function GridSubsection({ sectionId, sub, answers, setAnswers, results, numbering, disabled }) {
  const qs      = subsectionQuestions(sub);
  const headers = (sub.grid_headers ?? []).slice().sort((a, b) => a.order - b.order);
  const cells   = sub.grid_cells ?? [];

  // Data uses 1-based row/col — key the map that way
  const cellMap = {};
  cells.forEach(c => { cellMap[`${c.row}-${c.col}`] = c; });

  const numCols = headers.length || cells.reduce((m, c) => Math.max(m, c.col), 0);
  const numRows = cells.reduce((m, c) => Math.max(m, c.row), 0);

  // grid_cells embed Cathoven question IDs; sub.questions has DB IDs.
  // Match by `order` (both sets are sequentially ordered within the subsection).
  const qByOrder = {};
  qs.forEach((q, i) => { qByOrder[q.order] = { q, i }; });

  const cellStyle = { border: `1px solid ${BORDER}`, padding: "10px 14px", color: TEXT_SUB, verticalAlign: "middle", fontSize: 13.5 };

  return (
    <div className="lm-card" style={{ marginBottom: 32 }}>
      <SubHead sub={sub} numbering={numbering} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th key={`header-${sub.id}-${h.order ?? hi}-${hi}`} style={{ ...cellStyle, background: SURFACE, fontWeight: 600, color: TEXT_SUB }}>
                    {h.text}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: numRows }, (_, ri) => (
              <tr key={`row-${sub.id}-${ri}`}>
                {Array.from({ length: numCols }, (_, ci) => {
                  const cell = cellMap[`${ri + 1}-${ci + 1}`];
                  if (!cell) return <td key={`cell-${sectionId}-${sub.id}-${ri + 1}-${ci + 1}-${ci}`} style={cellStyle} />;

                  const cellQs = cell.questions ?? [];
                  if (cellQs.length === 0) {
                    return <td key={`cell-${sectionId}-${sub.id}-${cell.row}-${cell.col}-${ci}`} style={cellStyle}>{cell.text ?? ""}</td>;
                  }
                  return (
                    <td key={`cell-${sectionId}-${sub.id}-${cell.row}-${cell.col}-${ci}`} style={cellStyle}>
                      {cell.text ? <span style={{ marginRight: 4 }}>{cell.text}</span> : null}
                      {cellQs.map((cq, cqi) => {
                        const match = qByOrder[cq.order];
                        if (!match) return null;
                        const { q: dbQ } = match;
                        const qLabel   = numbering.questionNumberLabelById[dbQ.id] ?? "";
                        const value    = answers[dbQ.id];
                        const result   = results?.[String(dbQ.id)];
                        const onChange = val => setAnswers(a => ({ ...a, [dbQ.id]: val }));
                        return (
                          <span key={`cell-q-${sectionId}-${sub.id}-${cell.row}-${cell.col}-${cq.order}-${cqi}`}>
                            <Stem text={cq.text} label={qLabel} questionId={dbQ.id} value={value} onChange={onChange} disabled={disabled} result={result} />
                            {result && !result.is_correct && (
                              <span style={{ fontSize: 12, color: MUTED, marginLeft: 6 }}>
                                → <span style={{ color: GREEN }}>{Array.isArray(result.correct_answer) ? result.correct_answer[0] : result.correct_answer}</span>
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Table subsection ─────────────────────────────────────────────────────────
// Lettered option pool + list of matching questions.
function TableSubsection({ sectionId, sub, answers, setAnswers, results, numbering, disabled }) {
  const qs         = subsectionQuestions(sub);
  const sharedOpts = qs[0]?.options ?? [];
  return (
    <div className="lm-card" style={{ marginBottom: 32 }}>
      <SubHead sub={sub} numbering={numbering} />
      {sharedOpts.length > 0 && (
        <div style={{
          border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "14px 18px", marginBottom: 16, background: SURFACE_ALT,
          display: "flex", flexWrap: "wrap", gap: "8px 24px",
        }}>
          {sharedOpts.map((o, oi) => (
            <span key={`pool-opt-${sub.id}-${o.order ?? oi}-${oi}`} style={{ fontSize: 13.5, color: TEXT_SUB }}>
              <strong>{String.fromCharCode(65 + o.order)}</strong>&nbsp;&nbsp;{o.option}
            </span>
          ))}
        </div>
      )}
      {qs.map((q, i) => {
        const qLabel   = numbering.questionNumberLabelById[q.id] ?? String(i + 1);
        const value    = answers[q.id];
        const result   = results?.[String(q.id)];
        const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));
        return (
          <div key={`question-${sectionId}-${sub.id ?? "root"}-${q.id}-${i}`} data-qid={q.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <Bubble label={qLabel} />
            <span style={{ flex: 1, fontSize: 14, color: TEXT_SUB }}>{q.text}</span>
            <DropdownOpt question={q} value={value} onChange={onChange} result={result} disabled={disabled} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Regular subsection ───────────────────────────────────────────────────────
// Standard question list: fill, MCQ, multi-select, dropdown with group labels.
function RegularSubsection({ sectionId, sub, answers, setAnswers, results, numbering, disabled }) {
  const qs = subsectionQuestions(sub);
  let prevGroup = null;
  return (
    <div className="lm-card" style={{ marginBottom: 32 }}>
      <SubHead sub={sub} numbering={numbering} />
      {sub.visual && (
        <img src={sub.visual} alt="" style={{ maxWidth: "100%", borderRadius: 10, marginBottom: 16 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {qs.map((q, i) => {
          const qLabel   = numbering.questionNumberLabelById[q.id] ?? String(i + 1);
          const value    = answers[q.id];
          const result   = results?.[String(q.id)];
          const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));
          const label    = q.group_label;
          const showLabel = label && label !== prevGroup;
          if (showLabel) prevGroup = label;

          return (
            <div key={`question-${sectionId}-${sub.id ?? "root"}-${q.id}-${i}`} data-qid={q.id}>
              {showLabel && (
                <p style={{
                  fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 10,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}>{label}</p>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {q.question_type !== "fill_in_the_blank" && (
                  <div style={{ paddingTop: 2, flexShrink: 0 }}><Bubble label={qLabel} /></div>
                )}
                <div style={{ flex: 1 }}>
                  {q.question_type === "fill_in_the_blank" ? (
                    <Stem text={q.text} label={qLabel} questionId={q.id} value={value} onChange={onChange} disabled={disabled} result={result} />
                  ) : (
                    <p style={{ fontSize: 14, color: TEXT_SUB, lineHeight: 1.7 }}>{q.text}</p>
                  )}
                  {q.question_type === "multiple_choices" && <MCQOpts question={q} value={value} onChange={onChange} result={result} disabled={disabled} />}
                  {q.question_type === "multiple_select"  && <MultiSelectOpts question={q} value={value} onChange={onChange} result={result} disabled={disabled} />}
                  {q.question_type === "dropdown"         && (
                    <div style={{ marginTop: 8 }}>
                      <DropdownOpt question={q} value={value} onChange={onChange} result={result} disabled={disabled} />
                    </div>
                  )}
                  {result && !result.is_correct && result.tip && (
                    <div style={{
                      marginTop: 8, padding: "8px 12px",
                      background: "#fef9c3", border: "1px solid #fde68a",
                      borderRadius: 6, fontSize: 12.5, color: "#92400e", lineHeight: 1.6,
                    }}>
                      <strong>Tip: </strong>{result.tip}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Subsection router ────────────────────────────────────────────────────────
function Subsection(props) {
  switch (props.sub.subsection_type) {
    case "form":  return <FormSubsection  {...props} />;
    case "grid":  return <GridSubsection  {...props} />;
    case "table": return <TableSubsection {...props} />;
    default:      return <RegularSubsection {...props} />;
  }
}

// ─── Bottom navigation ────────────────────────────────────────────────────────
function BottomNav({
  sections, activeSection, setActiveSection, answers, numbering,
  activeQuestionId, onScrollToQuestion,
}) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: SURFACE, borderTop: `1px solid ${BORDER}`,
      boxShadow: "0 -4px 20px rgba(15, 23, 42, 0.06)",
    }}>
      <div style={{
        maxWidth: 800, margin: "0 auto",
        padding: "12px 20px", display: "flex", alignItems: "center",
        gap: 0, overflowX: "auto",
      }}>
      {sections.map((sec, si) => {
        const isActive = si === activeSection;
        const sectionTotal = sectionSlotCount(sec);
        const sectionAnswered = sectionAnsweredSlots(sec, answers);
        const navSlots = buildSectionNavSlots(sec, numbering);
        return (
          <div key={`part-tab-${sec.id ?? si}-${si}`} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {si > 0 && <div style={{ width: 1, height: 20, background: BORDER, marginRight: 4 }} />}
            <button
              onClick={() => setActiveSection(si)}
              style={{
                padding: "6px 16px", borderRadius: 999, fontWeight: 600, fontSize: 13,
                background: isActive ? PRIMARY : SURFACE,
                color: isActive ? "#fff" : MUTED,
                border: `1px solid ${isActive ? PRIMARY : BORDER}`,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                transition: "background .15s, border-color .15s, color .15s",
              }}
            >
              Part {sec.part}
            </button>
            {isActive ? (
              <div style={{ display: "flex", gap: 6 }}>
                {navSlots.map(({ question, questionId, number, slotIndex }) => {
                  const answeredSlots = getAnsweredSlotCount(question, answers[questionId]);
                  const done = answeredSlots > slotIndex;
                  const isCurrent = activeQuestionId === questionId;
                  return (
                    <button
                      key={`qnav-${sec.id ?? si}-${questionId}-${slotIndex}-${number}`}
                      type="button"
                      onClick={() => onScrollToQuestion(questionId)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: done ? PRIMARY_LIGHT : SURFACE,
                        color: done ? PRIMARY : MUTED_LIGHT,
                        border: `1.5px solid ${isCurrent ? PRIMARY : done ? "#C7D2FE" : BORDER}`,
                        cursor: "pointer", padding: 0, flexShrink: 0,
                        boxShadow: isCurrent ? `0 0 0 2px ${PRIMARY_MUTED}` : "none",
                      }}
                    >
                      {number}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: MUTED, whiteSpace: "nowrap", fontWeight: 500 }}>
                {sectionAnswered} of {sectionTotal}
              </span>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ─── Results helpers ─────────────────────────────────────────────────────────
function formatAnswer(ca) {
  if (Array.isArray(ca)) return ca.join(", ");
  if (ca === null || ca === undefined) return "—";
  return String(ca);
}

function getCEFR(band) {
  if (band >= 8.5) return "C2";
  if (band >= 7.0) return "C1";
  if (band >= 5.5) return "B2";
  if (band >= 4.5) return "B1";
  if (band >= 3.5) return "A2";
  return "A1";
}

function LMAnswerKeyItem({ num, qResult }) {
  const isCorrect = qResult?.is_correct;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", minWidth: 0 }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: isCorrect ? GREEN : PRIMARY,
        color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{num}</span>
      <span style={{ fontSize: 13, color: TEXT, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {formatAnswer(qResult?.correct_answer)}
      </span>
      <span style={{ color: "#94A3B8", fontSize: 12, flexShrink: 0 }}>—</span>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        background: isCorrect ? GREEN : RED,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 10, fontWeight: 700,
      }}>{isCorrect ? "✓" : "✗"}</span>
    </div>
  );
}

// ─── Results panel ────────────────────────────────────────────────────────────
function ResultsPanel({ result }) {
  const bandColor = b => b >= 7 ? GREEN : b >= 5.5 ? "#d97706" : RED;
  const bc = bandColor(result.overall_band);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Overall Band</p>
          <p style={{ fontSize: 52, fontWeight: 700, color: bc, lineHeight: 1 }}>{result.overall_band.toFixed(1)}</p>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{result.correct} / {result.total} correct</p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
            {result.overall_band >= 7 ? "Strong performance — well done!" : result.overall_band >= 5.5 ? "Developing — keep practising" : "Needs significant improvement"}
          </p>
          {Object.entries(result.section_scores ?? {}).map(([n, d]) => (
            <div key={n} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: MUTED }}>Part {n}</span>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>
                  {d.correct}/{d.total} — Band {d.band?.toFixed(1)}
                </span>
              </div>
              <div style={{ height: 5, background: BORDER, borderRadius: 3 }}>
                <div style={{ width: `${(d.correct / Math.max(1, d.total)) * 100}%`, height: "100%", background: ACCENT, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {result.improvement_tips?.length > 0 && (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Improvement Tips</p>
          {result.improvement_tips.map((tip, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "10px 14px", marginBottom: 8,
              background: SURFACE, borderRadius: 8, borderLeft: "3px solid #d97706",
            }}>
              <span style={{ color: "#d97706", flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 13.5, color: TEXT_SUB, lineHeight: 1.65 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── IELTS answer-slot helpers ────────────────────────────────────────────────
function subsectionQuestions(sub) {
  return (sub?.questions ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function sectionQs(sec) {
  return (sec?.subsections ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap(sub => subsectionQuestions(sub));
}

function allQuestions(test) {
  return (test?.sections ?? []).flatMap(sectionQs);
}

function getQuestionSlotCount(question) {
  if (question?.question_type === "multiple_select") {
    const max = Number(question.max_selected_options);
    if (max > 1) return max;
  }
  return 1;
}

function getQuestionNumbering(test) {
  const questionNumberStartById = {};
  const questionNumberEndById = {};
  const questionNumberLabelById = {};
  const questionSlotNumbersById = {};
  let number = 1;

  for (const sec of test?.sections ?? []) {
    for (const sub of (sec.subsections ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      for (const q of subsectionQuestions(sub)) {
        const slotCount = getQuestionSlotCount(q);
        const start = number;
        const end = number + slotCount - 1;
        questionNumberStartById[q.id] = start;
        questionNumberEndById[q.id] = end;
        questionNumberLabelById[q.id] = slotCount > 1 ? `${start}–${end}` : `${start}`;
        questionSlotNumbersById[q.id] = Array.from({ length: slotCount }, (_, i) => start + i);
        number += slotCount;
      }
    }
  }

  return {
    questionNumberStartById,
    questionNumberEndById,
    questionNumberLabelById,
    questionSlotNumbersById,
    totalSlots: Math.max(0, number - 1),
  };
}

function isAnswerComplete(question, answer) {
  if (question?.question_type === "multiple_select") {
    const expected = Number(question.max_selected_options) || 1;
    const selected = Array.isArray(answer) ? answer.length : 0;
    return selected >= expected;
  }
  if (Array.isArray(answer)) return answer.length > 0;
  return answer !== undefined && answer !== "";
}

function getAnsweredSlotCount(question, answer) {
  if (question?.question_type === "multiple_select") {
    const expected = Number(question.max_selected_options) || 1;
    const selectedCount = Array.isArray(answer) ? answer.length : 0;
    return Math.min(selectedCount, expected);
  }
  return isAnswerComplete(question, answer) ? 1 : 0;
}

function sectionSlotCount(sec) {
  return sectionQs(sec).reduce((sum, q) => sum + getQuestionSlotCount(q), 0);
}

function sectionAnsweredSlots(sec, answers) {
  return sectionQs(sec).reduce((sum, q) => sum + getAnsweredSlotCount(q, answers[q.id]), 0);
}

function getSectionNumberRange(section, numbering) {
  const qs = sectionQs(section);
  if (!qs.length) return { first: 0, last: 0 };
  return {
    first: numbering.questionNumberStartById[qs[0].id],
    last: numbering.questionNumberEndById[qs[qs.length - 1].id],
  };
}

function buildSectionNavSlots(sec, numbering) {
  return sectionQs(sec).flatMap(question => {
    const slotNumbers = numbering.questionSlotNumbersById[question.id] ?? [];
    return slotNumbers.map((number, slotIndex) => ({
      question,
      questionId: question.id,
      number,
      slotIndex,
    }));
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ListeningModule({
  apiBase, getToken, sessionId, testId, onComplete, autoSubmitRef, timeLeft, onBack,
}) {
  useEffect(injectCSS, []);

  const [test, setTest]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeSection, setActiveSection]   = useState(0);
  const [answers, setAnswers]               = useState({});
  const [submitting, setSubmitting]         = useState(false);
  const [result, setResult]                 = useState(null);
  const [view, setView]                     = useState("test");
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [reviewPart, setReviewPart]             = useState(1);

  // ── Load test ──
  useEffect(() => {
    async function load() {
      if (!apiBase || (!sessionId && !testId)) {
        await new Promise(r => setTimeout(r, 400));
        setTest(MOCK_TEST);
        setLoading(false);
        return;
      }
      try {
        const token = await getToken();
        const url = testId
          ? `${apiBase}/listening/tests/${testId}`
          : `${apiBase}/listening/for-session/${sessionId}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        const payload = await res.json();
        setTest(payload.data ?? payload);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiBase, sessionId, testId]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (!apiBase || (!sessionId && !testId)) {
        await new Promise(r => setTimeout(r, 800));
        setResult(buildMockResult(test, answers));
        setView("results");
        onComplete?.();
        return;
      }
      const token = await getToken();
      const res   = await fetch(`${apiBase}/listening/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ test_id: test.id, answers }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setResult(await res.json());
      setView("results");
      onComplete?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [apiBase, sessionId, testId, getToken, test, answers, onComplete]);

  useEffect(() => {
    if (autoSubmitRef) autoSubmitRef.current = handleSubmit;
  }, [autoSubmitRef, handleSubmit]);

  const scrollToQuestion = useCallback(questionId => {
    setActiveQuestionId(questionId);
    const el = document.querySelector(`[data-qid="${questionId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);


  const fmtTime = s => s != null ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : null;

  // ── Loading ──
  if (loading) {
    return (
      <div className="lm" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <span className="lm-spinner" />
          <p style={{ color: MUTED, fontSize: 13, marginTop: 12 }}>Loading test…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lm" style={{ padding: 32 }}>
        <div style={{ padding: 16, border: `1px solid ${RED}44`, borderRadius: 10, color: RED, fontSize: 13 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="lm" style={{ padding: 32 }}>
        <p style={{ color: MUTED, fontSize: 13 }}>No test available.</p>
      </div>
    );
  }

  const handleBack = onBack ?? (() => { if (typeof window !== "undefined") window.history.back(); });

  // ── Results view ──
  if (view === "results" && result) {
    const band = result.overall_band ?? 0;
    const bc = b => b >= 7 ? GREEN : b >= 5.5 ? "#d97706" : RED;
    const cefr = getCEFR(band);
    const qNumMap = getQuestionNumbering(test);
    const qResultMap = Object.fromEntries((result.question_results ?? []).map(r => [r.question_id, r]));

    // Group questions by part using test structure
    const answerKeyParts = (test.sections ?? [])
      .slice()
      .sort((a, b) => (a.part ?? 0) - (b.part ?? 0))
      .map(section => {
        const sc = result.section_scores?.[String(section.part)] ?? {};
        const items = sectionQs(section).map(q => ({
          qNum: qNumMap.questionNumberStartById[q.id],
          qResult: qResultMap[String(q.id)],
        }));
        return { part: section.part, sc, items };
      });

    return (
      <div className="lm" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{
          flexShrink: 0, background: "#fff", borderBottom: `1px solid ${BORDER}`,
          padding: "0 20px", height: 56,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={handleBack} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", color: MUTED, padding: "4px 6px", borderRadius: 8 }}>
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Listening Results</span>
          <span style={{ flex: 1 }} />
          <button onClick={handleBack} style={{ padding: "7px 16px", borderRadius: 8, background: PRIMARY, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Back to Tests
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Stats bar */}
          <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
            {[
              { label: "Overall Band Score", value: `${band.toFixed(1)}/9.0`, color: bc(band) },
              { label: "CEFR Level", value: cefr, color: TEXT },
              { label: "Correct Answers", value: `${result.correct}/${result.total}`, color: TEXT },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: "18px 24px", borderRight: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 56px" }}>

            {/* Answer Key */}
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 15, color: TEXT }}>
                Answer Key
              </div>
              {answerKeyParts.map(({ part, sc, items }) => (
                <div key={part} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ padding: "10px 20px 6px", fontWeight: 600, fontSize: 13, color: TEXT_SUB }}>
                    Part {part}: {sc.correct ?? 0}/{sc.total ?? items.length} correct
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "0 12px 10px", gap: "2px 16px" }}>
                    {items.map(({ qNum, qResult }) => qNum && (
                      <LMAnswerKeyItem key={qNum} num={qNum} qResult={qResult} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Improvement tips */}
            {result.improvement_tips?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Improvement Tips
                </div>
                {result.improvement_tips.map((tip, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", marginBottom: 8, borderRadius: 8,
                    background: "#fffbeb", border: "1px solid #fde68a",
                    fontSize: 13.5, color: "#78350f", lineHeight: 1.65,
                  }}>{tip}</div>
                ))}
              </div>
            )}

            {/* Review split pane */}
            <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 14 }}>Review your answers</div>

            {/* Part tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {answerKeyParts.map(({ part }) => (
                <button key={part} onClick={() => setReviewPart(part)} style={{
                  padding: "6px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontSize: 13,
                  border: `1px solid ${reviewPart === part ? PRIMARY : BORDER}`,
                  background: reviewPart === part ? PRIMARY : SURFACE,
                  color: reviewPart === part ? "#fff" : TEXT_SUB,
                }}>
                  Part {part}
                </button>
              ))}
            </div>

            {(() => {
              const section = test.sections.find(s => s.part === reviewPart);
              if (!section) return null;
              const reviewNumbering = getQuestionNumbering(test);
              const { first: rFirst, last: rLast } = getSectionNumberRange(section, reviewNumbering);
              const subs = (section.subsections ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              return (
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 40 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 400 }}>
                    {/* Transcript */}
                    <div style={{ borderRight: `1px solid ${BORDER}`, overflowY: "auto", maxHeight: 560 }}>
                      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Part {section.part} Transcript
                        </span>
                      </div>
                      <div style={{ padding: "16px 18px" }}>
                        {section.transcript
                          ? section.transcript.split(/\n{2,}/).map((para, i) => (
                              <p key={i} style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.85, marginBottom: 12 }}>{para}</p>
                            ))
                          : <p style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>Transcript not available for this part.</p>
                        }
                      </div>
                    </div>

                    {/* Questions */}
                    <div style={{ overflowY: "auto", maxHeight: 560 }}>
                      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>Questions {rFirst}–{rLast}</span>
                      </div>
                      <div style={{ padding: "16px 16px" }}>
                        {subs.map(sub => {
                          const type = sub.subsection_type;
                          const props = {
                            sectionId: section.id,
                            sub,
                            answers,
                            setAnswers: () => {},
                            results: qResultMap,
                            numbering: reviewNumbering,
                            disabled: true,
                          };
                          if (type === "form")  return <FormSubsection  key={sub.id} {...props} />;
                          if (type === "grid")  return <GridSubsection  key={sub.id} {...props} />;
                          if (type === "table") return <TableSubsection key={sub.id} {...props} />;
                          return <RegularSubsection key={sub.id} {...props} />;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // ── Test view ──
  const section = test.sections[activeSection];

  const numbering = getQuestionNumbering(test);
  const { first: secFirst, last: secLast } = getSectionNumberRange(section, numbering);

  const subsWithOffset = (section?.subsections ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(sub => ({ sub }));

  const totalQ = numbering.totalSlots;
  const totalAnswered = allQuestions(test).reduce(
    (sum, q) => sum + getAnsweredSlotCount(q, answers[q.id]),
    0
  );

  return (
    <div className="lm" style={{ minHeight: "100vh", paddingBottom: 88, background: PAGE_BG }}>

      {section && (
        <ListeningExamTopBar
          section={section}
          partLabel={`Part ${section.part} — Listen and answer questions ${secFirst}–${secLast}`}
          onBack={onBack ?? (() => { if (typeof window !== "undefined") window.history.back(); })}
          onSubmit={handleSubmit}
          submitting={submitting}
          totalAnswered={totalAnswered}
          totalQuestions={totalQ}
        />
      )}

      {/* ── Scrollable content ── */}
      <div
        className="lm-fadein"
        key={`section-content-${section?.id ?? activeSection}-${activeSection}`}
        style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 32px" }}
      >
        {subsWithOffset.map(({ sub }, subi) => (
          <Subsection
            key={`subsection-${section.id}-${sub.id ?? subi}-${subi}`}
            sectionId={section.id}
            sub={sub}
            answers={answers}
            setAnswers={setAnswers}
            results={null}
            numbering={numbering}
            disabled={false}
          />
        ))}

        {/* ── Section navigation ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => setActiveSection(s => s - 1)}
            disabled={activeSection === 0}
            className="lm-btn-ghost"
          >
            ← Previous
          </button>
          {activeSection < test.sections.length - 1 ? (
            <button
              onClick={() => setActiveSection(s => s + 1)}
              className="lm-btn-outline"
            >
              Next Part →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="lm-btn-primary"
            >
              {submitting ? "Submitting…" : "Finish Test"}
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <BottomNav
        sections={test.sections}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        answers={answers}
        numbering={numbering}
        activeQuestionId={activeQuestionId}
        onScrollToQuestion={scrollToQuestion}
      />
    </div>
  );
}

// ─── Mock test (demo mode) ────────────────────────────────────────────────────
const MOCK_TEST = {
  id: "mock-1",
  title: "IELTS Practice Test 1",
  sections: [
    {
      id: 1, part: 1, title: "Section 1", audio: null, audio_duration_seconds: 480,
      subsections: [
        {
          id: 1, order: 1, subsection_type: "form",
          text: "Complete the form below.\nWrite ONE WORD AND/OR A NUMBER for each answer.",
          title: "Guitar Group", visual: null, grid_headers: null, grid_cells: null,
          questions: [
            { id: 1, order: 1, question_type: "fill_in_the_blank", text: "Coordinator: Gary </blank>", options: [], group_label: null },
            { id: 2, order: 2, question_type: "fill_in_the_blank", text: "Level: </blank>",            options: [], group_label: null },
            { id: 3, order: 3, question_type: "fill_in_the_blank", text: "Place: the </blank>",        options: [], group_label: null },
            { id: 4, order: 4, question_type: "fill_in_the_blank", text: "</blank> Street",            options: [], group_label: null },
            { id: 5, order: 5, question_type: "fill_in_the_blank", text: "Time: Thursday morning at </blank>", options: [], group_label: null },
            { id: 6, order: 6, question_type: "fill_in_the_blank", text: "Recommended website: 'The perfect </blank>'", options: [], group_label: null },
          ],
        },
        {
          id: 2, order: 2, subsection_type: "grid",
          text: "Complete the table below.\nWrite ONE WORD ONLY for each answer.",
          title: "A Typical 45-Minute Guitar Lesson", visual: null,
          grid_headers: [{ order: 0, text: "Time" }, { order: 1, text: "Activity" }, { order: 2, text: "Notes" }],
          grid_cells: [
            { row: 0, col: 0, cell_text: "5 minutes",  question_ids: [] },
            { row: 0, col: 1, cell_text: "tuning guitars", question_ids: [] },
            { row: 0, col: 2, cell_text: "", question_ids: [7] },
            { row: 1, col: 0, cell_text: "10 minutes", question_ids: [] },
            { row: 1, col: 1, cell_text: "strumming chords using our thumbs", question_ids: [] },
            { row: 1, col: 2, cell_text: "", question_ids: [8] },
            { row: 2, col: 0, cell_text: "15 minutes", question_ids: [] },
            { row: 2, col: 1, cell_text: "playing songs", question_ids: [] },
            { row: 2, col: 2, cell_text: "", question_ids: [9] },
            { row: 3, col: 0, cell_text: "10 minutes", question_ids: [] },
            { row: 3, col: 1, cell_text: "playing single notes and simple tunes", question_ids: [] },
            { row: 3, col: 2, cell_text: "", question_ids: [10] },
            { row: 4, col: 0, cell_text: "5 minutes",  question_ids: [] },
            { row: 4, col: 1, cell_text: "noting things to practise at home", question_ids: [] },
            { row: 4, col: 2, cell_text: "–", question_ids: [] },
          ],
          questions: [
            { id: 7,  order: 7,  question_type: "fill_in_the_blank", text: "using an app or by </blank>",          options: [], group_label: null },
            { id: 8,  order: 8,  question_type: "fill_in_the_blank", text: "keeping time while the teacher is </blank>", options: [], group_label: null },
            { id: 9,  order: 9,  question_type: "fill_in_the_blank", text: "often listening to a </blank> of a song",   options: [], group_label: null },
            { id: 10, order: 10, question_type: "fill_in_the_blank", text: "playing together, then </blank>",       options: [], group_label: null },
          ],
        },
      ],
    },
    {
      id: 2, part: 2, title: "Section 2", audio: null, audio_duration_seconds: 480,
      subsections: [{
        id: 3, order: 1, subsection_type: "regular",
        text: "Choose the correct letter, A, B or C.",
        title: null, visual: null, grid_headers: null, grid_cells: null,
        questions: [
          { id: 11, order: 11, question_type: "multiple_choices", group_label: null,
            text: "What is the main purpose of the announcement?",
            options: [{ order: 0, option: "A  To advertise a new service" }, { order: 1, option: "B  To explain a recent change" }, { order: 2, option: "C  To request public feedback" }] },
          { id: 12, order: 12, question_type: "multiple_choices", group_label: null,
            text: "What time does the facility close on weekends?",
            options: [{ order: 0, option: "A  4:30 pm" }, { order: 1, option: "B  5:00 pm" }, { order: 2, option: "C  5:30 pm" }] },
        ],
      }],
    },
    {
      id: 3, part: 3, title: "Section 3", audio: null, audio_duration_seconds: 480,
      subsections: [{ id: 4, order: 1, subsection_type: "regular", text: "Answer the questions.", title: null, visual: null, grid_headers: null, grid_cells: null,
        questions: [{ id: 13, order: 13, question_type: "fill_in_the_blank", text: "The student's project topic is </blank>.", options: [], group_label: null }] }],
    },
    {
      id: 4, part: 4, title: "Section 4", audio: null, audio_duration_seconds: 480,
      subsections: [{ id: 5, order: 1, subsection_type: "regular", text: "Complete the notes.", title: null, visual: null, grid_headers: null, grid_cells: null,
        questions: [{ id: 14, order: 14, question_type: "fill_in_the_blank", text: "The main benefit described is </blank>.", options: [], group_label: null }] }],
    },
  ],
};

// ─── Mock scoring (demo only — real scoring is server-side) ───────────────────
function buildMockResult(test, userAnswers) {
  const keys = {
    1: "Thompson", 2: "intermediate", 3: "park", 4: "Oak",
    5: "9am", 6: "beginner", 7: "ear", 8: "singing",
    9: "recording", 10: "solo", 11: 1, 12: 2,
    13: "ecology", 14: "sustainability",
  };
  const sectionScores    = {};
  const question_results = [];

  test.sections.forEach(sec => {
    let correct = 0;
    const qs = (sec.subsections ?? []).flatMap(s => s.questions ?? []);
    qs.forEach(q => {
      const ua = userAnswers[q.id];
      const ca = keys[q.id];
      const isCorrect = typeof ca === "string"
        ? String(ua ?? "").toLowerCase().trim() === ca.toLowerCase()
        : ua === ca;
      if (isCorrect) correct++;
      question_results.push({
        question_id: String(q.id), question_type: q.question_type,
        text: q.text, user_answer: ua, correct_answer: ca,
        is_correct: isCorrect,
        tip: isCorrect ? null : "Listen carefully for paraphrases and synonyms.",
      });
    });
    const ratio = correct / Math.max(1, qs.length);
    sectionScores[sec.part] = {
      correct, total: qs.length,
      band: ratio >= .875 ? 8 : ratio >= .75 ? 7 : ratio >= .625 ? 6 : ratio >= .5 ? 5 : 4,
    };
  });

  const totalCorrect = Object.values(sectionScores).reduce((a, s) => a + s.correct, 0);
  const totalQ       = Object.values(sectionScores).reduce((a, s) => a + s.total, 0);
  const r            = totalCorrect / Math.max(1, totalQ);

  return {
    attempt_id: "demo-1",
    correct: totalCorrect, total: totalQ,
    overall_band: r >= .875 ? 8 : r >= .75 ? 7 : r >= .625 ? 6 : r >= .5 ? 5.5 : 4.5,
    section_scores: sectionScores,
    question_results,
    improvement_tips: totalCorrect < totalQ
      ? ["Practise listening for specific information in form-completion tasks.", "Focus on paraphrases — the audio rarely uses the exact words on the page."]
      : ["Excellent! Maintain this level with regular timed practice tests."],
  };
}