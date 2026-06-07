"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isProUser } from "@/lib/landingAccess";
import { MOD_COLORS, MODULE_META } from "@/lib/moduleColors";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";
import {
  ProgressSection,
  StudyPlanSection,
  VocabularySection,
} from "@/components/DashboardInsights";

const MODULES = ["listening", "reading", "writing", "speaking"];

function bandColor(b) {
  if (b == null || b <= 0) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function BandBadge({ value, size = 16 }) {
  if (value == null) return <span style={{ color: "#94a3b8", fontSize: size }}>—</span>;
  return <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: size, color: bandColor(value) }}>{value.toFixed(1)}</span>;
}

const TABS = [
  { id: "reports", label: "Reports" },
  { id: "progress", label: "Progress" },
  { id: "studyplan", label: "Study Plan" },
  { id: "vocabulary", label: "Vocabulary" },
];

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("reports");
  const [filter, setFilter] = useState("All");
  const [dash, setDash] = useState(null);
  const [listening, setListening] = useState([]);
  const [reading, setReading] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    Promise.allSettled([
      api.getDashboard(),
      api.getListeningAttempts(),
      api.getReadingAttempts(),
    ]).then(([d, l, r]) => {
      if (cancelled) return;
      if (d.status === "fulfilled") setDash(d.value);
      if (l.status === "fulfilled") setListening(l.value || []);
      if (r.status === "fulfilled") setReading(r.value || []);
    }).finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [user]);

  const isPro = isProUser(dash);

  const attempts = useMemo(() => {
    const all = [
      ...listening.map((a) => ({ ...a, module: "listening" })),
      ...reading.map((a) => ({ ...a, module: "reading" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return filter === "All" ? all : all.filter((a) => a.module === filter.toLowerCase());
  }, [listening, reading, filter]);

  const viewReport = (a) => {
    if (a.module === "listening") router.push(`/listening/results/${a.id}`);
    else router.push(`/reading/results/${a.id}`);
  };

  if (loading || (fetching && !dash)) {
    return (
      <DashboardShell title="My Reports">
        <PetLoader fullScreen label="is gathering your reports" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="My Reports">
      <div className="da-seg" style={{ marginBottom: 22 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`da-seg-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id !== "reports" && !isPro && <Lock size={12} />}
          </button>
        ))}
      </div>

      {tab === "reports" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            {["All", "Listening", "Reading"].map((f) => {
              const count = f === "Listening" ? listening.length : f === "Reading" ? reading.length : null;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="da-btn"
                  style={{
                    padding: "7px 16px",
                    background: filter === f ? MOD_COLORS.listening : "#fff",
                    color: filter === f ? "#fff" : "#475569",
                    border: `1px solid ${filter === f ? MOD_COLORS.listening : "#edeff4"}`,
                  }}
                >
                  {f}
                  {count != null && <span style={{ marginLeft: 2, opacity: 0.8 }}>({count})</span>}
                </button>
              );
            })}
          </div>

          <div className="da-card" style={{ overflow: "hidden" }}>
            {attempts.length === 0 ? (
              <div style={{ padding: "56px 24px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#475569", marginBottom: 6 }}>No reports yet</div>
                <div style={{ fontSize: 14 }}>
                  Complete a test to see your results here.{" "}
                  <span style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => router.push("/diagnostic")}>
                    Start a diagnostic →
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="da-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Task</th>
                      <th className="da-col-opt">Result</th>
                      <th>Score</th>
                      <th style={{ textAlign: "right" }}>Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => {
                      const mod = MODULE_META[a.module] || { label: a.module, color: "#64748b", bg: "#f1f5f9" };
                      return (
                        <tr key={`${a.module}-${a.id}`} className="clickable" onClick={() => viewReport(a)}>
                          <td style={{ whiteSpace: "nowrap", color: "#64748b" }}>{fmtDate(a.created_at)}</td>
                          <td>
                            <span className="da-chip" style={{ background: mod.bg, color: mod.color }}>{mod.label}</span>
                          </td>
                          <td className="da-col-opt" style={{ color: "#64748b" }}>{(a.correct ?? 0)}/{(a.total ?? 0)} correct</td>
                          <td><BandBadge value={a.overall_band > 0 ? a.overall_band : null} size={15} /></td>
                          <td style={{ textAlign: "right" }}>
                            <button className="da-btn da-btn-ghost" style={{ padding: "6px 14px", fontSize: 12.5 }} onClick={(e) => { e.stopPropagation(); viewReport(a); }}>
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(dash?.recent_sessions || []).length > 0 && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "28px 0 14px", color: "#0f172a" }}>Full test sessions</h2>
              <div className="da-card" style={{ overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="da-table">
                    <thead>
                      <tr>
                        <th>Test</th>
                        {MODULES.map((m) => <th key={m} style={{ textTransform: "capitalize" }} className="da-col-opt">{m.slice(0, 3)}</th>)}
                        <th>Overall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.recent_sessions.map((s) => (
                        <tr key={s.session_id} className="clickable" onClick={() => router.push(`/test/${s.session_id}`)}>
                          <td>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{s.test_title || "IELTS test"}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              {s.completed_at ? new Date(s.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </div>
                          </td>
                          {MODULES.map((m) => (
                            <td key={m} className="da-col-opt"><BandBadge value={s.module_bands?.[m]} size={13} /></td>
                          ))}
                          <td><BandBadge value={s.overall_band} size={16} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "progress" && <ProgressSection dash={dash} isPro={isPro} />}
      {tab === "studyplan" && <StudyPlanSection dash={dash} isPro={isPro} />}
      {tab === "vocabulary" && <VocabularySection dash={dash} isPro={isPro} />}
    </DashboardShell>
  );
}
