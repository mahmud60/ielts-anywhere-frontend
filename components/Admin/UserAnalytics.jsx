"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const num = (n) => Number(n || 0).toLocaleString();
const pct = (n) => `${Number(n || 0).toFixed(1)}%`;
const shortDay = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
const when = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const CARD = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" };
const TH = { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", padding: "8px 12px", borderBottom: "1px solid #e2e8f0" };
const TD = { fontSize: 13, color: "#334155", padding: "9px 12px", borderBottom: "1px solid #f1f5f9" };

const SEG = [
  { key: "none", label: "0 tests", color: "#e2e8f0" },
  { key: "low", label: "1–2", color: "#c7d2fe" },
  { key: "medium", label: "3–5", color: "#818cf8" },
  { key: "high", label: "6+", color: "#4f46e5" },
];

const FUNNEL_COLORS = ["#6366f1", "#0ea5e9", "#8b5cf6", "#059669"];
const monthLabel = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";

function TierBadge({ subscription }) {
  const c = subscription === "pro" ? "#059669" : "#64748b";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: c, background: `${c}18`, border: `1px solid ${c}33`, borderRadius: 99, padding: "2px 9px" }}>
      {subscription}
    </span>
  );
}

const MOD_COLOR = { listening: "#0ea5e9", reading: "#14b8a6", writing: "#10b981", speaking: "#8b5cf6" };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
function Pill({ module }) {
  const c = MOD_COLOR[module] || "#64748b";
  return <span style={{ fontSize: 11, fontWeight: 700, color: c, background: `${c}18`, borderRadius: 99, padding: "2px 9px" }}>{cap(module)}</span>;
}

