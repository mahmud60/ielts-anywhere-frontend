/**
 * /tests?mode= handling — filter available IELTS tests for SaaS flows.
 */

export const TEST_MODES = ["diagnostic", "full_mock"];

export function parseTestsMode(searchParams) {
  const raw = searchParams?.get?.("mode") ?? null;
  if (raw === "diagnostic" || raw === "full_mock") return raw;
  return null;
}

export function filterTestsByMode(tests, mode) {
  if (!Array.isArray(tests)) return [];
  if (mode === "diagnostic") {
    return tests.filter((t) => t.is_demo === true);
  }
  if (mode === "full_mock") {
    return tests.filter((t) => t.is_demo !== true);
  }
  return tests;
}

export function getTestsPageCopy(mode) {
  if (mode === "diagnostic") {
    return {
      title: "Free diagnostic",
      subtitle:
        "Short assessments to estimate your level. Results help you decide what to practice next.",
      startLabel: "Start diagnostic",
      emptyMessage: "No diagnostic tests are available right now. Check back soon.",
    };
  }
  if (mode === "full_mock") {
    return {
      title: "Full mock tests",
      subtitle:
        "Complete IELTS simulations — Listening, Reading, Writing, and Speaking with timed sections and detailed reports.",
      startLabel: "Start full mock",
      emptyMessage: "No full mock tests are available right now.",
    };
  }
  return {
    title: "Available tests",
    subtitle: "Each test contains all four IELTS modules taken in order.",
    startLabel: "Start test",
    emptyMessage: "No tests available.",
  };
}
