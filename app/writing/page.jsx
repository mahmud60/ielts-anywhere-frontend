"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Clock, Sparkles, FileText, ArrowRight, Lock, Crown, Award } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import { api } from "@/lib/api";
import { isProUser } from "@/lib/landingAccess";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

const ACCENT = "#10b981";
const ACCENT_SOFT = "#d1fae5";
const GRADIENT = "linear-gradient(135deg,#10b981 0%,#059669 100%)";

function bandColor(b) {
  if (!b || b <= 0) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}
function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function WritingPage() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [tests, setTests] = useState(null);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getWritingTests().then((d) => setTests(Array.isArray(d) ? d : [])).catch(() => setTests([]));
    api.getWritingAttempts().then(setHistory).catch(() => {});
    api.getMe().then(setProfile).catch(() => {});
  }, [user]);

  if (loading || tests === null) {
    return (
      <DashboardShell title={t.writingTestsTitle}>
        <PetLoader fullScreen label="is warming up" />
      </DashboardShell>
    );
  }

  const isPro = isProUser(profile);

  return (
    <DashboardShell title={t.writingTestsTitle}>
      {/* Hero */}
      <div style={{
        borderRadius: 20, padding: "28px 30px", marginBottom: 24, background: GRADIENT, color: "#fff",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", boxShadow: `0 18px 40px -18px ${ACCENT}aa`,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, flexShrink: 0, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PenLine size={30} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>{t.writingTestsTitle}</h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, opacity: .92, margin: 0, maxWidth: 520 }}>{t.writingSubtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { icon: <Clock size={12} />, label: t.duration, value: t.min60 },
            { icon: <Sparkles size={12} />, label: t.feedbackLabel, value: t.aiGraded },
          ].map((f) => (
            <div key={f.label} style={{ background: "rgba(255,255,255,.14)", borderRadius: 12, padding: "10px 14px", minWidth: 96 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: .85, marginBottom: 4 }}>{f.icon}{f.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro banner */}
      {!isPro && profile !== null && (
        <div className="da-card" style={{ background: "linear-gradient(120deg,#eef2ff,#f5f3ff)", border: "1px solid #e0e7ff", padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#312e81" }}>{t.writingIsProFeature}</div>
              <p style={{ fontSize: 13, color: "#4338ca", margin: "2px 0 0", lineHeight: 1.5 }}>{t.aiGradedProDesc}</p>
            </div>
          </div>
          <button className="da-btn da-btn-pro" onClick={() => router.push("/pricing")}>
            <Crown size={15} /> {t.upgradeToPro}
          </button>
        </div>
      )}

      {/* Tests */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t.availableTests}</h2>
        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{tests.length}</span>
      </div>

      {tests.length === 0 ? (
        <div className="da-card" style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>{t.noWritingTestsYet}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
          {tests.map((test, i) => {
            const isStarting = starting === test.id;
            const start = () => { if (isPro) { setStarting(test.id); router.push(`/writing/${test.id}`); } else router.push("/pricing"); };
            return (
              <div key={test.id} className="da-pcard" onClick={() => !isStarting && start()} style={{ padding: 0, overflow: "hidden", opacity: isStarting ? 0.65 : 1 }}>
                <div style={{ height: 6, background: GRADIENT }} />
                <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: ACCENT_SOFT, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    {!isPro ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#6366f1", background: "#eef2ff", borderRadius: 99, padding: "5px 11px" }}>
                        <Crown size={12} /> {t.pro}
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#64748b", background: "#f4f5f9", borderRadius: 99, padding: "5px 11px" }}>
                        <Clock size={12} /> {t.approxMin60}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 5, lineHeight: 1.35 }}>{test.title}</div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
                    {test.test_type === "academic" ? t.academicWriting : t.generalTrainingWriting}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18, marginTop: "auto" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#475569", background: "#f4f5f9", borderRadius: 8, padding: "5px 10px" }}>
                      <FileText size={12} /> {test.task_count ?? 2} {test.task_count !== 1 ? t.taskNounPlural : t.taskNounSingular}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: isPro ? GRADIENT : "#eef2ff", color: isPro ? "#fff" : "#6366f1", borderRadius: 11, padding: "11px 16px", fontSize: 14, fontWeight: 700 }}>
                    {isStarting ? t.opening : isPro ? <>{t.startTest} <ArrowRight size={16} /></> : <><Lock size={15} /> {t.unlockWithPro}</>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "32px 0 14px" }}>{t.pastResults}</h2>
          <div className="da-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="da-table">
                <thead>
                  <tr>
                    <th>{t.testCol}</th>
                    <th>{t.dateCol}</th>
                    <th>{t.statusCol}</th>
                    <th>{t.bandCol}</th>
                    <th style={{ textAlign: "right" }}>{t.reportCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => (
                    <tr key={a.id} className="clickable" onClick={() => router.push(`/writing/results/${a.id}`)}>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>{t.writingTestLabel}</td>
                      <td style={{ color: "#64748b" }}>{fmtDate(a.created_at)}</td>
                      <td style={{ color: "#64748b" }}>{a.status === "complete" ? t.graded : a.status === "pending" ? t.gradingStatus : a.status}</td>
                      <td><span style={{ fontFamily: "monospace", fontWeight: 700, color: bandColor(a.overall_band) }}>{a.overall_band != null ? Number(a.overall_band).toFixed(1) : "—"}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button className="da-btn da-btn-ghost" style={{ padding: "6px 14px", fontSize: 12.5 }} onClick={(e) => { e.stopPropagation(); router.push(`/writing/results/${a.id}`); }}>{t.viewBtn}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
        <button onClick={() => router.push("/reports")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e6e8ef", borderRadius: 11, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
          <Award size={16} color={ACCENT} /> {t.viewPastResults}
        </button>
      </div>
    </DashboardShell>
  );
}