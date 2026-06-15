"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Bot, FileX, Home, ArrowLeft, RefreshCw } from "lucide-react";

const CONFIGS = {
  not_found: {
    icon: FileX,
    iconBg: "#f1f5f9",
    iconColor: "#64748b",
    title: "Report not found",
    body: "This report doesn't exist or you may not have access to it.",
  },
  ai_unavailable: {
    icon: Bot,
    iconBg: "#fff7ed",
    iconColor: "#f97316",
    title: "AI is temporarily unavailable",
    body: "We couldn't process your request right now. Please try again in a moment.",
  },
  error: {
    icon: AlertCircle,
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
    title: "Something went wrong",
    body: null, // uses message prop
  },
};

/**
 * Full-screen error state — drop-in replacement for bare <p style="color:red"> patterns.
 *
 * Props:
 *   type        "not_found" | "ai_unavailable" | "error"
 *   message     Custom message (overrides default body; shown as sub-detail for "error")
 *   onRetry     If provided, shows a "Try again" button
 *   backHref    If provided, shows a back button linking here
 *   backLabel   Label for the back button (default "Go back")
 */
export default function ErrorState({
  type = "error",
  message,
  onRetry,
  backHref,
  backLabel = "Go back",
}) {
  const router = useRouter();
  const cfg = CONFIGS[type] || CONFIGS.error;
  const Icon = cfg.icon;
  const bodyText = cfg.body || message || "An unexpected error occurred.";

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "var(--font-inter), system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: cfg.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 22px",
          color: cfg.iconColor,
        }}>
          <Icon size={28} />
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px",
          letterSpacing: "-0.02em",
        }}>
          {cfg.title}
        </h2>

        {/* Body */}
        <p style={{
          fontSize: 14,
          color: "#64748b",
          lineHeight: 1.65,
          margin: "0 0 28px",
        }}>
          {bodyText}
          {type === "error" && message && cfg.body && (
            <span style={{
              display: "block",
              marginTop: 8,
              fontSize: 12,
              color: "#94a3b8",
              fontFamily: "monospace",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "6px 10px",
              textAlign: "left",
              wordBreak: "break-word",
            }}>
              {message}
            </span>
          )}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {onRetry && (
            <button
              onClick={onRetry}
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
          )}
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10,
                border: "1px solid #e2e8f0", background: "#fff",
                color: "#475569", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} />
              {backLabel}
            </button>
          )}
          {!onRetry && !backHref && (
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: "#6366f1", color: "#fff",
                fontWeight: 700, fontSize: 13.5, cursor: "pointer",
              }}
            >
              <Home size={14} />
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
