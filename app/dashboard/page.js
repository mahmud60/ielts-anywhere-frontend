"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ClipboardList,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Crown,
  Target,
  Sparkles,
  Award,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isProUser, setCachedProfile } from "@/lib/landingAccess";
import { MOD_COLORS } from "@/lib/moduleColors";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";
import {
  InsightTabBar,
  ProgressSection,
  StudyPlanSection,
  VocabularySection,
} from "@/components/DashboardInsights";

function S({ w = "100%", h = 18, r = 6, mb = 0, style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "db-shimmer 1.6s ease-in-out infinite",
      marginBottom: mb,
      flexShrink: 0,
      ...style,
    }} />
  );
}

function DashboardSkeleton({ user }) {
  return (
    <>
      <style>{`@keyframes db-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{greeting()},</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 0", color: "#0f172a", textTransform: "capitalize" }}>
          {displayName(user)}
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[80, 72, 88, 90].map((w, i) => <S key={i} w={w} h={34} r={10} />)}
      </div>

      <div style={{ borderRadius: 18, background: "#fff", border: "1px solid #e6e8ef", padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <S w={120} h={14} r={5} mb={10} />
            <S w="80%" h={40} r={8} mb={8} />
            <S w="55%" h={13} r={5} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ borderRadius: 12, background: "#f8fafc", border: "1px solid #e6e8ef", padding: "14px 18px", minWidth: 90 }}>
                <S w={60} h={12} r={4} mb={8} />
                <S w={50} h={22} r={6} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="da-stat-row" style={{ marginBottom: 26 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ borderRadius: 14, background: "#fff", border: "1px solid #e6e8ef", padding: "18px 20px", flex: 1, minWidth: 120 }}>
            <S w={32} h={32} r={10} mb={12} />
            <S w="60%" h={13} r={4} mb={6} />
            <S w="45%" h={22} r={6} />
          </div>
        ))}
      </div>

      <S w={120} h={16} r={5} mb={14} />
      <div className="da-grid-practice" style={{ marginBottom: 26 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ borderRadius: 16, background: "#fff", border: "1px solid #e6e8ef", padding: 20 }}>
            <S w={40} h={40} r={12} mb={14} />
            <S w="70%" h={16} r={5} mb={8} />
            <S w="90%" h={12} r={4} mb={6} />
            <S w="75%" h={12} r={4} mb={20} />
            <S h={38} r={10} />
          </div>
        ))}
      </div>

      <S w={140} h={16} r={5} mb={14} />
      <div className="da-card" style={{ padding: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}>
            <S w={38} h={38} r={10} />
            <div style={{ flex: 1 }}>
              <S w="55%" h={14} r={4} mb={6} />
              <S w="35%" h={11} r={4} />
            </div>
            <S w={50} h={26} r={8} />
          </div>
        ))}
      </div>
    </>
  );
}

const MODULES = ["listening", "reading", "writing", "speaking"];
const MOD_COLOR = MOD_COLORS;
const TARGET_KEY = "ielts_target_band";

function bandColor(b) {
  if (b == null) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function displayName(user) {
  if (user?.displayName) return user.displayName;
  if (user?.email) return user.email.split("@")[0];
  return "there";
}

function isNewDashboardUser(data) {
  if (!data) return false;
  const total = data.total_tests ?? data.testsTaken ?? 0;
  if (Number(total) === 0) return true;
  const recent = data.recent_sessions ?? data.recentSessions;
  if (!recent || (Array.isArray(recent) && recent.length === 0)) return true;
  return false;
}

function BandBadge({ value, size = 16 }) {
  if (value == null) return <span style={{ color: "#94a3b8", fontSize: size }}>—</span>;
  return (
    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: size, color: bandColor(value) }}>
      {value.toFixed(1)}
    </span>
  );
}

const MOD_LABELS = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

function TargetRing({ best, target }) {
  const R = 56, S = 10, C = 2 * Math.PI * R;
  const pct = best != null && target ? Math.min(1, best / target) : 0;
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={S} />
        <circle cx="70" cy="70" r={R} fill="none" stroke="#fff" strokeWidth={S} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, fontFamily: "monospace" }}>
          {best != null ? best.toFixed(1) : "—"}
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>of {Number(target).toFixed(1)} target</div>
      </div>
    </div>
  );
}

function SummaryHero({ data, target, setTarget }) {
  const best = data.best_overall ?? null;
  const avg = data.avg_overall ?? null;
  const moduleAvgs = data.module_avgs || {};
  const hasModules = Object.values(moduleAvgs).some((v) => v != null);

  return (
    <div className="da-card da-hero" style={{ overflow: "hidden", marginBottom: 18 }}>
      <div style={{
        background: "linear-gradient(150deg,#4f46e5 0%,#7c3aed 60%,#8b5cf6 100%)",
        padding: "26px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 18, color: "#fff",
      }}>
        <TargetRing best={best} target={target} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={15} style={{ opacity: 0.9 }} />
          <span style={{ fontSize: 12.5, opacity: 0.9 }}>Target band</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} style={{
            background: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.3)",
            borderRadius: 8, padding: "4px 8px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {["5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"].map((v) => (
              <option key={v} value={v} style={{ color: "#0f172a" }}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>Module breakdown</h3>
          <span style={{ fontSize: 12.5, color: "#64748b" }}>Avg {avg != null ? avg.toFixed(1) : "—"}</span>
        </div>
        {hasModules ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {MODULES.map((mod) => {
              const v = moduleAvgs[mod];
              const pct = v != null ? Math.min(100, (v / 9) * 100) : 0;
              return (
                <div key={mod}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{MOD_LABELS[mod] || mod}</span>
                    <BandBadge value={v} size={13} />
                  </div>
                  <div style={{ background: "#eef0f5", borderRadius: 99, height: 7, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: MOD_COLOR[mod], borderRadius: 99, transition: "width .7s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "#64748b", fontSize: 13.5, lineHeight: 1.6 }}>
            Complete a test to see your per-module band breakdown here. Start with a free diagnostic to estimate your current level.
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub, tint }) {
  return (
    <div className="da-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div className="da-iconwrap" style={{ width: 34, height: 34, borderRadius: 9, background: tint.bg, color: tint.fg }}>{icon}</div>
        <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1, fontFamily: "monospace" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function PracticeCard({ icon, color, title, sub, badge, badgeTone, onClick, cta }) {
  return (
    <button type="button" className="da-pcard" onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div className="da-iconwrap" style={{ background: color + "18", color }}>{icon}</div>
        {badge && (
          <span className="da-chip" style={{
            background: badgeTone === "pro" ? "#eef2ff" : "#f0f9ff",
            color: badgeTone === "pro" ? "#4f46e5" : "#0369a1",
          }}>
            {badgeTone === "pro" && <Crown size={12} />}
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{title}</div>
      <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5, margin: "0 0 14px", flex: 1 }}>{sub}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color }}>
        {cta} <ArrowRight size={15} />
      </div>
    </button>
  );
}

function GettingStarted({ steps, pct }) {
  return (
    <div className="da-card" style={{ padding: "22px 24px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={18} color="#6366f1" />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Getting started</h3>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>{pct}% complete</span>
      </div>
      <div style={{ background: "#eef0f5", borderRadius: 99, height: 8, overflow: "hidden", margin: "10px 0 18px" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 99, transition: "width .7s ease" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((st) => (
          <div key={st.label} onClick={st.done ? undefined : st.action} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 11, border: "1px solid #eef0f5",
            background: st.done ? "#f0fdf4" : "#fff", cursor: st.done ? "default" : "pointer",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: st.done ? "#16a34a" : "#eef2ff", color: st.done ? "#fff" : "#6366f1",
            }}>
              {st.done ? <Check size={14} /> : st.icon}
            </div>
            <span style={{
              fontSize: 13.5, fontWeight: 500, flex: 1,
              color: st.done ? "#15803d" : "#334155",
              textDecoration: st.done ? "line-through" : "none",
            }}>{st.label}</span>
            {!st.done && <ChevronRight size={16} color="#cbd5e1" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ session, router }) {
  const date = session.completed_at
    ? new Date(session.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
  return (
    <div className="da-act-row" onClick={() => router.push(`/test/${session.session_id}`)}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div className="da-iconwrap" style={{ background: "#eef2ff", color: "#6366f1", width: 38, height: 38, borderRadius: 10 }}>
          <Award size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {session.test_title || "IELTS test"}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <Clock size={12} /> {date}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }} className="da-act-mods">
          {MODULES.map((m) => (
            <div key={m} style={{ textAlign: "center", minWidth: 26 }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: bandColor(session.module_bands?.[m]) }}>
                {session.module_bands?.[m] != null ? session.module_bands[m].toFixed(1) : "—"}
              </div>
              <div style={{ fontSize: 9.5, color: "#94a3b8", textTransform: "capitalize" }}>{m.slice(0, 3)}</div>
            </div>
          ))}
        </div>
        <div style={{ width: 1, height: 28, background: "#edeff4" }} />
        <div style={{ textAlign: "center", minWidth: 36 }}>
          <BandBadge value={session.overall_band} size={18} />
          <div style={{ fontSize: 9.5, color: "#94a3b8" }}>overall</div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>{title}</h2>
      {action}
    </div>
  );
}

const DASH_CACHE_KEY = "ielts_dashboard_cache";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [target, setTargetState] = useState("7.0");
  const [tab, setTab] = useState("overview");

  useIsomorphicLayoutEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(DASH_CACHE_KEY) || "null");
      if (cached) { setData(cached); setFetching(false); }
      const saved = localStorage.getItem(TARGET_KEY);
      if (saved) setTargetState(saved);
    } catch {}
  }, []);

  const setTarget = (v) => {
    setTargetState(v);
    if (typeof window !== "undefined") window.localStorage.setItem(TARGET_KEY, v);
  };

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.getDashboard()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setFetching(false);
          try {
            localStorage.setItem(DASH_CACHE_KEY, JSON.stringify(d));
            setCachedProfile(d);
          } catch {}
        }
      })
      .catch((err) => { if (!cancelled) { setError(err instanceof Error ? err.message : "Could not load dashboard."); setFetching(false); } });
    return () => { cancelled = true; };
  }, [user]);

  const isPro = isProUser(data);
  const isNew = isNewDashboardUser(data);

  const targetMet = useMemo(() => {
    if (!data) return false;
    return data.best_overall != null && data.best_overall >= Number(target);
  }, [data, target]);

  if (!data) {
    return (
      <DashboardShell title="Home">
        <DashboardSkeleton user={user} />
      </DashboardShell>
    );
  }

  const totalTests = data.total_tests ?? 0;
  const hasFullMock = (data.recent_sessions || []).some(
    (s) => s.module_bands?.writing != null || s.module_bands?.speaking != null
  );
  const fullMockHref = isPro ? "/tests?mode=full_mock" : "/pricing";

  const practiceCards = [
    { id: "reading",  icon: <BookOpen size={20} />,   color: MOD_COLOR.reading,  title: "Reading",  sub: "Practice passages and question types, untimed and pressure-free.", badge: "Free", badgeTone: "free", cta: "Practice", onClick: () => router.push("/reading") },
    { id: "listening",icon: <Headphones size={20} />, color: MOD_COLOR.listening, title: "Listening",sub: "Train with authentic audio and exam-style questions.",              badge: "Free", badgeTone: "free", cta: "Practice", onClick: () => router.push("/listening") },
    { id: "writing",  icon: <PenLine size={20} />,    color: MOD_COLOR.writing,   title: "Writing",  sub: "Task 1 & 2 with AI grading on all four criteria.",                badge: "Pro",  badgeTone: "pro",  cta: isPro ? "Practice" : "Unlock", onClick: () => router.push("/writing") },
    { id: "speaking", icon: <Mic size={20} />,        color: MOD_COLOR.speaking,  title: "Speaking", sub: "3-part simulation with AI evaluation and feedback.",              badge: "Pro",  badgeTone: "pro",  cta: isPro ? "Practice" : "Unlock", onClick: () => router.push("/speaking") },
  ];

  const gettingStartedSteps = [
    { label: "Set your target band",       done: !!target,                                          icon: <Target size={13} />,      action: () => {} },
    { label: "Take a free diagnostic",     done: totalTests > 0,                                    icon: <ClipboardList size={13} />, action: () => router.push("/diagnostic") },
    { label: "Practice a module",          done: (data.recent_sessions || []).length > 0,           icon: <BookOpen size={13} />,    action: () => router.push("/reading") },
    { label: "Complete a full mock test",  done: hasFullMock,                                       icon: <Award size={13} />,       action: () => router.push(fullMockHref) },
  ];
  const gsDone = gettingStartedSteps.filter((s) => s.done).length;
  const gsPct = Math.round((gsDone / gettingStartedSteps.length) * 100);

  return (
    <DashboardShell title="Home">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{greeting()},</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 0", color: "#0f172a", textTransform: "capitalize" }}>
          {displayName(user)}
        </h1>
      </div>

      <InsightTabBar tab={tab} setTab={setTab} isPro={isPro} />

      {tab === "progress"   && <ProgressSection  dash={data} isPro={isPro} />}
      {tab === "studyplan"  && <StudyPlanSection  dash={data} isPro={isPro} />}
      {tab === "vocabulary" && <VocabularySection dash={data} isPro={isPro} />}

      {tab === "overview" && (<>

        {isNew && (
          <div className="da-card" style={{ background: "linear-gradient(120deg,#eef2ff,#f5f3ff)", border: "1px solid #e0e7ff", padding: "22px 24px", marginBottom: 18 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 6px", color: "#312e81" }}>Welcome to IELTS Anywhere</h2>
            <p style={{ fontSize: 14, color: "#4338ca", margin: "0 0 16px", lineHeight: 1.6, maxWidth: 540 }}>
              Let's estimate your IELTS level first with a short diagnostic — then we'll guide your practice.
            </p>
            <button className="da-btn da-btn-pro" onClick={() => router.push("/diagnostic")}>
              <ClipboardList size={16} /> Start Free Diagnostic
            </button>
          </div>
        )}

        <SummaryHero data={data} target={target} setTarget={setTarget} />

        {gsPct < 100 && <GettingStarted steps={gettingStartedSteps} pct={gsPct} />}

        <div className="da-stat-row" style={{ marginBottom: 26 }}>
          <StatTile icon={<ClipboardList size={17} />} label="Tests taken"   value={totalTests}                                                       tint={{ bg: "#eef2ff", fg: "#6366f1" }} />
          <StatTile icon={<Award size={17} />}         label="Best band"     value={data.best_overall != null ? data.best_overall.toFixed(1) : "—"} sub="overall"   tint={{ bg: "#ecfdf5", fg: "#059669" }} />
          <StatTile icon={<TrendingUp size={17} />}    label="Average band"  value={data.avg_overall  != null ? data.avg_overall.toFixed(1)  : "—"} sub="all tests" tint={{ bg: "#fff7ed", fg: "#d97706" }} />
          <StatTile icon={<Target size={17} />}        label="Target"        value={Number(target).toFixed(1)}                                      sub={targetMet ? "achieved 🎉" : "in progress"} tint={{ bg: "#faf5ff", fg: "#8b5cf6" }} />
        </div>

        <SectionHead title="Start practice" />
        <div className="da-grid-practice" style={{ marginBottom: 26 }}>
          {practiceCards.map((c) => (
            <PracticeCard key={c.id} icon={c.icon} color={c.color} title={c.title} sub={c.sub} badge={c.badge} badgeTone={c.badgeTone} cta={c.cta} onClick={c.onClick} />
          ))}
        </div>

        <SectionHead
          title="Recent activity"
          action={(data.recent_sessions || []).length > 0 && (
            <button className="da-btn da-btn-ghost" onClick={() => router.push("/reports")} style={{ padding: "7px 14px", fontSize: 13 }}>
              View all
            </button>
          )}
        />
        <div className="da-card" style={{ padding: 8 }}>
          {(data.recent_sessions || []).length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              No completed tests yet.{" "}
              <span style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => router.push("/diagnostic")}>
                Start your free diagnostic →
              </span>
            </div>
          ) : (
            data.recent_sessions.slice(0, 4).map((s) => <ActivityRow key={s.session_id} session={s} router={router} />)
          )}
        </div>

      </>)}
    </DashboardShell>
  );
}
