"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { isProUser } from "@/lib/landingAccess";
import { useProfile } from "@/lib/useProfile";
import PetLoader from "@/components/PetLoader";
import DashboardShell from "@/components/DashboardShell";
import { BookOpen, RefreshCw, Crown, Lightbulb, AlertCircle } from "lucide-react";

const ACCENT = "#6366f1";
const SOFT = "#eef2ff";
const GRADIENT = "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)";

function ExerciseCard({ ex }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="da-card" style={{ padding: "20px 24px", marginBottom: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontSize: 11, padding: "3px 10px", borderRadius: 99,
          fontWeight: 700, background: SOFT, color: ACCENT,
          border: "1px solid #c7d2fe", display: "inline-block",
        }}>{ex.structure}</span>
      </div>

      <p style={{ fontSize: 13.5, color: "#475569", margin: "0 0 14px", lineHeight: 1.65 }}>{ex.explanation}</p>

      <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px 16px", marginBottom: 12, border: "1px solid #bae6fd" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Example</div>
        <p style={{ fontSize: 13.5, color: "#0c4a6e", fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>{ex.example}</p>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", marginBottom: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Your turn</div>
        <p style={{ fontSize: 13.5, color: "#334155", margin: 0, lineHeight: 1.6 }}>{ex.transform_task}</p>
        {showAnswer ? (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Model answer</div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "#059669", margin: 0 }}>{ex.model_answer}</p>
          </div>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            style={{ marginTop: 10, fontSize: 12.5, color: ACCENT, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
          >
            Show model answer →
          </button>
        )}
      </div>

      {ex.common_error && (
        <div style={{ display: "flex", gap: 8, background: "#fef2f2", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#991b1b", border: "1px solid #fecaca", lineHeight: 1.55 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>Common error: </strong>{ex.common_error}</span>
        </div>
      )}

      {ex.ielts_tip && (
        <div style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#64748b", borderLeft: "2px solid #c7d2fe", paddingLeft: 10, lineHeight: 1.55 }}>
          <Lightbulb size={13} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
          {ex.ielts_tip}
        </div>
      )}
    </div>
  );
}

function PatternCard({ pattern }) {
  return (
    <div className="da-card" style={{ padding: "20px 24px", marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>{pattern.name}</div>
      <p style={{ fontSize: 13.5, color: "#475569", margin: "0 0 16px", lineHeight: 1.6 }}>{pattern.when_to_use}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fef2f2", borderRadius: 10, padding: "12px 14px", border: "1px solid #fecaca" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Active / Direct</div>
          <p style={{ fontSize: 13, color: "#374151", margin: 0, fontStyle: "italic", lineHeight: 1.55 }}>{pattern.active_example}</p>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Preferred / Transformed</div>
          <p style={{ fontSize: 13, color: "#374151", margin: 0, fontStyle: "italic", lineHeight: 1.55 }}>{pattern.passive_example}</p>
        </div>
      </div>
      {pattern.ielts_tip && (
        <div style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#64748b", borderLeft: "2px solid #c7d2fe", paddingLeft: 10, marginTop: 14, lineHeight: 1.55 }}>
          <Lightbulb size={13} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
          {pattern.ielts_tip}
        </div>
      )}
    </div>
  );
}

export default function GrammarPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const { profile } = useProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => { setData(null); }, [lang]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getGrammarExercises(lang);
      setData(result);
    } catch (e) {
      if (e.message?.includes("403")) {
        setError("pro");
      } else {
        setError("Failed to generate exercises. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isPro = isProUser(profile);

  if (profile !== null && !isPro) {
    return (
      <DashboardShell title="Grammar Practice">
        <div style={{ maxWidth: 540, margin: "60px auto", textAlign: "center", padding: "0 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: SOFT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Crown size={32} color={ACCENT} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Grammar Practice is Pro</h2>
          <p style={{ color: "#64748b", lineHeight: 1.65, margin: "0 0 24px" }}>
            Unlock AI-generated grammar exercises tailored to IELTS patterns, with explanations and study tips.
          </p>
          <button onClick={() => router.push("/pricing")} style={{ padding: "13px 32px", borderRadius: 12, border: "none", background: GRADIENT, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Upgrade to Pro
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Grammar Practice">
      {/* Hero */}
      <div style={{
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        background: GRADIENT, color: "#fff",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        boxShadow: "0 16px 36px -16px #6366f199",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BookOpen size={26} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 5px" }}>Grammar Practice</h1>
          <p style={{ fontSize: 13.5, opacity: .9, margin: 0, lineHeight: 1.5, maxWidth: 480 }}>
            AI-generated exercises tailored to IELTS — structures, transformations, and common error patterns.
          </p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,.15)", borderRadius: 9, padding: 3, flexShrink: 0 }}>
          {[{ code: "en", label: "EN" }, { code: "bn", label: "বাং" }].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              style={{
                padding: "5px 13px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 12.5, fontWeight: 700,
                background: lang === code ? "rgba(255,255,255,.9)" : "transparent",
                color: lang === code ? ACCENT : "rgba(255,255,255,.8)",
                transition: "background .15s",
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Empty state */}
        {!data && !loading && !error && (
          <div style={{
            textAlign: "center", padding: "56px 24px",
            background: "#fff", borderRadius: 20, border: "1px solid #edeff4",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: SOFT,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", border: "1px solid #c7d2fe",
            }}>
              <BookOpen size={32} color={ACCENT} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>Ready when you are</h2>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, maxWidth: 360, margin: "0 auto 28px" }}>
              Each session gives you AI-tailored grammar exercises — different every time, based on high-frequency IELTS patterns.
            </p>
            <button
              onClick={generate}
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                padding: "13px 28px", borderRadius: 12, border: "none",
                background: GRADIENT, color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                boxShadow: "0 10px 24px -10px #6366f199",
              }}
            >
              <BookOpen size={16} /> Generate exercises
            </button>
          </div>
        )}

        {loading && <PetLoader label="is building your exercises" accent={ACCENT} />}

        {/* Pro error */}
        {error === "pro" && (
          <div style={{
            background: "#fff", border: "1px solid #edeff4", borderRadius: 16,
            padding: "32px 28px", textAlign: "center",
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px", border: "1px solid #fecaca",
            }}>
              <Crown size={28} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Pro required</h3>
            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, maxWidth: 320, margin: "0 auto 24px" }}>
              Grammar Practice is a Pro feature. Upgrade to unlock AI grammar exercises, pattern cards, and study tips.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "none",
                background: GRADIENT, color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >Upgrade to Pro</button>
          </div>
        )}

        {/* Generic error */}
        {error && error !== "pro" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", fontSize: 13.5, color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Exercises */}
        {data && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {data.focus_areas?.map((area, i) => (
                  <span key={i} style={{
                    fontSize: 11.5, padding: "4px 12px", borderRadius: 99,
                    fontWeight: 600, background: SOFT, color: ACCENT, border: "1px solid #c7d2fe",
                  }}>{area}</span>
                ))}
              </div>
              <button
                onClick={generate}
                disabled={loading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 9, border: "1px solid #edeff4",
                  background: "#fff", color: "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                }}
              >
                <RefreshCw size={13} /> New exercises
              </button>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Exercises</div>
            {data.exercises?.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}

            {data.patterns?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", margin: "28px 0 12px" }}>Grammar Patterns</div>
                {data.patterns.map((p, i) => <PatternCard key={i} pattern={p} />)}
              </>
            )}

            {data.study_tip && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14,
                padding: "16px 20px", marginTop: 16,
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <Lightbulb size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13.5, color: "#78350f", lineHeight: 1.65 }}>
                  <strong>Study tip: </strong>{data.study_tip}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
