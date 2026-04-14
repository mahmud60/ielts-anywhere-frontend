"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { QuestionsTab } from "./QuestionsTab";
import { TestsTab } from "./TestsTab";
import { OverviewTab } from "@/components/Admin/OverviewTab";
import { UsersTab } from "@/components/Admin/UsersTab";
import { logout } from "@/lib/auth";
import { PricingTab } from "@/components/Admin/PricingTab";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#f8fafc", surface: "#ffffff", border: "#e2e8f0",
  accent: "#6366f1", accentDim: "#eef2ff",
  green: "#059669", greenDim: "#d1fae5",
  red: "#dc2626", redDim: "#fee2e2",
  gold: "#d97706", goldDim: "#fef3c7",
  text: "#0f172a", muted: "#64748b", mutedLight: "#94a3b8",
};

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "tests",     label: "Tests" }, 
  { id: "questions", label: "Questions & Audio" },
  { id: "pricing", label: "Pricing & Limits" },
];


// ─── Main admin page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }

    api.getMe()
      .then(data => {
        setMe(data);
        if (!data.is_admin) {
          setAccessDenied(true);
        }
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setChecking(false));
  }, [user, loading, router]);

  if (loading || checking) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>Checking access…</p>;
  }

  if (accessDenied) {
    return (
      <div style={{ padding: 32, fontFamily: "system-ui", textAlign: "center" }}>
        <h2 style={{ marginBottom: 8 }}>Access denied</h2>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          You need admin privileges to view this page.
        </p>
        <button onClick={() => router.push("/")}
          style={{ padding: "9px 20px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}>
          Go home
        </button>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: C.accent }}>IELTS Pro</span>
          <span style={{ color: C.muted, fontSize: 13 }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>{me.email}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => logout(router)}
              style={{
                padding: "5px 14px",
                borderRadius: 7,
                border: "1px solid #fee2e2",
                background: "#fff5f5",
                color: "#dc2626",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "system-ui",
                fontWeight: 500,
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff5f5"; }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto" }}>
        {/* Sidebar nav */}
        <div style={{ width: 180, padding: "24px 0", flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActiveTab(n.id)} style={{
              width: "100%", textAlign: "left", padding: "9px 16px",
              background: activeTab === n.id ? C.accentDim : "transparent",
              color: activeTab === n.id ? C.accent : C.muted,
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: activeTab === n.id ? 500 : 400,
              cursor: "pointer", transition: "all .15s", fontFamily: "system-ui",
            }}>{n.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px 24px 24px 16px" }}>
          {activeTab === "overview" && <OverviewTab api={api}/>}
          {activeTab === "users" && <UsersTab api={api} />}
          {activeTab === "tests" && <TestsTab api={api} />}
          {activeTab === "questions" && <QuestionsTab api={api} />}
          {activeTab === "pricing" && <PricingTab api={api} />}
        </div>
      </div>
    </div>
  );
}