"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import PetLoader from "@/components/PetLoader";

const s = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "40px 20px" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 16 },
  tag: { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600, marginRight: 6 },
  btn: { padding: "10px 22px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  label: { fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" },
};

function ExerciseCard({ ex, t }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div style={s.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...s.tag, background: "#f0fdf4", color: "#166534" }}>{ex.structure}</span>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0, marginBottom: 10, lineHeight: 1.6 }}>{ex.explanation}</p>

      <div style={{ background: "#f0f9ff", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <span style={s.label}>{t.exampleLabel}</span>
        <p style={{ fontSize: 14, color: "#0c4a6e", fontStyle: "italic", margin: 0 }}>{ex.example}</p>
      </div>

      <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <span style={s.label}>{t.yourTurn}</span>
        <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>{ex.transform_task}</p>
        {showAnswer ? (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
            <span style={s.label}>{t.modelAnswer}</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#059669", margin: 0 }}>{ex.model_answer}</p>
          </div>
        ) : (
          <button onClick={() => setShowAnswer(true)} style={{
            marginTop: 8, fontSize: 12, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>{t.showModelAnswer}</button>
        )}
      </div>

      {ex.common_error && (
        <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#991b1b" }}>
          <strong>{t.commonError} </strong>{ex.common_error}
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

function PatternCard({ pattern, t }) {
  return (
    <div style={{ ...s.card, background: "#fafafa" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>{pattern.name}</div>
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0, marginBottom: 12, lineHeight: 1.6 }}>{pattern.when_to_use}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 12px" }}>
          <span style={s.label}>{t.activeDirect}</span>
          <p style={{ fontSize: 13, color: "#374151", margin: 0, fontStyle: "italic" }}>{pattern.active_example}</p>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
          <span style={s.label}>{t.preferredTransformed}</span>
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
  const { lang, t, setLang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { setData(null); }, [lang]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getGrammarExercises(lang);
      setData(result);
    } catch (e) {
      setError(e.message.includes("403") ? t.proRequired : t.failedGenerate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <button onClick={() => router.back()} style={{
        background: "none", border: "none", color: "#6b7280", cursor: "pointer",
        fontSize: 13, padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4,
      }}>{t.back}</button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "#111827" }}>{t.grammarPractice}</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{t.grammarDesc}</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "#f1f5f9", borderRadius: 8, padding: 3, flexShrink: 0, marginTop: 4 }}>
          {[{ code: "en", label: "EN" }, { code: "bn", label: "বাং" }].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: lang === code ? "#fff" : "transparent",
                color: lang === code ? "#0f172a" : "#94a3b8",
                boxShadow: lang === code ? "0 1px 3px rgba(0,0,0,.1)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✏️</div>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>{t.grammarGenDesc}</p>
          <button onClick={generate} style={{ ...s.btn, background: "#0ea5e9", color: "#fff" }}>
            {t.generateExercises}
          </button>
        </div>
      )}

      {loading && <PetLoader label="is building your exercises" />}

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
              {t.refresh}
            </button>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 12 }}>{t.exercises}</h2>
          {data.exercises?.map((ex, i) => <ExerciseCard key={i} ex={ex} t={t} />)}

          {data.patterns?.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: "24px 0 12px" }}>{t.grammarPatterns}</h2>
              {data.patterns.map((p, i) => <PatternCard key={i} pattern={p} t={t} />)}
            </>
          )}

          {data.study_tip && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
              padding: "14px 18px", marginTop: 8, fontSize: 14, color: "#78350f", lineHeight: 1.6,
            }}>
              <strong>{t.studyTipLabel} </strong>{data.study_tip}
            </div>
          )}
        </>
      )}
    </div>
  );
}