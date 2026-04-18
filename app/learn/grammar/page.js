"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const s = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "40px 20px" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 16 },
  tag: { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, marginRight: 6 },
  btn: { padding: "10px 22px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  label: { fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" },
};

function Skeleton() {
  return (
    <div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ ...s.card, animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ height: 16, background: "#f3f4f6", borderRadius: 4, width: "50%", marginBottom: 12 }} />
          <div style={{ height: 13, background: "#f3f4f6", borderRadius: 4, width: "90%", marginBottom: 6 }} />
          <div style={{ height: 13, background: "#f3f4f6", borderRadius: 4, width: "70%" }} />
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ))}
    </div>
  );
}

function ExerciseCard({ ex }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div style={s.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...s.tag, background: "#f0fdf4", color: "#166534" }}>{ex.structure}</span>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0, marginBottom: 10, lineHeight: 1.6 }}>{ex.explanation}</p>

      <div style={{ background: "#f0f9ff", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <span style={s.label}>Example</span>
        <p style={{ fontSize: 14, color: "#0c4a6e", fontStyle: "italic", margin: 0 }}>{ex.example}</p>
      </div>

      <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <span style={s.label}>Your turn — transform this sentence</span>
        <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>{ex.transform_task}</p>
        {showAnswer ? (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
            <span style={s.label}>Model answer</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#059669", margin: 0 }}>{ex.model_answer}</p>
          </div>
        ) : (
          <button onClick={() => setShowAnswer(true)} style={{
            marginTop: 8, fontSize: 12, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>Show model answer</button>
        )}
      </div>

      {ex.common_error && (
        <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#991b1b" }}>
          <strong>Common error: </strong>{ex.common_error}
        </div>
      )}

      {ex.ielts_tip && (
        <div style={{ fontSize: 12, color: "#6b7280", borderLeft: "2px solid #e5e7eb", paddingLeft: 10 }}>
          {ex.ielts_tip}
        </div>
      )}
    </div>
  );
}

function PatternCard({ pattern }) {
  return (
    <div style={{ ...s.card, background: "#fafafa" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>{pattern.name}</div>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0, marginBottom: 12, lineHeight: 1.6 }}>{pattern.when_to_use}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 12px" }}>
          <span style={s.label}>Active / Direct</span>
          <p style={{ fontSize: 13, color: "#374151", margin: 0, fontStyle: "italic" }}>{pattern.active_example}</p>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
          <span style={s.label}>Preferred / Transformed</span>
          <p style={{ fontSize: 13, color: "#374151", margin: 0, fontStyle: "italic" }}>{pattern.passive_example}</p>
        </div>
      </div>
      {pattern.ielts_tip && (
        <div style={{ fontSize: 12, color: "#6b7280", borderLeft: "2px solid #e5e7eb", paddingLeft: 10, marginTop: 12 }}>
          {pattern.ielts_tip}
        </div>
      )}
    </div>
  );
}

export default function GrammarPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getGrammarExercises();
      setData(result);
    } catch (e) {
      setError(e.message.includes("403") ? "Pro subscription required." : "Failed to generate exercises. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <button onClick={() => router.back()} style={{
        background: "none", border: "none", color: "#6b7280", cursor: "pointer",
        fontSize: 13, padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4,
      }}>← Back</button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "#111827" }}>Grammar Practice</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          AI-generated exercises targeting your grammatical weak points.
        </p>
      </div>

      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✏️</div>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
            Generate grammar exercises based on patterns identified in your Writing and Speaking tests.
            Exercises are tailored to your current band level.
          </p>
          <button onClick={generate} style={{ ...s.btn, background: "#0ea5e9", color: "#fff" }}>
            Generate exercises
          </button>
        </div>
      )}

      {loading && <Skeleton />}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              {data.focus_areas?.map((area, i) => (
                <span key={i} style={{ ...s.tag, background: "#f0fdf4", color: "#166534", fontSize: 12 }}>{area}</span>
              ))}
            </div>
            <button onClick={generate} disabled={loading} style={{
              ...s.btn, background: "none", color: "#6b7280", border: "1px solid #e5e7eb",
              padding: "7px 14px", fontSize: 13,
            }}>
              Refresh ↺
            </button>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Exercises</h2>
          {data.exercises?.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}

          {data.patterns?.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "24px 0 12px" }}>Grammar Patterns</h2>
              {data.patterns.map((p, i) => <PatternCard key={i} pattern={p} />)}
            </>
          )}

          {data.study_tip && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
              padding: "14px 18px", marginTop: 8, fontSize: 14, color: "#78350f", lineHeight: 1.6,
            }}>
              <strong>Study tip: </strong>{data.study_tip}
            </div>
          )}
        </>
      )}
    </div>
  );
}
