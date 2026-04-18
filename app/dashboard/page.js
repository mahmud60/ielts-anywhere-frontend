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
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "20px 24px",
      flex: 1,
      minWidth: 140,
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
  return (
    <h2 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 14, marginTop: 0 }}>
      {children}
    </h2>
  );
}

function ModuleBar({ module, avg }) {
  const pct = avg != null ? Math.min(100, (avg / 9) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#374151", textTransform: "capitalize", fontWeight: 500 }}>
          {module}
        </span>
        <BandBadge value={avg} />
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: MOD_COLOR[module],
          borderRadius: 99,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

function TipList({ tips }) {
  if (!tips || tips.length === 0) return <p style={{ color: "#9ca3af", fontSize: 13 }}>No tips yet — complete more tests.</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {tips.map((t, i) => (
        <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 4 }}>{t}</li>
      ))}
    </ul>
  );
}

function RecentTestRow({ session, router }) {
  const mods = ["listening", "reading", "writing", "speaking"];
  const date = session.completed_at
    ? new Date(session.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div
      onClick={() => router.push(`/test/${session.session_id}`)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: "1px solid #f3f4f6",
        cursor: "pointer",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
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

function UpgradeBanner() {
  const router = useRouter();
  return (
    <div style={{
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      borderRadius: 12,
      padding: "24px 28px",
      color: "#fff",
      marginBottom: 24,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Unlock detailed insights</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16, lineHeight: 1.6 }}>
        Pro members get module-by-module performance trends, AI-generated improvement tips, and vocabulary coaching based on their test history.
      </div>
      <button
        onClick={() => router.push("/pricing")}
        style={{
          background: "#fff",
          color: "#6366f1",
          border: "none",
          borderRadius: 8,
          padding: "9px 20px",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setFetching(false));
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
  const proTabs = ["overview", "tips", "vocabulary"];
  const tabs = isPro ? proTabs : ["overview"];

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
          <button
            onClick={() => router.push("/tests")}
            style={{
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Take a test
          </button>
          <button
            onClick={() => signOut(auth).then(() => router.push("/login"))}
            style={{
              background: "#fff",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "9px 18px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Tests taken" value={data.total_tests} />
        <StatCard
          label="Best score"
          value={data.best_overall != null ? data.best_overall.toFixed(1) : "—"}
          sub="overall band"
        />
        <StatCard
          label="Average score"
          value={data.avg_overall != null ? data.avg_overall.toFixed(1) : "—"}
          sub="across all tests"
        />
      </div>

      {/* Pro upgrade banner for free users */}
      {!isPro && <UpgradeBanner />}

      {/* Tabs (pro only) */}
      {isPro && (
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #e5e7eb" }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "#0ea5e9" : "#6b7280",
                borderBottom: activeTab === tab ? "2px solid #0ea5e9" : "2px solid transparent",
                marginBottom: -1,
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Overview tab */}
      {activeTab === "overview" && (
        <>
          {/* Module performance (pro) */}
          {isPro && data.module_avgs && Object.keys(data.module_avgs).length > 0 && (
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 20,
            }}>
              <SectionTitle>Module averages</SectionTitle>
              {["listening", "reading", "writing", "speaking"].map(mod =>
                data.module_avgs[mod] != null ? (
                  <ModuleBar key={mod} module={mod} avg={data.module_avgs[mod]} />
                ) : null
              )}
            </div>
          )}

          {/* Weak modules (pro) */}
          {isPro && data.weak_modules && data.weak_modules.length > 0 && (
            <div style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>⚠</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#92400e", marginBottom: 4 }}>
                  Needs attention
                </div>
                <div style={{ fontSize: 13, color: "#78350f" }}>
                  Your weakest {data.weak_modules.length === 1 ? "module is" : "modules are"}{" "}
                  {data.weak_modules.map(w => (
                    <span key={w.module} style={{ fontWeight: 600, textTransform: "capitalize" }}>
                      {w.module} ({w.avg_band.toFixed(1)})
                    </span>
                  )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [])}
                  . Focus on these to raise your overall score.
                </div>
              </div>
            </div>
          )}

          {/* Recent test history */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
              <SectionTitle>Recent tests</SectionTitle>
            </div>
            {data.recent_sessions.length === 0 ? (
              <div style={{ padding: 24, color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
                No completed tests yet. <span
                  style={{ color: "#0ea5e9", cursor: "pointer" }}
                  onClick={() => router.push("/tests")}
                >Take your first test →</span>
              </div>
            ) : (
              data.recent_sessions.map(s => (
                <RecentTestRow key={s.session_id} session={s} router={router} />
              ))
            )}
          </div>
        </>
      )}

      {/* Tips tab (pro) */}
      {activeTab === "tips" && isPro && (
        <div>
          {["listening", "reading", "writing", "speaking"].map(mod => {
            const tips = data.tips_by_module?.[mod] || [];
            return (
              <div key={mod} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "18px 22px",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: MOD_COLOR[mod],
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#111827", textTransform: "capitalize" }}>
                    {mod}
                  </span>
                  {data.module_avgs?.[mod] != null && (
                    <span style={{ marginLeft: "auto" }}>
                      <BandBadge value={data.module_avgs[mod]} />
                    </span>
                  )}
                </div>
                <TipList tips={tips} />
              </div>
            );
          })}
        </div>
      )}

      {/* Vocabulary tab (pro) */}
      {activeTab === "vocabulary" && isPro && (
        <div>
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            fontSize: 13,
            color: "#166534",
            lineHeight: 1.6,
          }}>
            These vocabulary and lexical resource tips are extracted from your AI feedback on Writing and Speaking modules.
          </div>
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "20px 24px",
          }}>
            {data.vocab_tips && data.vocab_tips.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.vocab_tips.map((tip, i) => (
                  <li key={i} style={{
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.7,
                    marginBottom: 10,
                    paddingBottom: 10,
                    borderBottom: i < data.vocab_tips.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
                No vocabulary tips yet. Complete Writing and Speaking modules to get personalised feedback.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
