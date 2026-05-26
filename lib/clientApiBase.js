/**
 * Single API origin for browser-side fetch in exam modules.
 * Matches lib/api.js: browser uses same-origin proxy; server uses env URL.
 */
export function getClientApiBase() {
  if (typeof window !== "undefined") {
    return "/api-backend";
  }
  return process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";
}
