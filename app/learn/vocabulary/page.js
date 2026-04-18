"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const s = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "40px 20px" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 16 },
  tag: { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, marginRight: 6 },
  btn: { padding: "10px 22px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" },
};

function Skeleton() {
  return (
    <div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ ...s.card, animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ height: 18, background: "#f3f4f6", borderRadius: 4, width: "40%", marginBottom: 10 }} />
          <div style={{ height: 13, background: "#f3f4f6", borderRadius: 4, width: "80%", marginBottom: 6 }} />
          <div style={{ height: 13, background: "#f3f4f6", borderRadius: 4, width: "60%" }} />
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ))}
    </div>
  );
}

function WordCard({ ex }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div style={s.card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{ex.word}</span>
          <span style={{ ...s.tag, background: "#e0f2fe", color: "#0369a1", marginLeft: 8 }}>{ex.part_of_speech}</span>
          {ex.ielts_topics?.map(t => (
            <span key={t} style={{ ...s.tag, background: "#f0fdf4", color: "#166534" }}>{t}</span>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 14, color: "#374151", margin: "8px 0 4px" }}>{ex.definition}</p>
      <p style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", margin: "0 0 12px" }}>"{ex.example_sentence}"</p>

      {/* Gap fill */}
      <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gap fill</div>
        <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>{ex.gap_fill}</p>
        {showAnswer ? (
          <p style={{ fontSize: 14, fontWeight: 700, color: "#059669", margin: "6px 0 0" }}>→ {ex.gap_fill_answer}</p>
        ) : (
          <button onClick={() => setShowAnswer(true)} style={{
            marginTop: 6, fontSize: 12, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>Show answer</button>
        )}
      </div>

      {/* Collocations */}
      {ex.collocations?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Collocations: </span>
          {ex.collocations.map((c, i) => (
            <span key={i} style={{ ...s.tag, background: "#faf5ff", color: "#7c3aed" }}>{c}</span>
          ))}
        </div>
      )}

      {ex.usage_tip && (
        <div style={{ fontSize: 12, color: "#6b7280", borderLeft: "2px solid #e5e7eb", paddingLeft: 10 }}>
          {ex.usage_tip}
        </div>
      )}
    </div>
  );
}

function PhraseCard({ phrase }) {
  const [showEx, setShowEx] = useState(false);
  return (
    <div style={{ ...s.card, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>"{phrase.phrase}"</span>
        <span style={{ ...s.tag, background: "#f0f9ff", color: "#0369a1" }}>{phrase.register}</span>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "6px 0 8px" }}>{phrase.meaning}</p>
      {showEx ? (
        <p style={{ fontSize: 13, color: "#374151", fontStyle: "italic", margin: 0 }}>"{phrase.example}"</p>
      ) : (
        <button onClick={() => setShowEx(true)} style={{
          fontSize: 12, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>Show example sentence</button>
      )}
    </div>
  );
}

export default function VocabularyPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getVocabularyExercises();
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
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "#111827" }}>Vocabulary Practice</h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          AI-generated exercises personalised to your IELTS weak areas.
        </p>
      </div>

      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
            Click below to generate vocabulary exercises tailored to your performance history.
            Each set focuses on lexical gaps identified in your Writing and Speaking tests.
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
                <span key={i} style={{ ...s.tag, background: "#e0f2fe", color: "#0369a1", fontSize: 12 }}>{area}</span>
              ))}
            </div>
            <button onClick={generate} disabled={loading} style={{
              ...s.btn, background: "none", color: "#6b7280", border: "1px solid #e5e7eb",
              padding: "7px 14px", fontSize: 13,
            }}>
              Refresh ↺
            </button>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Words & Expressions</h2>
          {data.exercises?.map((ex, i) => <WordCard key={i} ex={ex} />)}

          {data.phrases?.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "24px 0 12px" }}>Academic Phrases</h2>
              {data.phrases.map((p, i) => <PhraseCard key={i} phrase={p} />)}
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
