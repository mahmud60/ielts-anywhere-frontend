"use client";
import { useState, useEffect } from "react";

const KEY = "ia_posthog_embed";
const CARD = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" };

export function ProductAnalyticsTab() {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : "";
    if (saved) { setUrl(saved); setInput(saved); } else { setEditing(true); }
  }, []);

  const save = () => {
    const v = input.trim();
    if (!v) return;
    localStorage.setItem(KEY, v);
    setUrl(v);
    setEditing(false);
  };

  const showEmbed = url && !editing;

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Product analytics</h2>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href="https://us.posthog.com" target="_blank" rel="noreferrer"
             style={{ fontSize: 12.5, color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>Open PostHog ↗</a>
          {showEmbed && (
            <button onClick={() => setEditing(true)}
              style={{ fontSize: 12.5, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui" }}>
              Change dashboard
            </button>
          )}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 18px" }}>
        Session-level behaviour, funnels and retention from PostHog — embed a shared dashboard here.
      </p>

      {showEmbed ? (
        <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
          <iframe src={url} title="PostHog dashboard" style={{ width: "100%", height: 740, border: "none" }} allowFullScreen />
        </div>
      ) : (
        <div style={CARD}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Embed a PostHog dashboard</div>
          <ol style={{ fontSize: 13, color: "#475569", lineHeight: 1.9, paddingLeft: 18, margin: "0 0 14px" }}>
            <li>In PostHog, open (or build) the dashboard you want — e.g. a New Users / Retention / Conversion board.</li>
            <li>
              Open its <b>⋯</b> menu → <b>Share or embed</b> → enable public sharing, then copy the <b>Embed</b> URL
              (looks like <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>https://us.posthog.com/embedded/…</code>).
            </li>
            <li>Paste it below.</li>
          </ol>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder="https://us.posthog.com/embedded/…"
              style={{ flex: 1, padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "system-ui" }}
            />
            <button onClick={save} disabled={!input.trim()}
              style={{ padding: "9px 18px", borderRadius: 8, background: input.trim() ? "#0ea5e9" : "#bae6fd", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: input.trim() ? "pointer" : "default" }}>
              Embed
            </button>
            {url && (
              <button onClick={() => setEditing(false)}
                style={{ padding: "9px 14px", borderRadius: 8, background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer", fontFamily: "system-ui" }}>
                Cancel
              </button>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 10 }}>
            Saved in your browser only. You’re already sending <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>test_started</code> ·
            <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}> test_completed</code> ·
            <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}> subscription_activated</code> — build funnels &amp; retention on those in PostHog.
          </p>
        </div>
      )}
    </div>
  );
}
