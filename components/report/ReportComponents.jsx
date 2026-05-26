"use client";

import { useState } from "react";

// ── Palette ───────────────────────────────────────────────────────────────────
export const PRIMARY  = "#0080ff";
export const BORDER   = "#e2e8f0";
export const TEXT     = "#0f172a";
export const TEXT_SUB = "#475569";
export const MUTED    = "#94a3b8";
export const GREEN    = "#059669";
export const AMBER    = "#d97706";
export const RED      = "#dc2626";

export function bandColor(b) {
  if (!b || b <= 0) return MUTED;
  if (b >= 7.5) return PRIMARY;
  if (b >= 6.5) return GREEN;
  if (b >= 5)   return AMBER;
  return RED;
}
export function bandBg(b) {
  if (!b || b <= 0) return "#f1f5f9";
  if (b >= 7.5) return "#eff6ff";
  if (b >= 6.5) return "#f0fdf4";
  if (b >= 5)   return "#fffbeb";
  return "#fef2f2";
}
export function cefrLabel(b) {
  if (!b) return "–";
  if (b >= 8.5) return "C2";
  if (b >= 7)   return "C1";
  if (b >= 5.5) return "B2";
  if (b >= 4)   return "B1";
  return "A2";
}

// ── Text segmenter ────────────────────────────────────────────────────────────
export function segmentText(text, errors) {
  if (!errors?.length || !text) return [{ text }];
  const sorted = errors
    .map(e => ({ ...e, pos: text.indexOf(e.originalText) }))
    .filter(e => e.pos >= 0)
    .sort((a, b) => a.pos - b.pos);
  const clean = [];
  let end = 0;
  for (const e of sorted) {
    if (e.pos >= end) { clean.push(e); end = e.pos + e.originalText.length; }
  }
  const segs = [];
  let pos = 0;
  for (const e of clean) {
    if (e.pos > pos) segs.push({ text: text.slice(pos, e.pos) });
    segs.push({ text: e.originalText, errId: e.id ?? e.originalText });
    pos = e.pos + e.originalText.length;
  }
  if (pos < text.length) segs.push({ text: text.slice(pos) });
  return segs;
}

// ── CriterionCard ─────────────────────────────────────────────────────────────
export function CriterionCard({ crit, expanded, onToggle }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 12,
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: crit.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: TEXT }}>{crit.label}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: bandColor(crit.band), minWidth: 36, textAlign: "right" }}>
          {crit.band != null ? Number(crit.band).toFixed(1) : "–"}
        </span>
        <span style={{ color: MUTED, fontSize: 16, marginLeft: 4 }}>{expanded ? "∧" : "∨"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 18px 14px 18px", borderTop: `1px solid ${BORDER}` }}>
          {crit.sub?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 0 10px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                What examiners look for
              </div>
              {crit.sub.map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: crit.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: TEXT_SUB }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: bandColor(s.band) }}>{s.band?.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ margin: crit.sub?.length ? "10px 0 0" : "12px 0 0", fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>
            {crit.summary ?? crit.feedback}
          </p>
        </div>
      )}
    </div>
  );
}

// ── ErrorItem ─────────────────────────────────────────────────────────────────
export function ErrorItem({ num, error, color }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", background: color,
          color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{num}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: TEXT }}>{error.label}</span>
      </div>
      {error.originalText && (
        <div style={{ marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
          <span style={{
            background: "#fef2f2", color: RED, padding: "1px 7px", borderRadius: 4,
            textDecoration: "line-through", display: "inline",
          }}>{error.originalText.length > 60 ? error.originalText.slice(0, 60) + "…" : error.originalText}</span>
          {error.correctedText && (
            <>
              <span style={{ color: MUTED, margin: "0 6px" }}>→</span>
              <span style={{
                background: "#f0fdf4", color: GREEN, padding: "1px 7px", borderRadius: 4, display: "inline",
              }}>{error.correctedText.length > 70 ? error.correctedText.slice(0, 70) + "…" : error.correctedText}</span>
            </>
          )}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 12, color: TEXT_SUB, lineHeight: 1.55 }}>{error.note}</p>
    </div>
  );
}

