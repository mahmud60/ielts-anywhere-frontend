@AGENTS.md

# IELTS Anywhere — Frontend Codebase Guide

## Project Overview

IELTS practice platform with 4 modules: **Listening**, **Reading**, **Writing**, **Speaking**.

**Tiers:**
- **Free** — Listening, Reading, Diagnostic
- **Pro** — Writing, Speaking, Grammar, Vocabulary, Full mock tests, Progress analytics

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16.2.3 — App Router |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS + custom `da-*` CSS (injected by DashboardShell) |
| Icons | `lucide-react` only — never use other icon libraries |
| Auth | Firebase (`useAuth()` from `lib/AuthContext.js`) |
| Voice | ElevenLabs React SDK (`SpeakingSession.jsx`) |

All pages are `"use client"` — there are no server components inside `app/`.

---

## Design System

All app pages wrap their content in `<DashboardShell title="...">`. The shell injects a set of `da-*` CSS classes that **must** be used for consistency.

### Available Classes

| Class | Purpose |
|---|---|
| `da-card` | Standard white card (border + 16px radius) |
| `da-pcard` | Clickable practice card (hover lift effect) |
| `da-hero` | Hero section two-column grid |
| `da-btn` | Base button |
| `da-btn-primary` | Primary blue button (`#0ea5e9`) |
| `da-btn-pro` | Gradient Pro button (`#6366f1 → #8b5cf6`) |
| `da-btn-ghost` | Ghost / secondary button |
| `da-iconbtn` | 40×40 icon-only button |
| `da-stat-row` | Horizontal statistics grid |
| `da-grid-practice` | Auto-fill practice card grid (min 204px) |
| `da-act-row` | Clickable activity / list row |
| `da-iconwrap` | 42×42 icon container |
| `da-chip` | Small badge/chip |
| `da-pill-pro` | "Pro" badge pill |
| `da-seg` | Segmented control container |
| `da-seg-item` | Segmented control button (add `active` class for active) |
| `da-table` | HTML table styling |
| `da-col-opt` | Hide a table column on narrow screens |
| `da-locked` | Locked content wrapper |
| `da-locked-overlay` | Overlay with lock icon for Pro-gated content |
| `da-locked-blur` | Blur effect beneath a lock overlay |

### DashboardShell Usage

```jsx
import DashboardShell from "@/components/DashboardShell";

export default function MyPage() {
  return (
    <DashboardShell title="Page Title">
      {/* page content */}
    </DashboardShell>
  );
}
```

`title` controls which sidebar item is highlighted and what appears in the topbar.

### Loading States

```jsx
import PetLoader from "@/components/PetLoader";

// Full-screen overlay (during initial load)
<PetLoader fixed label="is loading your report" accent={MOD_COLORS.listening} />

// Inline (inside DashboardShell content area)
<PetLoader label="is building your exercises" accent={ACCENT} />
```

### Module Colors

Always import from `lib/moduleColors.js` — never hardcode module colors.

```js
import { MOD_COLORS, SPEAKING_THEME, READING_THEME, DIAGNOSTIC_THEME } from "@/lib/moduleColors";

MOD_COLORS = {
  listening: "#0ea5e9",
  reading:   "#14b8a6",
  writing:   "#10b981",
  speaking:  "#8b5cf6",
}

// Theme objects contain { accent, soft, gradient }
// e.g. SPEAKING_THEME.gradient = "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)"
```

---

## Auth Pattern

```js
import { useAuth } from "@/lib/AuthContext";

const { user, loading } = useAuth();

// Redirect unauthenticated users
useEffect(() => {
  if (!loading && !user) router.push("/login");
}, [user, loading, router]);

// Guard data fetches
useEffect(() => {
  if (!user) return;
  api.getSomething().then(setData);
}, [user]);
```

- `user.displayName` — display name
- `user.email` — email address

---

## Pro Gating Pattern

```js
import { isProUser } from "@/lib/landingAccess";

const [profile, setProfile] = useState(null);

useEffect(() => {
  if (!user) return;
  api.getMe().then(setProfile).catch(() => {});
}, [user]);

const isPro = isProUser(profile);

// Show gate while profile loads (profile === null means not yet fetched)
if (!isPro && profile !== null) {
  return <UpgradeCard />;  // or router.push("/pricing")
}
```

**Pro-only features:** Writing, Speaking, Grammar (`/learn/grammar`), Vocabulary (`/learn/vocabulary`), Full mock tests, Progress analytics tabs.

