/**
 * WritingModule.jsx
 *
 * IELTS Writing module — two tasks, AI grading via Claude Haiku,
 * async polling until grading completes.
 *
 * Props:
 *   apiBase   — FastAPI URL e.g. "http://localhost:8000"
 *   getToken  — async () => Firebase ID token string
 *   sessionId — UUID string of the current TestSession
 *   onComplete— callback fired after grading completes and session is advanced
 *
 * Key difference from Listening/Reading:
 *   Submit returns immediately with status="pending".
 *   This component polls GET /writing/attempts/{id} every 2s
 *   until status == "complete", then calls onComplete().
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderFocus: "#0ea5e9",
  accent: "#0ea5e9",
  accentDim: "#e0f2fe",
  green: "#059669",
  greenDim: "#d1fae5",
  gold: "#d97706",
  goldDim: "#fef3c7",
  red: "#dc2626",
  redDim: "#fee2e2",
  purple: "#7c3aed",
  purpleDim: "#ede9fe",
  text: "#0f172a",
  muted: "#64748b",
  mutedLight: "#94a3b8",
};

const CRITERIA_LABELS = {
  task_achievement: "Task Achievement",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range: "Grammatical Range",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
  .wm * { box-sizing: border-box; margin: 0; padding: 0; }
  .wm { font-family: 'Inter', sans-serif; color: ${C.text}; background: ${C.bg}; }
  @keyframes wm-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes wm-spin { to { transform:rotate(360deg); } }
  @keyframes wm-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes wm-dots { 0%{content:'.'} 33%{content:'..'} 66%{content:'...'} 100%{content:'.'} }
  .wm-fadeup { animation: wm-fadeup .3s ease both; }
  .wm-card { background:${C.surface}; border:1px solid ${C.border}; border-radius:12px; }
  .wm-spinner { width:18px; height:18px; border:2px solid ${C.border}; border-top-color:${C.accent}; border-radius:50%; animation:wm-spin .7s linear infinite; display:inline-block; }
  .wm-btn { font-family:'Inter',sans-serif; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; padding:9px 20px; transition:all .15s; }
  .wm-btn-primary { background:${C.accent}; color:#fff; }
  .wm-btn-primary:hover { background:#0284c7; }
  .wm-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .wm-btn-outline { background:transparent; color:${C.accent}; border:1px solid ${C.accent}44; }
  .wm-btn-outline:hover { background:${C.accentDim}; }
  .wm-btn-ghost { background:transparent; color:${C.muted}; border:none; }
  .wm-textarea { width:100%; font-family:'Lora',serif; font-size:15px; line-height:1.85; color:${C.text}; background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; padding:16px 18px; resize:vertical; transition:border-color .15s; }
  .wm-textarea:focus { outline:none; border-color:${C.borderFocus}; }
  .wm-badge { border-radius:99px; font-size:11px; font-weight:600; letter-spacing:.05em; padding:2px 10px; text-transform:uppercase; display:inline-block; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function bandColor(band) {
  if (band >= 7) return C.green;
  if (band >= 5.5) return C.gold;
  return C.red;
}

function Badge({ children, color }) {
  return (
    <span className="wm-badge" style={{ background: color + "18", color, border: `1px solid ${color}33` }}>
      {children}
    </span>
  );
}

function Spinner() {
  return <span className="wm-spinner" />;
}

// ─── Word count indicator ─────────────────────────────────────────────────────
function WordCount({ count, min }) {
  const met = count >= min;
  const color = met ? C.green : count > min * 0.8 ? C.gold : C.muted;
  const pct = Math.min(100, (count / min) * 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color }}>
          {count} words {met ? "✓" : `— ${min - count} more needed`}
        </span>
        <span style={{ fontSize: 12, color: C.mutedLight }}>Min {min} words</span>
      </div>
      <div style={{ height: 3, background: C.border, borderRadius: 4 }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: met ? C.green : count > min * 0.8 ? C.gold : C.border,
          borderRadius: 4, transition: "width .2s, background .2s",
        }} />
      </div>
    </div>
  );
}

// ─── Task editor ──────────────────────────────────────────────────────────────
function TaskEditor({ task, value, onChange, submitted }) {
  const wc = countWords(value);
  const isTask2 = task.task_number === 2;

  return (
    <div className="wm-card" style={{ padding: "20px 24px", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Badge color={isTask2 ? C.purple : C.accent}>
          Task {task.task_number}
        </Badge>
        <span style={{ fontSize: 13, color: C.muted }}>
          {isTask2 ? "Discursive Essay" : "Academic Report"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.mutedLight }}>
          Min {task.min_words} words
        </span>
      </div>

      {/* Prompt */}
      <div style={{
        padding: "14px 16px",
        background: isTask2 ? C.purpleDim : C.accentDim,
        borderRadius: 8,
        marginBottom: task.stimulus ? 12 : 18,
        fontSize: 14,
        lineHeight: 1.7,
        color: C.text,
        borderLeft: `3px solid ${isTask2 ? C.purple : C.accent}`,
      }}>
        {task.prompt}
      </div>

      {/* Stimulus (graph description for Task 1) */}
      {task.stimulus && (
        <div style={{
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 8,
          marginBottom: 18,
          fontSize: 13,
          lineHeight: 1.7,
          color: C.muted,
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: "pre-line",
          border: `1px solid ${C.border}`,
        }}>
          {task.stimulus}
        </div>
      )}

      {/* Writing area */}
      <textarea
        className="wm-textarea"
        rows={isTask2 ? 14 : 10}
        disabled={submitted}
        value={value}
        onChange={e => !submitted && onChange(e.target.value)}
        placeholder={
          isTask2
            ? "Write your essay here…\n\nRemember to:\n• State your position clearly\n• Support arguments with examples\n• Address counterarguments\n• Write a clear conclusion"
            : "Write your report here…\n\nRemember to:\n• Describe the overall trend first\n• Compare key data points\n• Use precise language for figures and percentages"
        }
        style={{ minHeight: isTask2 ? 280 : 200 }}
      />

      <WordCount count={wc} min={task.min_words} />
    </div>
  );
}

