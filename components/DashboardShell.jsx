"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  FileText,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  ClipboardList,
  Award,
  GraduationCap,
  Crown,
  Shield,
  LogOut,
  Lock,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import { isProUser, isAdminUser } from "@/lib/landingAccess";

export const SHELL_CSS = `
.da-shell{display:flex;min-height:100vh;background:#f6f7fb;color:#0f172a;font-family:var(--font-inter),system-ui,sans-serif;}
.da-sidebar{width:252px;flex-shrink:0;background:#fff;border-right:1px solid #edeff4;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;overflow-x:hidden;transition:width .22s ease;}
.da-brand{display:flex;align-items:center;gap:10px;padding:20px 18px 14px;font-weight:800;font-size:17px;letter-spacing:-.02em;white-space:nowrap;}
.da-brand-mark{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;flex-shrink:0;}
.da-nav{padding:4px 12px;display:flex;flex-direction:column;gap:2px;}
.da-nav-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9aa4b5;padding:16px 12px 6px;white-space:nowrap;}
.da-nav-item{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:10px;font-size:13.5px;font-weight:500;color:#475569;cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:background .15s,color .15s;white-space:nowrap;}
.da-nav-item:hover{background:#f4f5f9;color:#0f172a;}
.da-nav-item.active{background:#eef2ff;color:#4f46e5;font-weight:600;}
.da-nav-item svg{flex-shrink:0;}
.da-nav-item .da-lock{margin-left:auto;color:#cbd5e1;}
.da-foot{margin-top:auto;padding:12px;border-top:1px solid #edeff4;display:flex;flex-direction:column;gap:2px;}
/* collapsed icon rail */
.da-sidebar.is-collapsed{width:74px;}
.da-sidebar.is-collapsed .da-brand{justify-content:center;padding:20px 0 14px;}
.da-sidebar.is-collapsed .da-brand-text{display:none;}
.da-sidebar.is-collapsed .da-nav{padding:4px 12px;align-items:center;}
.da-sidebar.is-collapsed .da-nav-label{display:none;}
.da-sidebar.is-collapsed .da-nav-item{justify-content:center;gap:0;padding:11px 0;width:46px;}
.da-sidebar.is-collapsed .da-nav-text{display:none;}
.da-sidebar.is-collapsed .da-nav-item .da-lock{display:none;}
.da-sidebar.is-collapsed .da-foot{padding:12px;align-items:center;}
.da-collapse-dot{margin-left:auto;width:7px;height:7px;border-radius:50%;background:#c7b3f9;flex-shrink:0;}
.da-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.da-topbar{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 28px;border-bottom:1px solid #edeff4;background:#fff;position:sticky;top:0;z-index:20;}
.da-title-pill{font-size:14px;font-weight:700;color:#0f172a;background:#f4f5f9;border-radius:9px;padding:7px 14px;}
.da-content{width:100%;max-width:1120px;margin:0 auto;padding:26px 28px 72px;}
.da-card{background:#fff;border:1px solid #edeff4;border-radius:16px;}
.da-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;}
.da-pill-pro{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:99px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,.28);}
.da-pill-pro:hover{filter:brightness(1.05);}
.da-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:5px 11px;border-radius:99px;}
.da-grid-practice{display:grid;grid-template-columns:repeat(auto-fill,minmax(204px,1fr));gap:14px;}
.da-stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;}
.da-hero{display:grid;grid-template-columns:300px 1fr;}
.da-pcard{display:flex;flex-direction:column;padding:18px;border-radius:14px;border:1px solid #edeff4;background:#fff;transition:transform .18s,box-shadow .18s,border-color .18s;cursor:pointer;text-align:left;}
.da-pcard:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(15,23,42,.08);border-color:#e3e6ef;}
.da-act-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-radius:12px;cursor:pointer;transition:background .15s;}
.da-act-row:hover{background:#f7f8fc;}
.da-iconwrap{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.da-locked{position:relative;overflow:hidden;}
.da-locked-blur{filter:blur(5px);opacity:.5;pointer-events:none;user-select:none;}
.da-locked-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.9));}
.da-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:10px;font-weight:600;font-size:13.5px;cursor:pointer;padding:10px 18px;transition:filter .15s,transform .15s,background .15s;}
.da-btn:hover{filter:brightness(1.04);}
.da-btn-primary{background:#0ea5e9;color:#fff;}
.da-btn-pro{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;}
.da-btn-ghost{background:#f4f5f9;color:#334155;}
.da-iconbtn{width:40px;height:40px;border-radius:11px;border:1px solid #edeff4;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#334155;flex-shrink:0;}
.da-iconbtn:hover{background:#f4f5f9;}
.da-seg{display:inline-flex;background:#f1f3f8;border-radius:11px;padding:4px;gap:4px;flex-wrap:wrap;}
.da-seg-item{border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;padding:7px 16px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;transition:.15s;}
.da-seg-item.active{background:#fff;color:#4f46e5;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.da-table{width:100%;border-collapse:collapse;}
.da-table th{text-align:left;font-size:12px;font-weight:600;color:#64748b;padding:12px 16px;border-bottom:1px solid #edeff4;white-space:nowrap;}
.da-table td{font-size:13.5px;color:#334155;padding:14px 16px;border-bottom:1px solid #f1f3f8;}
.da-table tr:last-child td{border-bottom:none;}
.da-table tr.clickable{cursor:pointer;}
.da-table tr.clickable:hover td{background:#f7f8fc;}
.da-hamburger{display:none;}
.da-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:55;opacity:0;pointer-events:none;transition:opacity .25s ease;}
.da-backdrop.open{opacity:1;pointer-events:auto;}
.da-drawer{position:fixed;top:0;left:0;bottom:0;width:284px;max-width:85vw;background:#fff;z-index:60;transform:translateX(-100%);transition:transform .26s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;overflow-y:auto;box-shadow:0 10px 44px rgba(15,23,42,.2);}
.da-drawer.open{transform:translateX(0);}
.da-drawer-close{position:absolute;top:16px;right:14px;width:34px;height:34px;border-radius:9px;border:none;background:#f4f5f9;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#475569;z-index:2;}
@media(max-width:960px){.da-hero{grid-template-columns:1fr;}}
@media(max-width:900px){
 .da-sidebar{display:none;}
 .da-content{padding:16px 16px 80px;}
 .da-topbar{padding:12px 16px;}
 .da-hamburger{display:flex;}
}
@media(min-width:901px){
 .da-drawer,.da-backdrop{display:none;}
}
@media(max-width:560px){
 .da-act-mods{display:none;}
 .da-pill-pro{padding:8px 12px;font-size:12px;}
 .da-content{padding:14px 12px 80px;}
 .da-table .da-col-opt{display:none;}
}
`;

