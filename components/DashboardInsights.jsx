"use client";

import { useRouter } from "next/navigation";
import { Crown, Lock, ArrowRight } from "lucide-react";
import { MOD_COLORS } from "@/lib/moduleColors";
import { VocabularyPractice } from "@/app/learn/vocabulary/page";

const MODULES = ["listening", "reading", "writing", "speaking"];
const TAB_IDS = ["overview", "progress", "studyplan", "vocabulary"];
const TAB_LABELS = {
  overview:   "Overview",
  progress:   "Progress",
  studyplan:  "Study Plan",
  vocabulary: "Vocabulary",
};

function bandColor(b) {
  if (b == null || b <= 0) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

function BandBadge({ value, size = 16 }) {
  if (value == null) return <span style={{ color: "#94a3b8", fontSize: size }}>—</span>;
  return <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: size, color: bandColor(value) }}>{value.toFixed(1)}</span>;
}

export function ProgressChart({ history }) {
  const data = (history || []).filter((s) => s.overall_band != null);
  if (data.length < 2) {
    return <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Complete at least 2 tests to see your progress chart.</div>;
  }
  const W = 600, H = 200, PX = 36, PY = 20;
  const cW = W - PX * 2, cH = H - PY * 2;
  const MIN = 3, MAX = 9;
  const tx = (i) => PX + (i / (data.length - 1)) * cW;
  const ty = (b) => PY + cH - ((b - MIN) / (MAX - MIN)) * cH;
  const overallD = data.map((s, i) => `${i === 0 ? "M" : "L"}${tx(i).toFixed(1)},${ty(s.overall_band).toFixed(1)}`).join(" ");
  const modPaths = Object.entries(MOD_COLORS).map(([mod, color]) => {
    const pts = data.map((s, i) => (s.module_bands?.[mod] != null ? `${i === 0 ? "M" : "L"}${tx(i).toFixed(1)},${ty(s.module_bands[mod]).toFixed(1)}` : null)).filter(Boolean);
    return pts.length >= 2 ? { color, d: pts.join(" "), mod } : null;
  }).filter(Boolean);

  const dateLabel = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[4, 5, 6, 7, 8, 9].map((y) => (
          <g key={y}>
            <line x1={PX} y1={ty(y)} x2={W - PX} y2={ty(y)} stroke="#f1f3f8" strokeWidth="1" />
            <text x={PX - 6} y={ty(y)} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" fontSize="10">{y}</text>
          </g>
        ))}
        {modPaths.map(({ color, d, mod }) => (
          <path key={mod} d={d} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 3" />
        ))}
        <path d={overallD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((s, i) => (
          <g key={i}>
            <circle cx={tx(i)} cy={ty(s.overall_band)} r="5" fill="#6366f1" />
            <text x={tx(i)} y={ty(s.overall_band) - 10} textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">{s.overall_band.toFixed(1)}</text>
            {(i === 0 || i === data.length - 1) && <text x={tx(i)} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize="9">{dateLabel(s.completed_at)}</text>}
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 20, height: 2.5, background: "#6366f1", borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: "#64748b" }}>Overall</span>
        </div>
        {Object.entries(MOD_COLORS).map(([mod, color]) => (
          <div key={mod} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 1.5, background: color, opacity: 0.5, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{mod.slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeaknessPanel({ weaknessByModule }) {
  if (!weaknessByModule || Object.keys(weaknessByModule).length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: 13 }}>Complete Writing or Speaking tests to see criterion-level analysis.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.entries(weaknessByModule).map(([mod, info]) => (
        <div key={mod} className="da-card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: MOD_COLORS[mod], flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", textTransform: "capitalize" }}>{mod}</span>
            {info.weakest_label && (
              <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                Weakest: {info.weakest_label} ({info.weakest_score?.toFixed(1)})
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {Object.entries(info.criteria_avgs || {}).map(([key, { score, label }]) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11.5, color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: bandColor(score), fontFamily: "monospace" }}>{score.toFixed(1)}</span>
                </div>
                <div style={{ height: 5, background: "#eef0f5", borderRadius: 3 }}>
                  <div style={{ width: `${(score / 9) * 100}%`, height: "100%", background: bandColor(score), borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TipList({ tips }) {
  if (!tips || tips.length === 0) return <p style={{ color: "#94a3b8", fontSize: 13 }}>Complete more tests to generate tips.</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {tips.map((tip, i) => <li key={i} style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginBottom: 6 }}>{tip}</li>)}
    </ul>
  );
}

export function LockedTeaser({ title, blurb }) {
  const router = useRouter();
  return (
    <div
      className="da-card"
      style={{
        padding: "48px 32px 40px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        minHeight: 300,
        background: "linear-gradient(180deg,#fafbff 0%,#fff 100%)",
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lock size={26} color="#6366f1" />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 14, color: "#64748b", maxWidth: 420, margin: "0 auto", lineHeight: 1.65 }}>{blurb}</p>
      </div>
      <button className="da-btn da-btn-pro" onClick={() => router.push("/pricing")} style={{ marginTop: 4 }}>
        <Crown size={15} /> Upgrade to Pro
      </button>
    </div>
  );
}

export function ProgressSection({ dash, isPro }) {
  if (isPro) {
    return (
      <>
        <div className="da-card" style={{ padding: "22px 24px", marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Band score history</h3>
          <ProgressChart history={dash?.score_history || []} />
        </div>
        {dash?.weak_modules?.length > 0 && (
          <div className="da-card" style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "16px 20px", display: "flex", gap: 10 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#92400e", marginBottom: 4 }}>Needs attention</div>
              <div style={{ fontSize: 13, color: "#78350f" }}>
                {dash.weak_modules.map((w, i) => (
                  <span key={w.module}>{i > 0 && ", "}<strong style={{ textTransform: "capitalize" }}>{w.module}</strong> ({w.avg_band.toFixed(1)})</span>
                ))} — focus here to raise your overall score.
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  return <LockedTeaser title="Track your progress over time" blurb="Pro unlocks band-score history charts and module trend tracking so you can see exactly how you improve." />;
}

export function StudyPlanSection({ dash, isPro }) {
  if (isPro) {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {MODULES.map((mod) => (
            <div key={mod} className="da-card" style={{ padding: "18px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: MOD_COLORS[mod] }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", textTransform: "capitalize" }}>{mod}</span>
                {dash?.module_avgs?.[mod] != null && <span style={{ marginLeft: "auto" }}><BandBadge value={dash.module_avgs[mod]} /></span>}
              </div>
              <TipList tips={dash?.tips_by_module?.[mod]} />
            </div>
          ))}
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 14px" }}>Criterion analysis</h2>
        <WeaknessPanel weaknessByModule={dash?.weakness_by_module} />
      </>
    );
  }
  return <LockedTeaser title="Get a personalized study plan" blurb="Pro turns your Writing and Speaking AI feedback into module-by-module tips and criterion-level weakness analysis." />;
}

export function VocabularySection({ dash, isPro }) {
  const router = useRouter();
  if (isPro) return <VocabularyPractice showBack={false} />;
  if (isPro) {
    return (
      <>
        <div className="da-card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 18px", marginBottom: 16, fontSize: 13, color: "#166534", lineHeight: 1.6, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span>Vocabulary tips extracted from your Writing and Speaking AI feedback.</span>
          <button className="da-btn da-btn-ghost" onClick={() => router.push("/learn/vocabulary")} style={{ fontSize: 12.5 }}>
            Practice exercises <ArrowRight size={14} />
          </button>
        </div>
        <div className="da-card" style={{ padding: "20px 24px" }}>
          {dash?.vocab_tips?.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dash.vocab_tips.map((tip, i) => (
                <li key={i} style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 10, paddingBottom: 10, borderBottom: i < dash.vocab_tips.length - 1 ? "1px solid #f1f3f8" : "none" }}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", margin: 0 }}>
              No vocabulary tips yet — complete Writing and Speaking modules to generate feedback.
            </p>
          )}
        </div>
      </>
    );
  }
  return <LockedTeaser title="Build exam-ready vocabulary" blurb="Pro extracts vocabulary tips from your AI feedback and unlocks dedicated vocabulary and grammar exercises." />;
}

export function InsightTabBar({ tab, setTab, isPro }) {
  return (
    <div className="da-seg" style={{ marginBottom: 22 }}>
      {TAB_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`da-seg-item ${tab === id ? "active" : ""}`}
          onClick={() => setTab(id)}
        >
          {TAB_LABELS[id] || id}
          {id !== "overview" && !isPro && <Lock size={12} />}
        </button>
      ))}
    </div>
  );
}

export const INSIGHT_TABS = TAB_IDS.map((id) => ({ id }));
