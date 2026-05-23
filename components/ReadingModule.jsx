/**
 * ReadingModule.jsx
 *
 * Full IELTS reading module — fetches from FastAPI backend,
 * authenticates via Firebase, handles all 6 question types.
 *
 * Props:
 *   apiBase   — FastAPI URL e.g. "http://localhost:8000"
 *   getToken  — async () => Firebase ID token string
 *   sessionId — UUID string of the current TestSession
 *   onComplete— callback fired after successful submission
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#f8fafc",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#e2e8f0",
  borderHover: "#94a3b8",
  accent: "#0ea5e9",
  accentDim: "#e0f2fe",
  gold: "#d97706",
  goldDim: "#fef3c7",
  green: "#059669",
  greenDim: "#d1fae5",
  red: "#dc2626",
  redDim: "#fee2e2",
  purple: "#7c3aed",
  purpleDim: "#ede9fe",
  text: "#0f172a",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  passageBg: "#fffbeb",
  passageBorder: "#fde68a",
};

const TYPE_COLORS = {
  mcq: C.accent,
  tfng: C.purple,
  fill: C.gold,
  matching_headings: C.green,
  matching_info: "#0891b2",
  short_answer: "#be185d",
  multiple_select: "#7c3aed",
};

const TYPE_LABELS = {
  mcq: "Multiple choice",
  tfng: "True / False / Not Given",
  fill: "Fill in the blank",
  matching_headings: "Matching headings",
  matching_info: "Matching information",
  short_answer: "Short answer",
  multiple_select: "Multiple select",
};

// Normalize options to [{order, option}] regardless of source format.
function normalizeOptions(options) {
  if (!options || options.length === 0) return [];
  return options.map((o, i) => typeof o === "string" ? { order: i + 1, option: o } : o);
}

// Extract the display string from a correct_answer value (may be array or scalar).
function correctStr(ca) {
  if (Array.isArray(ca)) return ca[0] ?? "";
  return String(ca ?? "");
}

// Render question text that may contain </blank> markers as inline inputs.
function InlineFill({ text, value, onChange, result, disabled }) {
  const parts = (text || "").split("</blank>");
  if (parts.length === 1) return null; // no blank — caller handles separately
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;
  return (
    <span style={{ fontSize: 13.5, lineHeight: 2 }}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <input
              className={`rm-input ${result ? (isCorrect ? "rm-inp-correct" : "rm-inp-wrong") : ""}`}
              style={{ width: 130, display: "inline-block", margin: "0 4px", padding: "3px 8px", verticalAlign: "middle" }}
              value={value || ""}
              disabled={disabled || !!result}
              onChange={e => !result && onChange(e.target.value)}
            />
          )}
        </span>
      ))}
      {isWrong && (
        <span style={{ marginLeft: 6, fontSize: 12, color: C.muted }}>
          → <span style={{ color: C.green, fontFamily: "'JetBrains Mono'" }}>{correctStr(result.correct_answer)}</span>
        </span>
      )}
    </span>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  .rm * { box-sizing: border-box; margin: 0; padding: 0; }
  .rm { font-family: 'Inter', sans-serif; color: ${C.text}; background: ${C.bg}; }
  .rm ::-webkit-scrollbar { width: 4px; height: 4px; }
  .rm ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  @keyframes rm-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes rm-spin { to { transform:rotate(360deg); } }
  .rm-fadeup { animation: rm-fadeup .3s ease both; }
  .rm-card { background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; }
  .rm-passage { font-family:'Lora',serif; font-size:15px; line-height:1.85; color:#1e293b; }
  .rm-passage p { margin-bottom:1rem; }
  .rm-passage .para-label { font-weight:700; color:${C.accent}; font-family:'Inter',sans-serif; font-size:13px; }
  .rm-option { display:flex; align-items:flex-start; gap:10px; padding:9px 13px; border-radius:8px; border:1px solid ${C.border}; cursor:pointer; transition:all .15s; font-size:13.5px; line-height:1.5; }
  .rm-option:hover:not(.rm-opt-disabled) { border-color:${C.borderHover}; background:#f8fafc; }
  .rm-option.rm-opt-selected { background:${C.accentDim}; border-color:${C.accent}66; color:${C.accent}; }
  .rm-option.rm-opt-correct { background:${C.greenDim}; border-color:${C.green}55; }
  .rm-option.rm-opt-wrong { background:${C.redDim}; border-color:${C.red}55; }
  .rm-option.rm-opt-disabled { cursor:default; }
  .rm-input { width:100%; padding:8px 12px; border:1px solid ${C.border}; border-radius:8px; font-family:'Inter',sans-serif; font-size:13.5px; color:${C.text}; background:${C.surface}; transition:border-color .15s; }
  .rm-input:focus { outline:none; border-color:${C.accent}; }
  .rm-input.rm-inp-correct { border-color:${C.green}; background:${C.greenDim}; }
  .rm-input.rm-inp-wrong { border-color:${C.red}; background:${C.redDim}; }
  .rm-select { padding:7px 10px; border:1px solid ${C.border}; border-radius:8px; font-family:'Inter',sans-serif; font-size:13px; color:${C.text}; background:${C.surface}; cursor:pointer; min-width:120px; }
  .rm-btn { font-family:'Inter',sans-serif; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; padding:9px 18px; transition:all .15s; }
  .rm-btn-primary { background:${C.accent}; color:#fff; }
  .rm-btn-primary:hover { background:#0284c7; }
  .rm-btn-primary:disabled { opacity:.45; cursor:not-allowed; }
  .rm-btn-outline { background:transparent; color:${C.accent}; border:1px solid ${C.accent}44; }
  .rm-btn-outline:hover { background:${C.accentDim}; }
  .rm-btn-ghost { background:transparent; color:${C.muted}; border:none; }
  .rm-badge { border-radius:99px; font-size:11px; font-weight:600; letter-spacing:.05em; padding:2px 9px; text-transform:uppercase; display:inline-block; }
  .rm-spinner { width:17px; height:17px; border:2px solid ${C.border}; border-top-color:${C.accent}; border-radius:50%; animation:rm-spin .7s linear infinite; display:inline-block; }
  .rm-tip { padding:9px 13px; background:${C.goldDim}; border:1px solid #fbbf2444; border-radius:8px; font-size:12.5px; color:#78350f; line-height:1.6; margin-top:10px; }
`;

function Badge({ children, color }) {
  return (
    <span className="rm-badge" style={{ background: color + "18", color, border: `1px solid ${color}33` }}>
      {children}
    </span>
  );
}

function Spinner() {
  return <span className="rm-spinner" />;
}

// ─── Passage renderer ─────────────────────────────────────────────────────────
function Passage({ passage, highlightRef }) {
  const hasParagraphs = passage.paragraphs && passage.paragraphs.length > 0;

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        Passage {passage.passage_number}
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 18, color: C.text, fontFamily: "'Lora', serif" }}>
        {passage.title}
      </h2>
      <div className="rm-passage">
        {hasParagraphs ? (
          passage.paragraphs.map((para, i) => {
            // Extract paragraph label (e.g. "A") from "A  The phenomenon..."
            const match = para.match(/^([A-Z])\s{2}/);
            const label = match ? match[1] : null;
            const text = match ? para.slice(match[0].length) : para;
            return (
              <p key={i}>
                {label && <span className="para-label">{label}  </span>}
                {text}
              </p>
            );
          })
        ) : (
          passage.body.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Question type renderers ──────────────────────────────────────────────────
function MCQQuestion({ question, value, onChange, result, color }) {
  const opts = normalizeOptions(question.options);
  // Cathoven: options are objects, answer is option text.
  // Legacy: options may be null/strings, answer is integer index.
  const isCathoven = opts.length > 0 && typeof (question.options?.[0]) === "object";
  const ca = result?.correct_answer;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {opts.map((opt, oi) => {
        const selected = isCathoven ? value === opt.option : value === oi;
        const isCorrect = result && (isCathoven ? opt.option === correctStr(ca) : oi === Number(ca));
        const isWrong = result && selected && !result.is_correct;
        let cls = "rm-option rm-opt-disabled";
        if (!result) cls = selected ? "rm-option rm-opt-selected" : "rm-option";
        else if (isCorrect) cls = "rm-option rm-opt-correct rm-opt-disabled";
        else if (isWrong) cls = "rm-option rm-opt-wrong rm-opt-disabled";
        else cls = "rm-option rm-opt-disabled";

        return (
          <label key={oi} className={cls} onClick={() => !result && onChange(isCathoven ? opt.option : oi)}>
            <span style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${isCorrect ? C.green : isWrong ? C.red : selected ? color : C.border}`,
              background: (selected || isCorrect) ? (isCorrect ? C.green : isWrong ? C.red : color) : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
            }}>
              {(selected || isCorrect) && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
            </span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{opt.option}</span>
            {isCorrect && <span style={{ fontSize: 11, color: C.green, flexShrink: 0 }}>✓</span>}
            {isWrong && <span style={{ fontSize: 11, color: C.red, flexShrink: 0 }}>✗</span>}
          </label>
        );
      })}
    </div>
  );
}

function TFNGQuestion({ question, value, onChange, result, color }) {
  // Cathoven: question.options = [{option:"TRUE"}, {option:"FALSE"}, {option:"NOT GIVEN"}]
  // Legacy: no options, hardcode
  const rawOpts = normalizeOptions(question.options);
  const isCathoven = rawOpts.length > 0;
  const opts = isCathoven ? rawOpts.map(o => o.option) : ["True", "False", "Not Given"];
  const ca = result?.correct_answer;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {opts.map((opt, oi) => {
        const selected = isCathoven ? value === opt : value === oi;
        const caVal = isCathoven ? correctStr(ca) : Number(ca);
        const isCorrect = result && (isCathoven
          ? opt.toUpperCase() === caVal.toUpperCase()
          : oi === caVal);
        const isWrong = result && selected && !result.is_correct;
        const bg = isCorrect ? C.greenDim : isWrong ? C.redDim : selected ? C.accentDim : C.surface;
        const border = isCorrect ? C.green + "55" : isWrong ? C.red + "55" : selected ? color + "66" : C.border;
        const textColor = isCorrect ? C.green : isWrong ? C.red : selected ? color : C.text;
        return (
          <button key={oi} className="rm-btn" disabled={!!result}
            onClick={() => !result && onChange(isCathoven ? opt : oi)}
            style={{ background: bg, border: `1px solid ${border}`, color: textColor, padding: "7px 16px", fontSize: 13 }}>
            {opt}
          </button>
        );
      })}
      {result && !result.is_correct && (
        <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>
          Correct: <strong style={{ color: C.green }}>{correctStr(ca)}</strong>
        </span>
      )}
    </div>
  );
}

function FillQuestion({ question, value, onChange, result }) {
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;
  const hasBlank = (question.question_text || "").includes("</blank>");

  // Inline rendering when the question stem has a blank marker
  if (hasBlank) {
    return (
      <div>
        <InlineFill
          text={question.question_text}
          value={value}
          onChange={onChange}
          result={result}
          disabled={false}
        />
      </div>
    );
  }

  return (
    <div>
      <input
        className={`rm-input ${result ? (isCorrect ? "rm-inp-correct" : "rm-inp-wrong") : ""}`}
        value={value || ""}
        disabled={!!result}
        onChange={e => !result && onChange(e.target.value)}
        placeholder="Type your answer from the passage…"
      />
      {isWrong && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
          Correct: <span style={{ color: C.green, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>
            {correctStr(result.correct_answer)}
          </span>
        </div>
      )}
    </div>
  );
}

function ShortAnswerQuestion({ question, value, onChange, result }) {
  return <FillQuestion question={question} value={value} onChange={onChange} result={result} />;
}

function MatchingHeadingsQuestion({ question, groupData, value, onChange, result }) {
  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;

  // Legacy: groupData.heading_options = ["i  Heading text", ...]
  // Cathoven: question.options = [{option:"i"}, {option:"ii"}, ...]
  const legacyHeadings = groupData.heading_options || [];
  const cathovenOpts = normalizeOptions(question.options);
  const useCathoven = cathovenOpts.length > 0 && !legacyHeadings.length;

  return (
    <div>
      <select
        className="rm-select"
        value={value || ""}
        disabled={!!result}
        onChange={e => !result && onChange(e.target.value)}
        style={{ width: "100%", borderColor: result ? (isCorrect ? C.green : C.red) : C.border }}
      >
        <option value="">— Select heading —</option>
        {useCathoven
          ? cathovenOpts.map((o, i) => (
              <option key={i} value={o.option}>{o.option}</option>
            ))
          : legacyHeadings.map((h, i) => (
              <option key={i} value={h.split(/\s+/)[0].toLowerCase()}>{h}</option>
            ))
        }
      </select>
      {isWrong && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
          Correct: <span style={{ color: C.green, fontFamily: "'JetBrains Mono'" }}>
            {correctStr(result.correct_answer)}
          </span>
        </div>
      )}
    </div>
  );
}

function MatchingInfoQuestion({ question, groupData, value, onChange, result }) {
  // Legacy: groupData.paragraph_labels = ["A","B","C","D","E"]
  // Cathoven: question.options = [{option:"A"}, {option:"B"}, ...]
  const cathovenOpts = normalizeOptions(question.options);
  const labels = cathovenOpts.length > 0
    ? cathovenOpts.map(o => o.option)
    : (groupData.paragraph_labels || ["A", "B", "C", "D", "E"]);

  const isCorrect = result?.is_correct;
  const isWrong = result && !isCorrect;
  const ca = correctStr(result?.correct_answer);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {labels.map(label => {
          const selected = value === label;
          const isC = result && label.toUpperCase() === ca.toUpperCase();
          const isW = result && selected && !result.is_correct;
          return (
            <button key={label} className="rm-btn" disabled={!!result}
              onClick={() => !result && onChange(label)}
              style={{
                width: 36, height: 36, padding: 0, fontSize: 14, fontWeight: 600,
                background: isC ? C.greenDim : isW ? C.redDim : selected ? C.accentDim : C.surface,
                border: `1px solid ${isC ? C.green + "55" : isW ? C.red + "55" : selected ? C.accent + "66" : C.border}`,
                color: isC ? C.green : isW ? C.red : selected ? C.accent : C.text,
              }}>
              {label}
            </button>
          );
        })}
      </div>
      {isWrong && (
        <span style={{ fontSize: 12, color: C.muted }}>
          Correct: <strong style={{ color: C.green }}>{ca}</strong>
        </span>
      )}
    </div>
  );
}

function MultipleSelectQuestion({ question, value, onChange, result, color }) {
  const opts = normalizeOptions(question.options);
  const selected = Array.isArray(value) ? value : [];
  const ca = Array.isArray(result?.correct_answer) ? result.correct_answer : [];
  const caNorm = ca.map(s => s.toLowerCase().trim());

  const toggle = (opt) => {
    if (result) return;
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt];
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {opts.map((opt, oi) => {
        const isSel = selected.includes(opt.option);
        const isC = result && caNorm.includes(opt.option.toLowerCase().trim());
        const isW = result && isSel && !isC;
        let cls = "rm-option rm-opt-disabled";
        if (!result) cls = isSel ? "rm-option rm-opt-selected" : "rm-option";
        else if (isC) cls = "rm-option rm-opt-correct rm-opt-disabled";
        else if (isW) cls = "rm-option rm-opt-wrong rm-opt-disabled";
        else cls = "rm-option rm-opt-disabled";

        return (
          <label key={oi} className={cls} onClick={() => toggle(opt.option)}>
            <span style={{
              width: 16, height: 16, borderRadius: 3, flexShrink: 0,
              border: `2px solid ${isC ? C.green : isW ? C.red : isSel ? color : C.border}`,
              background: isC ? C.green : isW ? C.red : isSel ? color : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {(isSel || isC) && <span style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />}
            </span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{opt.option}</span>
          </label>
        );
      })}
      {result && !result.is_correct && (
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
          Correct: <span style={{ color: C.green }}>{ca.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Single question wrapper ───────────────────────────────────────────────────
function Question({ question, groupData, qNumber, answers, setAnswers, resultMap, submitted }) {
  const qid = String(question.id);
  const value = answers[qid];
  const result = resultMap?.[qid];
  const qt = groupData.question_type;
  const color = TYPE_COLORS[qt] || C.accent;

  const onChange = useCallback(val => {
    if (!submitted) setAnswers(a => ({ ...a, [qid]: val }));
  }, [qid, submitted, setAnswers]);

  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 10,
      border: `1px solid ${result ? (result.is_correct ? C.green + "44" : C.red + "44") : C.border}`,
      background: result ? (result.is_correct ? C.greenDim + "44" : C.redDim + "44") : C.surface,
      marginBottom: 12,
    }}>
      {/* Question label + text — skip text for inline-blank fill (InlineFill renders it) */}
      {(() => {
        const hasInlineBlank = (qt === "fill" || qt === "short_answer") && (question.question_text || "").includes("</blank>");
        return (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
            <span style={{
              background: color + "18", color, border: `1px solid ${color}33`,
              borderRadius: 6, padding: "2px 8px", fontSize: 12,
              fontFamily: "'JetBrains Mono'", flexShrink: 0, fontWeight: 500,
            }}>Q{qNumber}</span>
            {hasInlineBlank
              ? <InlineFill text={question.question_text} value={value} onChange={onChange} result={result} />
              : <span style={{ fontSize: 13.5, lineHeight: 1.6, flex: 1 }}>{question.question_text}</span>
            }
          </div>
        );
      })()}

      {qt === "mcq" && (
        <MCQQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}
      {qt === "tfng" && (
        <TFNGQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}
      {qt === "fill" && !(question.question_text || "").includes("</blank>") && (
        <FillQuestion question={question} value={value} onChange={onChange} result={result} />
      )}
      {qt === "short_answer" && (
        <ShortAnswerQuestion question={question} value={value} onChange={onChange} result={result} />
      )}
      {qt === "matching_headings" && (
        <MatchingHeadingsQuestion question={question} groupData={groupData} value={value} onChange={onChange} result={result} />
      )}
      {qt === "matching_info" && (
        <MatchingInfoQuestion question={question} groupData={groupData} value={value} onChange={onChange} result={result} />
      )}
      {qt === "multiple_select" && (
        <MultipleSelectQuestion question={question} value={value} onChange={onChange} result={result} color={color} />
      )}

      {result && !result.is_correct && result.tip && (
        <div className="rm-tip">
          <strong>Tip:</strong> {result.tip}
        </div>
      )}
    </div>
  );
}

