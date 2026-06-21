"use client";
import { useEffect, useState } from "react";

const usd = (n) => `$${Number(n || 0).toFixed(2)}`;
const num = (n) => Number(n || 0).toLocaleString();

const CARD = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" };
const TH = { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", padding: "8px 12px", borderBottom: "1px solid #e2e8f0" };
const TD = { fontSize: 13, color: "#334155", padding: "9px 12px", borderBottom: "1px solid #f1f5f9" };

function Table({ title, rows, keyName, keyLabel }) {
  return (
    <div style={CARD}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{title}</div>
      {(!rows || rows.length === 0) ? (
        <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>No usage yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH}>{keyLabel || keyName}</th>
              <th style={{ ...TH, textAlign: "right" }}>Calls</th>
              <th style={{ ...TH, textAlign: "right" }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...TD, fontWeight: 600, color: "#0f172a" }}>{r[keyName] || "—"}</td>
                <td style={{ ...TD, textAlign: "right", fontFamily: "monospace" }}>{num(r.calls)}</td>
                <td style={{ ...TD, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>{usd(r.cost_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function AiUsageTab({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.admin.getAiUsage()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message || "Failed to load AI usage"); });
    return () => { cancelled = true; };
  }, [api]);

  if (error) return <p style={{ color: "#dc2626", fontFamily: "system-ui" }}>Error: {error}</p>;
  if (!data) return <p style={{ color: "#64748b", fontFamily: "system-ui" }}>Loading…</p>;

  const cards = [
    { label: "Estimated cost", value: usd(data.total_cost_usd), color: "#059669" },
    { label: "AI calls", value: num(data.total_calls), color: "#6366f1" },
    { label: "Input tokens", value: num(data.total_input_tokens), color: "#0f172a" },
    { label: "Output tokens", value: num(data.total_output_tokens), color: "#0f172a" },
  ];

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>AI Usage</h2>
      <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 18px", lineHeight: 1.5 }}>
        Estimated from logged token counts for grading & learn (Claude). The live speaking
        pipeline (Deepgram/OpenAI/LiveKit) and exact billing live in the provider dashboards.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
        {cards.map((c) => (
          <div key={c.label} style={CARD}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "monospace" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 16 }}>
        <Table title="By module" rows={data.by_module} keyName="module" />
        <Table title="By model" rows={data.by_model} keyName="model" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Table title="Top users by cost" rows={data.top_users} keyName="email" keyLabel="user" />
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Daily cost (last 30 days)</div>
        {(!data.by_day || data.by_day.length === 0) ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>No usage yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.by_day.map((d) => (
              <div key={d.day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{d.day}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{num(d.calls)} calls</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#059669", minWidth: 64, textAlign: "right" }}>{usd(d.cost_usd)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
