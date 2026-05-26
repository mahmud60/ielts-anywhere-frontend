"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { isProUser } from "@/lib/landingAccess";
import {
  filterTestsByMode,
  getTestsPageCopy,
  parseTestsMode,
} from "@/lib/testsMode";

const MODULE_LABELS = ["Listening", "Reading", "Writing", "Speaking"];

function bandColor(b) {
  if (!b) return "#9ca3af";
  return b >= 7 ? "#059669" : b >= 5.5 ? "#d97706" : "#dc2626";
}

const s = {
  wrap: { maxWidth: 680, margin: "0 auto", padding: "48px 24px" },
  h1: { fontSize: 28, fontWeight: 600, marginBottom: 6 },
  sub: { color: "#6b7280", fontSize: 15, marginBottom: 24, lineHeight: 1.55 },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: 500, fontSize: 16, marginBottom: 6 },
  meta: { color: "#9ca3af", fontSize: 13, marginBottom: 10 },
  chips: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: {
    fontSize: 11,
    padding: "2px 9px",
    borderRadius: 99,
    background: "#f3f4f6",
    color: "#6b7280",
  },
  btn: {
    padding: "10px 22px",
    borderRadius: 8,
    background: "#0ea5e9",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  banner: {
    background: "#eef2ff",
    border: "1px solid #e0e7ff",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 24,
    fontSize: 14,
    color: "#3730a3",
    lineHeight: 1.55,
  },
  upgradeBtn: {
    marginTop: 12,
    padding: "9px 18px",
    borderRadius: 8,
    background: "#6366f1",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};

function LastResult({ result }) {
  if (!result) return null;
  const { overall_band, module_bands } = result;
  if (!overall_band && !module_bands) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        background: "#f9fafb",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Last result
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {overall_band != null && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: bandColor(overall_band),
                fontFamily: "monospace",
                lineHeight: 1,
              }}
            >
              {overall_band.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>overall</span>
          </div>
        )}
        {module_bands && (
          <div style={{ display: "flex", gap: 10 }}>
            {["listening", "reading", "writing", "speaking"].map((m) =>
              module_bands[m] != null ? (
                <div key={m} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: bandColor(module_bands[m]),
                      fontFamily: "monospace",
                    }}
                  >
                    {module_bands[m].toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>
                    {m}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<p style={{ padding: 32, fontFamily: "system-ui" }}>Loading tests…</p>}>
      <TestsPageContent />
    </Suspense>
  );
}

function TestsPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseTestsMode(searchParams);

  const [tests, setTests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [starting, setStarting] = useState(null);
  const [lastResults, setLastResults] = useState({});
  const [startError, setStartError] = useState("");

  const isPro = isProUser(profile);
  const copy = getTestsPageCopy(mode);

  const visibleTests = useMemo(() => filterTestsByMode(tests, mode), [tests, mode]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setFetching(true);

    Promise.all([api.getAvailableTests(), api.getMe()])
      .then(([testList, me]) => {
        if (cancelled) return;
        setTests(testList);
        setProfile(me);
        testList.forEach((t) => {
          api
            .getTestLastResult(t.id)
            .then((result) => setLastResults((prev) => ({ ...prev, [t.id]: result })))
            .catch(() => {});
        });
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const start = async (testId) => {
    if (mode === "full_mock" && !isPro) {
      router.push("/pricing");
      return;
    }

    setStarting(testId);
    setStartError("");
    try {
      const session = await api.startSession(testId);
      router.push(`/test/${session.id}`);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not start test.";
      if (msg.includes("403") || msg.toLowerCase().includes("pro")) {
        router.push("/pricing");
      } else {
        setStartError(msg);
      }
      setStarting(null);
    }
  };

  if (loading || fetching) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>Loading tests…</p>;
  }

  const showProGate = mode === "full_mock" && !isPro;

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>{copy.title}</h1>
      <p style={s.sub}>{copy.subtitle}</p>

      {showProGate && (
        <div style={s.banner}>
          <strong>Pro required.</strong> Full mock tests include all four modules, AI Writing and
          Speaking feedback, and detailed progress reports.
          <div>
            <button type="button" style={s.upgradeBtn} onClick={() => router.push("/pricing")}>
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {startError && (
        <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{startError}</p>
      )}

      {visibleTests.map((t) => (
        <div key={t.id} style={s.card}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.title}>{t.title}</div>
            <div style={s.meta}>
              {t.test_type === "academic" ? "Academic" : "General"}
              {t.is_demo ? " · Diagnostic" : " · Full mock"}
            </div>
            <div style={s.chips}>
              {MODULE_LABELS.map((m) => (
                <span key={m} style={s.chip}>
                  {m}
                </span>
              ))}
            </div>
            <LastResult result={lastResults[t.id]} />
          </div>
          <div style={{ marginLeft: 16, flexShrink: 0 }}>
            <button
              type="button"
              style={{ ...s.btn, opacity: starting === t.id ? 0.6 : 1 }}
              disabled={starting === t.id || showProGate}
              onClick={() => start(t.id)}
            >
              {starting === t.id ? "Starting…" : showProGate ? "Pro only" : copy.startLabel}
            </button>
          </div>
        </div>
      ))}

      {visibleTests.length === 0 && (
        <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
          {copy.emptyMessage}
          {mode === "diagnostic" && (
            <>
              {" "}
              <span
                style={{ color: "#0ea5e9", cursor: "pointer" }}
                onClick={() => router.push("/dashboard")}
              >
                Back to dashboard
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}
