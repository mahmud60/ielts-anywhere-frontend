import { auth } from "./firebase";

const BASE = process.env.NEXT_PUBLIC_API_BASE;

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const user = auth.currentUser;
  if (user) {
    headers["Authorization"] = `Bearer ${await user.getIdToken(true)}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
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
  getListeningForSession: (sessionId) =>
    apiFetch(`/listening/for-session/${sessionId}`),
  submitListening: (testId, answers) =>
    apiFetch("/listening/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, answers }),
    }),

  // Reading
  getReadingForSession: (sessionId) =>
    apiFetch(`/reading/for-session/${sessionId}`),
  submitReading: (testId, answers) =>
    apiFetch("/reading/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, answers }),
    }),

  // Writing
  getWritingForSession: (sessionId) =>
    apiFetch(`/writing/for-session/${sessionId}`),
  submitWriting: (testId, responses) =>
    apiFetch("/writing/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, responses }),
    }),
  pollWritingAttempt: (attemptId) =>
    apiFetch(`/writing/attempts/${attemptId}`),

  // Speaking
  getSpeakingForSession: (sessionId) =>
    apiFetch(`/speaking/for-session/${sessionId}`),
  submitSpeaking: (testId, partResponses) =>
    apiFetch("/speaking/submit", {
      method: "POST",
      body: JSON.stringify({ test_id: testId, part_responses: partResponses }),
    }),
  pollSpeakingAttempt: (attemptId) =>
    apiFetch(`/speaking/attempts/${attemptId}`),

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
  getCheckoutUrl: () => apiFetch("/payments/checkout-url"),

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
      apiFetch("/admin/listening/tests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateListeningTest: (testId, data) =>
      apiFetch(`/admin/listening/tests/${testId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    getQuestions: (sectionId) =>
      apiFetch(`/admin/listening/sections/${sectionId}/questions`),
    createQuestion: (sectionId, data) =>
      apiFetch(`/admin/listening/sections/${sectionId}/questions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateQuestion: (questionId, data) =>
      apiFetch(`/admin/listening/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteQuestion: (questionId) =>
      apiFetch(`/admin/listening/questions/${questionId}`, { method: "DELETE" }),
    uploadAudio: async (sectionId, file) => {
      const token = auth.currentUser
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
  },
};