"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Search, ArrowRight, Award } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

const SHIMMER_ID = "exam-list-shimmer";
function useShimmerStyle() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current || typeof document === "undefined") return;
    injected.current = true;
    if (document.getElementById(SHIMMER_ID)) return;
    const el = document.createElement("style");
    el.id = SHIMMER_ID;
    el.textContent = `
@keyframes el-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.el-skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:el-shimmer 1.6s ease-in-out infinite;border-radius:6px;}
    `;
    document.head.appendChild(el);
  }, []);
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: "#fff", border: "1px solid #e6e8ef" }}>
      <div className="el-skel" style={{ height: 6, borderRadius: 0 }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="el-skel" style={{ width: 42, height: 42, borderRadius: 12 }} />
          <div className="el-skel" style={{ width: 80, height: 28, borderRadius: 99 }} />
        </div>
        <div className="el-skel" style={{ height: 18, marginBottom: 8 }} />
        <div className="el-skel" style={{ height: 13, width: "68%", marginBottom: 18 }} />
        <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
          <div className="el-skel" style={{ width: 82, height: 26, borderRadius: 8 }} />
          <div className="el-skel" style={{ width: 96, height: 26, borderRadius: 8 }} />
        </div>
        <div className="el-skel" style={{ height: 44, borderRadius: 11 }} />
      </div>
    </div>
  );
}

/**
 * Reusable exam browser for a single module (Listening / Reading).
 *
 * config = {
 *   moduleKey, title, subtitle, accent, accentSoft, gradient,
 *   icon, duration, facts: [{icon, label, value}],
 *   fetchTests: () => Promise<test[]>,
 *   startPath: (t) => string,
 *   getDescription: (t) => string,
 *   getMeta: (t) => [{icon, label}],
 * }
 */
export default function ExamListPage(config) {
  const {
    title, subtitle, accent, accentSoft, gradient, icon, duration,
    facts = [], fetchTests, startPath, getDescription, getMeta,
  } = config;

  useShimmerStyle();

  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [tests, setTests] = useState(null);
  const [starting, setStarting] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchTests()
      .then((d) => { if (!cancelled) setTests(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setTests([]); });
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    if (!tests) return [];
    const q = query.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((test) =>
      (test.title || "").toLowerCase().includes(q) ||
      (getDescription?.(test) || "").toLowerCase().includes(q)
    );
  }, [tests, query, getDescription]);

  if (loading) {
    return (
      <DashboardShell title={title}>
        <PetLoader fullScreen label="is loading your tests" />
      </DashboardShell>
    );
  }

  const isLoadingTests = tests === null;

  const start = (test) => { setStarting(test.id); router.push(startPath(test)); };

  const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 };

  let listContent;
  if (isLoadingTests) {
    listContent = (
      <div style={GRID}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  } else if (tests.length === 0) {
    listContent = (
      <div className="da-card" style={{ padding: "56px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>🗂️</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>{t.noTestsAvailable}</div>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 auto", maxWidth: 360 }}>
          {t.newTestsLabel} {title} {t.checkBackSoon}
        </p>
      </div>
    );
  } else if (filtered.length === 0) {
    listContent = (
      <div className="da-card" style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
        {t.noTestsMatch} &ldquo;{query}&rdquo;.
      </div>
    );
  } else {
    listContent = (
      <div style={GRID}>
        {filtered.map((test, i) => {
          const meta = getMeta?.(test) || [];
          const isStarting = starting === test.id;
          return (
            <div
              key={test.id}
              className="da-pcard"
              onClick={() => !isStarting && start(test)}
              style={{ padding: 0, overflow: "hidden", opacity: isStarting ? 0.65 : 1 }}
            >
              <div style={{ height: 6, background: gradient }} />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, background: accentSoft,
                    color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11.5, fontWeight: 600, color: "#64748b",
                    background: "#f4f5f9", borderRadius: 99, padding: "5px 11px",
                  }}>
                    <Clock size={12} /> {duration}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 5, lineHeight: 1.35 }}>
                  {test.title}
                </div>
                {getDescription?.(test) && (
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {getDescription(test)}
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18, marginTop: "auto" }}>
                  {meta.map((m) => (
                    <span key={m.label} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11.5, fontWeight: 500, color: "#475569",
                      background: "#f4f5f9", borderRadius: 8, padding: "5px 10px",
                    }}>
                      {m.icon}{m.label}
                    </span>
                  ))}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  background: gradient, color: "#fff", borderRadius: 11,
                  padding: "11px 16px", fontSize: 14, fontWeight: 700,
                }}>
                  {isStarting ? t.opening : t.startTest} {!isStarting && <ArrowRight size={16} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DashboardShell title={title}>
      {/* Hero banner */}
      <div style={{
        borderRadius: 20, padding: "28px 30px", marginBottom: 24,
        background: gradient, color: "#fff",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        boxShadow: `0 18px 40px -18px ${accent}aa`,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>{title}</h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, opacity: .92, margin: 0, maxWidth: 520 }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {facts.map((f) => (
            <div key={f.label} style={{ background: "rgba(255,255,255,.14)", borderRadius: 12, padding: "10px 14px", minWidth: 96 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: .85, marginBottom: 4 }}>
                {f.icon}{f.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>{t.availableTests}</h2>
          {!isLoadingTests && <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{filtered.length}</span>}
        </div>
        <div style={{ position: "relative", flex: "0 1 280px" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchTests}
            disabled={isLoadingTests}
            style={{
              width: "100%", padding: "10px 12px 10px 36px", borderRadius: 11,
              border: "1px solid #e6e8ef", background: "#fff", fontSize: 13.5,
              color: "#0f172a", outline: "none", opacity: isLoadingTests ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      {listContent}

      {/* Footer link */}
      <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => router.push("/reports")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1px solid #e6e8ef", borderRadius: 11,
            padding: "10px 18px", fontSize: 13.5, fontWeight: 600, color: "#475569", cursor: "pointer",
          }}
        >
          <Award size={16} color={accent} /> {t.viewPastResults}
        </button>
      </div>
    </DashboardShell>
  );
}
