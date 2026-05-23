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
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT    = "#312e81";   // deep indigo — matches listening module
const ACCENT_BG = "#eef2ff";
const BORDER    = "#e5e7eb";
const SURFACE   = "#ffffff";
const MUTED     = "#6b7280";
const TEXT      = "#111827";
const TEXT_SUB  = "#374151";
const GREEN     = "#059669";
const GREEN_BG  = "#ecfdf5";
const RED       = "#dc2626";
const RED_BG    = "#fef2f2";
const GOLD      = "#d97706";
const GOLD_BG   = "#fffbeb";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap');
  .rm * { box-sizing: border-box; }
  .rm { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: ${TEXT}; background: ${SURFACE}; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
  .rm ::-webkit-scrollbar { width: 5px; height: 5px; }
  .rm ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
  .rm ::-webkit-scrollbar-track { background: transparent; }

  /* Header */
  .rm-header { display: flex; align-items: center; gap: 12px; padding: 0 20px; height: 52px; border-bottom: 1px solid ${BORDER}; background: ${SURFACE}; flex-shrink: 0; }
  .rm-subtitle { padding: 0 24px; height: 40px; display: flex; align-items: center; border-bottom: 1px solid ${BORDER}; background: #f9fafb; flex-shrink: 0; }

  /* Body */
  .rm-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; }
  .rm-passage-pane { border-right: 1px solid ${BORDER}; overflow-y: auto; height: 100%; background: #fffdf5; }
  .rm-questions-pane { overflow-y: auto; height: 100%; padding: 20px 22px 32px; }

  /* Bottom nav */
  .rm-bottom { height: 52px; border-top: 1px solid ${BORDER}; display: flex; align-items: center; padding: 0 16px; gap: 2px; overflow-x: auto; flex-shrink: 0; background: ${SURFACE}; }
  .rm-bottom::-webkit-scrollbar { height: 0; }
  .rm-part-tab { padding: 5px 10px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: ${MUTED}; transition: all .12s; white-space: nowrap; }
  .rm-part-tab.active { background: ${ACCENT_BG}; color: ${ACCENT}; }
  .rm-part-tab:hover:not(.active) { background: #f3f4f6; }
  .rm-q-dot { width: 27px; height: 27px; border-radius: 50%; border: 1.5px solid #d1d5db; background: transparent; font-size: 10.5px; font-weight: 600; cursor: pointer; color: ${TEXT_SUB}; display: flex; align-items: center; justify-content: center; transition: all .12s; flex-shrink: 0; }
  .rm-q-dot.answered { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
  .rm-q-dot:hover:not(.answered) { border-color: ${ACCENT}; color: ${ACCENT}; }
  .rm-q-count { font-size: 11.5px; color: ${MUTED}; padding: 0 6px; white-space: nowrap; }
  .rm-sep { width: 1px; height: 20px; background: ${BORDER}; margin: 0 6px; flex-shrink: 0; }

  /* Passage */
  .rm-passage-inner { padding: 24px 28px; max-width: 700px; }
  .rm-passage-text { font-family: 'Lora', Georgia, serif; font-size: 14.5px; line-height: 1.9; color: #1e293b; }
  .rm-passage-text p { margin-bottom: 0.9rem; }
  .rm-para-label { font-weight: 700; color: #0369a1; font-family: -apple-system, sans-serif; font-size: 13px; margin-right: 6px; }

  /* Group box */
  .rm-group { border: 1px solid ${BORDER}; border-radius: 10px; margin-bottom: 18px; overflow: hidden; }
  .rm-group-header { font-size: 13.5px; font-weight: 700; color: ${ACCENT}; padding: 10px 16px; background: ${SURFACE}; border-bottom: 1px solid ${BORDER}; }
  .rm-group-instr { padding: 8px 16px 10px; font-size: 12px; color: ${MUTED}; line-height: 1.65; white-space: pre-line; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }

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
  .rm-match-pill { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid ${BORDER}; background: ${SURFACE}; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .12s; }
  .rm-match-pill:hover:not(:disabled) { border-color: ${ACCENT}; color: ${ACCENT}; }
  .rm-match-pill.sel { background: ${ACCENT_BG}; border-color: ${ACCENT}66; color: ${ACCENT}; }
  .rm-match-pill.ok  { background: ${GREEN_BG}; border-color: ${GREEN}55; color: ${GREEN}; }
  .rm-match-pill.bad { background: ${RED_BG};   border-color: ${RED}55;   color: ${RED}; }

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return <div className="rm-spinner" />;
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
function MCQItem({ question, qNumber, value, onChange, result, groupType }) {
  const opts = normalizeOptions(question.options);
  const isCathoven = opts.length > 0 && typeof question.options?.[0] === "object";
  const ca = result?.correct_answer;
  const isMultiSel = groupType === "multiple_select";

  // Multi-select uses checkboxes
  if (isMultiSel) {
    const selected = Array.isArray(value) ? value : [];
    const caArr = Array.isArray(ca) ? ca : [];
    const caNorm = caArr.map(s => String(s).toLowerCase().trim());
    const toggle = (opt) => {
      if (result) return;
      const next = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="rm-mcq-item" data-qid={question.id}>
        <div className="rm-mcq-q">
          <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
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
            return (
              <div key={oi} className={cls} onClick={() => toggle(opt.option)}>
                <span className="rm-letter">{LETTERS[oi]}</span>
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
  const isCorrect = result?.is_correct;
  const ca = correctStr(result?.correct_answer);

  return (
    <div className="rm-mcq-item" data-qid={question.id}>
      <div className="rm-mcq-q">
        <strong style={{ color: ACCENT }}>{qNumber}.</strong>{" "}
        {question.question_text}
      </div>
      <div className="rm-match-grid">
        {labels.map(label => {
          const selected = value === label;
          const isC = result && label.toUpperCase() === ca.toUpperCase();
          const isW = result && selected && !result.is_correct;
          const cls = isC ? "ok" : isW ? "bad" : selected ? "sel" : "";
          return (
            <button key={label} className={`rm-match-pill ${cls}`}
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

// ─── Question Group ───────────────────────────────────────────────────────────
function QuestionGroup({ group, qOffset, answers, setAnswers, resultMap, submitted }) {
  const qt = group.question_type;
  const firstQ = qOffset + 1;
  const lastQ = qOffset + group.questions.length;
  const rangeLabel = group.questions.length === 1
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
              const qNum = qOffset + qi + 1;
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
            const qNum = qOffset + qi + 1;
            const value = answers[qid];
            const result = resultMap?.[qid];
            const cb = val => onChange(qid, val);

            if (qt === "mcq" || qt === "multiple_select") {
              return <MCQItem key={q.id} question={q} qNumber={qNum} value={value} onChange={cb} result={result} groupType={qt} />;
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

// ─── Results summary ──────────────────────────────────────────────────────────
function ResultsSummary({ result }) {
  const bc = b => b >= 7 ? GREEN : b >= 5.5 ? GOLD : RED;
  return (
    <div className="rm-band-card">
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Overall band</div>
          <div style={{ fontSize: 52, fontWeight: 700, color: bc(result.overall_band), fontFamily: "monospace", lineHeight: 1 }}>
            {result.overall_band.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{result.correct} / {result.total} correct</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {result.passage_results.map(p => (
            <div key={p.passage_number} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: MUTED }}>Passage {p.passage_number} — {p.passage_title}</span>
                <span style={{ fontSize: 12, color: bc(p.band), fontFamily: "monospace" }}>
                  {p.correct}/{p.total} — Band {p.band.toFixed(1)}
                </span>
              </div>
              <div style={{ height: 5, background: BORDER, borderRadius: 4 }}>
                <div style={{ width: `${(p.correct / p.total) * 100}%`, height: "100%", background: bc(p.band), borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {result.improvement_tips?.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Improvement tips
          </div>
          {result.improvement_tips.map((tip, i) => (
            <div key={i} className="rm-tip" style={{ marginTop: 6, marginBottom: 0 }}>{tip}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReadingModule({
  apiBase, getToken, sessionId, onComplete, autoSubmitRef,
  timerFormatted, timerWarning, timerDanger, onBack,
}) {
  useEffect(injectCSS, []);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePassage, setActivePassage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState("test");

  const questionsRef = useRef(null);

  // Load
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBase}/reading/for-session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        const payload = await res.json();
        setTest(payload.data ?? payload);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (sessionId && apiBase) load();
  }, [apiBase, sessionId, getToken]);

  // Answer helpers
  const allQuestions = test
    ? test.passages.flatMap(p => p.question_groups.flatMap(g => g.questions))
    : [];
  const answered = q => {
    const a = answers[String(q.id)];
    return a !== undefined && a !== "" && a !== null && !(Array.isArray(a) && a.length === 0);
  };
  const totalAnswered = allQuestions.filter(answered).length;
  const totalQuestions = allQuestions.length;

  // Result map
  const resultMap = result
    ? Object.fromEntries(result.question_results.map(r => [r.question_id, r]))
    : null;

  // Question offset for a passage index
  const passageQOffset = useCallback((pi) => {
    if (!test) return 0;
    return test.passages.slice(0, pi).reduce(
      (acc, p) => acc + p.question_groups.reduce((a, g) => a + g.questions.length, 0),
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
  const pOffset = passageQOffset(activePassage);

  // Question range for subtitle
  const firstQNum = pOffset + 1;
  const lastQNum = pOffset + passage.question_groups.reduce((a, g) => a + g.questions.length, 0);

  const timerColor = timerDanger ? RED : timerWarning ? GOLD : MUTED;

  // ── Results view ──
  if (view === "results") {
    return (
      <div className="rm">
        {/* Header */}
        <div className="rm-header">
          <button onClick={() => { setView("test"); setResult(null); setAnswers({}); }}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: MUTED, padding: "4px 8px" }}>
            ←
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Reading results</span>
        </div>

        {/* Results body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {result && <ResultsSummary result={result} />}

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 24 }}>Review your answers</h3>
          {test.passages.map((p, pi) => {
            const pOff = passageQOffset(pi);
            return (
              <div key={p.id} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
                  Passage {p.passage_number} — {p.title}
                </div>
                <div className="rm-review-split">
                  <div className="rm-review-pane">
                    <Passage passage={p} />
                  </div>
                  <div className="rm-review-pane" style={{ padding: "16px" }}>
                    {p.question_groups.map((g, gi) => {
                      const gOff = pOff + p.question_groups.slice(0, gi).reduce((a, x) => a + x.questions.length, 0);
                      return (
                        <QuestionGroup
                          key={g.id} group={g} qOffset={gOff}
                          answers={answers} setAnswers={() => {}}
                          resultMap={resultMap} submitted
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Test view ──
  return (
    <div className="rm">
      {/* ── Header bar ── */}
      <div className="rm-header">
        <button onClick={onBack}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: MUTED, padding: "4px 8px", flexShrink: 0 }}>
          ←
        </button>

        {/* Timer — centre */}
        <span style={{
          marginLeft: "auto", marginRight: "auto",
          fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums",
          color: timerColor, flexShrink: 0,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ⏱ {timerFormatted || "--:--"}
        </span>

        <button onClick={handleSubmit} disabled={submitting}
          style={{
            background: ACCENT, color: "#fff", border: "none",
            borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600,
            cursor: submitting ? "default" : "pointer", flexShrink: 0,
            opacity: submitting ? 0.7 : 1, whiteSpace: "nowrap",
          }}>
          {submitting ? "Submitting…" : "Finish Test"}
        </button>
      </div>

      {/* ── Subtitle bar ── */}
      <div className="rm-subtitle">
        <span style={{ fontSize: 13, color: MUTED }}>
          Part {activePassage + 1} — Read the text and answer questions {firstQNum}–{lastQNum}
        </span>
      </div>

      {/* ── Main split pane ── */}
      <div className="rm-body">
        {/* Passage */}
        <div className="rm-passage-pane">
          <Passage passage={passage} key={passage.id} />
        </div>

        {/* Questions */}
        <div className="rm-questions-pane" ref={questionsRef}>
          {passage.question_groups.map((g, gi) => {
            const gOff = pOffset + passage.question_groups
              .slice(0, gi)
              .reduce((a, x) => a + x.questions.length, 0);
            return (
              <QuestionGroup
                key={g.id} group={g} qOffset={gOff}
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
          const pQs = p.question_groups.flatMap(g => g.questions);
          const pAnswered = pQs.filter(answered).length;
          const pOff = passageQOffset(pi);

          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
              {/* Separator between parts */}
              {pi > 0 && <span className="rm-sep" />}

              {/* Part tab */}
              <button
                className={`rm-part-tab ${isActive ? "active" : ""}`}
                onClick={() => setActivePassage(pi)}>
                Part {p.passage_number}
              </button>

              {/* Inactive: show count */}
              {!isActive && (
                <span className="rm-q-count">
                  {pAnswered} of {pQs.length}
                </span>
              )}

              {/* Active: show individual question circles */}
              {isActive && pQs.map((q, qi) => {
                const qNum = pOff + qi + 1;
                const isAns = answered(q);
                return (
                  <button
                    key={q.id}
                    className={`rm-q-dot ${isAns ? "answered" : ""}`}
                    onClick={() => scrollToQuestion(q.id)}
                    title={`Question ${qNum}`}>
                    {qNum}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Total count right side */}
        <span style={{ marginLeft: "auto", fontSize: 12, color: MUTED, flexShrink: 0, paddingLeft: 12 }}>
          {totalAnswered} of {totalQuestions} answered
        </span>
      </div>
    </div>
  );
}