// ─── Grading in progress screen ───────────────────────────────────────────────
function GradingScreen() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Spinner />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>
        Grading your writing{dots}
      </h2>
      <p style={{ color: C.muted, fontSize: 14, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
        Our AI examiner is carefully evaluating your responses against the
        official IELTS band descriptors. This takes about 5–10 seconds.
      </p>
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8, maxWidth: 280, margin: "28px auto 0" }}>
        {["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range"].map((c, i) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: C.accent,
              animation: `wm-pulse 1.2s ease-in-out ${i * 0.25}s infinite`,
            }} />
            <span style={{ fontSize: 12, color: C.mutedLight }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Criteria score row ───────────────────────────────────────────────────────
function CriteriaRow({ label, score }) {
  const color = bandColor(score);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono'", color, fontWeight: 500 }}>
          {score.toFixed(1)}
        </span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 4 }}>
        <div style={{
          width: `${(score / 9) * 100}%`, height: "100%",
          background: color, borderRadius: 4, transition: "width .5s ease",
        }} />
      </div>
    </div>
  );
}

// ─── Task result card ─────────────────────────────────────────────────────────
function TaskResultCard({ taskScore, response }) {
  const [showResponse, setShowResponse] = useState(false);
  const isTask2 = taskScore.task_number === 2;
  const bc = bandColor(taskScore.band);

  return (
    <div className="wm-card wm-fadeup" style={{ padding: "20px 24px", marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Badge color={isTask2 ? C.purple : C.accent}>Task {taskScore.task_number}</Badge>
        <div style={{
          fontSize: 32, fontWeight: 700, color: bc,
          fontFamily: "'JetBrains Mono'",
        }}>
          {taskScore.band.toFixed(1)}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          {taskScore.word_count} words
        </div>
        <button
          className="wm-btn wm-btn-ghost"
          style={{ marginLeft: "auto", fontSize: 12 }}
          onClick={() => setShowResponse(s => !s)}
        >
          {showResponse ? "Hide response" : "View your response"}
        </button>
      </div>

      {/* Criteria scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", marginBottom: 16 }}>
        {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
          <CriteriaRow key={key} label={label} score={taskScore[key]} />
        ))}
      </div>

      {/* Examiner feedback */}
      <div style={{
        padding: "12px 16px", background: C.accentDim,
        borderRadius: 8, fontSize: 13.5, lineHeight: 1.7,
        color: "#0c4a6e", borderLeft: `3px solid ${C.accent}`,
      }}>
        <strong style={{ color: C.accent }}>Examiner feedback: </strong>
        {taskScore.feedback}
      </div>

      {/* Student's response (collapsible) */}
      {showResponse && response && (
        <div style={{
          marginTop: 14, padding: "14px 16px",
          background: "#f8fafc", borderRadius: 8,
          fontSize: 14, lineHeight: 1.85,
          fontFamily: "'Lora', serif", color: C.text,
          border: `1px solid ${C.border}`,
          whiteSpace: "pre-wrap",
        }}>
          {response}
        </div>
      )}
    </div>
  );
}

// ─── Full results screen ──────────────────────────────────────────────────────
function ResultsScreen({ result, responses, onRetry }) {
  const bc = bandColor(result.overall_band);

  return (
    <div className="wm-fadeup" style={{ padding: "24px 0" }}>
      {/* Overall band */}
      <div className="wm-card" style={{
        padding: "28px 32px", marginBottom: 20,
        borderColor: bc + "55",
        display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Overall band
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, color: bc, fontFamily: "'JetBrains Mono'", lineHeight: 1 }}>
            {result.overall_band.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            Task 2 weighted double
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            {result.overall_band >= 7
              ? "Strong performance — well above average"
              : result.overall_band >= 6
              ? "Competent — working towards your target band"
              : "Developing — focused practice will help significantly"}
          </div>
          {result.improvement_tips?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {result.improvement_tips.map((tip, i) => (
                <div key={i} style={{
                  fontSize: 13, color: C.muted, lineHeight: 1.6,
                  paddingLeft: 12, borderLeft: `2px solid ${C.gold}`,
                }}>
                  {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-task results */}
      {result.task_scores?.map(ts => (
        <TaskResultCard
          key={ts.task_number}
          taskScore={ts}
          response={responses[ts.task_number]}
        />
      ))}

      <button className="wm-btn wm-btn-ghost" onClick={onRetry}
        style={{ marginTop: 8, fontSize: 13 }}>
        ← Retake writing test
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WritingModule({ apiBase, getToken, sessionId, onComplete, autoSubmitRef }) {
  // Inject CSS
  useEffect(() => {
    const id = "wm-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // responses keyed by task UUID
  const [responses, setResponses] = useState({});

  const [activeTask, setActiveTask] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [grading, setGrading] = useState(false);   // polling in progress
  const [result, setResult] = useState(null);
  const [view, setView] = useState("write");        // "write" | "grading" | "results"

  const pollRef = useRef(null);

  // Load writing test
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(
          `${apiBase}/writing/for-session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setTest(data);
        // Initialise response state keyed by task id
        const init = {};
        data.tasks.forEach(t => { init[String(t.id)] = ""; });
        setResponses(init);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (apiBase && sessionId) load();
  }, [apiBase, sessionId, getToken]);

  // Polling loop — runs after submit until grading completes
  const startPolling = useCallback((aid) => {
    setGrading(true);
    setView("grading");

    pollRef.current = setInterval(async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBase}/writing/attempts/${aid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "complete") {
          clearInterval(pollRef.current);
          setResult(data);
          setGrading(false);
          setView("results");
          // Advance the session — writing is done
          if (onComplete) onComplete();
        } else if (data.status === "failed") {
          clearInterval(pollRef.current);
          setGrading(false);
          setError("Grading failed — please try submitting again.");
          setView("write");
        }
        // status === "pending" or "grading" → keep polling
      } catch (e) {
        // Network error — keep polling, don't stop
        console.warn("Polling error:", e.message);
      }
    }, 2000);  // poll every 2 seconds
  }, [apiBase, getToken, onComplete]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleSubmit = async () => {
    if (!test) return;
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/writing/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          test_id: test.id,
          responses,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Submit succeeded — start polling for grading result
      setAttemptId(data.attempt_id);
      startPolling(data.attempt_id);
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

  const handleRetry = () => {
    setView("write");
    setResult(null);
    setAttemptId(null);
    if (test) {
      const init = {};
      test.tasks.forEach(t => { init[String(t.id)] = ""; });
      setResponses(init);
    }
  };

  // ── Loading / error ──
  if (loading) {
    return (
      <div className="wm" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <div style={{ color: C.muted, fontSize: 13, marginTop: 12 }}>Loading writing test…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wm" style={{ padding: 24 }}>
        <div style={{ padding: 16, background: C.redDim, borderRadius: 10, color: C.red, fontSize: 13 }}>
          {error}
        </div>
        <button className="wm-btn wm-btn-ghost" style={{ marginTop: 12 }} onClick={() => setError(null)}>
          Try again
        </button>
      </div>
    );
  }

  if (!test) return null;

  // ── Grading screen ──
  if (view === "grading") {
    return (
      <div className="wm">
        <GradingScreen />
      </div>
    );
  }

  // ── Results screen ──
  if (view === "results" && result) {
    // Map task responses by task_number for the results view
    const responsesByNumber = {};
    test.tasks.forEach(t => {
      responsesByNumber[t.task_number] = responses[String(t.id)];
    });

    return (
      <div className="wm">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "24px 0 0" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Writing results</h2>
          <Badge color={C.green}>Complete</Badge>
        </div>
        <ResultsScreen result={result} responses={responsesByNumber} onRetry={handleRetry} />
      </div>
    );
  }

  // ── Writing view ──
  const task = test.tasks[activeTask];
  const allWordsMet = test.tasks.every(t => {
    const wc = countWords(responses[String(t.id)] || "");
    return wc >= t.min_words;
  });
  const totalWords = Object.values(responses).reduce((acc, r) => acc + countWords(r), 0);

  return (
    <div className="wm" style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>Writing Test</h2>
          <div style={{ fontSize: 13, color: C.muted }}>{test.title} · 60 minutes</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            <span style={{ fontFamily: "'JetBrains Mono'", color: allWordsMet ? C.green : C.accent }}>
              {totalWords}
            </span>
            {" total words"}
          </span>
          <button
            className="wm-btn wm-btn-primary"
            disabled={!allWordsMet || submitting}
            onClick={handleSubmit}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {submitting ? <><Spinner /> Submitting…</> : "Submit for AI grading"}
          </button>
        </div>
      </div>

      {/* Task tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {test.tasks.map((t, i) => {
          const wc = countWords(responses[String(t.id)] || "");
          const met = wc >= t.min_words;
          const isActive = i === activeTask;
          return (
            <button
              key={t.id}
              className="wm-btn"
              onClick={() => setActiveTask(i)}
              style={{
                padding: "8px 18px",
                background: isActive ? C.accentDim : "transparent",
                color: isActive ? C.accent : C.muted,
                border: `1px solid ${isActive ? C.accent + "55" : C.border}`,
              }}
            >
              Task {t.task_number}
              <span style={{
                marginLeft: 8, fontSize: 11,
                fontFamily: "'JetBrains Mono'",
                color: met ? C.green : C.muted,
              }}>
                {wc}/{t.min_words}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task editor */}
      {task && (
        <div className="wm-fadeup" key={task.id}>
          <TaskEditor
            task={task}
            value={responses[String(task.id)] || ""}
            onChange={val => setResponses(r => ({ ...r, [String(task.id)]: val }))}
            submitted={submitting}
          />
        </div>
      )}

      {/* IELTS criteria reference */}
      <div className="wm-card" style={{ padding: "14px 20px" }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Graded on 4 criteria
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
          {Object.values(CRITERIA_LABELS).map(label => (
            <div key={label} style={{ fontSize: 13, color: C.mutedLight, padding: "3px 0" }}>
              · {label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.mutedLight }}>
          Task 2 carries twice the weight of Task 1 in the final band score.
        </div>
      </div>

      {/* Submission note */}
      {!allWordsMet && (
        <div style={{
          marginTop: 14, padding: "10px 14px",
          background: C.goldDim, borderRadius: 8,
          fontSize: 13, color: "#78350f",
          border: `1px solid #fbbf2444`,
        }}>
          Complete both tasks to the minimum word count before submitting.
          {test.tasks.map(t => {
            const wc = countWords(responses[String(t.id)] || "");
            if (wc < t.min_words) {
              return (
                <span key={t.id} style={{ display: "block", marginTop: 2 }}>
                  Task {t.task_number}: {t.min_words - wc} more words needed
                </span>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}