// ─── Question group ───────────────────────────────────────────────────────────
function QuestionGroup({ group, qOffset, answers, setAnswers, resultMap, submitted }) {
  const color = TYPE_COLORS[group.question_type] || C.accent;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Badge color={color}>{TYPE_LABELS[group.question_type] || group.question_type}</Badge>
        {group.word_limit && (
          <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>{group.word_limit}</span>
        )}
      </div>
      {group.title && (
        <div style={{ fontSize: 13, fontWeight: 700, fontStyle: "italic", color: C.text, marginBottom: 6 }}>
          {group.title.toUpperCase()}
        </div>
      )}
      <div style={{
        padding: "10px 14px", background: "#f8fafc",
        borderRadius: 8, fontSize: 13, color: C.muted,
        lineHeight: 1.6, marginBottom: 12, borderLeft: `3px solid ${color}`,
        whiteSpace: "pre-line",
      }}>
        {group.instruction}
      </div>

      {/* Heading options for matching_headings */}
      {group.question_type === "matching_headings" && group.heading_options && (
        <div style={{
          padding: "12px 14px", background: C.goldDim,
          borderRadius: 8, marginBottom: 14, border: `1px solid #fbbf2433`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 8 }}>
            LIST OF HEADINGS
          </div>
          {group.heading_options.map((h, i) => (
            <div key={i} style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>{h}</div>
          ))}
        </div>
      )}

      {group.questions.map((q, qi) => (
        <Question
          key={q.id}
          question={q}
          groupData={group}
          qNumber={qOffset + qi + 1}
          answers={answers}
          setAnswers={setAnswers}
          resultMap={resultMap}
          submitted={submitted}
        />
      ))}
    </div>
  );
}