export function UserAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.admin.getUserAnalytics()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Failed to load user analytics"); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p style={{ color: "#dc2626", fontFamily: "system-ui" }}>Error: {error}</p>;
  if (!data) return <p style={{ color: "#64748b", fontFamily: "system-ui" }}>Loading…</p>;

  const cards = [
    { label: "Total users", value: num(data.total_users), color: "#6366f1" },
    { label: "New · 7 days", value: num(data.new_7d), color: "#0ea5e9" },
    { label: "New · 30 days", value: num(data.new_30d), color: "#0ea5e9" },
    { label: "Pro users", value: num(data.pro_users), sub: `${pct(data.pro_conversion_pct)} of users`, color: "#059669" },
    { label: "Active · 7 days", value: num(data.active_7d), sub: `${num(data.active_30d)} in 30d`, color: "#8b5cf6" },
    { label: "Activated", value: pct(data.activation_pct), sub: "took ≥1 test", color: "#d97706" },
  ];

  const eng = data.engagement || {};
  const engTotal = Math.max(1, (eng.none || 0) + (eng.low || 0) + (eng.medium || 0) + (eng.high || 0));
  const days = data.signups_by_day || [];
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  return (
    <div style={{ fontFamily: "system-ui", marginBottom: 30 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>User growth &amp; behaviour</h2>
      <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 18px" }}>
        Signups, activation and engagement. “Tests” counts listening, reading, writing and diagnostic attempts.
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        {cards.map((c) => (
          <div key={c.label} style={CARD}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "monospace" }}>{c.value}</div>
            {c.sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* New-user funnel */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>New-user funnel</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {(data.funnel || []).map((s, i) => {
            const top = data.funnel[0]?.count || 1;
            const w = (s.count / Math.max(1, top)) * 100;
            const step = i > 0 ? (data.funnel[i - 1].count ? Math.round((s.count / data.funnel[i - 1].count) * 100) : 0) : 100;
            return (
              <div key={s.stage}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, color: "#334155", fontWeight: 600 }}>{s.stage}</span>
                  <span style={{ fontSize: 12, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                    <b style={{ color: "#0f172a" }}>{num(s.count)}</b> · {Math.round(w)}%
                    {i > 0 ? <span style={{ color: "#94a3b8" }}>  ({step}% of prev)</span> : null}
                  </span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 5, height: 20, overflow: "hidden" }}>
                  <div style={{ width: `${w}%`, height: "100%", background: FUNNEL_COLORS[i] || "#6366f1", borderRadius: 5 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement segments */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Engagement — users by tests taken</div>
        <div style={{ display: "flex", height: 26, borderRadius: 7, overflow: "hidden", marginBottom: 10, background: "#f1f5f9" }}>
          {SEG.map((s) => {
            const v = eng[s.key] || 0;
            const w = (v / engTotal) * 100;
            return w > 0 ? (
              <div key={s.key} title={`${s.label}: ${v}`}
                style={{ width: `${w}%`, background: s.color, color: s.key === "high" || s.key === "medium" ? "#fff" : "#475569", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {w > 7 ? v : ""}
              </div>
            ) : null;
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {SEG.map((s) => (
            <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
              {s.label}: <b style={{ color: "#334155" }}>{num(eng[s.key] || 0)}</b>
            </span>
          ))}
        </div>
      </div>

      {/* Module engagement + Retention */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Module engagement</div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 10 }}>
            {data.first_module && data.first_module.length
              ? `Most users start with ${cap(data.first_module[0].module)} (${data.first_module[0].count})`
              : "How many distinct users try each module"}
          </div>
          {(!data.module_reach || data.module_reach.length === 0) ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>No module activity yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={TH}>Module</th><th style={{ ...TH, textAlign: "right" }}>Users</th><th style={{ ...TH, textAlign: "right" }}>Attempts</th></tr></thead>
              <tbody>
                {data.module_reach.map((r) => (
                  <tr key={r.module}>
                    <td style={TD}><Pill module={r.module} /></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{num(r.users)}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", color: "#64748b" }}>{num(r.attempts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Retention</div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 12 }}>Of activated users, the share that came back (active on 2+ days).</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#8b5cf6", fontFamily: "monospace", marginBottom: 8 }}>{pct(data.retention?.return_rate_pct)}</div>
          <div style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden", marginBottom: 8, background: "#f1f5f9" }}>
            <div style={{ width: `${(() => { const r = data.retention || {}; const t = Math.max(1, (r.returned || 0) + (r.one_and_done || 0)); return ((r.returned || 0) / t) * 100; })()}%`, height: "100%", background: "#8b5cf6" }} />
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            <b style={{ color: "#334155" }}>{num(data.retention?.returned)}</b> came back · <b style={{ color: "#334155" }}>{num(data.retention?.one_and_done)}</b> one-and-done
          </div>
        </div>
      </div>

      {/* Signups per day */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>New signups per day (last 30 days)</div>
        {days.length === 0 ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No signups in the last 30 days.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {days.map((d) => (
              <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <span style={{ color: "#64748b", width: 54, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{shortDay(d.day)}</span>
                <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, height: 14, overflow: "hidden" }}>
                  <div style={{ width: `${(d.count / maxDay) * 100}%`, height: "100%", background: "#6366f1", borderRadius: 4 }} />
                </div>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a", width: 28, textAlign: "right" }}>{num(d.count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversion by signup cohort */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Conversion by signup cohort</div>
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 10 }}>Of the users who joined each month, the share now on Pro.</div>
        {(!data.cohorts || data.cohorts.length === 0) ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No cohorts yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={TH}>Cohort</th>
              <th style={{ ...TH, textAlign: "right" }}>Signups</th>
              <th style={{ ...TH, textAlign: "right" }}>Pro</th>
              <th style={TH}>Conversion</th>
            </tr></thead>
            <tbody>
              {data.cohorts.map((c) => (
                <tr key={c.month}>
                  <td style={{ ...TD, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" }}>{monthLabel(c.month)}</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: "monospace" }}>{num(c.signups)}</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", color: "#059669", fontWeight: 700 }}>{num(c.pro)}</td>
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 120, background: "#f1f5f9", borderRadius: 4, height: 12, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, c.conversion_pct)}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a", width: 44, textAlign: "right" }}>{pct(c.conversion_pct)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent signups with activity */}
      <div style={CARD}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Recent signups</div>
        {(!data.recent_signups || data.recent_signups.length === 0) ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No signups yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={TH}>User</th>
                <th style={TH}>Tier</th>
                <th style={TH}>Joined</th>
                <th style={{ ...TH, textAlign: "right" }}>Tests</th>
                <th style={TH}>Last active</th>
              </tr></thead>
              <tbody>
                {data.recent_signups.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...TD, color: "#0f172a", fontWeight: 600 }}>
                      {r.email}
                      {r.full_name ? <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {r.full_name}</span> : null}
                    </td>
                    <td style={TD}><TierBadge subscription={r.subscription} /></td>
                    <td style={{ ...TD, color: "#64748b", whiteSpace: "nowrap" }}>{when(r.created_at)}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: r.attempts ? "#0f172a" : "#cbd5e1" }}>{num(r.attempts)}</td>
                    <td style={{ ...TD, color: "#64748b", whiteSpace: "nowrap" }}>{when(r.last_active)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
