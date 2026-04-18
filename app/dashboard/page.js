"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const MOD_COLOR = {
  listening: "#0ea5e9",
  reading: "#f59e0b",
  writing: "#10b981",
  speaking: "#8b5cf6",
};

const CRITERIA_LABELS = {
  task_achievement: "Task Achievement",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range: "Grammatical Range",
  fluency_coherence: "Fluency & Coherence",
  pronunciation: "Pronunciation",
};

function bandColor(b) {
  if (b == null) return "#9ca3af";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

function BandBadge({ value, size = 16 }) {
  if (value == null) return <span style={{ color: "#9ca3af", fontSize: size }}>—</span>;
  return (
    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: size, color: bandColor(value) }}>
      {value.toFixed(1)}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "20px 24px", flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: "#111827", lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 14, marginTop: 0 }}>{children}</h2>;
}

// ── Progress chart ────────────────────────────────────────────────────────────
function ProgressChart({ history }) {
  const data = history.filter(s => s.overall_band != null);
  if (data.length < 2) {
    return (
      <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
        Complete at least 2 tests to see your progress chart.
      </div>
    );
  }

  const W = 600, H = 180, PX = 36, PY = 18;
  const cW = W - PX * 2, cH = H - PY * 2;
  const MIN = 3, MAX = 9;
  const tx = i => PX + (i / (data.length - 1)) * cW;
  const ty = b => PY + cH - ((b - MIN) / (MAX - MIN)) * cH;

  const overallD = data.map((s, i) => `${i === 0 ? "M" : "L"}${tx(i).toFixed(1)},${ty(s.overall_band).toFixed(1)}`).join(" ");
  const modPaths = Object.entries(MOD_COLOR).map(([mod, color]) => {
    const pts = data.map((s, i) =>
      s.module_bands?.[mod] != null
        ? `${i === 0 ? "M" : "L"}${tx(i).toFixed(1)},${ty(s.module_bands[mod]).toFixed(1)}`
        : null
    ).filter(Boolean);
    return pts.length >= 2 ? { color, d: pts.join(" "), mod } : null;
  }).filter(Boolean);

  const dateLabel = iso => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[4, 5, 6, 7, 8, 9].map(y => (
          <g key={y}>
            <line x1={PX} y1={ty(y)} x2={W - PX} y2={ty(y)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PX - 6} y={ty(y)} textAnchor="end" dominantBaseline="middle" fill="#9ca3af" fontSize="10">{y}</text>
          </g>
        ))}
        {modPaths.map(({ color, d, mod }) => (
          <path key={mod} d={d} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 3" />
        ))}
        <path d={overallD} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((s, i) => (
          <g key={i}>
            <circle cx={tx(i)} cy={ty(s.overall_band)} r="5" fill="#0ea5e9" />
            <text x={tx(i)} y={ty(s.overall_band) - 10} textAnchor="middle" fill="#374151" fontSize="10" fontWeight="600">
              {s.overall_band.toFixed(1)}
            </text>
            {(i === 0 || i === data.length - 1) && (
              <text x={tx(i)} y={H - 4} textAnchor="middle" fill="#9ca3af" fontSize="9">
                {dateLabel(s.completed_at)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 20, height: 2.5, background: "#0ea5e9", borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: "#6b7280" }}>Overall</span>
        </div>
        {Object.entries(MOD_COLOR).map(([mod, color]) => (
          <div key={mod} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 1.5, background: color, opacity: 0.5, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>{mod.slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module bar ────────────────────────────────────────────────────────────────
function ModuleBar({ module, avg }) {
  const pct = avg != null ? Math.min(100, (avg / 9) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#374151", textTransform: "capitalize", fontWeight: 500 }}>{module}</span>
        <BandBadge value={avg} />
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: MOD_COLOR[module], borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Weakness panel ────────────────────────────────────────────────────────────
function WeaknessPanel({ weaknessByModule }) {
  if (!weaknessByModule || Object.keys(weaknessByModule).length === 0) {
    return <p style={{ color: "#9ca3af", fontSize: 13 }}>Complete Writing or Speaking tests to see criterion-level analysis.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(weaknessByModule).map(([mod, info]) => (
        <div key={mod} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: MOD_COLOR[mod], flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111827", textTransform: "capitalize" }}>{mod}</span>
            {info.weakest_label && (
              <span style={{
                marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 99,
                background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
              }}>
                Weakest: {info.weakest_label} ({info.weakest_score?.toFixed(1)})
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {Object.entries(info.criteria_avgs || {}).map(([key, { score, label }]) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11.5, color: "#6b7280" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: bandColor(score), fontFamily: "monospace" }}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3 }}>
                  <div style={{
                    width: `${(score / 9) * 100}%`, height: "100%",
                    background: bandColor(score), borderRadius: 3, transition: "width .5s",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Recent test row ───────────────────────────────────────────────────────────
function RecentTestRow({ session, router }) {
  const mods = ["listening", "reading", "writing", "speaking"];
  const date = session.completed_at
    ? new Date(session.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
  return (
    <div onClick={() => router.push(`/test/${session.session_id}`)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", borderBottom: "1px solid #f3f4f6",
      cursor: "pointer", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {session.test_title}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{date}</div>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {mods.map(m => (
          <div key={m} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: bandColor(session.module_bands?.[m]) }}>
              {session.module_bands?.[m] != null ? session.module_bands[m].toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{m.slice(0, 3)}</div>
          </div>
        ))}
        <div style={{ width: 1, background: "#e5e7eb", height: 28, marginLeft: 2 }} />
        <div style={{ textAlign: "center" }}>
          <BandBadge value={session.overall_band} size={18} />
          <div style={{ fontSize: 10, color: "#9ca3af" }}>overall</div>
        </div>
      </div>
    </div>
  );
}

// ── Upgrade banner ────────────────────────────────────────────────────────────
function UpgradeBanner({ router }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 24,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Unlock detailed insights</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16, lineHeight: 1.6 }}>
        Pro members get progress charts, criterion-level weakness analysis, improvement tips, vocabulary and grammar coaching.
      </div>
      <button onClick={() => router.push("/pricing")} style={{
        background: "#fff", color: "#6366f1", border: "none", borderRadius: 8,
        padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
      }}>
        Upgrade to Pro
      </button>
    </div>
  );
}

// ── Tip list ──────────────────────────────────────────────────────────────────
function TipList({ tips }) {
  if (!tips || tips.length === 0) return <p style={{ color: "#9ca3af", fontSize: 13 }}>Complete more tests to generate tips.</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {tips.map((t, i) => (
        <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 4 }}>{t}</li>
      ))}
    </ul>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getDashboard().then(setData).catch(console.error).finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ color: "#9ca3af" }}>Loading dashboard…</div>
      </div>
    );
  }
  if (!data) return null;

  const isPro = data.is_pro;
  const tabs = isPro
    ? ["overview", "progress", "weaknesses", "tips", "vocabulary"]
    : ["overview"];

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "#111827" }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {isPro ? "Pro account" : "Free account"} · {data.total_tests} test{data.total_tests !== 1 ? "s" : ""} completed
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/tests")} style={{
            background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Take a test</button>
          {isPro && (
            <button onClick={() => router.push("/learn/vocabulary")} style={{
              background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0",
              borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Practice</button>
          )}
          <button onClick={() => signOut(auth).then(() => router.push("/login"))} style={{
            background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb",
            borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Log out</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Tests taken" value={data.total_tests} />
        <StatCard label="Best score" value={data.best_overall != null ? data.best_overall.toFixed(1) : "—"} sub="overall band" />
        <StatCard label="Average score" value={data.avg_overall != null ? data.avg_overall.toFixed(1) : "—"} sub="across all tests" />
      </div>

      {!isPro && <UpgradeBanner router={router} />}

      {/* Tabs */}
      {isPro && (
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: "none", border: "none", padding: "8px 16px", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#0ea5e9" : "#6b7280",
              borderBottom: activeTab === tab ? "2px solid #0ea5e9" : "2px solid transparent",
              marginBottom: -1, textTransform: "capitalize", whiteSpace: "nowrap",
            }}>{tab}</button>
          ))}
        </div>
      )}

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <>
          {isPro && data.module_avgs && Object.keys(data.module_avgs).length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
              <SectionTitle>Module averages</SectionTitle>
              {["listening", "reading", "writing", "speaking"].map(mod =>
                data.module_avgs[mod] != null ? <ModuleBar key={mod} module={mod} avg={data.module_avgs[mod]} /> : null
              )}
            </div>
          )}

          {isPro && data.weak_modules?.length > 0 && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12,
              padding: "16px 20px", marginBottom: 20, display: "flex", gap: 10,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#92400e", marginBottom: 4 }}>Needs attention</div>
                <div style={{ fontSize: 13, color: "#78350f" }}>
                  {data.weak_modules.map((w, i) => (
                    <span key={w.module}>
                      {i > 0 && ", "}
                      <strong style={{ textTransform: "capitalize" }}>{w.module}</strong> ({w.avg_band.toFixed(1)})
                    </span>
                  ))}
                  {" "}— focus here to raise your overall score.
                </div>
              </div>
            </div>
          )}

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
              <SectionTitle>Recent tests</SectionTitle>
            </div>
            {data.recent_sessions.length === 0 ? (
              <div style={{ padding: 24, color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
                No completed tests yet.{" "}
                <span style={{ color: "#0ea5e9", cursor: "pointer" }} onClick={() => router.push("/tests")}>
                  Take your first test →
                </span>
              </div>
            ) : (
              data.recent_sessions.map(s => <RecentTestRow key={s.session_id} session={s} router={router} />)
            )}
          </div>
        </>
      )}

      {/* ── Progress chart ── */}
      {activeTab === "progress" && isPro && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
          <SectionTitle>Band score history</SectionTitle>
          <ProgressChart history={data.score_history || []} />
        </div>
      )}

      {/* ── Weaknesses ── */}
      {activeTab === "weaknesses" && isPro && (
        <div>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
            Criterion scores averaged across your completed Writing and Speaking tests.
            The weakest criterion per module is highlighted.
          </p>
          <WeaknessPanel weaknessByModule={data.weakness_by_module} />
        </div>
      )}

      {/* ── Tips ── */}
      {activeTab === "tips" && isPro && (
        <div>
          {["listening", "reading", "writing", "speaking"].map(mod => (
            <div key={mod} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: MOD_COLOR[mod], flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: "#111827", textTransform: "capitalize" }}>{mod}</span>
                {data.module_avgs?.[mod] != null && (
                  <span style={{ marginLeft: "auto" }}><BandBadge value={data.module_avgs[mod]} /></span>
                )}
              </div>
              <TipList tips={data.tips_by_module?.[mod]} />
            </div>
          ))}
        </div>
      )}

      {/* ── Vocabulary ── */}
      {activeTab === "vocabulary" && isPro && (
        <div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
            Vocabulary tips extracted from your Writing and Speaking AI feedback.
            For full exercises, visit the{" "}
            <span style={{ color: "#059669", cursor: "pointer", fontWeight: 600 }} onClick={() => router.push("/learn/vocabulary")}>
              Vocabulary practice page →
            </span>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            {data.vocab_tips?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.vocab_tips.map((tip, i) => (
                  <li key={i} style={{
                    fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 10,
                    paddingBottom: 10, borderBottom: i < data.vocab_tips.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}>{tip}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", margin: 0 }}>
                No vocabulary tips yet — complete Writing and Speaking modules to generate feedback.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