// ─── Results summary ──────────────────────────────────────────────────────────
function ResultsSummary({ result }) {
  const bandColor = b => b >= 7 ? C.green : b >= 5.5 ? C.gold : C.red;
  return (
    <div style={{
      padding: "20px 24px", background: C.surface,
      borderRadius: 12, border: `1px solid ${C.border}`,
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Overall band
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, color: bandColor(result.overall_band), fontFamily: "'JetBrains Mono'", lineHeight: 1 }}>
            {result.overall_band.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            {result.correct} / {result.total} correct
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.passage_results.map(p => (
              <div key={p.passage_number}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Passage {p.passage_number} — {p.passage_title}</span>
                  <span style={{ fontSize: 12, color: bandColor(p.band), fontFamily: "'JetBrains Mono'" }}>
                    {p.correct}/{p.total} — Band {p.band.toFixed(1)}
                  </span>
                </div>
                <div style={{ height: 5, background: C.border, borderRadius: 4 }}>
                  <div style={{ width: `${(p.correct / p.total) * 100}%`, height: "100%", background: bandColor(p.band), borderRadius: 4, transition: "width .4s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {result.improvement_tips?.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Improvement tips
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.improvement_tips.map((tip, i) => (
              <div key={i} style={{
                padding: "9px 13px", background: "#f8fafc",
                borderRadius: 8, fontSize: 13, color: C.muted,
                borderLeft: `3px solid ${C.gold}`, lineHeight: 1.6,
              }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReadingModule({ apiBase, getToken, sessionId, onComplete, autoSubmitRef}) {
  // Inject CSS once
  useEffect(() => {
    const id = "rm-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePassage, setActivePassage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState("test"); // "test" | "results"

  // Load test via session
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

  // Answer completion tracking
  const passage = test?.passages[activePassage];
  const allQuestions = test
    ? test.passages.flatMap(p => p.question_groups.flatMap(g => g.questions))
    : [];
  const totalAnswered = allQuestions.filter(q => {
    const a = answers[String(q.id)];
    return a !== undefined && a !== "" && a !== null;
  }).length;
  const totalQuestions = allQuestions.length;

  // Build result map keyed by question_id
  const resultMap = result
    ? Object.fromEntries(result.question_results.map(r => [r.question_id, r]))
    : null;

  // Question number offset per passage
  const getPassageQOffset = (passageIdx) => {
    return test.passages
      .slice(0, passageIdx)
      .reduce((acc, p) => acc + p.question_groups.reduce((a, g) => a + g.questions.length, 0), 0);
  };

  const handleSubmit = async () => {
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
  };
  // ✅ ADD THIS RIGHT AFTER handleSubmit:
  useEffect(() => {
    if (autoSubmitRef) {
      autoSubmitRef.current = handleSubmit;
    }
  }, [autoSubmitRef, handleSubmit]);
  // ── Loading / error ──
  if (loading) {
    return (
      <div className="rm" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <div style={{ color: C.muted, fontSize: 13, marginTop: 12 }}>Loading reading test…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm" style={{ padding: 24 }}>
        <div style={{ padding: 16, background: "#fee2e2", borderRadius: 10, color: C.red, fontSize: 13 }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!test) return null;

  // ── Results view ──
  if (view === "results") {
    return (
      <div className="rm rm-fadeup" style={{ padding: "24px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button className="rm-btn rm-btn-ghost" onClick={() => { setView("test"); setResult(null); setAnswers({}); }}>
            ← New attempt
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Reading results</h2>
        </div>

        {result && <ResultsSummary result={result} />}

        {/* Review answers — same split-pane layout */}
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Review your answers</h3>
        {test.passages.map((p, pi) => (
          <div key={p.id} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              Passage {p.passage_number} — {p.title}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="rm-card" style={{ maxHeight: 500, overflowY: "auto" }}>
                <Passage passage={p} />
              </div>
              <div style={{ overflowY: "auto", maxHeight: 500 }}>
                {p.question_groups.map(g => (
                  <QuestionGroup
                    key={g.id} group={g}
                    qOffset={getPassageQOffset(pi) + p.question_groups.slice(0, p.question_groups.indexOf(g)).reduce((a, x) => a + x.questions.length, 0)}
                    answers={answers} setAnswers={() => {}}
                    resultMap={resultMap} submitted={true}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Test view ──
  return (
    <div className="rm" style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>Reading Test</h2>
          <div style={{ fontSize: 13, color: C.muted }}>{test.title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            <span style={{ color: C.accent, fontFamily: "'JetBrains Mono'" }}>{totalAnswered}</span>
            {" "}/{" "}{totalQuestions} answered
          </span>
          <button className="rm-btn rm-btn-primary"
            disabled={totalAnswered < totalQuestions || submitting}
            onClick={handleSubmit}
            style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {submitting ? <><Spinner /> Submitting…</> : "Submit test"}
          </button>
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ height: 3, background: C.border, borderRadius: 4, marginBottom: 18 }}>
        <div style={{ width: `${(totalAnswered / totalQuestions) * 100}%`, height: "100%", background: C.accent, borderRadius: 4, transition: "width .3s" }} />
      </div>

      {/* Passage tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {test.passages.map((p, pi) => {
          const pQuestions = p.question_groups.flatMap(g => g.questions);
          const pAnswered = pQuestions.filter(q => {
            const a = answers[String(q.id)];
            return a !== undefined && a !== "" && a !== null;
          }).length;
          const isActive = pi === activePassage;
          return (
            <button key={p.id} className="rm-btn"
              onClick={() => setActivePassage(pi)}
              style={{
                padding: "7px 16px",
                background: isActive ? C.accentDim : "transparent",
                color: isActive ? C.accent : C.muted,
                border: `1px solid ${isActive ? C.accent + "55" : C.border}`,
              }}>
              Passage {p.passage_number}
              <span style={{ marginLeft: 6, fontSize: 11, fontFamily: "'JetBrains Mono'", color: pAnswered === pQuestions.length ? C.green : C.muted }}>
                {pAnswered}/{pQuestions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Split pane: passage left, questions right */}
      {passage && (
        <div className="rm-fadeup" key={passage.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left — passage */}
          <div className="rm-card" style={{
            maxHeight: "calc(100vh - 200px)", overflowY: "auto",
            position: "sticky", top: 80,
            background: C.passageBg, borderColor: C.passageBorder,
          }}>
            <Passage passage={passage} />
          </div>

          {/* Right — questions */}
          <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: 4 }}>
            {passage.question_groups.map((g, gi) => {
              const groupOffset = passage.question_groups
                .slice(0, gi)
                .reduce((a, x) => a + x.questions.length, 0);
              return (
                <QuestionGroup
                  key={g.id} group={g}
                  qOffset={getPassageQOffset(activePassage) + groupOffset}
                  answers={answers} setAnswers={setAnswers}
                  resultMap={null} submitted={false}
                />
              );
            })}

            {/* Passage navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <button className="rm-btn rm-btn-ghost"
                disabled={activePassage === 0}
                onClick={() => setActivePassage(p => p - 1)}>
                ← Previous
              </button>
              <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>
                Passage {activePassage + 1} of {test.passages.length}
              </span>
              {activePassage < test.passages.length - 1 ? (
                <button className="rm-btn rm-btn-outline"
                  onClick={() => setActivePassage(p => p + 1)}>
                  Next →
                </button>
              ) : (
                <button className="rm-btn rm-btn-primary"
                  disabled={totalAnswered < totalQuestions || submitting}
                  onClick={handleSubmit}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {submitting ? <><Spinner /> Submitting…</> : "Submit test"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}