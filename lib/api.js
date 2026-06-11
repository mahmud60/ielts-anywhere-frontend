import { auth } from "./firebase";
import { getClientApiBase } from "./clientApiBase";

const REMOTE_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
// Browser: same-origin proxy (avoids CORS when using 127.0.0.1 vs localhost).
const BASE = getClientApiBase() || REMOTE_BASE;

const _cache = new Map();
const TTL = 5 * 60 * 1000;

function cached(key, fetcher) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data);
  return fetcher().then(data => {
    _cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

async function apiFetch(path, options = {}) {
  if (!BASE) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE is not set. Copy .env.example to .env.local and set your API URL.",
    );
  }
  const headers = { "Content-Type": "application/json", ...options.headers };
  const user = auth?.currentUser;
  if (user) {
    headers["Authorization"] = `Bearer ${await user.getIdToken(true)}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not reach the API (${detail}). Check that the backend is running and NEXT_PUBLIC_API_BASE is correct.`,
    );
  }
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  getMe: () => apiFetch("/auth/me"),

  // Tests & sessions
  getAvailableTests: () => apiFetch("/sessions/tests"),
  startSession: (ieltsTestId) =>
    apiFetch("/sessions/start", {
      method: "POST",
      body: JSON.stringify({ ielts_test_id: ieltsTestId }),
    }),
  getSession: (sessionId) => apiFetch(`/sessions/${sessionId}`),
  startModule: (sessionId) =>
    apiFetch(`/sessions/${sessionId}/start-module`, { method: "POST" }),
  getTimeRemaining: (sessionId) =>
    apiFetch(`/sessions/${sessionId}/time-remaining`),
  completeModule: (sessionId) =>
    apiFetch(`/sessions/${sessionId}/complete-module`, { method: "POST" }),
  getResults: (sessionId) => apiFetch(`/sessions/${sessionId}/results`),

  // Listening
  getListeningTests: () => cached("listeningTests", () => apiFetch("/listening/tests")),
  getListeningTest: (testId) => apiFetch(`/listening/tests/${testId}`),
  getListeningAttempts: () => apiFetch("/listening/attempts"),
  getListeningAttempt: (attemptId) => apiFetch(`/listening/attempts/${attemptId}`),
  getListeningForSession: (sessionId) =>
    apiFetch(`/listening/for-session/${sessionId}`),
  submitListening: (testId, answers) =>
    apiFetch("/listening/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, answers }),
    }),

  // Reading
  getReadingTests: () => cached("readingTests", () => apiFetch("/reading/tests")),
  getReadingTest: (testId) => apiFetch(`/reading/tests/${testId}`),
  getReadingAttempts: () => apiFetch("/reading/attempts"),
  getReadingAttempt: (attemptId) => apiFetch(`/reading/attempts/${attemptId}`),
  getReadingForSession: (sessionId) =>
    apiFetch(`/reading/for-session/${sessionId}`),
  submitReading: (testId, answers) =>
    apiFetch("/reading/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, answers }),
    }),

  // Writing
  getWritingTests: () => cached("writingTests", () => apiFetch("/writing/tests")),
  getWritingTest: (testId) => apiFetch(`/writing/tests/${testId}`),
  getWritingAttempts: () => apiFetch("/writing/attempts"),
  getWritingAttempt: (attemptId) => apiFetch(`/writing/attempts/${attemptId}`),
  getWritingForSession: (sessionId) =>
    apiFetch(`/writing/for-session/${sessionId}`),
  submitWriting: (testId, responses) =>
    apiFetch("/writing/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, responses }),
    }),
  pollWritingAttempt: (attemptId) =>
    apiFetch(`/writing/attempts/${attemptId}`),

  // Speaking (session-linked)
  getSpeakingForSession: (sessionId) =>
    apiFetch(`/speaking/for-session/${sessionId}`),
  submitSpeaking: (testId, partResponses) =>
    apiFetch("/speaking/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, part_responses: partResponses }),
    }),
  pollSpeakingAttempt: (attemptId) =>
    apiFetch(`/speaking/attempts/${attemptId}`),

  // Speaking (ElevenLabs standalone)
  elGetSignedUrl: () => apiFetch("/speaking/el-signed-url"),
  elSubmitSpeaking: (transcript, elSessionId, testSessionId = null) =>
    apiFetch("/speaking/el-submit", {
      method: "POST",
      body: JSON.stringify({
        transcript,
        elevenlabs_session_id: elSessionId ?? null,
        test_session_id: testSessionId ?? null,
      }),
    }),
  getSpeakingResults: (sessionId) => apiFetch(`/speaking/results/${sessionId}`),
  getSpeakingHistory: () => apiFetch("/speaking/history"),

  // Reset Module
  resetModule: (sessionId) =>
  apiFetch(`/sessions/${sessionId}/reset-module`, { method: "POST" }),

  restartSession: (sessionId) =>
    apiFetch(`/sessions/${sessionId}/restart`, { method: "POST" }),

  getLastScores:  (sessionId) =>
    apiFetch(`/sessions/${sessionId}/last-scores`),
  
  getTestLastResult: (testId) =>
    apiFetch(`/sessions/tests/${testId}/last-result`),

  getDashboard: () => apiFetch("/dashboard"),

  // Learn (Pro only)
  getVocabularyExercises: () => apiFetch("/learn/vocabulary", { method: "POST" }),
  getGrammarExercises: () => apiFetch("/learn/grammar", { method: "POST" }),

  // IeltsTest management
  getIeltsTests: () => apiFetch("/admin/ielts-tests"),
  createIeltsTest: (data) =>
    apiFetch("/admin/ielts-tests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateIeltsTest: (testId, data) =>
    apiFetch(`/admin/ielts-tests/${testId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteIeltsTest: (testId) =>
    apiFetch(`/admin/ielts-tests/${testId}`, { method: "DELETE" }),

  // Payments
  getCheckoutUrl: (refCode) =>
    apiFetch(`/payments/checkout-url${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`),

  // Admin
  admin: {
    getStats: () => apiFetch("/admin/stats"),
    getUsers: (search = "", skip = 0) =>
      apiFetch(`/admin/users?search=${search}&skip=${skip}`),
    updateSubscription: (userId, tier) =>
      apiFetch(`/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ subscription: tier }),
      }),
    toggleAdmin: (userId, isAdmin) =>
      apiFetch(`/admin/users/${userId}/admin`, {
        method: "PATCH",
        body: JSON.stringify({ is_admin: isAdmin }),
      }),
    getListeningTests: () => apiFetch("/admin/listening/tests"),
    createListeningTest: (data) =>
      apiFetch("/admin/listening/tests", { method: "POST", body: JSON.stringify(data) }),
    deleteListeningTest: (testId) =>
      apiFetch(`/admin/listening/tests/${testId}`, { method: "DELETE" }),
    updateListeningTest: (testId, data) =>
      apiFetch(`/admin/listening/tests/${testId}`, { method: "PATCH", body: JSON.stringify(data) }),
    createListeningSection: (testId, data) =>
      apiFetch(`/admin/listening/tests/${testId}/sections`, { method: "POST", body: JSON.stringify(data) }),
    updateListeningSection: (sectionId, data) =>
      apiFetch(`/admin/listening/sections/${sectionId}`, { method: "PATCH", body: JSON.stringify(data) }),
    getSubsections: (sectionId) =>
      apiFetch(`/admin/listening/sections/${sectionId}/subsections`),
    createSubsection: (sectionId, data) =>
      apiFetch(`/admin/listening/sections/${sectionId}/subsections`, { method: "POST", body: JSON.stringify(data) }),
    updateSubsection: (subsectionId, data) =>
      apiFetch(`/admin/listening/subsections/${subsectionId}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteSubsection: (subsectionId) =>
      apiFetch(`/admin/listening/subsections/${subsectionId}`, { method: "DELETE" }),
    getQuestions: (subsectionId) =>
      apiFetch(`/admin/listening/subsections/${subsectionId}/questions`),
    createQuestion: (subsectionId, data) =>
      apiFetch(`/admin/listening/subsections/${subsectionId}/questions`, { method: "POST", body: JSON.stringify(data) }),
    updateQuestion: (questionId, data) =>
      apiFetch(`/admin/listening/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteQuestion: (questionId) =>
      apiFetch(`/admin/listening/questions/${questionId}`, { method: "DELETE" }),
    uploadAudio: async (sectionId, file) => {
      const token = auth?.currentUser
        ? await auth.currentUser.getIdToken(true)
        : "";
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch(`${BASE}/admin/listening/sections/${sectionId}/audio`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    // Reading
    getReadingTests: () => apiFetch("/admin/reading/tests"),
    createReadingTest: (data) =>
      apiFetch("/admin/reading/tests", { method: "POST", body: JSON.stringify(data) }),
    createReadingPassage: (testId, data) =>
      apiFetch(`/admin/reading/tests/${testId}/passages`, { method: "POST", body: JSON.stringify(data) }),
    updateReadingPassage: (passageId, data) =>
      apiFetch(`/admin/reading/passages/${passageId}`, { method: "PATCH", body: JSON.stringify(data) }),
    createReadingGroup: (passageId, data) =>
      apiFetch(`/admin/reading/passages/${passageId}/groups`, { method: "POST", body: JSON.stringify(data) }),
    updateReadingGroup: (groupId, data) =>
      apiFetch(`/admin/reading/groups/${groupId}`, { method: "PATCH", body: JSON.stringify(data) }),
    getReadingQuestions: (groupId) =>
      apiFetch(`/admin/reading/groups/${groupId}/questions`),
    createReadingQuestion: (groupId, data) =>
      apiFetch(`/admin/reading/groups/${groupId}/questions`, { method: "POST", body: JSON.stringify(data) }),
    updateReadingQuestion: (questionId, data) =>
      apiFetch(`/admin/reading/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteReadingQuestion: (questionId) =>
      apiFetch(`/admin/reading/questions/${questionId}`, { method: "DELETE" }),
    deleteReadingGroup: (groupId) =>
      apiFetch(`/admin/reading/groups/${groupId}`, { method: "DELETE" }),
    deleteReadingPassage: (passageId) =>
      apiFetch(`/admin/reading/passages/${passageId}`, { method: "DELETE" }),
    updateReadingTest: (testId, data) =>
      apiFetch(`/admin/reading/tests/${testId}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteReadingTest: (testId) =>
      apiFetch(`/admin/reading/tests/${testId}`, { method: "DELETE" }),
    generateListeningTips: (testId, overwrite = false) =>
      apiFetch(`/admin/listening/tests/${testId}/generate-tips?overwrite=${overwrite}`, { method: "POST" }),
    generateReadingTips: (testId, overwrite = false) =>
      apiFetch(`/admin/reading/tests/${testId}/generate-tips?overwrite=${overwrite}`, { method: "POST" }),

    // Writing
    getWritingTests: () => apiFetch("/admin/writing/tests"),
    createWritingTest: (data) =>
      apiFetch("/admin/writing/tests", { method: "POST", body: JSON.stringify(data) }),
    createWritingTask: (testId, data) =>
      apiFetch(`/admin/writing/tests/${testId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
    updateWritingTask: (taskId, data) =>
      apiFetch(`/admin/writing/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),

    // Speaking
    getSpeakingTests: () => apiFetch("/admin/speaking/tests"),
    createSpeakingTest: (data) =>
      apiFetch("/admin/speaking/tests", { method: "POST", body: JSON.stringify(data) }),
    createSpeakingPart: (testId, data) =>
      apiFetch(`/admin/speaking/tests/${testId}/parts`, { method: "POST", body: JSON.stringify(data) }),
    updateSpeakingPart: (partId, data) =>
      apiFetch(`/admin/speaking/parts/${partId}`, { method: "PATCH", body: JSON.stringify(data) }),

    // IeltsTest management
    getIeltsTests: () => apiFetch("/admin/ielts-tests"),
    createIeltsTest: (data) =>
      apiFetch("/admin/ielts-tests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateIeltsTest: (testId, data) =>
      apiFetch(`/admin/ielts-tests/${testId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteIeltsTest: (testId) =>
      apiFetch(`/admin/ielts-tests/${testId}`, { method: "DELETE" }),
    
    getPricing: () => apiFetch("/admin/pricing"),
    getTimeLimits: () => apiFetch("/admin/time-limits"),

    // Affiliates
    getAffiliates: () => apiFetch("/admin/affiliates"),
    createAffiliate: (data) =>
      apiFetch("/admin/affiliates", { method: "POST", body: JSON.stringify(data) }),
    updateAffiliate: (id, data) =>
      apiFetch(`/admin/affiliates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    getAffiliateReferrals: (id) => apiFetch(`/admin/affiliates/${id}/referrals`),
  },

  // Affiliate self-service
  affiliate: {
    getMe: () => apiFetch("/affiliate/me"),
    validateCode: (code) => apiFetch(`/affiliate/validate/${encodeURIComponent(code)}`),
  },
};