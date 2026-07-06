"use client";
import { useOverview } from "@/lib/admin/useOverview";

export function OverviewTab() {
  const { tiles, loading, error, openDocs, openLemon } = useOverview();

  if (error) return <p style={{ color: "#dc2626", fontFamily: "system-ui" }}>Error: {error}</p>;

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 18px" }}>Overview</h2>

      <div className="da-stat-row" style={{ marginBottom: 22 }}>
        {loading ? (
          <div style={{ color: "#64748b", padding: 20 }}>Loading…</div>
        ) : (
          tiles.map((t) => (
            <div key={t.label} className="da-card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: t.color, fontFamily: "monospace" }}>{t.value}</div>
            </div>
          ))
        )}
      </div>

      <div className="da-card" style={{ padding: "18px 20px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>Quick actions</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="da-btn da-btn-ghost" onClick={openDocs}>API docs ↗</button>
          <button className="da-btn da-btn-ghost" onClick={openLemon}>LemonSqueezy dashboard ↗</button>
        </div>
      </div>
    </div>
  );
}
