/**
 * Time limits (seconds) for STANDALONE practice tests — /listening/[testId],
 * /reading/[testId], /writing/[testId].
 *
 * The full test session (/test/[sessionId]) does NOT use these: it gets its
 * limit from the server via useModuleTimer -> GET /sessions/{id}/time-remaining,
 * which is authoritative because the server records the module start time.
 *
 * Standalone practice has no session, so there is nothing server-side to ask.
 * These values are therefore a deliberate DUPLICATE of the backend env vars:
 *
 *   LISTENING_TIME_LIMIT=1800   READING_TIME_LIMIT=3600
 *   WRITING_TIME_LIMIT=3600     SPEAKING_TIME_LIMIT=900
 *
 * set in .github/workflows/deploy.yml on the backend repo.
 *
 * ⚠ If you change those env vars, change these too — nothing enforces that they
 * agree, and a mismatch silently gives practice tests a different clock than
 * the real session. The drift-proof alternative is a public
 * GET /config/time-limits endpoint on the backend (today's only endpoint,
 * /admin/time-limits, is admin-gated and unusable here).
 */
export const STANDALONE_TIME_LIMITS = {
  listening: 1800,  // 30 min
  reading: 3600,    // 60 min
  writing: 3600,    // 60 min
};
