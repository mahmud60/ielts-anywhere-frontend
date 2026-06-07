/** Shared module accent palette (distinct from error/wrong-answer red #dc2626) */
export const MOD_COLORS = {
  listening: "#0ea5e9",
  reading: "#14b8a6",
  writing: "#10b981",
  speaking: "#8b5cf6",
};

export const MODULE_META = {
  listening: { label: "Listening", color: MOD_COLORS.listening, bg: "#f0f9ff" },
  reading: { label: "Reading", color: MOD_COLORS.reading, bg: "#ccfbf1" },
  writing: { label: "Writing", color: MOD_COLORS.writing, bg: "#d1fae5" },
  speaking: { label: "Speaking", color: MOD_COLORS.speaking, bg: "#ede9fe" },
};

export const READING_THEME = {
  accent: MOD_COLORS.reading,
  soft: "#ccfbf1",
  gradient: "linear-gradient(135deg,#2dd4bf 0%,#0d9488 100%)",
};

export const SPEAKING_THEME = {
  accent: MOD_COLORS.speaking,
  soft: "#ede9fe",
  gradient: "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)",
};

export const DIAGNOSTIC_THEME = {
  accent: "#6366f1",
  soft: "#eef2ff",
  gradient: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)",
};
