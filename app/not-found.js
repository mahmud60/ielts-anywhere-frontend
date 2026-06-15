"use client";

import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

const BRAND = "#6366f1";

export default function NotFound() {
  const router = useRouter();

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(150deg, #f0f0ff 0%, #f6f7fb 50%, #fff 100%)",
      fontFamily: "var(--font-inter), system-ui, sans-serif",
      padding: "40px 24px",
      color: "#0f172a",
    }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>

        {/* 404 number */}
        <div style={{
          fontSize: "clamp(72px, 18vw, 120px)",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-4px",
          background: `linear-gradient(135deg, ${BRAND} 0%, #8b5cf6 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 4,
          userSelect: "none",
        }}>
          404
        </div>

        {/* Owl */}
        <div style={{ fontSize: 52, marginBottom: 22, lineHeight: 1 }}>🦉</div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          margin: "0 0 12px",
          letterSpacing: "-0.025em",
        }}>
          Page not found
        </h1>

        <p style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.7,
          margin: "0 0 36px",
        }}>
          The page you're looking for doesn't exist or may have been moved.
          Check the URL or head back to where you came from.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 11, border: "none",
              background: BRAND, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99,102,241,.25)",
              transition: "filter .15s",
            }}
            onMouseOver={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseOut={e => e.currentTarget.style.filter = ""}
          >
            <Home size={16} />
            Go to Dashboard
          </button>

          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 11,
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseOut={e => e.currentTarget.style.background = "#fff"}
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>

        {/* Brand */}
        <div style={{
          marginTop: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          opacity: 0.7,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${BRAND}, #8b5cf6)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 11,
          }}>IA</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>
            IELTS<span style={{ color: BRAND }}>Anywhere</span>
          </span>
        </div>
      </div>
    </main>
  );
}
