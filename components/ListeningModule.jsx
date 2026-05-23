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

const ACCENT       = "#312e81";
const ACCENT_LIGHT = "#ede9fe";
const BORDER       = "#e5e7eb";
const SURFACE      = "#f9fafb";
const TEXT         = "#111827";
const TEXT_SUB     = "#374151";
const MUTED        = "#6b7280";
const MUTED_LIGHT  = "#9ca3af";
const GREEN        = "#059669";
const GREEN_BG     = "#ecfdf5";
const RED          = "#dc2626";
const RED_BG       = "#fef2f2";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  .lm *, .lm *::before, .lm *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lm {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #fff; color: #111827; min-height: 100vh;
  }
  .lm-blank {
    border: 1.5px solid #d1d5db; border-radius: 6px;
    padding: 3px 10px; font-size: 13.5px; font-family: inherit;
    width: 120px; background: #f9fafb; vertical-align: middle;
    display: inline-block; outline: none;
    transition: border-color .12s, background .12s;
  }
  .lm-blank:focus { border-color: #312e81; background: #fff; }
  .lm-blank:disabled { cursor: default; }
  .lm-blank.ok  { border-color: #059669 !important; background: #ecfdf5 !important; }
  .lm-blank.bad { border-color: #dc2626 !important; background: #fef2f2 !important; }
  .lm-opt {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; border-radius: 8px; margin-bottom: 6px;
    border: 1.5px solid #e5e7eb; cursor: pointer;
    font-size: 13.5px; user-select: none;
    transition: border-color .1s, background .1s; color: #374151;
  }
  label.lm-opt:hover { border-color: #a5b4fc; background: #f5f3ff; }
  .lm-opt.sel  { border-color: #312e81; background: #ede9fe; color: #312e81; }
  .lm-opt.ok   { border-color: #059669; background: #ecfdf5; color: #059669; }
  .lm-opt.bad  { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
  @keyframes lm-spin { to { transform: rotate(360deg); } }
  .lm-spinner {
    width: 20px; height: 20px; border: 2px solid #e5e7eb;
    border-top-color: #312e81; border-radius: 50%;
    animation: lm-spin .7s linear infinite; display: inline-block;
  }
  @keyframes lm-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: none; }
  }
  .lm-fadein { animation: lm-fadein .25s ease both; }
`;

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById("lm-css")) return;
  const s = document.createElement("style");
  s.id = "lm-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Number bubble ────────────────────────────────────────────────────────────
function Bubble({ n, size = 22 }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: ACCENT, color: "#fff",
      fontSize: size <= 20 ? 9 : 11, fontWeight: 700,
      flexShrink: 0, verticalAlign: "middle", lineHeight: 1,
    }}>{n}</span>
  );
}

// ─── Inline blank (number bubble + input) ─────────────────────────────────────
function InlineBlank({ n, value, onChange, disabled, result }) {
  const isOk  = result?.is_correct;
  const isBad = result && !isOk;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, verticalAlign: "middle" }}>
      <Bubble n={n} />
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
function Stem({ text, n, value, onChange, disabled, result }) {
  if (!text) return null;
  const parts = text.split("</blank>");
  if (parts.length < 2) {
    return <span style={{ fontSize: 14, lineHeight: 1.75, color: TEXT_SUB }}>{text}</span>;
  }
  return (
    <span style={{ fontSize: 14, lineHeight: 2.1, color: TEXT_SUB }}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <InlineBlank
              n={n} value={value} onChange={onChange}
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
    <p style={{ fontSize: 14, color: TEXT_SUB, lineHeight: 1.65, marginBottom: 4 }}>
      {parts.map((p, i) =>
        /^[A-Z][A-Z /]+[A-Z]$/.test(p.trim())
          ? <strong key={i}>{p}</strong>
          : <span key={i}>{p}</span>
      )}
    </p>
  );
}

// ─── Audio player (compact, lives in sticky top bar) ──────────────────────────
function AudioPlayer({ section }) {
  const audioRef = useRef(null);
  const mockRef  = useRef(null);
  const hasAudio = Boolean(section?.audio);

  const [playing, setPlaying]   = useState(false);
  const [time, setTime]         = useState(0);
  const [duration, setDuration] = useState(section?.audio_duration_seconds || 240);
  const [ready, setReady]       = useState(!hasAudio);
  const [audioErr, setAudioErr] = useState(false);

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
  }, [hasAudio]);

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

  const toggle = () => {
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

  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
      {hasAudio && (
        <audio ref={audioRef} src={section.audio} preload="metadata" style={{ display: "none" }} />
      )}
      <span style={{ fontSize: 13, color: MUTED, fontVariantNumeric: "tabular-nums", minWidth: 36, flexShrink: 0 }}>
        {fmt(time)}
      </span>
      <button
        onClick={toggle}
        disabled={hasAudio && !ready}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: audioErr ? RED : ACCENT,
          border: "none", color: "#fff", fontSize: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: audioErr || (hasAudio && !ready) ? "default" : "pointer",
          flexShrink: 0, opacity: hasAudio && !ready ? 0.5 : 1,
        }}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div
        style={{
          flex: 1, height: 4, background: BORDER, borderRadius: 4,
          position: "relative", cursor: "pointer",
        }}
        onClick={scrub}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: ACCENT, borderRadius: 4 }} />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          width: 12, height: 12, borderRadius: "50%", background: ACCENT,
          transform: "translate(-50%, -50%)",
          boxShadow: `0 0 0 3px ${ACCENT_LIGHT}`,
          transition: "left .1s",
        }} />
      </div>
      <span style={{ fontSize: 12, color: MUTED_LIGHT, minWidth: 36, textAlign: "right", flexShrink: 0 }}>
        {fmt(duration)}
      </span>
    </div>
  );
}

// ─── MCQ options ──────────────────────────────────────────────────────────────
function MCQOpts({ question, value, onChange, result, disabled }) {
  const opts = (question.options ?? []).map((o, i) =>
    typeof o === "string" ? { order: i, option: o } : o
  );
  return (
    <div style={{ marginTop: 10 }}>
      {opts.map(opt => {
        const sel   = value === opt.order;
        const isOk  = result && opt.order === result.correct_answer;
        const isBad = result && sel && !result.is_correct;
        return (
          <label key={opt.order} className={`lm-opt${isOk ? " ok" : isBad ? " bad" : sel ? " sel" : ""}`}>
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
    ? new Set(Array.isArray(result.correct_answer) ? result.correct_answer.map(String) : [])
    : null;

  const toggle = order => {
    if (result || disabled) return;
    const next = new Set(sel);
    if (next.has(order)) next.delete(order);
    else if (!question.max_selected_options || next.size < question.max_selected_options) next.add(order);
    onChange([...next]);
  };

  return (
    <div style={{ marginTop: 10 }}>
      {opts.map(opt => {
        const isSel = sel.has(opt.order);
        const isOk  = result && correct?.has(String(opt.order));
        const isBad = result && isSel && !isOk;
        return (
          <label
            key={opt.order}
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
          border: `1.5px solid ${isBad ? RED : isOk ? GREEN : "#d1d5db"}`,
          borderRadius: 6, padding: "3px 8px", fontSize: 13, fontFamily: "inherit",
          background: isBad ? RED_BG : isOk ? GREEN_BG : SURFACE,
          cursor: disabled || result ? "default" : "pointer", outline: "none",
        }}
      >
        <option value="">— Select —</option>
        {opts.map(o => <option key={o.order} value={o.order}>{o.option}</option>)}
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
function SubHead({ sub, qOffset }) {
  const count = (sub.questions ?? []).length;
  const start = qOffset + 1;
  const end   = qOffset + count;
  const range = start === end ? `Question ${start}` : `Questions ${start}–${end}`;
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{range}</h3>
      {sub.text && sub.text.split("\n").map((line, i) => (
        <Instruction key={i} text={line} />
      ))}
      {sub.title && (
        <p style={{ fontSize: 13, fontStyle: "italic", fontWeight: 700, color: TEXT, marginTop: 8 }}>
          {sub.title.toUpperCase()}
        </p>
      )}
    </div>
  );
}

// ─── Form subsection ──────────────────────────────────────────────────────────
// Renders questions as lines of text with inline blanks inside a bordered box.
function FormSubsection({ sub, answers, setAnswers, results, qOffset, disabled }) {
  const qs = sub.questions ?? [];
  return (
    <div style={{ marginBottom: 36 }}>
      <SubHead sub={sub} qOffset={qOffset} />
      <div style={{
        border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: "20px 24px", background: "#fff",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {sub.visual && (
          <img src={sub.visual} alt="" style={{ maxWidth: "100%", borderRadius: 6, marginBottom: 8 }} />
        )}
        {qs.map((q, i) => {
          const n        = qOffset + i + 1;
          const value    = answers[q.id];
          const result   = results?.[String(q.id)];
          const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));

          if (q.question_type === "fill_in_the_blank") {
            return (
              <div key={q.id} style={{ lineHeight: 2.1 }}>
                <Stem text={q.text} n={n} value={value} onChange={onChange} disabled={disabled} result={result} />
                {result && !result.is_correct && (
                  <span style={{ fontSize: 12, color: MUTED, marginLeft: 8 }}>
                    → <span style={{ color: GREEN }}>{result.correct_answer}</span>
                  </span>
                )}
              </div>
            );
          }
          return (
            <div key={q.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ paddingTop: 2 }}><Bubble n={n} /></div>
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
function GridSubsection({ sub, answers, setAnswers, results, qOffset, disabled }) {
  const qs      = sub.questions ?? [];
  const headers = (sub.grid_headers ?? []).slice().sort((a, b) => a.order - b.order);
  const cells   = sub.grid_cells ?? [];
  const numCols = headers.length || cells.reduce((m, c) => Math.max(m, c.col + 1), 0);
  const numRows = cells.reduce((m, c) => Math.max(m, c.row + 1), 0);

  const cellMap = {};
  cells.forEach(c => { cellMap[`${c.row}-${c.col}`] = c; });

  const qMap = {};
  qs.forEach((q, i) => { qMap[q.id] = { ...q, _i: i }; });

  const cellStyle = { border: `1px solid ${BORDER}`, padding: "10px 14px", color: TEXT_SUB, verticalAlign: "middle" };

  return (
    <div style={{ marginBottom: 36 }}>
      <SubHead sub={sub} qOffset={qOffset} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map(h => (
                  <th key={h.order} style={{ ...cellStyle, background: SURFACE, fontWeight: 600, color: TEXT_SUB }}>
                    {h.text}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: numRows }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: numCols }, (_, col) => {
                  const cell = cellMap[`${row}-${col}`];
                  if (!cell) return <td key={col} style={cellStyle} />;

                  const qIds = cell.question_ids ?? [];
                  if (qIds.length === 0) {
                    return <td key={col} style={cellStyle}>{cell.cell_text ?? ""}</td>;
                  }
                  return (
                    <td key={col} style={cellStyle}>
                      {qIds.map(qid => {
                        const q = qMap[qid];
                        if (!q) return null;
                        const n        = qOffset + q._i + 1;
                        const value    = answers[q.id];
                        const result   = results?.[String(q.id)];
                        const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));
                        return (
                          <span key={qid}>
                            <Stem text={q.text} n={n} value={value} onChange={onChange} disabled={disabled} result={result} />
                            {result && !result.is_correct && (
                              <span style={{ fontSize: 12, color: MUTED, marginLeft: 6 }}>
                                → <span style={{ color: GREEN }}>{result.correct_answer}</span>
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
function TableSubsection({ sub, answers, setAnswers, results, qOffset, disabled }) {
  const qs         = sub.questions ?? [];
  const sharedOpts = qs[0]?.options ?? [];
  return (
    <div style={{ marginBottom: 36 }}>
      <SubHead sub={sub} qOffset={qOffset} />
      {sharedOpts.length > 0 && (
        <div style={{
          border: `1px solid ${BORDER}`, borderRadius: 8,
          padding: "12px 18px", marginBottom: 16, background: SURFACE,
          display: "flex", flexWrap: "wrap", gap: "8px 24px",
        }}>
          {sharedOpts.map(o => (
            <span key={o.order} style={{ fontSize: 13.5, color: TEXT_SUB }}>
              <strong>{String.fromCharCode(65 + o.order)}</strong>&nbsp;&nbsp;{o.option}
            </span>
          ))}
        </div>
      )}
      {qs.map((q, i) => {
        const n        = qOffset + i + 1;
        const value    = answers[q.id];
        const result   = results?.[String(q.id)];
        const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));
        return (
          <div key={q.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <Bubble n={n} />
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
function RegularSubsection({ sub, answers, setAnswers, results, qOffset, disabled }) {
  const qs = sub.questions ?? [];
  let prevGroup = null;
  return (
    <div style={{ marginBottom: 36 }}>
      <SubHead sub={sub} qOffset={qOffset} />
      {sub.visual && (
        <img src={sub.visual} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 16 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {qs.map((q, i) => {
          const n        = qOffset + i + 1;
          const value    = answers[q.id];
          const result   = results?.[String(q.id)];
          const onChange = val => setAnswers(a => ({ ...a, [q.id]: val }));
          const label    = q.group_label;
          const showLabel = label && label !== prevGroup;
          if (showLabel) prevGroup = label;

          return (
            <div key={q.id}>
              {showLabel && (
                <p style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 10 }}>{label}</p>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {q.question_type !== "fill_in_the_blank" && (
                  <div style={{ paddingTop: 2, flexShrink: 0 }}><Bubble n={n} /></div>
                )}
                <div style={{ flex: 1 }}>
                  {q.question_type === "fill_in_the_blank" ? (
                    <Stem text={q.text} n={n} value={value} onChange={onChange} disabled={disabled} result={result} />
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
function BottomNav({ sections, activeSection, setActiveSection, answers }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "#fff", borderTop: `1px solid ${BORDER}`,
      padding: "10px 20px", display: "flex", alignItems: "center",
      gap: 0, overflowX: "auto",
    }}>
      {sections.map((sec, si) => {
        const isActive = si === activeSection;
        const qs       = (sec.subsections ?? []).flatMap(s => s.questions ?? []);
        const answered = qs.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length;
        return (
          <div key={sec.id} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {si > 0 && <div style={{ width: 1, height: 20, background: BORDER, marginRight: 4 }} />}
            <button
              onClick={() => setActiveSection(si)}
              style={{
                padding: "5px 14px", borderRadius: 99, fontWeight: 600, fontSize: 13,
                background: isActive ? ACCENT : "transparent",
                color: isActive ? "#fff" : MUTED,
                border: `1.5px solid ${isActive ? ACCENT : BORDER}`,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              Part {sec.part}
            </button>
            {isActive ? (
              <div style={{ display: "flex", gap: 4 }}>
                {qs.map((q, qi) => {
                  const done = answers[q.id] !== undefined && answers[q.id] !== "";
                  return (
                    <span key={q.id} style={{
                      width: 20, height: 20, borderRadius: "50%",
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? ACCENT : "#f3f4f6",
                      color: done ? "#fff" : MUTED_LIGHT,
                      border: `1px solid ${done ? ACCENT : BORDER}`,
                    }}>
                      {qi + 1}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: MUTED_LIGHT, whiteSpace: "nowrap" }}>
                {answered} of {qs.length}
              </span>
            )}
          </div>
        );
      })}
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

// ─── Helper: flatten all questions in a section ───────────────────────────────
function sectionQs(sec) {
  return (sec?.subsections ?? []).flatMap(s => s.questions ?? []);
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ListeningModule({
  apiBase, getToken, sessionId, onComplete, autoSubmitRef, timeLeft, onBack,
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

  // ── Load test ──
  useEffect(() => {
    async function load() {
      if (!apiBase || !sessionId) {
        await new Promise(r => setTimeout(r, 400));
        setTest(MOCK_TEST);
        setLoading(false);
        return;
      }
      try {
        const token = await getToken();
        const res   = await fetch(`${apiBase}/listening/for-session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
  }, [apiBase, sessionId]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (!apiBase || !sessionId) {
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
  }, [apiBase, sessionId, getToken, test, answers, onComplete]);

  useEffect(() => {
    if (autoSubmitRef) autoSubmitRef.current = handleSubmit;
  }, [autoSubmitRef, handleSubmit]);

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

  // ── Results view ──
  if (view === "results" && result) {
    return (
      <div className="lm">
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "#fff", borderBottom: `1px solid ${BORDER}`,
          padding: "0 20px", height: 52,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            onClick={() => { setView("test"); setResult(null); setAnswers({}); setActiveSection(0); }}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: MUTED, padding: "4px 8px" }}
          >←</button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Results — {test.title}</span>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 48px" }}>
          <ResultsPanel result={result} />
        </div>
      </div>
    );
  }

  // ── Test view ──
  const section = test.sections[activeSection];

  // Global question offset for this section (questions in earlier sections come first)
  const globalOffset = test.sections
    .slice(0, activeSection)
    .reduce((a, s) => a + sectionQs(s).length, 0);

  const secQs   = sectionQs(section);
  const secFirst = globalOffset + 1;
  const secLast  = globalOffset + secQs.length;

  // Per-subsection offsets (within the global numbering)
  let subOffset = globalOffset;
  const subsWithOffset = (section?.subsections ?? []).map(sub => {
    const off = subOffset;
    subOffset += (sub.questions ?? []).length;
    return { sub, offset: off };
  });

  const totalQ        = test.sections.reduce((a, s) => a + sectionQs(s).length, 0);
  const totalAnswered = test.sections.reduce(
    (a, s) => a + sectionQs(s).filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length,
    0
  );

  return (
    <div className="lm" style={{ minHeight: "100vh", paddingBottom: 72 }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "0 20px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: MUTED, padding: "4px 8px", flexShrink: 0 }}
        >←</button>

        {timeLeft != null && (
          <span style={{ fontSize: 13, color: MUTED, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {fmtTime(timeLeft)}
          </span>
        )}

        {section && <AudioPlayer key={section.id} section={section} />}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: ACCENT, color: "#fff", border: "none",
            borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
            whiteSpace: "nowrap", flexShrink: 0,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Submitting…" : "Finish Test"}
        </button>
      </div>

      {/* ── Part label ── */}
      <div style={{ padding: "8px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontSize: 13, color: MUTED }}>
          Part {section?.part} — Listen and answer questions {secFirst}–{secLast}
        </span>
      </div>

      {/* ── Scrollable content ── */}
      <div
        className="lm-fadein"
        key={section?.id}
        style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 24px" }}
      >
        {subsWithOffset.map(({ sub, offset }) => (
          <Subsection
            key={sub.id}
            sub={sub}
            answers={answers}
            setAnswers={setAnswers}
            results={null}
            qOffset={offset}
            disabled={false}
          />
        ))}

        {/* ── Section navigation ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => setActiveSection(s => s - 1)}
            disabled={activeSection === 0}
            style={{
              border: `1px solid ${BORDER}`, background: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: 13,
              color: activeSection === 0 ? MUTED_LIGHT : TEXT,
              cursor: activeSection === 0 ? "default" : "pointer",
            }}
          >
            ← Previous
          </button>
          {activeSection < test.sections.length - 1 ? (
            <button
              onClick={() => setActiveSection(s => s + 1)}
              style={{
                border: `1.5px solid ${ACCENT}`, background: ACCENT_LIGHT,
                borderRadius: 8, padding: "8px 18px", fontSize: 13,
                color: ACCENT, fontWeight: 600, cursor: "pointer",
              }}
            >
              Next Part →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                background: ACCENT, color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 18px", fontSize: 13,
                fontWeight: 600, cursor: submitting ? "default" : "pointer",
              }}
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