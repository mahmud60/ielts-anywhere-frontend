"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import { SHELL_CSS } from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";
import {
  LayoutDashboard, BarChart3, TrendingUp, Users, FileText, ListChecks,
  DollarSign, Sparkles, Gift, Shield, Home, LogOut, Menu, X,
} from "lucide-react";
import { QuestionsTab } from "./QuestionsTab";
import { TestsTab } from "./TestsTab";
import { OverviewTab } from "@/components/Admin/OverviewTab";
import { UsersTab } from "@/components/Admin/UsersTab";
import { PricingTab } from "@/components/Admin/PricingTab";
import { AffiliatesTab } from "@/components/Admin/AffiliatesTab";
import { AiUsageTab } from "@/components/Admin/AiUsageTab";
import { TestAnalyticsTab } from "@/components/Admin/TestAnalyticsTab";
import { ProductAnalyticsTab } from "@/components/Admin/ProductAnalyticsTab";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "product", label: "Product Analytics", icon: TrendingUp },
  { id: "users", label: "Users", icon: Users },
  { id: "tests", label: "Tests", icon: FileText },
  { id: "questions", label: "Questions & Audio", icon: ListChecks },
  { id: "pricing", label: "Pricing & Limits", icon: DollarSign },
  { id: "ai-usage", label: "AI Usage", icon: Sparkles },
  { id: "affiliates", label: "Affiliates", icon: Gift },
];

// Reuse the main-site shell design; override the few indigo accents to the
// admin's sky-blue scheme so it reads as one product.
const ADMIN_CSS = `
.da-nav-item.active{background:#e0f2fe;color:#0369a1;}
.da-brand-mark,.da-avatar{background:linear-gradient(135deg,#0ea5e9,#0284c7);}
`;

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    api.getMe()
      .then((data) => { setMe(data); if (!data.is_admin) setAccessDenied(true); })
      .catch(() => setAccessDenied(true))
      .finally(() => setChecking(false));
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (loading || checking) return <PetLoader fixed label="is checking your access" />;

  if (accessDenied) {
    return (
      <div style={{ padding: 32, fontFamily: "system-ui", textAlign: "center" }}>
        <h2 style={{ marginBottom: 8 }}>Access denied</h2>
        <p style={{ color: "#64748b", marginBottom: 20 }}>You need admin privileges to view this page.</p>
        <button onClick={() => router.push("/")}
          style={{ padding: "9px 20px", borderRadius: 10, background: "#0ea5e9", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "system-ui" }}>
          Go home
        </button>
      </div>
    );
  }

  if (!me) return null;

  const active = NAV.find((n) => n.id === activeTab);
  const go = (id) => { setActiveTab(id); setMobileOpen(false); };

  const nav = (
    <>
      <div className="da-brand">
        <span className="da-brand-mark">IA</span>
        <span className="da-brand-text">IELTS<span style={{ color: "#0ea5e9" }}>Anywhere</span></span>
      </div>

      <div className="da-nav">
        <div className="da-nav-label">Admin</div>
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              type="button"
              className={`da-nav-item ${activeTab === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
              title={n.label}
            >
              <Icon size={18} />
              <span className="da-nav-text">{n.label}</span>
            </button>
          );
        })}
      </div>

      <div className="da-foot">
        <button type="button" className="da-nav-item" onClick={() => router.push("/dashboard")} title="Back to app">
          <Home size={18} /><span className="da-nav-text">Back to app</span>
        </button>
        <button type="button" className="da-nav-item" onClick={() => { setMobileOpen(false); logout(router); }} title="Log out">
          <LogOut size={18} /><span className="da-nav-text">Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="da-shell">
      <style>{SHELL_CSS}{ADMIN_CSS}</style>

      <aside className="da-sidebar">{nav}</aside>

      <div className={`da-backdrop ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} aria-hidden={!mobileOpen} />
      <div className={`da-drawer ${mobileOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Admin menu">
        <button type="button" className="da-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        {nav}
      </div>

      <div className="da-main" style={{ marginLeft: 252 }}>
        <header className="da-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button type="button" className="da-hamburger da-iconbtn" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <span className="da-title-pill">{active?.label || "Admin"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span className="da-chip" style={{ background: "#e0f2fe", color: "#0369a1" }}><Shield size={13} /> Admin</span>
            <span style={{ fontSize: 13, color: "#64748b" }}>{me.email}</span>
            <div className="da-avatar">{(me.email || "A").charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className="da-content">
          {activeTab === "overview" && <OverviewTab api={api} />}
          {activeTab === "analytics" && <TestAnalyticsTab api={api} />}
          {activeTab === "product" && <ProductAnalyticsTab />}
          {activeTab === "users" && <UsersTab api={api} />}
          {activeTab === "tests" && <TestsTab api={api} />}
          {activeTab === "questions" && <QuestionsTab api={api} />}
          {activeTab === "pricing" && <PricingTab api={api} />}
          {activeTab === "ai-usage" && <AiUsageTab api={api} />}
          {activeTab === "affiliates" && <AffiliatesTab />}
        </main>
      </div>
    </div>
  );
}