// ── AnnotatedText ─────────────────────────────────────────────────────────────
export function AnnotatedText({ text, errors, showHighlights, color }) {
  if (!text) return null;
  if (!showHighlights) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.85, color: TEXT_SUB, whiteSpace: "pre-wrap" }}>
        {text}
      </div>
    );
  }
  const segs = segmentText(text, errors);
  return (
    <div style={{ fontSize: 13, lineHeight: 1.85, color: TEXT_SUB, whiteSpace: "pre-wrap" }}>
      {segs.map((s, i) =>
        s.errId ? (
          <span key={i} style={{ borderBottom: `2.5px solid ${color}`, paddingBottom: 1 }}>
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </div>
  );
}

// ── DetailedFeedback (criterion tabs + annotated text + errors panel) ─────────
export function DetailedFeedback({ text, criteria, errorsMap, taskPrompt }) {
  const critKeys = criteria.map(c => c.key);
  const [activeCrit, setActiveCrit] = useState(critKeys[0]);
  const [showHighlights, setShowHighlights] = useState(true);

  const crit = criteria.find(c => c.key === activeCrit);
  const errors = errorsMap?.[activeCrit] ?? [];

  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 20px 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 16 }}>Detailed Feedback</div>

      {taskPrompt && (
        <div style={{
          background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: TEXT_SUB, lineHeight: 1.6,
        }}>
          {taskPrompt}
        </div>
      )}

      {/* Criterion tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {criteria.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCrit(c.key)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: activeCrit === c.key ? c.color : "#f1f5f9",
              color: activeCrit === c.key ? "#fff" : TEXT_SUB,
              transition: "background .15s",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Left: annotated text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginRight: 4 }}>Your Writing</span>
            {["Original", "Highlighted"].map(mode => (
              <button
                key={mode}
                onClick={() => setShowHighlights(mode === "Highlighted")}
                style={{
                  padding: "3px 12px", borderRadius: 14, fontSize: 11, fontWeight: 600,
                  border: "none", cursor: "pointer",
                  background: (showHighlights ? "Highlighted" : "Original") === mode ? TEXT : "#f1f5f9",
                  color: (showHighlights ? "Highlighted" : "Original") === mode ? "#fff" : MUTED,
                }}
              >
                {mode}
              </button>
            ))}
          </div>
          <div style={{
            background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
            maxHeight: 440, overflowY: "auto",
          }}>
            <AnnotatedText
              text={text}
              errors={errors}
              showHighlights={showHighlights}
              color={crit?.color ?? PRIMARY}
            />
          </div>
        </div>

        {/* Right: error list */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>
            {crit?.label} Issues
          </div>
          {errors.length > 0
            ? errors.map((e, i) => <ErrorItem key={i} num={i + 1} error={e} color={crit?.color ?? PRIMARY} />)
            : <p style={{ fontSize: 13, color: MUTED }}>No issues found for this criterion.</p>
          }
        </div>
      </div>
    </div>
  );
}

// ── SpeakingErrorPanel (criterion tabs + transcript + errors panel) ────────────
export function SpeakingErrorPanel({ transcript, criteria, errorsMap }) {
  const critKeys = criteria.map(c => c.key);
  const [activeCrit, setActiveCrit] = useState(critKeys[0]);

  const crit = criteria.find(c => c.key === activeCrit);
  const errors = errorsMap?.[activeCrit] ?? [];

  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 20px 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 16 }}>Detailed Feedback</div>

      {/* Criterion tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {criteria.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCrit(c.key)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: activeCrit === c.key ? c.color : "#f1f5f9",
              color: activeCrit === c.key ? "#fff" : TEXT_SUB,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Left: transcript */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Transcript</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 420, overflowY: "auto" }}>
            {transcript.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 13px", borderRadius: 12,
                  fontSize: 13, lineHeight: 1.55, color: TEXT,
                  background: msg.role === "user" ? "#eff6ff" : "#f1f5f9",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                  borderBottomLeftRadius: msg.role === "agent" ? 4 : 12,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {msg.role === "agent" ? "Examiner" : "You"}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: error list */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>
            {crit?.label} Notes
          </div>
          {errors.length > 0
            ? errors.map((e, i) => <ErrorItem key={i} num={i + 1} error={e} color={crit?.color ?? PRIMARY} />)
            : <p style={{ fontSize: 13, color: MUTED }}>No issues found for this criterion.</p>
          }
        </div>
      </div>
    </div>
  );
}