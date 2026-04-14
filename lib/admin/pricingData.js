export function formatSeconds(seconds) {
  return `${Math.floor(seconds / 60)} min`;
}

export const MODULE_COLORS = {
  listening: "#0ea5e9",
  reading:   "#f59e0b",
  writing:   "#10b981",
  speaking:  "#8b5cf6",
};