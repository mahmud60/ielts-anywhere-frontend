"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Search, ArrowRight, Award, CheckCircle2, RefreshCw } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function buildAttemptMap(attempts) {
  const map = new Map();
  if (Array.isArray(attempts)) {
    for (const a of attempts) {
      const tid = a.test_id;
      if (tid == null) continue;
      const existing = map.get(tid);
      if (!existing || (a.overall_band ?? 0) > (existing.overall_band ?? 0)) {
        map.set(tid, a);
      }
    }
  }
  return map;
}

function readCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function writeCache(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

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

function bandColor(b) {
  if (!b || b <= 0) return "#94a3b8";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

/**
 * Reusable exam browser for a single module (Listening / Reading).
 */
export default function ExamListPage(config) {
  const {
    moduleKey, title, subtitle, accent, accentSoft, gradient, icon, duration,
    facts = [], fetchTests, fetchAttempts, startPath, getDescription, getMeta,
  } = config;

  const TESTS_KEY = `ielts_examlist_tests_${moduleKey}`;
  const ATTEMPTS_KEY = `ielts_examlist_attempts_${moduleKey}`;

  useShimmerStyle();

  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState(null);
  const [attemptMap, setAttemptMap] = useState(new Map());
  const [starting, setStarting] = useState(null);
  const [query, setQuery] = useState("");

  // Hydrate tests + attempts from cache before first paint so completed bands
  // render instantly on revisit/reload instead of popping in after the fetch.
  useIsomorphicLayoutEffect(() => {
    const cachedTests = readCache(TESTS_KEY);
    if (cachedTests) setTests(cachedTests);
    const cachedAttempts = readCache(ATTEMPTS_KEY);
    if (cachedAttempts) setAttemptMap(buildAttemptMap(cachedAttempts));
  }, [TESTS_KEY, ATTEMPTS_KEY]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetchTests()
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d) ? d : [];
        setTests(list);
        writeCache(TESTS_KEY, list);
      })
      .catch(() => { if (!cancelled) setTests((prev) => (prev == null ? [] : prev)); });

    if (fetchAttempts) {
      fetchAttempts()
        .then((attempts) => {
          if (cancelled) return;
          setAttemptMap(buildAttemptMap(attempts));
          if (Array.isArray(attempts)) writeCache(ATTEMPTS_KEY, attempts);
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
    // Intentionally runs only when `user` becomes available; the fetchers are
    // fresh closures each render and the cache keys are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading && tests === null) {
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
        <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>No tests available yet</div>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 auto", maxWidth: 360 }}>
          New {title} are added regularly. Check back soon or explore another module.
        </p>
      </div>
    );
  } else if (filtered.length === 0) {
    listContent = (
      <div className="da-card" style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
        No tests match &ldquo;{query}&rdquo;.
      </div>
    );
  } else {
    listContent = (
      <div style={GRID}>
        {filtered.map((test, i) => {
          const meta = getMeta?.(test) || [];
          const isStarting = starting === test.id;
          const attempt = attemptMap.get(test.id);
          const taken = !!attempt;
          const band = attempt?.overall_band;

          return (
            <div
              key={test.id}
              className="da-pcard"
              onClick={() => !isStarting && start(test)}
              style={{
                padding: 0,
                overflow: "hidden",
                opacity: isStarting ? 0.65 : 1,
                border: taken ? `1.5px solid ${accent}55` : undefined,
              }}
            >
              <div style={{ height: 6, background: taken ? `${accent}88` : gradient }} />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: taken ? accentSoft : accentSoft,
                    color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
                  }}>
                    {taken
                      ? <CheckCircle2 size={20} color={accent} />
                      : String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {taken && band != null && (
                      <span style={{
                        fontSize: 11.5, fontWeight: 700, color: bandColor(band),
                        background: "#f0fdf4", borderRadius: 99, padding: "4px 9px",
                        border: `1px solid ${bandColor(band)}44`,
                      }}>
                        Band {Number(band).toFixed(1)}
                      </span>
                    )}
                    {!taken && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11.5, fontWeight: 600, color: "#64748b",
                        background: "#f4f5f9", borderRadius: 99, padding: "5px 11px",
                      }}>
                        <Clock size={12} /> {duration}
                      </span>
                    )}
                  </div>
                </div>

                {taken && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, color: accent,
                    textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6,
                  }}>
                    <CheckCircle2 size={12} /> Completed
                  </div>
                )}

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

                {taken ? (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: "#fff", color: accent,
                    border: `1.5px solid ${accent}`,
                    borderRadius: 11, padding: "11px 16px", fontSize: 14, fontWeight: 700,
                  }}>
                    {isStarting ? "Opening…" : <><RefreshCw size={15} /> Retake test</>}
                  </div>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: gradient, color: "#fff", borderRadius: 11,
                    padding: "11px 16px", fontSize: 14, fontWeight: 700,
                  }}>
                    {isStarting ? "Opening…" : <><span>Start test</span> <ArrowRight size={16} /></>}
                  </div>
                )}
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
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>Available tests</h2>
          {!isLoadingTests && <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{filtered.length}</span>}
        </div>
        <div style={{ position: "relative", flex: "0 1 280px" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tests…"
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
          <Award size={16} color={accent} /> View your past results
        </button>
      </div>
    </DashboardShell>
  );
}
