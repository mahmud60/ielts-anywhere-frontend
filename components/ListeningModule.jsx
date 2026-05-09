/**
 * ListeningModule.jsx
 *
 * Full IELTS listening module — fetches from FastAPI backend,
 * authenticates via Firebase, handles all 4 question types.
 *
 * Backend calls go through lib/api.js so Firebase auth headers and
 * API error handling stay consistent with the rest of the frontend.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#ffffff",
  surface: "#f8fafc",
  card: "#ffffff",
  cardHover: "#f9fafb",
  border: "#e2e8f0",
  borderHover: "#cbd5e1",
  accent: "#0080ff",
  accentDim: "#e6f2ff",
  accentHover: "#006bd6",
  gold: "#d97706",
  goldDim: "#fef3c7",
  green: "#059669",
  greenDim: "#dcfce7",
  red: "#dc2626",
  redDim: "#fee2e2",
  purple: "#7c3aed",
  purpleDim: "#ede9fe",
  text: "#0f172a",
  muted: "#64748b",
  mutedLight: "#475569",
};

const SECTION_COLORS = {
  1: C.accent,
  2: C.gold,
  3: C.purple,
  4: C.green,
};


// ─── CSS injected once (animations + spinner only; layout uses Tailwind) ───────
const CSS = `
  @keyframes lm-fadeup { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lm-spin { to { transform:rotate(360deg); } }
  .lm-fadeup { animation: lm-fadeup .3s ease both; }
  .lm-spinner { width:18px; height:18px; border:2px solid #e2e8f0; border-top-color:#0080ff; border-radius:50%; animation:lm-spin .7s linear infinite; display:inline-block; }
`;

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Badge({ children, color = C.accent }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

function Spinner() {
  return <span className="lm-spinner" />;
}

function ProgressBar({ value, color = C.accent, height = 4 }) {
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 999, height, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s ease" }} />
    </div>
  );
}

function formatTime(seconds = 0) {
  if (!Number.isFinite(seconds)) return "0:00";
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function getQuestionType(question) {
  return question.question_type || question.type || "fill";
}

function isAnswerComplete(question, value) {
  if (value === undefined || value === null || value === "") return false;
  if (getQuestionType(question) === "matching") {
    const items = question.options || [];
    return items.length > 0 && items.every((_, idx) => {
      const answer = value?.[idx];
      return answer !== undefined && answer !== null && String(answer).trim() !== "";
    });
  }
  if (typeof value === "object") return Object.values(value).some(v => String(v ?? "").trim() !== "");
  return String(value).trim() !== "";
}

function getSectionAnswered(section, answers) {
  return section.questions.filter(q => isAnswerComplete(q, answers[q.id])).length;
}

function getPartLabel(section, fallbackIndex) {
  return `Part ${section?.section_number || fallbackIndex + 1}`;
}

// ─── Exam header ──────────────────────────────────────────────────────────────
function ListeningExamHeader({
  testTitle,
  partLabel,
  formatted,
  isWarning,
  isDanger,
  submitting,
  canSubmit,
  onSubmit,
  answered,
  total,
  partAnswered,
  partTotal,
}) {
  const timerTone = isDanger
    ? "border-red-200 bg-red-50 text-red-700"
    : isWarning
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const overallPct = total ? (answered / total) * 100 : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            IA
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-primary md:text-lg">
              IELTS<span className="text-foreground">Anywhere</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">Listening exam mode</div>
          </div>
        </div>

        <div className="min-w-[180px] flex-1 md:pl-6">
          <div className="truncate text-sm font-semibold text-foreground sm:text-base">
            {testTitle || "Listening Practice Test"}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{partLabel}</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
            <span>{answered}/{total} answered</span>
            {partTotal > 0 && <span>· this part {partAnswered}/{partTotal}</span>}
          </div>
        </div>

        <div className="ml-auto flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-sm font-semibold ${timerTone}`}>
            <Clock className="h-4 w-4" />
            {formatted || "--:--"}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            title={canSubmit ? "Finish and submit listening answers" : "Answer all questions before finishing"}
          >
            {submitting ? "Submitting…" : "Finish"}
          </button>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function ListeningProgressSummary({ sections, answers, activeSection, totalAnswered, totalQuestions }) {
  const section = sections[activeSection];
  const currentAnswered = section ? getSectionAnswered(section, answers) : 0;
  const currentTotal = section?.questions.length || 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="lm-card p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Overall Progress</div>
        <div className="mt-2 flex items-end gap-2">
          <div className="text-2xl font-semibold text-foreground">{totalAnswered}/{totalQuestions}</div>
          <div className="pb-1 text-sm text-muted-foreground">questions answered</div>
        </div>
        <div className="mt-4">
          <ProgressBar value={totalQuestions ? (totalAnswered / totalQuestions) * 100 : 0} />
        </div>
      </div>
      <div className="lm-card p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current Part</div>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="text-2xl font-semibold text-foreground">
            {getPartLabel(section, activeSection)}: {currentAnswered}/{currentTotal}
          </div>
          <div className="pb-1 text-sm text-muted-foreground">answered in this part</div>
        </div>
        <div className="mt-4">
          <ProgressBar value={currentTotal ? (currentAnswered / currentTotal) * 100 : 0} color={SECTION_COLORS[section?.section_number] || C.accent} />
        </div>
      </div>
    </div>
  );
}

// ─── Compact audio bar ────────────────────────────────────────────────────────
function ListeningAudioBar({ section }) {
  const audioRef = useRef(null);
  const mockTimerRef = useRef(null);

  const hasRealAudio = Boolean(section.audio_url);
  const color = SECTION_COLORS[section.section_number];

  // Playback state
  const [playing, setPlaying]   = useState(false);
  const [time, setTime]         = useState(0);
  const [duration, setDuration] = useState(section.audio_duration_seconds || 0);
  const [audioReady, setAudioReady] = useState(!hasRealAudio); // mock is always ready
  const [audioError, setAudioError] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

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
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setAudioError(true));
      }
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

  const handleVolume = (e) => {
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

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  // Status badge
  const statusBadge = audioError
    ? { label: "Audio unavailable", color: C.red }
    : hasRealAudio && !audioReady
    ? { label: "Loading…", color: C.muted }
    : hasRealAudio
    ? { label: "Audio ready", color: C.green }
    : { label: "Demo — no audio", color: C.muted };

  return (
    <div className="glass-card overflow-hidden p-4">
      {hasRealAudio && <audio ref={audioRef} src={section.audio_url} preload="metadata" />}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={color}>{getPartLabel(section, 0)}</Badge>
            <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Listen carefully, then answer the questions below.</p>
          {section.context && (
            <div className="mt-1 text-sm leading-6 text-muted-foreground">{section.context}</div>
          )}
        </div>

        <div className="w-full min-w-0 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background/80 p-3 lg:max-w-[22rem]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            disabled={audioError || (!audioReady && hasRealAudio)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: audioError ? C.red : color }}
            aria-label={playing ? "Pause audio" : "Play audio"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>

          <span className="w-11 shrink-0 text-right font-mono text-xs font-semibold text-muted-foreground">
            {formatTime(time)}
          </span>
          <button
            type="button"
            onClick={handleScrub}
            className="relative h-3 min-w-0 flex-1 rounded-full bg-secondary"
            aria-label="Seek audio"
          >
            <span
              className="absolute left-0 top-0 h-3 rounded-full"
              style={{ width: `${pct}%`, background: color }}
            />
            <span
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow ring-2"
              style={{ left: `calc(${pct}% - 8px)`, borderColor: color }}
            />
          </button>
          <span className="w-11 shrink-0 font-mono text-xs font-semibold text-muted-foreground">
            {duration ? formatTime(duration) : "--:--"}
          </span>

          <button
            type="button"
            onClick={handleReset}
            className="hidden shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:inline-flex"
            aria-label="Restart audio"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          </div>

          {hasRealAudio && (
            <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-border/50 pt-2.5">
              <button
                type="button"
                onClick={toggleMute}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label={muted ? "Unmute audio" : "Mute audio"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="h-1.5 w-20 max-w-[5rem] shrink-0 accent-primary"
                aria-label="Audio volume"
              />
            </div>
          )}
        </div>
      </div>

      {audioError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load audio. Check that the file was uploaded in the admin panel and that your R2 bucket has public access enabled.
        </div>
      )}
    </div>
  );
}

// ─── Question components ──────────────────────────────────────────────────────
function MCQQuestion({ question, value, onChange, result, color }) {
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, oi) => {
        const selected = value === oi;
        const isCorrect = result && oi === result.correct_answer;
        const isWrong = result && selected && !result.is_correct;
        const state = result
          ? isCorrect
            ? "border-emerald-300 bg-emerald-50"
            : isWrong
            ? "border-red-300 bg-red-50"
            : selected
            ? "border-primary bg-primary/5"
            : "border-border bg-background"
          : selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/15"
          : "border-border bg-background hover:border-primary/25 hover:bg-secondary/40";
        return (
          <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition ${state}`}>
            <input type="radio" style={{ display: "none" }} checked={selected}
              disabled={!!result} onChange={() => !result && onChange(oi)} />
            <span style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${isCorrect ? C.green : isWrong ? C.red : selected ? color : C.border}`,
              background: selected || isCorrect ? (isCorrect ? C.green : isWrong ? C.red : color) : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {selected && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
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

function hasBlankInText(text) {
  return /_{2,}/.test(text || "");
}

function FillQuestion({ question, value, onChange, result }) {
  const text = question?.question_text || "";
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;
  const inputCls = [
    "inline-block align-baseline rounded-lg border bg-background px-3 py-1.5 text-[15px] leading-normal text-foreground transition",
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-70",
    result ? (isCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50") : "border-input",
  ].join(" ");

  if (hasBlankInText(text)) {
    const parts = text.split(/(_{2,})/).filter(Boolean);
    return (
      <div className="text-[15px] leading-relaxed text-foreground">
        {parts.map((part, i) =>
          /_{2,}/.test(part) ? (
            <input
              key={`b-${i}`}
              type="text"
              className={`${inputCls} mx-0.5 min-w-[8.5rem] max-w-[13rem]`}
              value={value || ""}
              disabled={!!result}
              onChange={e => !result && onChange(e.target.value)}
              placeholder="answer"
              aria-label="Your answer"
            />
          ) : (
            <span key={`t-${i}`}>{part}</span>
          )
        )}
        {isWrong && (
          <p className="mt-2 text-xs text-muted-foreground">
            Correct: <span className="font-medium text-emerald-700">{result.correct_answer}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1">
      <input
        type="text"
        className={`h-11 w-full max-w-sm rounded-xl border bg-background px-4 text-[15px] text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-70 ${result ? (isCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50") : "border-input"}`}
        value={value || ""}
        disabled={!!result}
        onChange={e => !result && onChange(e.target.value)}
        placeholder="Type your answer"
        aria-label="Your answer"
      />
      {isWrong && (
        <p className="mt-2 text-xs text-muted-foreground">
          Correct: <span className="font-medium text-emerald-700">{result.correct_answer}</span>
        </p>
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
    <div className="flex flex-col gap-3">
      {question.options.map((item, idx) => {
        const userAns = value[idx];
        const correctAns = result?.correct_answer?.[idx];
        const isCorrect = result && String(userAns || "").toLowerCase() === String(correctAns || "").toLowerCase();
        const isWrong = result && !isCorrect;
        return (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center"
            style={{
              background: result ? (isCorrect ? C.greenDim : isWrong ? C.redDim : "#fff") : "#fff",
              borderColor: result ? (isCorrect ? C.green + "55" : isWrong ? C.red + "55" : C.border) : C.border,
            }}
          >
            {/* Item label */}
            <span className="flex-1 text-sm text-foreground">{item}</span>
            <span className="hidden shrink-0 text-lg text-muted-foreground sm:inline">→</span>
            {/* Dropdown selector */}
            <select
              disabled={!!result}
              value={userAns || ""}
              onChange={e => !result && onChange({ ...value, [idx]: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-44"
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

function Question({
  question,
  answers,
  setAnswers,
  results,
  color,
  index,
  questionNumber,
  isActive,
  onActivate,
}) {
  const value = answers[question.id];
  const result = results?.[question.id];

  const onChange = useCallback(val => {
    setAnswers(a => ({ ...a, [question.id]: val }));
    onActivate?.();
  }, [onActivate, question.id, setAnswers]);

  const type = getQuestionType(question);
  const typeLabelMap = {
    mcq: "Multiple choice",
    multiple_choice: "Multiple choice",
    fill: "Fill in the blank",
    short_answer: "Short answer",
    table_completion: "Table completion",
    tfng: "True / False / Not Given",
    matching: "Matching",
  };
  const typeColorMap = { mcq: C.accent, fill: C.gold, tfng: C.purple, matching: C.green };
  const typeColor = typeColorMap[type] || C.accent;
  const label = typeLabelMap[type] || "Question";
  const isFillType = ["fill", "short_answer", "table_completion"].includes(type);

  return (
    <div
      id={`listening-question-${question.id}`}
      className={`glass-card lm-fadeup scroll-mt-32 p-5 transition-shadow ${isActive ? "ring-2 ring-primary/20 shadow-md" : ""}`}
      onClick={onActivate}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: color }}
        >
          {questionNumber ?? index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          {question.instruction && (
            <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
              {question.instruction}
            </p>
          )}
          {!isFillType && (
            <p className="text-[15px] font-medium leading-relaxed text-foreground">{question.question_text}</p>
          )}
          <Badge color={typeColor}>{label}</Badge>
        </div>
      </div>

      {/* Input */}
      {(type === "mcq" || type === "multiple_choice") && (
        <MCQQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}
      {(type === "fill" || type === "short_answer" || type === "table_completion") && (
        <FillQuestion question={question} value={value} onChange={onChange} result={result} />
      )}
      {type === "tfng" && (
        <TFNGQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}
      {type === "matching" && (
        <MatchingQuestion question={question} value={value} onChange={onChange} result={result} />
      )}
      {!["mcq", "multiple_choice", "fill", "short_answer", "table_completion", "tfng", "matching"].includes(type) && (
        <FillQuestion question={question} value={value} onChange={onChange} result={result} />
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

function ListeningBottomNavigator({
  sections,
  answers,
  activeSection,
  setActiveSection,
  activeQuestionId,
  setActiveQuestionId,
  questionNumbers,
}) {
  const section = sections[activeSection];

  const goToQuestion = (sectionIndex, question) => {
    setActiveSection(sectionIndex);
    setActiveQuestionId(question.id);
    window.setTimeout(() => {
      document
        .getElementById(`listening-question-${question.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/90 shadow-[0_-12px_32px_rgba(15,23,42,0.10)] backdrop-blur-md">
      <div className="container mx-auto max-w-3xl px-4 py-3 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((sec, si) => {
            const answered = getSectionAnswered(sec, answers);
            const total = sec.questions.length;
            const isActive = si === activeSection;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveSection(si);
                  if (sec.questions[0]) goToQuestion(si, sec.questions[0]);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span>{getPartLabel(sec, si)}</span>
                <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${isActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {answered}/{total}
                </span>
              </button>
            );
          })}
        </div>

        {section && (
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {getPartLabel(section, activeSection)}
            </div>
            <div className="flex gap-2">
              {section.questions.map(question => {
                const answered = isAnswerComplete(question, answers[question.id]);
                const current = activeQuestionId === question.id;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goToQuestion(activeSection, question)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold transition ${
                      current
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : answered
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                    }`}
                    aria-label={`Question ${questionNumbers[question.id]} ${answered ? "answered" : "unanswered"}`}
                  >
                    {questionNumbers[question.id]}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto hidden shrink-0 items-center gap-3 text-xs text-muted-foreground md:flex">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full border border-border bg-background" /> Unanswered</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full border border-primary/20 bg-primary/10" /> Answered</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-primary" /> Current</span>
            </div>
          </div>
        )}
      </div>
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
          <div style={{ fontSize: 56, fontWeight: 600, color: bc, fontFamily: "monospace", lineHeight: 1 }}>
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
                    <span style={{ fontSize: 12, color: sc, fontFamily: "monospace" }}>
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
export default function ListeningModule({
  sessionId,
  onComplete,
  autoSubmitRef,
  formatted,
  isWarning,
  isDanger,
}) {
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

  // State
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState("test"); // "test" | "results"

  // Load test
  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      try {
        setTest(await api.getListeningForSession(sessionId));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  // Answer completion tracking
  const section = test?.sections[activeSection];
  const answeredInSection = section
    ? getSectionAnswered(section, answers)
    : 0;
  const totalAnswered = test
    ? test.sections.reduce((acc, s) => acc + getSectionAnswered(s, answers), 0)
    : 0;
  const totalQuestions = test
    ? test.sections.reduce((acc, s) => acc + s.questions.length, 0)
    : 0;

  // Build results map keyed by question_id for fast lookup
  const resultsMap = result
    ? Object.fromEntries(result.question_results.map(r => [r.question_id, r]))
    : null;

  const questionNumbers = {};
  if (test) {
    let questionNumber = 1;
    test.sections.forEach(sec => {
      sec.questions.forEach(q => {
        questionNumbers[q.id] = questionNumber;
        questionNumber += 1;
      });
    });
  }

  useEffect(() => {
    if (!section?.questions?.length) return;
    const currentInSection = section.questions.some(q => q.id === activeQuestionId);
    if (!currentInSection) setActiveQuestionId(section.questions[0].id);
  }, [activeQuestionId, section]);

  // Submit answers
  const handleSubmit = useCallback(async () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const data = await api.submitListening(test.id, answers);
      setResult(data);
      setView("results");
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [answers, onComplete, test]);

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
            onClick={() => { setView("test"); setResult(null); setAnswers({}); setActiveSection(0); setActiveQuestionId(null); }}>
            ← New attempt
          </button>
          <div style={{ fontSize: 22, fontWeight: 600 }}>Results</div>
          <Badge color={C.accent}>{test.title}</Badge>
        </div>

        <ResultsPanel result={result} />

        {/* Review answers per section */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Review your answers</div>
          {test.sections.map(sec => (
            <div key={sec.id} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Badge color={SECTION_COLORS[sec.section_number]}>Section {sec.section_number}</Badge>
                <span style={{ color: C.mutedLight, fontSize: 13 }}>{sec.title}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sec.questions.map((q, qi) => (
                  <Question key={q.id} question={q} answers={answers} setAnswers={() => {}}
                    results={resultsMap} color={SECTION_COLORS[sec.section_number]}
                    index={qi}
                    questionNumber={questionNumbers[q.id]} />
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
  const canSubmit = totalQuestions > 0 && totalAnswered >= totalQuestions;

  const goToAdjacentSection = (direction) => {
    setActiveSection(current => {
      const next = Math.min(Math.max(current + direction, 0), test.sections.length - 1);
      const nextQuestion = test.sections[next]?.questions?.[0];
      if (nextQuestion) {
        setActiveQuestionId(nextQuestion.id);
        window.setTimeout(() => {
          document
            .getElementById(`listening-question-${nextQuestion.id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      }
      return next;
    });
  };

  return (
    <div className="lm-root min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background text-foreground">
      <ListeningExamHeader
        testTitle={test.title}
        partLabel={`${getPartLabel(section, activeSection)} of ${test.sections.length}`}
        formatted={formatted}
        isWarning={isWarning}
        isDanger={isDanger}
        submitting={submitting}
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
        answered={totalAnswered}
        total={totalQuestions}
        partAnswered={answeredInSection}
        partTotal={section?.questions.length || 0}
      />

      <main className="mx-auto max-w-3xl px-4 pb-40 pt-4 md:px-6">
        {isWarning && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            isDanger ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            {isDanger
              ? "Less than 1 minute remaining. Finish and submit as soon as you can."
              : "Under 5 minutes left for Listening. Review unanswered questions."}
          </div>
        )}

        <div className="space-y-4">
          {section && <ListeningAudioBar section={section} />}

          {section && (
            <section className="lm-fadeup space-y-3" key={section.id}>
              <p className="text-sm text-muted-foreground">
                {getPartLabel(section, activeSection)}
                {section.title ? ` · ${section.title}` : ""}
              </p>

              <div className="space-y-3">
                {section.questions.map((q, qi) => (
                  <Question
                    key={q.id}
                    question={q}
                    answers={answers}
                    setAnswers={setAnswers}
                    results={null}
                    color={sectionColor}
                    index={qi}
                    questionNumber={questionNumbers[q.id]}
                    isActive={activeQuestionId === q.id}
                    onActivate={() => setActiveQuestionId(q.id)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={activeSection === 0}
                  onClick={() => goToAdjacentSection(-1)}
                  className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Part
                </button>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {getPartLabel(section, activeSection)} of {test.sections.length}
                </span>
                {activeSection < test.sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToAdjacentSection(1)}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  >
                    Next Part
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? <><Spinner /> Submitting...</> : <><Check className="h-4 w-4" /> Finish Test</>}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <ListeningBottomNavigator
        sections={test.sections}
        answers={answers}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        activeQuestionId={activeQuestionId}
        setActiveQuestionId={setActiveQuestionId}
        questionNumbers={questionNumbers}
      />
    </div>
  );
}