**Speaking has a two-layer gate:**
1. `app/speaking/page.jsx` — shows inline upgrade card for free users
2. `app/speaking/start/page.jsx` — hard redirects to `/pricing` if not Pro

---

## EN/BN Language Toggle — Critical Rules

The toggle switches improvement tips between English and Bengali. **Structural UI labels are always hardcoded English** — the toggle never affects them.

### Where the toggle IS shown
- Listening results: `app/listening/results/[attemptId]/page.js` (Bengali tips are pre-translated and stored in the DB — no read-time LLM)
- Writing results: `app/writing/results/[attemptId]/page.jsx`
- Speaking results: `app/speaking/results/[sessionId]/page.jsx`
- Grammar page: `app/learn/grammar/page.js`

### Where the toggle is NOT shown (everywhere else)
Dashboard, module list pages, test-taking UI, vocabulary page, reports list, etc.

### Rules for new code
- **Do NOT** use `useLang()` or `t.*` in new pages or components unless they are a report page or grammar page.
- **Do NOT** translate any structural label (heading, button, stat tile, tab name, etc.).
- **Only** API-fetched content (`improvement_tips` field) may appear in Bengali.

### API lang param
Pass `lang` only to these endpoints:
```js
api.getListeningAttempt(attemptId, lang)   // tips in response (Bengali pre-translated in DB)
api.pollWritingAttempt(attemptId, lang)    // tips in response
// getDashboard() — never pass lang; dashboard is always English
```

### Re-fetch on lang change pattern (results pages)
```js
const { lang, setLang } = useLang();
const prevLang = useRef(lang);

// Clear stale data so loader shows while re-fetching
useEffect(() => {
  if (prevLang.current !== lang) {
    prevLang.current = lang;
    setAttempt(null);
  }
}, [lang]);

useEffect(() => {
  if (!user) return;
  api.getListeningAttempt(attemptId, lang).then(setAttempt);
}, [user, attemptId, lang]);
```

---

## API Layer (`lib/api.js`)

All methods auto-attach the Firebase auth `Bearer` token. Methods return parsed JSON or throw with a descriptive message.

### Key methods

```js
api.getMe()                                   // user profile + Pro status
api.getDashboard()                            // dashboard stats (always English)
api.getAvailableTests()                       // cached 5 min
api.startSession(testId)                      // → { id: sessionId }
api.getListeningAttempt(attemptId, lang)      // lang: "en" | "bn" (BN pre-translated in DB)
api.pollWritingAttempt(attemptId, lang)       // poll until graded
api.getSpeakingResults(sessionId)
api.getGrammarExercises(lang)                 // Pro only
api.getVocabularyExercises()                  // Pro only, always English
```

---

## Routing Map

| Route | Description |
|---|---|
| `/dashboard` | Main dashboard |
| `/listening` | Listening test list |
| `/listening/[testId]` | Take a listening test |
| `/listening/results/[attemptId]` | Listening report (EN/BN toggle) |
| `/reading` | Reading test list |
| `/reading/[testId]` | Take a reading test |
| `/reading/results/[attemptId]` | Reading report |
| `/writing` | Writing test list (Pro) |
| `/writing/[testId]` | Take a writing test |
| `/writing/results/[attemptId]` | Writing report (EN/BN toggle) |
| `/speaking` | Speaking list + Pro gate |
| `/speaking/start` | Speaking session (Pro hard gate) |
| `/speaking/results/[sessionId]` | Speaking report (EN/BN toggle) |
| `/tests` | Test catalog (`?mode=full_mock` or `?mode=diagnostic`) |
| `/diagnostic` | Free diagnostic test |
| `/learn/grammar` | Grammar exercises (Pro, EN/BN toggle) |
| `/learn/vocabulary` | Vocabulary exercises (Pro, English only) |
| `/reports` | All past attempts |
| `/pricing` | Upgrade page |

---

## Key Conventions

- **`useSearchParams()` requires `Suspense`** — wrap the component that calls it (see `app/tests/page.js` pattern with `TestsPage` / `TestsPageContent`)
- **Module colors always from `MOD_COLORS`** — never hardcode `#0ea5e9` etc. directly
- **Icons always from `lucide-react`**
- **No new npm dependencies** without explicit user approval
- **No Bengali text** in any UI string — only backend-returned content (tips) may be Bengali when `lang=bn`
- **`ReportComponents.jsx`** (`components/report/`) contains shared `CriterionCard`, `SpeakingErrorPanel`, `PaywallGate`, `DetailedFeedback` — all labels hardcoded English; reuse these rather than rebuilding
