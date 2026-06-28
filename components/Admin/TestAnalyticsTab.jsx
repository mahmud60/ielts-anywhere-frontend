"use client";
import { useEffect, useState } from "react";

const num = (n) => Number(n || 0).toLocaleString();
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const when = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const bandColor = (b) => (b == null ? "#94a3b8" : b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626");

const CARD = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" };
const TH = { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", padding: "8px 12px", borderBottom: "1px solid #e2e8f0" };
const TD = { fontSize: 13, color: "#334155", padding: "9px 12px", borderBottom: "1px solid #f1f5f9" };

const MOD_COLOR = { listening: "#0ea5e9", reading: "#14b8a6", writing: "#10b981", speaking: "#8b5cf6" };

function Pill({ module }) {
  const c = MOD_COLOR[module] || "#64748b";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: c, background: `${c}18`, borderRadius: 99, padding: "2px 9px" }}>
      {cap(module)}
    </span>
  );
}

export function TestAnalyticsTab({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.admin.getTestAnalytics()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Failed to load analytics"); });
    return () => { cancelled = true; };
  }, [api]);

  if (error) return <p style={{ color: "#dc2626", fontFamily: "system-ui" }}>Error: {error}</p>;
  if (!data) return <p style={{ color: "#64748b", fontFamily: "system-ui" }}>Loading…</p>;

  const cards = [
    { label: "Graded attempts", value: num(data.total_attempts), color: "#6366f1" },
    { label: "Speaking sessions", value: num(data.speaking_sessions), color: "#8b5cf6" },
    { label: "Full mocks completed", value: num(data.completed_full_mocks), color: "#059669" },
  ];

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Analytics</h2>
      <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 18px" }}>
        Test activity across the platform. Graded attempts cover listening, reading and writing;
        speaking is counted separately.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 22 }}>
        {cards.map((c) => (
          <div key={c.label} style={CARD}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "monospace" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Latest tests taken */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Latest tests taken</div>
        {(!data.recent_tests || data.recent_tests.length === 0) ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No tests taken yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={TH}>When</th>
                <th style={TH}>User</th>
                <th style={TH}>Module</th>
                <th style={TH}>Test</th>
                <th style={{ ...TH, textAlign: "right" }}>Band</th>
              </tr></thead>
              <tbody>
                {data.recent_tests.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...TD, color: "#64748b", whiteSpace: "nowrap" }}>{when(r.at)}</td>
                    <td style={{ ...TD, color: "#0f172a", fontWeight: 600 }}>{r.email}</td>
                    <td style={TD}><Pill module={r.module} /></td>
                    <td style={{ ...TD, color: "#334155" }}>{r.title}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: bandColor(r.band) }}>
                      {r.band != null ? r.band.toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 16 }}>
        {/* By module */}
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Attempts by module</div>
          {data.by_module.length === 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>No attempts yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={TH}>Module</th><th style={{ ...TH, textAlign: "right" }}>Attempts</th><th style={{ ...TH, textAlign: "right" }}>Avg band</th></tr></thead>
              <tbody>
                {data.by_module.map((r) => (
                  <tr key={r.module}>
                    <td style={TD}><Pill module={r.module} /></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{num(r.count)}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace" }}>{r.avg_band != null ? r.avg_band.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Most active users */}
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Most active users</div>
          {data.active_users.length === 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>No activity yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={TH}>User</th><th style={{ ...TH, textAlign: "right" }}>Attempts</th></tr></thead>
              <tbody>
                {data.active_users.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...TD, color: "#0f172a", fontWeight: 600 }}>{r.email}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{num(r.attempts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Most popular tests */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Most popular tests</div>
        {data.popular_tests.length === 0 ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No tests taken yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={TH}>Module</th><th style={TH}>Test</th><th style={{ ...TH, textAlign: "right" }}>Times taken</th></tr></thead>
            <tbody>
              {data.popular_tests.map((r, i) => (
                <tr key={i}>
                  <td style={TD}><Pill module={r.module} /></td>
                  <td style={{ ...TD, color: "#0f172a", fontWeight: 600 }}>{r.title}</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{num(r.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Daily trend */}
      <div style={CARD}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Attempts per day (last 30 days)</div>
        {data.by_day.length === 0 ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No attempts yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.by_day.map((d) => (
              <div key={d.day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{d.day}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{num(d.count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
