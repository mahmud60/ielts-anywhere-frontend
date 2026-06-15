"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";

export default function GlobalError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error("[App Error Boundary]", error);
  }, [error]);

  // Detect AI / network errors from the 502 messages the backend sends
  const isAiError =
    error?.message?.includes("AI service unavailable") ||
    error?.message?.includes("AI returned");
  const isNetworkError =
    error?.message?.includes("Could not reach") ||
    error?.message?.includes("502") ||
    error?.message?.includes("503");

  const title = isAiError
    ? "AI is temporarily unavailable"
    : isNetworkError
    ? "Service unavailable"
    : "Something went wrong";

  const body = isAiError
    ? "Our AI couldn't process your request right now. This is usually temporary — please try again in a moment."
    : isNetworkError
    ? "We're having trouble reaching the server. Check your connection and try again."
    : "An unexpected error occurred. If this keeps happening, please contact support.";

  const iconBg = isAiError ? "#fff7ed" : "#fef2f2";
  const iconColor = isAiError ? "#f97316" : "#ef4444";

  return (
    <DashboardShell title="Error">
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>

          {/* Icon */}
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            color: iconColor,
          }}>
            <AlertTriangle size={30} />
          </div>

          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 12px",
            letterSpacing: "-0.025em",
          }}>
            {title}
          </h1>

          <p style={{
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.7,
            margin: "0 0 10px",
          }}>
            {body}
          </p>

          {/* Error detail (collapsed) */}
          {error?.message && (
            <p style={{
              fontSize: 11.5,
              color: "#94a3b8",
              fontFamily: "monospace",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 12px",
              margin: "0 0 28px",
              textAlign: "left",
              wordBreak: "break-word",
            }}>
              {error.message}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: "#6366f1", color: "#fff",
                fontWeight: 700, fontSize: 13.5, cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Try again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10,
                border: "1px solid #e2e8f0", background: "#fff",
                color: "#475569", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
              }}
            >
              <Home size={14} />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
