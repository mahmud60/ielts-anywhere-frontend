"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const PRIMARY = "#0080ff";
const BORDER  = "#e2e8f0";
const TEXT    = "#0f172a";
const MUTED   = "#94a3b8";
const GREEN   = "#059669";
const AMBER   = "#d97706";
const RED     = "#dc2626";

function bandColor(b) {
  if (!b || b <= 0) return MUTED;
  return b >= 7 ? GREEN : b >= 5.5 ? AMBER : RED;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isProUser(profile) {
  if (!profile) return false;
  if (profile.is_pro === true || profile.isPro === true) return true;
  const tier = String(
    profile.subscription_tier || profile.subscriptionTier ||
    profile.subscription || profile.plan || profile.tier || ""
  ).toLowerCase();
  return tier === "pro" || tier === "premium";
}

const s = {
  wrap: { maxWidth: 760, margin: "0 auto", padding: "48px 24px 64px", fontFamily: "system-ui" },
  h1:   { fontSize: 28, fontWeight: 700, marginBottom: 6, color: TEXT },
  sub:  { color: "#64748b", fontSize: 15, marginBottom: 36 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 },
  card: {
    background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: "18px 22px", marginBottom: 10,
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
  },
  title: { fontWeight: 600, fontSize: 15, marginBottom: 3, color: TEXT },
  meta:  { color: MUTED, fontSize: 13 },
  chip:  { display: "inline-block", fontSize: 11, padding: "2px 9px", borderRadius: 99, background: "#f1f5f9", color: "#64748b", marginRight: 6, marginTop: 4 },
  btn:   { padding: "9px 20px", borderRadius: 8, background: PRIMARY, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  btnOutline: { padding: "7px 16px", borderRadius: 8, background: "#fff", border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
};

function ProLockOverlay({ onUpgrade }) {
  return (
    <div style={{
      position: "absolute", inset: 0, borderRadius: 12, zIndex: 2,
      backdropFilter: "blur(3px)", background: "rgba(255,255,255,0.6)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff",
        border: "1px solid #e0e7ff", borderRadius: 99, padding: "3px 12px",
      }}>Pro</div>
      <button onClick={onUpgrade} style={{
        padding: "8px 18px", borderRadius: 8, background: "#6366f1", border: "none",
        color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
      }}>Unlock</button>
    </div>
  );
}

export default function WritingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests,    setTests]    = useState([]);
  const [history,  setHistory]  = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getWritingTests().then(setTests).catch(console.error);
    api.getWritingAttempts().then(setHistory).catch(() => {});
    api.getMe().then(setProfile).catch(() => {});
  }, [user]);

  if (loading) return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</p>;

  const isPro = isProUser(profile);

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Writing Tests</h1>
      <p style={s.sub}>Practice IELTS Academic Writing — choose a test below.</p>

      {!isPro && profile !== null && (
        <div style={{
          background: "#eef2ff", border: "1px solid #e0e7ff", borderRadius: 10,
          padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pro</span>
            <p style={{ fontSize: 13, color: "#4338ca", margin: "4px 0 0", lineHeight: 1.5 }}>
              Writing tests with AI grading are available on the Pro plan.
            </p>
          </div>
          <button onClick={() => router.push("/pricing")} style={{
            padding: "9px 20px", borderRadius: 8, background: "#6366f1", border: "none",
            color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", flexShrink: 0,
          }}>Upgrade to Pro</button>
        </div>
      )}

      <div style={s.sectionLabel}>Available Tests</div>
      {tests.length === 0 && (
        <p style={{ color: MUTED, marginBottom: 32 }}>No writing tests available yet.</p>
      )}

      {tests.map((t) => {
        return (
          <div key={t.id} style={{ position: "relative", marginBottom: 10 }}>
            <div style={{
              ...s.card, marginBottom: 0,
              opacity: isPro ? 1 : 0.85,
              filter: isPro ? "none" : "blur(0.5px)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.title}>{t.title}</div>
                <div style={s.meta}>{t.test_type === "academic" ? "Academic" : "General Training"}</div>
                <div style={{ marginTop: 4 }}>
                  <span style={s.chip}>{t.task_count ?? 2} task{t.task_count !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <button
                style={{ ...s.btn, opacity: (starting === t.id || !isPro) ? 0.6 : 1 }}
                disabled={starting === t.id || !isPro}
                onClick={() => { if (isPro) { setStarting(t.id); router.push(`/writing/${t.id}`); } }}
              >
                {starting === t.id ? "Opening…" : "Start"}
              </button>
            </div>
            {!isPro && profile !== null && (
              <ProLockOverlay onUpgrade={() => router.push("/pricing")} />
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button style={{ ...s.btnOutline, fontSize: 13 }} onClick={() => router.push("/reports")}>
          View past results →
        </button>
      </div>

      {history.length > 0 && (
        <>
          <div style={{ ...s.sectionLabel, marginTop: 48 }}>Past Results</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map(a => (
              <div key={a.id} style={{
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: TEXT, marginBottom: 2 }}>
                    Writing Test
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>{fmtDate(a.created_at)}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                    {a.status === "complete" ? "Graded" : a.status === "pending" ? "Grading…" : a.status}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: bandColor(a.overall_band), lineHeight: 1 }}>
                    {a.overall_band != null ? Number(a.overall_band).toFixed(1) : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Band</div>
                </div>
                <button
                  onClick={() => router.push(`/writing/results/${a.id}`)}
                  style={{
                    flexShrink: 0, padding: "8px 16px", borderRadius: 8,
                    background: "#fff", border: `1px solid ${BORDER}`,
                    color: TEXT, fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}