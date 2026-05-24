/**
 * ReadingModule.jsx — IELTS Reading (full-screen, matches screenshot design)
 *
 * Props:
 *   apiBase         — FastAPI URL
 *   getToken        — async () => Firebase ID token
 *   sessionId       — UUID
 *   onComplete      — called after submit
 *   autoSubmitRef   — optional ref wired by parent timer
 *   timerFormatted  — "59:08" string from parent timer
 *   timerWarning    — bool (< 5 min)
 *   timerDanger     — bool (< 1 min)
 *   onBack          — optional back navigation callback
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronLeft, Eye, Clock } from "lucide-react";

// ─── Design tokens (aligned with Listening exam / landing page) ───────────────
const PRIMARY       = "#0080ff";
const PRIMARY_HOVER = "#006bd6";
const PRIMARY_LIGHT   = "#e6f2ff";
const PRIMARY_MUTED   = "#bfdbfe";
const ACCENT          = PRIMARY;
const ACCENT_BG       = PRIMARY_LIGHT;
const PAGE_BG         = "#F8FAFC";
const BORDER          = "#E2E8F0";
const SURFACE         = "#FFFFFF";
const SURFACE_ALT     = "#F1F5F9";
const MUTED           = "#64748B";
const MUTED_LIGHT     = "#94A3B8";
const TEXT            = "#0F172A";
const TEXT_SUB        = "#475569";
const GREEN           = "#059669";
const GREEN_BG        = "#ECFDF5";
const RED             = "#DC2626";
const RED_BG          = "#FEF2F2";
const GOLD            = "#d97706";
const GOLD_BG         = "#fffbeb";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap');
  .rm * { box-sizing: border-box; }
  .rm { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: ${TEXT}; background: ${PAGE_BG}; height: 100vh; overflow: hidden; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
  .rm ::-webkit-scrollbar { width: 5px; height: 5px; }
  .rm ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
  .rm ::-webkit-scrollbar-track { background: transparent; }

  /* Exam top bar */
  .rm-exam-topbar { flex-shrink: 0; background: ${SURFACE}; border-bottom: 1px solid ${BORDER}; }
  .rm-exam-topbar-inner {
    padding: 0 16px; height: 60px;
    display: flex; align-items: center; gap: 10px; flex-wrap: nowrap;
  }
  .rm-exam-brand { font-size: 15px; font-weight: 700; flex-shrink: 0; white-space: nowrap; letter-spacing: -0.02em; }
  .rm-exam-brand-ielts { color: ${PRIMARY}; }
  .rm-exam-brand-anywhere { color: ${TEXT}; }
  .rm-exam-brand-sep { width: 1px; height: 20px; background: ${BORDER}; flex-shrink: 0; }
  .rm-exam-back {
    border: none; background: none; cursor: pointer; color: ${MUTED};
    padding: 6px; border-radius: 8px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    transition: color .15s, background .15s;
  }
  .rm-exam-back:hover { color: ${TEXT}; background: ${SURFACE_ALT}; }
  .rm-exam-timer {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums;
    flex-shrink: 0; min-width: 72px;
  }
  .rm-exam-spacer { flex: 1; min-width: 8px; }
  .rm-exam-answered {
    font-size: 12px; font-weight: 600; color: ${PRIMARY};
    background: ${PRIMARY_LIGHT}; border: 1px solid ${PRIMARY_MUTED};
    border-radius: 999px; padding: 5px 11px; white-space: nowrap; flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .rm-exam-answered-short { display: none; }
  .rm-btn-finish {
    background: ${PRIMARY}; color: #fff; border: none; border-radius: 999px;
    padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    white-space: nowrap; flex-shrink: 0; transition: background .15s, opacity .15s;
  }
  .rm-btn-finish:hover:not(:disabled) { background: ${PRIMARY_HOVER}; }
  .rm-btn-finish:disabled { opacity: 0.65; cursor: default; }
  .rm-exam-context {
    border-top: 1px solid ${BORDER}; background: ${SURFACE};
    padding: 9px 20px; font-size: 13px; font-weight: 500; color: ${TEXT_SUB};
  }

  /* Body */
  .rm-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; }
  .rm-passage-pane {
    border-right: 1px solid ${BORDER}; overflow-y: auto; height: 100%;
    background: ${SURFACE}; transition: background .25s ease, color .25s ease;
  }
  .rm-passage-pane.warm { background: #F5E6D0; }
  .rm-passage-pane.warm .rm-passage-text { color: #4A3F35; }
  .rm-passage-pane.warm .rm-passage-inner h2 { color: #3D3429; }
  .rm-passage-pane.warm .rm-para-label { color: #B45309; }
  .rm-passage-pane.warm .rm-passage-toolbar { border-bottom-color: #E8D5BC; }
  .rm-passage-toolbar {
    position: sticky; top: 0; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px; border-bottom: 1px solid ${BORDER};
    background: inherit; backdrop-filter: blur(4px);
  }
  .rm-passage-toolbar-label { font-size: 11px; font-weight: 600; color: ${MUTED}; text-transform: uppercase; letter-spacing: 0.06em; }
  .rm-warm-toggle {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${BORDER};
    background: ${SURFACE}; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: ${MUTED}; transition: all .15s; flex-shrink: 0;
  }
  .rm-warm-toggle:hover { color: ${PRIMARY}; border-color: ${PRIMARY_MUTED}; background: ${PRIMARY_LIGHT}; }
  .rm-warm-toggle.active { color: ${PRIMARY}; background: ${PRIMARY_LIGHT}; border-color: ${PRIMARY}; box-shadow: 0 0 0 2px ${PRIMARY_MUTED}; }
  .rm-passage-pane.warm .rm-warm-toggle { background: #FBF0E4; border-color: #E8D5BC; }
  .rm-questions-pane { overflow-y: auto; height: 100%; padding: 20px 22px 32px; background: ${PAGE_BG}; }

  /* Bottom nav */
  .rm-bottom { height: 52px; border-top: 1px solid ${BORDER}; display: flex; align-items: center; padding: 0 16px; gap: 2px; overflow-x: auto; flex-shrink: 0; background: ${SURFACE}; }
  .rm-bottom::-webkit-scrollbar { height: 0; }
  .rm-part-tab { padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid ${BORDER}; background: ${SURFACE}; color: ${MUTED}; transition: all .15s; white-space: nowrap; }
  .rm-part-tab.active { background: ${PRIMARY}; border-color: ${PRIMARY}; color: #fff; }
  .rm-part-tab:hover:not(.active) { background: ${SURFACE_ALT}; }
  .rm-q-dot { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid ${BORDER}; background: ${SURFACE}; font-size: 11px; font-weight: 700; cursor: pointer; color: ${MUTED_LIGHT}; display: flex; align-items: center; justify-content: center; transition: all .12s; flex-shrink: 0; }
  .rm-q-dot.answered { background: ${PRIMARY_LIGHT}; border-color: ${PRIMARY_MUTED}; color: ${PRIMARY}; }
  .rm-q-dot:hover:not(.answered) { border-color: ${PRIMARY}; color: ${PRIMARY}; }
  .rm-q-count { font-size: 12px; color: ${MUTED}; padding: 0 6px; white-space: nowrap; font-weight: 500; }
  .rm-sep { width: 1px; height: 20px; background: ${BORDER}; margin: 0 6px; flex-shrink: 0; }

  /* Passage */
  .rm-passage-inner { padding: 20px 28px 28px; max-width: 700px; }
  .rm-passage-text { font-family: 'Lora', Georgia, serif; font-size: 14.5px; line-height: 1.9; color: ${TEXT_SUB}; transition: color .25s ease; }
  .rm-passage-text p { margin-bottom: 0.9rem; }
  .rm-para-label { font-weight: 700; color: ${PRIMARY}; font-family: -apple-system, sans-serif; font-size: 13px; margin-right: 6px; }

  /* Group box */
  .rm-group { border: 1px solid ${BORDER}; border-radius: 12px; margin-bottom: 18px; overflow: hidden; background: ${SURFACE}; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
  .rm-group-header { font-size: 13.5px; font-weight: 700; color: ${PRIMARY}; padding: 10px 16px; background: ${SURFACE}; border-bottom: 1px solid ${BORDER}; }
  .rm-group-instr { padding: 8px 16px 10px; font-size: 12px; color: ${MUTED}; line-height: 1.65; white-space: pre-line; background: ${SURFACE_ALT}; border-bottom: 1px solid ${BORDER}; }

  /* Form completion (fill/short_answer) */
  .rm-form-title { padding: 8px 16px; font-size: 13px; font-weight: 600; color: ${TEXT}; background: ${SURFACE}; border-bottom: 1px solid ${BORDER}; }
  .rm-form-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
  .rm-form-sentence { font-size: 13.5px; line-height: 2.1; }

  /* Inline question number badge */
  .rm-qbadge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: ${ACCENT}; color: #fff; font-size: 10px; font-weight: 700; vertical-align: middle; margin: 0 4px; flex-shrink: 0; }
  .rm-qbadge.correct { background: ${GREEN}; }
  .rm-qbadge.wrong   { background: ${RED}; }

  /* Blank input */
  .rm-blank { border: 1.5px solid #d1d5db; border-radius: 6px; padding: 3px 10px; font-size: 13px; font-family: inherit; background: #f9fafb; vertical-align: middle; display: inline-block; outline: none; transition: border-color .12s, background .12s; }
  .rm-blank:focus { border-color: ${ACCENT}; background: ${SURFACE}; }
  .rm-blank:disabled { cursor: default; opacity: .75; }
  .rm-blank.correct { border-color: ${GREEN}; background: ${GREEN_BG}; }
  .rm-blank.wrong   { border-color: ${RED};   background: ${RED_BG}; }

  /* Standalone text input (non-inline fill) */
  .rm-input-full { width: 100%; padding: 8px 12px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 13.5px; font-family: inherit; color: ${TEXT}; background: ${SURFACE}; outline: none; transition: border-color .12s; }
  .rm-input-full:focus { border-color: ${ACCENT}; }
  .rm-input-full.correct { border-color: ${GREEN}; background: ${GREEN_BG}; }
  .rm-input-full.wrong   { border-color: ${RED};   background: ${RED_BG}; }

  /* MCQ / TFNG */
  .rm-mcq-item { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
  .rm-mcq-item:last-child { border-bottom: none; }
  .rm-mcq-q { font-size: 13.5px; color: ${TEXT}; line-height: 1.55; margin-bottom: 10px; }
  .rm-mcq-opts { display: flex; flex-direction: column; gap: 5px; }
  .rm-opt { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 7px; cursor: pointer; user-select: none; transition: background .1s; }
  .rm-opt:hover:not(.rm-opt-dis) { background: #f3f4f6; }
  .rm-opt.rm-opt-sel  { background: ${ACCENT_BG}; }
  .rm-opt.rm-opt-ok   { background: ${GREEN_BG}; cursor: default; }
  .rm-opt.rm-opt-bad  { background: ${RED_BG};   cursor: default; }
  .rm-opt.rm-opt-dis  { cursor: default; }
  .rm-letter { min-width: 18px; font-size: 13px; font-weight: 600; color: ${TEXT_SUB}; }
  .rm-radio { width: 17px; height: 17px; border-radius: 50%; border: 1.5px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rm-radio.sel { border-color: ${ACCENT}; background: ${ACCENT}; }
  .rm-radio.ok  { border-color: ${GREEN};  background: ${GREEN}; }
  .rm-radio.bad { border-color: ${RED};    background: ${RED}; }
  .rm-radio-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; }
  .rm-opt-text { font-size: 13px; color: ${TEXT}; line-height: 1.45; flex: 1; }

  /* TFNG */
  .rm-tfng-opts { display: flex; gap: 7px; flex-wrap: wrap; }
  .rm-tfng-btn { padding: 6px 14px; border-radius: 7px; font-size: 12.5px; font-weight: 500; cursor: pointer; border: 1.5px solid ${BORDER}; background: ${SURFACE}; color: ${TEXT}; transition: all .12s; }
  .rm-tfng-btn:hover:not(:disabled) { border-color: ${ACCENT}; color: ${ACCENT}; }
  .rm-tfng-btn.sel { background: ${ACCENT_BG}; border-color: ${ACCENT}66; color: ${ACCENT}; }
  .rm-tfng-btn.ok  { background: ${GREEN_BG}; border-color: ${GREEN}55; color: ${GREEN}; }
  .rm-tfng-btn.bad { background: ${RED_BG};   border-color: ${RED}55;   color: ${RED}; }

  /* Matching */
  .rm-match-select { padding: 7px 10px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 13px; font-family: inherit; color: ${TEXT}; background: ${SURFACE}; cursor: pointer; width: 100%; }
  .rm-match-select:focus { outline: none; border-color: ${ACCENT}; }
  .rm-match-select.correct { border-color: ${GREEN}; background: ${GREEN_BG}; }
  .rm-match-select.wrong   { border-color: ${RED};   background: ${RED_BG}; }
  .rm-match-grid { display: flex; gap: 6px; flex-wrap: wrap; }
  .rm-match-pill { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid ${BORDER}; background: ${SURFACE}; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .12s; flex-shrink: 0; }
  .rm-match-pill:hover:not(:disabled) { border-color: ${ACCENT}; color: ${ACCENT}; }
  .rm-match-pill.sel { background: ${ACCENT_BG}; border-color: ${ACCENT}66; color: ${ACCENT}; }
  .rm-match-pill.ok  { background: ${GREEN_BG}; border-color: ${GREEN}55; color: ${GREEN}; }
  .rm-match-pill.bad { background: ${RED_BG};   border-color: ${RED}55;   color: ${RED}; }
  .rm-match-names { display: flex; flex-direction: column; gap: 5px; width: 100%; }
  .rm-match-name-btn {
    width: 100%; padding: 8px 12px; border-radius: 8px;
    border: 1.5px solid ${BORDER}; background: ${SURFACE};
    font-size: 13px; font-weight: 500; cursor: pointer;
    text-align: left; color: ${TEXT}; line-height: 1.4;
    transition: background .12s, border-color .12s, color .12s;
  }
  .rm-match-name-btn:hover:not(:disabled) { border-color: ${ACCENT}; background: ${SURFACE_ALT}; }
  .rm-match-name-btn.sel { background: ${ACCENT_BG}; border-color: ${ACCENT}66; color: ${ACCENT}; }
  .rm-match-name-btn.ok  { background: ${GREEN_BG}; border-color: ${GREEN}55; color: ${GREEN}; cursor: default; }
  .rm-match-name-btn.bad { background: ${RED_BG};   border-color: ${RED}55;   color: ${RED};   cursor: default; }

  /* Heading options */
  .rm-headings-box { background: ${GOLD_BG}; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
  .rm-headings-title { font-size: 11px; font-weight: 700; color: ${GOLD}; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 6px; }
  .rm-heading-row { font-size: 13px; color: ${TEXT}; margin-bottom: 3px; }

  /* Multiple select */
  .rm-checkbox { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rm-checkbox.sel { border-color: ${ACCENT}; background: ${ACCENT}; }
  .rm-checkbox.ok  { border-color: ${GREEN};  background: ${GREEN}; }
  .rm-checkbox.bad { border-color: ${RED};    background: ${RED}; }

  /* Tip */
  .rm-tip { padding: 8px 12px; background: ${GOLD_BG}; border: 1px solid #fde68a; border-radius: 7px; font-size: 12px; color: #78350f; line-height: 1.55; margin-top: 8px; }

  /* Correct hint */
  .rm-correct-hint { font-size: 11.5px; color: ${MUTED}; margin-top: 6px; }
  .rm-correct-hint strong { color: ${GREEN}; }

  /* Loading / error */
  .rm-center { display: flex; align-items: center; justify-content: center; flex: 1; }
  @keyframes rm-spin { to { transform: rotate(360deg); } }
  .rm-spinner { width: 20px; height: 20px; border: 2.5px solid ${BORDER}; border-top-color: ${ACCENT}; border-radius: 50%; animation: rm-spin .7s linear infinite; }

  /* Results */
  .rm-results { flex: 1; overflow-y: auto; padding: 28px 40px; max-width: 900px; margin: 0 auto; width: 100%; }
  .rm-band-card { background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
  .rm-review-split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .rm-review-pane { border: 1px solid ${BORDER}; border-radius: 10px; overflow-y: auto; max-height: 520px; }
  @media (max-width: 640px) {
    .rm-exam-topbar-inner { gap: 6px; padding: 0 10px; height: 56px; }
    .rm-exam-brand { font-size: 13px; }
    .rm-exam-brand-sep { display: none; }
    .rm-exam-answered-long { display: none; }
    .rm-exam-answered-short { display: inline; }
    .rm-btn-finish { padding: 7px 11px; font-size: 12px; }
  }
`;

function injectCSS() {
  const id = "rm-css";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id; el.textContent = CSS;
    document.head.appendChild(el);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function normalizeOptions(options) {
  if (!options || !options.length) return [];
  return options.map((o, i) => (typeof o === "string" ? { order: i + 1, option: o } : o));
}

function correctStr(ca) {
  if (Array.isArray(ca)) return ca[0] ?? "";
  return String(ca ?? "");
}

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return <div className="rm-spinner" />;
}

function ReadingExamTopBar({
  partLabel, onBack, onSubmit, submitting,
  totalAnswered, totalQuestions,
  timerFormatted, timerWarning, timerDanger,
}) {
  const timerColor = timerDanger ? RED : timerWarning ? GOLD : MUTED;

  return (
    <header className="rm-exam-topbar">
      <div className="rm-exam-topbar-inner">
        <span className="rm-exam-brand" aria-label="IELTSAnywhere">
          <span className="rm-exam-brand-ielts">IELTS</span>
          <span className="rm-exam-brand-anywhere">Anywhere</span>
        </span>

        <span className="rm-exam-brand-sep" aria-hidden="true" />

        <button type="button" className="rm-exam-back" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        <span className="rm-exam-timer" style={{ color: timerColor }}>
          <Clock size={15} strokeWidth={2} />
          {timerFormatted || "--:--"}
        </span>

        <span className="rm-exam-spacer" />

        <span className="rm-exam-answered" aria-live="polite">
          <span className="rm-exam-answered-long">{totalAnswered}/{totalQuestions} answered</span>
          <span className="rm-exam-answered-short">{totalAnswered}/{totalQuestions}</span>
        </span>

        <button
          type="button"
          className="rm-btn-finish"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Finish Test"}
        </button>
      </div>

      {partLabel && (
        <div className="rm-exam-context">{partLabel}</div>
      )}
    </header>
  );
}

function QBadge({ n, result }) {
  const cls = result ? (result.is_correct ? "correct" : "wrong") : "";
  return <span className={`rm-qbadge ${cls}`}>{n}</span>;
}

// Passage renderer
function Passage({ passage }) {
  const hasParagraphs = passage.paragraphs?.length > 0;
  return (
    <div className="rm-passage-inner">
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, fontFamily: "'Lora', Georgia, serif" }}>
        {passage.title}
      </h2>
      <div className="rm-passage-text">
        {hasParagraphs
          ? passage.paragraphs.map((para, i) => {
              const m = para.match(/^([A-Z])\s{2}/);
              const label = m ? m[1] : null;
              const text = m ? para.slice(m[0].length) : para;
              return (
                <p key={i}>
                  {label && <span className="rm-para-label">{label}</span>}
                  {text}
                </p>
              );
            })
          : passage.body.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para.replace(/\n/g, " ")}</p>
            ))
        }
      </div>
    </div>
  );
}

// Inline sentence fill (question_text contains </blank>)
function InlineSentence({ question, qNumber, value, onChange, result, disabled }) {
  const parts = (question.question_text || "").split("</blank>");
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;
  const blankCls = result ? (isCorrect ? "correct" : "wrong") : "";
  const badgeCls = result ? (isCorrect ? "correct" : "wrong") : "";

  return (
    <div className="rm-form-sentence">
      {parts.map((part, i) => (
        <span key={i}>
          <span>{part}</span>
          {i < parts.length - 1 && (
            <>
              <span className={`rm-qbadge ${badgeCls}`}>{qNumber}</span>
              <input
                className={`rm-blank ${blankCls}`}
                style={{ width: 140 }}
                value={value || ""}
                disabled={disabled || !!result}
                onChange={e => !result && onChange(e.target.value)}
                placeholder=""
              />
              {isWrong && (
                <span style={{ fontSize: 11.5, color: MUTED, marginLeft: 4 }}>
                  → <strong style={{ color: GREEN }}>{correctStr(result.correct_answer)}</strong>
                </span>
              )}
            </>
          )}
        </span>
      ))}
    </div>
  );
}

// MCQ option row (A ○ text)
function MCQOpt({ letter, text, selected, isCorrect, isWrong, onClick, disabled }) {
  let cls = "rm-opt";
  if (isCorrect) cls += " rm-opt-ok";
  else if (isWrong) cls += " rm-opt-bad";
  else if (selected) cls += " rm-opt-sel";
  if (disabled) cls += " rm-opt-dis";

  const radioCls = isCorrect ? "ok" : isWrong ? "bad" : selected ? "sel" : "";

  return (
    <div className={cls} onClick={!disabled ? onClick : undefined}>
      <span className="rm-letter">{letter}</span>
      <span className={`rm-radio ${radioCls}`}>
        {(selected || isCorrect || isWrong) && <span className="rm-radio-dot" />}
      </span>
      <span className="rm-opt-text">{text}</span>
      {isCorrect && <span style={{ fontSize: 11, color: GREEN, marginLeft: "auto" }}>✓</span>}
      {isWrong && <span style={{ fontSize: 11, color: RED, marginLeft: "auto" }}>✗</span>}
    </div>
  );
}

// Renders one MCQ question (number + text + options)
function MCQItem({ question, qNumber, qNumberLabel, value, onChange, result, groupType, group }) {
  const opts = normalizeOptions(question.options);
  const isCathoven = opts.length > 0 && typeof question.options?.[0] === "object";
  const ca = result?.correct_answer;
  const isMultiSel = groupType === "multiple_select";
  const displayNum = qNumberLabel ?? String(qNumber);

  // Multi-select uses checkboxes
  if (isMultiSel) {
    const selected = Array.isArray(value) ? value : [];
    const caArr = Array.isArray(ca) ? ca : [];
    const caNorm = caArr.map(s => String(s).toLowerCase().trim());
    const max = Number(question.max_selected_options ?? group?.max_selected_options) || 2;
    const toggle = (opt) => {
      if (result) return;
      const next = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : selected.length >= max
          ? selected
          : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="rm-mcq-item" data-qid={question.id}>
        <div className="rm-mcq-q">
          <strong style={{ color: ACCENT }}>{displayNum}.</strong>{" "}
          {question.question_text}
        </div>
        <div className="rm-mcq-opts">
          {opts.map((opt, oi) => {
            const isSel = selected.includes(opt.option);
            const isC = result && caNorm.includes(opt.option.toLowerCase().trim());
            const isW = result && isSel && !isC;
            let cls = "rm-opt";
            if (isC) cls += " rm-opt-ok";
            else if (isW) cls += " rm-opt-bad";
            else if (isSel) cls += " rm-opt-sel";
            if (result) cls += " rm-opt-dis";
            const cbCls = isC ? "ok" : isW ? "bad" : isSel ? "sel" : "";
            const optIsLetter = opt.option === LETTERS[oi];
            return (
              <div key={oi} className={cls} onClick={() => toggle(opt.option)}>
                {!optIsLetter && <span className="rm-letter">{LETTERS[oi]}</span>}
                <span className={`rm-checkbox ${cbCls}`}>
                  {(isSel || isC || isW) && <span style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />}
                </span>
                <span className="rm-opt-text">{opt.option}</span>
              </div>
            );
          })}
        </div>
        {result && !result.is_correct && (
          <div className="rm-correct-hint">Correct: <strong>{caArr.join(", ")}</strong></div>
        )}
        {result && !result.is_correct && result.tip && (
          <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
        )}
      </div>
    );
  }

  return (
    <div className="rm-mcq-item" data-qid={question.id}>
      <div className="rm-mcq-q">
        <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
        {question.question_text}
      </div>
      <div className="rm-mcq-opts">
        {opts.map((opt, oi) => {
          const selected = isCathoven ? value === opt.option : value === oi;
          const isC = result && (isCathoven
            ? opt.option.toLowerCase() === correctStr(ca).toLowerCase()
            : oi === Number(ca));
          const isW = result && selected && !result.is_correct;
          return (
            <MCQOpt
              key={oi}
              letter={LETTERS[oi]}
              text={opt.option}
              selected={selected}
              isCorrect={isC}
              isWrong={isW}
              disabled={!!result}
              onClick={() => !result && onChange(isCathoven ? opt.option : oi)}
            />
          );
        })}
      </div>
      {result && !result.is_correct && (
        <div className="rm-correct-hint">Correct: <strong>{correctStr(ca)}</strong></div>
      )}
      {result && !result.is_correct && result.tip && (
        <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
      )}
    </div>
  );
}

// TFNG item
function TFNGItem({ question, qNumber, value, onChange, result }) {
  const rawOpts = normalizeOptions(question.options);
  const opts = rawOpts.length > 0
    ? rawOpts.map(o => o.option)
    : ["True", "False", "Not Given"];
  const isCathoven = rawOpts.length > 0;
  const ca = result?.correct_answer;

  return (
    <div className="rm-mcq-item" data-qid={question.id}>
      <div className="rm-mcq-q">
        <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
        {question.question_text}
      </div>
      <div className="rm-tfng-opts">
        {opts.map((opt, oi) => {
          const selected = isCathoven ? value === opt : value === oi;
          const caVal = isCathoven ? correctStr(ca) : Number(ca);
          const isC = result && (isCathoven
            ? opt.toUpperCase() === caVal.toString().toUpperCase()
            : oi === caVal);
          const isW = result && selected && !result.is_correct;
          const cls = isC ? "ok" : isW ? "bad" : selected ? "sel" : "";
          return (
            <button key={oi} className={`rm-tfng-btn ${cls}`}
              disabled={!!result}
              onClick={() => !result && onChange(isCathoven ? opt : oi)}>
              {opt}
            </button>
          );
        })}
      </div>
      {result && !result.is_correct && (
        <div className="rm-correct-hint">Correct: <strong>{correctStr(ca)}</strong></div>
      )}
      {result && !result.is_correct && result.tip && (
        <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
      )}
    </div>
  );
}

// Matching headings item
function MatchingHeadingsItem({ question, qNumber, groupData, value, onChange, result }) {
  const legacyH = groupData.heading_options || [];
  const cathovenOpts = normalizeOptions(question.options);
  const useCathoven = cathovenOpts.length > 0 && !legacyH.length;
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;

  return (
    <div className="rm-mcq-item" data-qid={question.id}>
      <div className="rm-mcq-q">
        <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
        {question.question_text}
      </div>
      <select
        className={`rm-match-select ${result ? (isCorrect ? "correct" : "wrong") : ""}`}
        value={value || ""}
        disabled={!!result}
        onChange={e => !result && onChange(e.target.value)}
      >
        <option value="">— Select heading —</option>
        {useCathoven
          ? cathovenOpts.map((o, i) => <option key={i} value={o.option}>{o.option}</option>)
          : legacyH.map((h, i) => <option key={i} value={h.split(/\s+/)[0].toLowerCase()}>{h}</option>)
        }
      </select>
      {isWrong && (
        <div className="rm-correct-hint">Correct: <strong>{correctStr(result.correct_answer)}</strong></div>
      )}
      {isWrong && result.tip && (
        <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
      )}
    </div>
  );
}

// Matching info item
function MatchingInfoItem({ question, qNumber, groupData, value, onChange, result }) {
  const cathovenOpts = normalizeOptions(question.options);
  const labels = cathovenOpts.length > 0
    ? cathovenOpts.map(o => o.option)
    : (groupData.paragraph_labels || ["A", "B", "C", "D", "E"]);
  const isLetterLabels = labels.every(l => String(l).trim().length <= 2);
  const isCorrect = result?.is_correct;
  const ca = correctStr(result?.correct_answer);

  return (
    <div className="rm-mcq-item" data-qid={question.id}>
      <div className="rm-mcq-q">
        <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
        {question.question_text}
      </div>
      <div className={isLetterLabels ? "rm-match-grid" : "rm-match-names"}>
        {labels.map(label => {
          const selected = value === label;
          const isC = result && label.toUpperCase() === ca.toUpperCase();
          const isW = result && selected && !result.is_correct;
          const cls = isC ? "ok" : isW ? "bad" : selected ? "sel" : "";
          const btnCls = isLetterLabels ? "rm-match-pill" : "rm-match-name-btn";
          return (
            <button key={label} className={`${btnCls} ${cls}`}
              disabled={!!result}
              onClick={() => !result && onChange(label)}>
              {label}
            </button>
          );
        })}
      </div>
      {result && !result.is_correct && (
        <div className="rm-correct-hint">Correct: <strong>{ca}</strong></div>
      )}
      {result && !result.is_correct && result.tip && (
        <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
      )}
    </div>
  );
}

// Short answer / plain fill item (no </blank> in question_text)
function PlainFillItem({ question, qNumber, value, onChange, result }) {
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;

  return (
    <div className="rm-mcq-item" data-qid={question.id}>
      <div className="rm-mcq-q">
        <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
        {question.question_text}
      </div>
      <input
        className={`rm-input-full ${result ? (isCorrect ? "correct" : "wrong") : ""}`}
        value={value || ""}
        disabled={!!result}
        onChange={e => !result && onChange(e.target.value)}
        placeholder="Write your answer…"
      />
      {isWrong && (
        <div className="rm-correct-hint">Correct: <strong>{correctStr(result.correct_answer)}</strong></div>
      )}
      {isWrong && result.tip && (
        <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
      )}
    </div>
  );
}

// ─── IELTS answer-slot helpers (Reading) ─────────────────────────────────────
function getReadingQuestionSlotCount(question, group) {
  const qType = group?.question_type ?? question?.question_type;
  if (qType === "multiple_select") {
    const max = Number(question?.max_selected_options ?? group?.max_selected_options);
    if (max > 1) return max;
  }
  return 1;
}

function getGroupSlotCount(group) {
  return (group?.questions ?? []).reduce(
    (sum, q) => sum + getReadingQuestionSlotCount(q, group),
    0
  );
}

function getReadingNumbering(test) {
  const questionNumberStartById = {};
  const questionNumberEndById = {};
  const questionNumberLabelById = {};
  const questionSlotNumbersById = {};
  let number = 1;

  for (const passage of test?.passages ?? []) {
    for (const group of passage.question_groups ?? []) {
      for (const q of group.questions ?? []) {
        const slotCount = getReadingQuestionSlotCount(q, group);
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

function isAnswerComplete(question, group, answer) {
  if ((group?.question_type ?? question?.question_type) === "multiple_select") {
    const expected = Number(question?.max_selected_options ?? group?.max_selected_options) || 1;
    const selected = Array.isArray(answer) ? answer.length : 0;
    return selected >= expected;
  }
  if (Array.isArray(answer)) return answer.length > 0;
  return answer !== undefined && answer !== "";
}

function getAnsweredSlotCount(question, group, answer) {
  if ((group?.question_type ?? question?.question_type) === "multiple_select") {
    const expected = Number(question?.max_selected_options ?? group?.max_selected_options) || 1;
    const selectedCount = Array.isArray(answer) ? answer.length : 0;
    return Math.min(selectedCount, expected);
  }
  return isAnswerComplete(question, group, answer) ? 1 : 0;
}

function passageSlotCount(passage) {
  return (passage?.question_groups ?? []).reduce((sum, g) => sum + getGroupSlotCount(g), 0);
}

function passageAnsweredSlots(passage, answers) {
  return (passage?.question_groups ?? []).reduce(
    (sum, g) => sum + (g.questions ?? []).reduce(
      (qSum, q) => qSum + getAnsweredSlotCount(q, g, answers[String(q.id)]),
      0
    ),
    0
  );
}

function buildPassageNavSlots(passage, numbering) {
  const slots = [];
  for (const group of passage?.question_groups ?? []) {
    for (const question of group.questions ?? []) {
      const slotNumbers = numbering.questionSlotNumbersById[question.id] ?? [];
      slotNumbers.forEach((num, slotIndex) => {
        slots.push({ question, group, questionId: question.id, number: num, slotIndex });
      });
    }
  }
  return slots;
}

// ─── Question Group ───────────────────────────────────────────────────────────
function QuestionGroup({ group, qOffset, numbering, answers, setAnswers, resultMap, submitted }) {
  const qt = group.question_type;
  const groupSlots = getGroupSlotCount(group);
  const firstQ = qOffset + 1;
  const lastQ = qOffset + groupSlots;
  const rangeLabel = groupSlots === 1
    ? `Question ${firstQ}`
    : `Questions ${firstQ}–${lastQ}`;

  const onChange = useCallback((qid, val) => {
    if (!submitted) setAnswers(a => ({ ...a, [qid]: val }));
  }, [submitted, setAnswers]);

  const isFormStyle = (qt === "fill" || qt === "short_answer") &&
    group.questions.some(q => (q.question_text || "").includes("</blank>"));

  return (
    <div className="rm-group">
      <div className="rm-group-header">{rangeLabel}</div>

      {group.instruction && (
        <div className="rm-group-instr">{group.instruction}</div>
      )}

      {/* Heading options list */}
      {qt === "matching_headings" && group.heading_options?.length > 0 && (
        <div style={{ padding: "10px 16px", borderBottom: `1px solid #f3f4f6` }}>
          <div className="rm-headings-box">
            <div className="rm-headings-title">List of headings</div>
            {group.heading_options.map((h, i) => (
              <div key={i} className="rm-heading-row">{h}</div>
            ))}
          </div>
        </div>
      )}

      {/* Form-style fill questions */}
      {isFormStyle ? (
        <>
          {group.title && <div className="rm-form-title">{group.title}</div>}
          <div className="rm-form-body">
            {group.questions.map((q, qi) => {
              const qid = String(q.id);
              const qNum = numbering?.questionNumberStartById[q.id] ?? (qOffset + qi + 1);
              const qNumLabel = numbering?.questionNumberLabelById[q.id] ?? String(qNum);
              const value = answers[qid];
              const result = resultMap?.[qid];
              const hasBlank = (q.question_text || "").includes("</blank>");
              if (hasBlank) {
                return (
                  <div key={q.id} data-qid={q.id}>
                    <InlineSentence
                      question={q}
                      qNumber={qNum}
                      value={value}
                      onChange={val => onChange(qid, val)}
                      result={result}
                      disabled={submitted}
                    />
                    {result && !result.is_correct && result.tip && (
                      <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
                    )}
                  </div>
                );
              }
              // No blank marker — show as plain fill inside the form box
              return (
                <div key={q.id} data-qid={q.id} style={{ marginBottom: 10 }}>
                  <div className="rm-form-sentence">
                    <span className={`rm-qbadge ${result ? (result.is_correct ? "correct" : "wrong") : ""}`}>{qNum}</span>
                    {" "}{q.question_text}
                  </div>
                  <input
                    className={`rm-blank ${result ? (result.is_correct ? "correct" : "wrong") : ""}`}
                    style={{ width: "100%", marginTop: 4 }}
                    value={value || ""}
                    disabled={submitted || !!result}
                    onChange={e => onChange(qid, e.target.value)}
                    placeholder=""
                  />
                  {result && !result.is_correct && (
                    <div className="rm-correct-hint">Correct: <strong>{correctStr(result.correct_answer)}</strong></div>
                  )}
                  {result && !result.is_correct && result.tip && (
                    <div className="rm-tip"><strong>Tip:</strong> {result.tip}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Card-style questions (MCQ, TFNG, matching, plain fill) */
        <>
          {group.title && (
            <div style={{ padding: "8px 16px", fontWeight: 600, fontSize: 13, borderBottom: `1px solid #f3f4f6` }}>
              {group.title}
            </div>
          )}
          {group.questions.map((q, qi) => {
            const qid = String(q.id);
            const qNum = numbering?.questionNumberStartById[q.id] ?? (qOffset + qi + 1);
            const qNumLabel = numbering?.questionNumberLabelById[q.id] ?? String(qNum);
            const value = answers[qid];
            const result = resultMap?.[qid];
            const cb = val => onChange(qid, val);

            if (qt === "mcq" || qt === "multiple_select") {
              return (
                <MCQItem
                  key={q.id}
                  question={q}
                  qNumber={qNum}
                  qNumberLabel={qNumLabel}
                  value={value}
                  onChange={cb}
                  result={result}
                  groupType={qt}
                  group={group}
                />
              );
            }
            if (qt === "tfng") {
              return <TFNGItem key={q.id} question={q} qNumber={qNum} value={value} onChange={cb} result={result} />;
            }
            if (qt === "matching_headings") {
              return <MatchingHeadingsItem key={q.id} question={q} qNumber={qNum} groupData={group} value={value} onChange={cb} result={result} />;
            }
            if (qt === "matching_info") {
              return <MatchingInfoItem key={q.id} question={q} qNumber={qNum} groupData={group} value={value} onChange={cb} result={result} />;
            }
            // fill or short_answer without </blank>
            return <PlainFillItem key={q.id} question={q} qNumber={qNum} value={value} onChange={cb} result={result} />;
          })}
        </>
      )}
    </div>
  );
}

// ─── Answer key item ─────────────────────────────────────────────────────────
function AnswerKeyItem({ num, qResult }) {
  const isCorrect = qResult?.is_correct;
  const answer = formatAnswer(qResult?.correct_answer);
  const numBg = isCorrect ? GREEN : PRIMARY;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", minWidth: 0 }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%", background: numBg,
        color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{num}</span>
      <span style={{ fontSize: 13, color: TEXT, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {answer}
      </span>
      <span style={{ color: MUTED_LIGHT, fontSize: 12, flexShrink: 0 }}>—</span>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        background: isCorrect ? GREEN : RED,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 10, fontWeight: 700,
      }}>{isCorrect ? "✓" : "✗"}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReadingModule({
  apiBase, getToken, sessionId, testId, onComplete, autoSubmitRef,
  timerFormatted, timerWarning, timerDanger, onBack,
  initialResult,
}) {
  useEffect(injectCSS, []);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePassage, setActivePassage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(initialResult ?? null);
  const [view, setView] = useState(initialResult ? "results" : "test");
  const [warmPassage, setWarmPassage] = useState(false);

  const questionsRef = useRef(null);

  // Load
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const url = testId
          ? `${apiBase}/reading/tests/${testId}`
          : `${apiBase}/reading/for-session/${sessionId}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        const payload = await res.json();
        setTest(payload.data ?? payload);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if ((sessionId || testId) && apiBase) load();
  }, [apiBase, sessionId, testId, getToken]);

  // Answer helpers (slot-based for IELTS numbering)
  const numbering = useMemo(() => (test ? getReadingNumbering(test) : null), [test]);

  const totalAnswered = useMemo(() => {
    if (!test) return 0;
    return test.passages.reduce(
      (sum, p) => sum + passageAnsweredSlots(p, answers),
      0
    );
  }, [test, answers]);

  const totalQuestions = numbering?.totalSlots ?? 0;

  // Result map
  const resultMap = result
    ? Object.fromEntries(result.question_results.map(r => [r.question_id, r]))
    : null;

  // Slot offset for a passage index
  const passageSlotOffset = useCallback((pi) => {
    if (!test) return 0;
    return test.passages.slice(0, pi).reduce(
      (acc, p) => acc + passageSlotCount(p),
      0
    );
  }, [test]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/reading/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ test_id: test.id, answers }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setView("results");
      setActivePassage(0);
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [apiBase, getToken, test, answers, onComplete]);

  useEffect(() => {
    if (autoSubmitRef) autoSubmitRef.current = handleSubmit;
  }, [autoSubmitRef, handleSubmit]);

  // Scroll to question in questions pane
  const scrollToQuestion = useCallback((qid) => {
    const el = questionsRef.current?.querySelector(`[data-qid="${qid}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="rm">
        <div className="rm-center">
          <div style={{ textAlign: "center" }}>
            <Spinner />
            <div style={{ color: MUTED, fontSize: 13, marginTop: 12 }}>Loading reading test…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm">
        <div className="rm-center">
          <div style={{ padding: 16, background: "#fee2e2", borderRadius: 10, color: RED, fontSize: 13, maxWidth: 400 }}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!test) return <div className="rm" />;

  const passage = test.passages[activePassage];
  const pOffset = passageSlotOffset(activePassage);

  // Question range for subtitle (slot-based)
  const firstQNum = pOffset + 1;
  const lastQNum = pOffset + passageSlotCount(passage);

  const handleBack = onBack ?? (() => { if (typeof window !== "undefined") window.history.back(); });

  // ── Results view ──
  if (view === "results") {
    const band = result?.overall_band ?? 0;
    const bc = b => b >= 7 ? GREEN : b >= 5.5 ? GOLD : RED;
    const cefr = getCEFR(band);

    // Build answer key: passage → list of { qNum, qResult }
    const answerKeyPassages = (test.passages ?? []).map(passage => {
      const passResult = result?.passage_results?.find(p => p.passage_number === passage.passage_number);
      const items = [];
      for (const group of passage.question_groups ?? []) {
        for (const q of group.questions ?? []) {
          const qNum = numbering?.questionNumberStartById[q.id];
          const qResult = resultMap?.[String(q.id)];
          if (qNum) items.push({ qNum, qResult });
        }
      }
      return { passage, passResult, items };
    });

    return (
      <div className="rm">
        {/* Topbar */}
        <header className="rm-exam-topbar">
          <div className="rm-exam-topbar-inner">
            <span className="rm-exam-brand" aria-label="IELTSAnywhere">
              <span className="rm-exam-brand-ielts">IELTS</span>
              <span className="rm-exam-brand-anywhere">Anywhere</span>
            </span>
            <span className="rm-exam-brand-sep" aria-hidden="true" />
            <button type="button" className="rm-exam-back" onClick={handleBack} aria-label="Back to tests">
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Reading Results</span>
            <span className="rm-exam-spacer" />
            <button type="button" className="rm-btn-finish" onClick={handleBack}>Back to Tests</button>
          </div>
        </header>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Stats bar */}
          <div style={{ display: "flex", background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            {[
              { label: "Overall Band Score", value: `${band.toFixed(1)}/9.0`, color: bc(band) },
              { label: "CEFR Level", value: cefr, color: TEXT },
              { label: "Correct Answers", value: `${result.correct}/${result.total}`, color: TEXT },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: "18px 24px",
                borderRight: i < 2 ? `1px solid ${BORDER}` : "none",
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 28px 56px" }}>

            {/* Answer Key */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 28, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 15, color: TEXT }}>
                Answer Key
              </div>
              {answerKeyPassages.map(({ passage, passResult, items }) => (
                <div key={passage.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ padding: "10px 20px 6px", fontWeight: 600, fontSize: 13, color: TEXT_SUB }}>
                    Part {passage.passage_number}: {passResult?.correct ?? 0}/{passResult?.total ?? items.length} correct
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "0 12px 10px", gap: "2px 16px" }}>
                    {items.map(({ qNum, qResult }) => (
                      <AnswerKeyItem key={qNum} num={qNum} qResult={qResult} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Improvement tips */}
            {result.improvement_tips?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Improvement Tips
                </div>
                {result.improvement_tips.map((tip, i) => (
                  <div key={i} className="rm-tip" style={{ marginBottom: 6 }}>{tip}</div>
                ))}
              </div>
            )}

            {/* Review split pane */}
            <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 16 }}>Review your answers</div>
            {test.passages.map((p, pi) => {
              const pOff = passageSlotOffset(pi);
              return (
                <div key={p.id} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
                    Part {p.passage_number} — {p.title}
                  </div>
                  <div className="rm-review-split">
                    <div className="rm-review-pane"><Passage passage={p} /></div>
                    <div className="rm-review-pane" style={{ padding: 16 }}>
                      {p.question_groups.map((g, gi) => {
                        const gOff = pOff + p.question_groups.slice(0, gi).reduce((a, x) => a + getGroupSlotCount(x), 0);
                        return (
                          <QuestionGroup key={g.id} group={g} qOffset={gOff} numbering={numbering}
                            answers={answers} setAnswers={() => {}} resultMap={resultMap} submitted />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Test view ──
  return (
    <div className="rm">
      <ReadingExamTopBar
        partLabel={`Part ${activePassage + 1} — Read the text and answer questions ${firstQNum}–${lastQNum}`}
        onBack={handleBack}
        onSubmit={handleSubmit}
        submitting={submitting}
        totalAnswered={totalAnswered}
        totalQuestions={totalQuestions}
        timerFormatted={timerFormatted}
        timerWarning={timerWarning}
        timerDanger={timerDanger}
      />

      {/* ── Main split pane ── */}
      <div className="rm-body">
        {/* Passage */}
        <div className={`rm-passage-pane${warmPassage ? " warm" : ""}`}>
          <div className="rm-passage-toolbar">
            <span className="rm-passage-toolbar-label">Reading passage</span>
            <button
              type="button"
              className={`rm-warm-toggle${warmPassage ? " active" : ""}`}
              onClick={() => setWarmPassage(w => !w)}
              aria-pressed={warmPassage}
              aria-label={warmPassage ? "Turn off warm reading mode" : "Turn on warm reading mode for eye comfort"}
              title={warmPassage ? "Warm mode on" : "Warm mode for eyes"}
            >
              <Eye size={16} strokeWidth={2} />
            </button>
          </div>
          <Passage passage={passage} key={passage.id} />
        </div>

        {/* Questions */}
        <div className="rm-questions-pane" ref={questionsRef}>
          {passage.question_groups.map((g, gi) => {
            const gOff = pOffset + passage.question_groups
              .slice(0, gi)
              .reduce((a, x) => a + getGroupSlotCount(x), 0);
            return (
              <QuestionGroup
                key={g.id} group={g} qOffset={gOff} numbering={numbering}
                answers={answers} setAnswers={setAnswers}
                resultMap={null} submitted={false}
              />
            );
          })}
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="rm-bottom">
        {test.passages.map((p, pi) => {
          const isActive = pi === activePassage;
          const pTotal = passageSlotCount(p);
          const pAnswered = passageAnsweredSlots(p, answers);
          const navSlots = buildPassageNavSlots(p, numbering);

          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
              {pi > 0 && <span className="rm-sep" />}

              <button
                className={`rm-part-tab ${isActive ? "active" : ""}`}
                onClick={() => setActivePassage(pi)}>
                Part {p.passage_number}
              </button>

              {!isActive && (
                <span className="rm-q-count">
                  {pAnswered} of {pTotal}
                </span>
              )}

              {isActive && navSlots.map(({ question, group, questionId, number, slotIndex }) => {
                const answeredSlots = getAnsweredSlotCount(question, group, answers[String(questionId)]);
                const done = answeredSlots > slotIndex;
                return (
                  <button
                    key={`qnav-${p.id}-${questionId}-${slotIndex}-${number}`}
                    className={`rm-q-dot ${done ? "answered" : ""}`}
                    onClick={() => scrollToQuestion(questionId)}
                    title={`Question ${number}`}>
                    {number}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}