function nameFromUser(user) {
  if (user?.displayName) return user.displayName.split(" ")[0];
  if (user?.email) return user.email.split("@")[0];
  return "there";
}

function SidebarNav({ pathname, isPro, isAdmin, router, onAfter = () => {}, collapsed = false, onToggle }) {
  const go = (path) => { router.push(path); onAfter(); };
  const fullMockHref = isPro ? "/tests?mode=full_mock" : "/pricing";

  const item = (active, icon, label, onClick, locked) => (
    <button
      type="button"
      className={`da-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon}
      <span className="da-nav-text">{label}</span>
      {locked && <Lock size={13} className="da-lock" />}
    </button>
  );

  return (
    <>
      <div className="da-brand">
        <span className="da-brand-mark">IA</span>
        <span className="da-brand-text">IELTS<span style={{ color: "#6366f1" }}>Anywhere</span></span>
      </div>

      <nav className="da-nav">
        {item(pathname === "/dashboard", <Home size={18} />, "Home", () => go("/dashboard"))}
        {item(pathname.startsWith("/reports"), <FileText size={18} />, "My Reports", () => go("/reports"))}
      </nav>

      <div className="da-nav">
        <div className="da-nav-label">Practice</div>
        {item(pathname.startsWith("/reading"), <BookOpen size={18} />, "Reading", () => go("/reading"))}
        {item(pathname.startsWith("/listening"), <Headphones size={18} />, "Listening", () => go("/listening"))}
        {item(pathname.startsWith("/writing"), <PenLine size={18} />, "Writing", () => go("/writing"), !isPro)}
        {item(pathname.startsWith("/speaking"), <Mic size={18} />, "Speaking", () => go("/speaking"), !isPro)}
        {item(pathname.startsWith("/diagnostic"), <ClipboardList size={18} />, "Diagnostic", () => go("/diagnostic"))}
        {item(false, <Award size={18} />, "Full Mock", () => go(fullMockHref), !isPro)}
        {isPro && item(pathname.startsWith("/learn"), <GraduationCap size={18} />, "Lessons", () => go("/learn/grammar"))}
      </div>

      <div className="da-foot">
        {item(pathname.startsWith("/pricing"), <Crown size={18} color="#6366f1" />, isPro ? "Manage plan" : "Upgrade", () => go("/pricing"))}
        {isAdmin && item(pathname.startsWith("/admin"), <Shield size={18} />, "Admin", () => go("/admin"))}
        {item(false, <LogOut size={18} />, "Log out", () => { onAfter(); logout(router); })}
        {onToggle && (
          <button
            type="button"
            className="da-nav-item"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            <span className="da-nav-text">Collapse</span>
          </button>
        )}
      </div>
    </>
  );
}

export default function DashboardShell({ title, children }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [me, setMe] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeDrawer = () => setMobileOpen(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(window.localStorage.getItem("ia_sidebar_collapsed") === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") window.localStorage.setItem("ia_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    if (!user) return undefined;
    api.getMe().then((d) => { if (!cancelled) setMe(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => { if (window.innerWidth > 900) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isPro = isProUser(me);
  const isAdmin = isAdminUser(me);
  const navProps = { pathname, isPro, isAdmin, router };

  return (
    <div className="da-shell">
      <style>{SHELL_CSS}</style>

      <aside className={`da-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <SidebarNav {...navProps} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      <div className={`da-backdrop ${mobileOpen ? "open" : ""}`} onClick={closeDrawer} aria-hidden={!mobileOpen} />
      <div className={`da-drawer ${mobileOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" className="da-drawer-close" onClick={closeDrawer} aria-label="Close menu">
          <X size={18} />
        </button>
        <SidebarNav {...navProps} onAfter={closeDrawer} />
      </div>

      <div className="da-main">
        <header className="da-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button type="button" className="da-hamburger da-iconbtn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            {title && <span className="da-title-pill">{title}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {isPro ? (
              <span className="da-chip" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                <Crown size={13} /> Pro
              </span>
            ) : (
              <button className="da-pill-pro" onClick={() => router.push("/pricing")}>
                <Crown size={15} /> Upgrade to Pro
              </button>
            )}
            <div className="da-avatar">{nameFromUser(user).charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className="da-content">{children}</main>
      </div>
    </div>
  );
}
