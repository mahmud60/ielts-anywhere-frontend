"use client";

/**
 * ModuleTimer
 * Displays the countdown and shows a warning banner when time is low.
 *
 * Props:
 *   formatted  — "MM:SS" string from useModuleTimer
 *   isWarning  — true when < 5 minutes left
 *   isDanger   — true when < 1 minute left
 *   isExpired  — true when time ran out
 *   moduleName — "Listening" | "Reading" | etc.
 */
export default function ModuleTimer({
  formatted,
  isWarning,
  isDanger,
  isExpired,
  moduleName,
}) {
  const color = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";
  const bg = isDanger ? "#fee2e2" : isWarning ? "#fef3c7" : "#f0fdf4";

  return (
    <div>
      {/* Timer pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 99,
        background: bg, border: `1px solid ${color}44`,
        fontFamily: "monospace", fontSize: 14, fontWeight: 600, color,
        animation: isDanger ? "pulse 1s ease-in-out infinite" : "none",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {formatted}
      </div>

      {/* Warning banner — shown in page when < 5 min */}
      {isWarning && !isExpired && (
        <div style={{
          marginTop: 8, padding: "8px 14px",
          background: isDanger ? "#fee2e2" : "#fef3c7",
          borderRadius: 8, fontSize: 13,
          color: isDanger ? "#991b1b" : "#78350f",
          border: `1px solid ${isDanger ? "#fca5a5" : "#fcd34d"}`,
        }}>
          {isDanger
            ? `⚠️ Less than 1 minute remaining — your ${moduleName} answers will be auto-submitted shortly.`
            : `⏱ Under 5 minutes left for ${moduleName}. Start wrapping up your answers.`}
        </div>
      )}

      {/* Expired notice */}
      {isExpired && (
        <div style={{
          marginTop: 8, padding: "8px 14px",
          background: "#fee2e2", borderRadius: 8,
          fontSize: 13, color: "#991b1b",
          border: "1px solid #fca5a5",
        }}>
          Time's up — submitting your answers now…
        </div>
      )}
    </div>
  );
}