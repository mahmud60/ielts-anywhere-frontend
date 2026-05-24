"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const PRIMARY = "#0080ff";
const BORDER  = "#E2E8F0";
const PAGE_BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const TEXT    = "#0F172A";
const TEXT_SUB = "#475569";
const MUTED   = "#94A3B8";
const GREEN   = "#059669";
const AMBER   = "#d97706";
const RED     = "#DC2626";

const MODULE_META = {
  listening: { label: "Listening", color: "#0ea5e9", bg: "#f0f9ff" },
  reading:   { label: "Reading",   color: "#f59e0b", bg: "#fffbeb" },
};

function bandColor(b) {
  if (!b || b <= 0) return MUTED;
  return b >= 7 ? GREEN : b >= 5.5 ? AMBER : RED;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

const FILTERS = ["All", "Listening", "Reading"];

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listeningAttempts, setListeningAttempts] = useState([]);
  const [readingAttempts,   setReadingAttempts]   = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getListeningAttempts().catch(() => []),
      api.getReadingAttempts().catch(() => []),
    ]).then(([l, r]) => {
      setListeningAttempts(l);
      setReadingAttempts(r);
      setFetching(false);
    });
  }, [user]);

  if (loading || fetching) {
    return (
      <div style={{ minHeight: "100vh", background: PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <p style={{ color: MUTED }}>Loading reports…</p>
      </div>
    );
  }

  // Merge and sort by date desc
  const all = [
    ...listeningAttempts.map(a => ({ ...a, module: "listening" })),
    ...readingAttempts.map(a => ({ ...a, module: "reading" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filtered = filter === "All"
    ? all
    : all.filter(a => a.module === filter.toLowerCase());

  const viewReport = (a) => {
    if (a.module === "listening") router.push(`/listening/results/${a.id}`);
    else router.push(`/reading/results/${a.id}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => router.back()}
          style={{ border: "none", background: "none", cursor: "pointer", color: MUTED, padding: "4px 6px", borderRadius: 8, fontSize: 20, lineHeight: 1 }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>My Reports</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 18px", borderRadius: 999, cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              border: `1px solid ${filter === f ? PRIMARY : BORDER}`,
              background: filter === f ? PRIMARY : SURFACE,
              color: filter === f ? "#fff" : TEXT_SUB,
            }}>
              {f}
              {f !== "All" && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700,
                  background: filter === f ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: filter === f ? "#fff" : MUTED,
                  borderRadius: 99, padding: "1px 6px",
                }}>
                  {f === "Listening" ? listeningAttempts.length : readingAttempts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: TEXT_SUB, marginBottom: 6 }}>No reports yet</div>
            <div style={{ fontSize: 14 }}>Complete a test to see your results here.</div>
          </div>
        )}

        {/* Attempt cards */}
        {filtered.map(a => {
          const mod = MODULE_META[a.module];
          return (
            <div key={a.id} style={{
              background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14,
              padding: "18px 22px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 18,
            }}>
              {/* Module badge */}
              <div style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: 10,
                background: mod.bg, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: mod.color, letterSpacing: "0.04em" }}>
                  {mod.label.slice(0, 1)}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: TEXT, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.test_title ?? `${mod.label} Test`}
                </div>
                <div style={{ fontSize: 12, color: MUTED, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: mod.color }}>{mod.label}</span>
                  <span>·</span>
                  <span>{fmtDate(a.created_at)}</span>
                  <span>·</span>
                  <span>{a.correct ?? 0}/{a.total ?? 0} correct</span>
                </div>
              </div>

              {/* Band score */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: bandColor(a.overall_band), lineHeight: 1 }}>
                  {a.overall_band > 0 ? a.overall_band.toFixed(1) : "—"}
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Band</div>
              </div>

              {/* CTA */}
              <button
                onClick={() => viewReport(a)}
                style={{
                  flexShrink: 0, padding: "8px 18px", borderRadius: 8,
                  background: "#fff", border: `1px solid ${BORDER}`,
                  color: TEXT, fontWeight: 600, fontSize: 13, cursor: "pointer",
                  transition: "border-color .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
              >
                View Report
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}