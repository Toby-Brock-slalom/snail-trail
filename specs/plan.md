# Implementation Plan: Bootcamp Skills Tracker

**Feature**: Bootcamp Skills Tracker  
**Branch**: `001-bootcamp-skills-tracker`  
**Plan Created**: 2026-07-09  
**Status**: Approved

---

## 1. Technical Context

### Stack Decisions (Resolved)

| Concern | Decision | Rationale |
|---|---|---|
| UI layer | Vanilla HTML5 + CSS3 + JS ES2022 modules | Constitution Principle I; zero build step for app code |
| Persistence | `localStorage` only (via storage abstraction module) | Simpler than IndexedDB for this data shape; < 5 KB of structured JSON |
| Offline | Hand-rolled Service Worker, cache-first, no Workbox | Keeps app dependency-free; Workbox is 30 KB+ |
| Testing | Vitest + `@vitest/coverage-v8` + jsdom (dev-only) | Browser-compatible, fast, no separate babel config needed |
| Routing | URL hash (`location.hash`) with `hashchange` listener | No server config needed; works on `file://` and static hosts |
| Curriculum | Static `data/curriculum.json`, fetched at startup | Avoids hard-coding data in JS; easy to update without touching logic |
| Animation | CSS keyframe on SVG checkmark icon | GPU-composited, no JS animation library needed |
| Build pipeline | None for app code | `npx vitest` for tests only; `npx serve .` for local dev |

### Known Constraints

- Total initial page weight **< 200 KB** uncompressed (HTML + CSS + JS).
- No render-blocking resources in the critical path (`<script type="module">` is deferred by default).
- Service worker only activates on `https://` or `localhost`; graceful degradation on `file://`.
- Notes are free-form text; rendered via `textContent` (never `innerHTML`) to prevent XSS.
- Schema version tracked in `localStorage`; mismatch triggers migration or user prompt — never silent overwrite.

---

## 2. Constitution Check

| Principle | Compliance Status | Evidence |
|---|---|---|
| **I. Simplicity & Vanilla First** | PASS | Zero npm runtime deps; `<script type="module">` loads; no preprocessor |
| **II. Intuitive UX** | PASS | All primary actions ≤ 2 clicks; plain-English labels; empty states designed |
| **III. Accessibility (WCAG 2.1 AA)** | PASS | `aria-live` regions for dynamic updates; keyboard nav in all components; contrast tokens enforced at CSS level |
| **IV. Client-Side Persistence** | PASS | `storage.js` is sole entry point to `localStorage`; no direct calls in UI modules |
| **V. Performance & Offline** | PASS | SW cache-first; < 200 KB budget; `<link rel="preload">` for critical CSS |
| **VI. Test-Driven Core Logic** | PASS | Unit tests required for `storage`, `state`, `progress`, `streak`, `notes` before implementation |
| **VII. Demo-Ready Polish** | PASS | CSS design tokens; purposeful animations ≤ 300 ms; all UI states designed |

**Gate result: ALL PASS — implementation may proceed.**

---

## 3. File Structure

```
/                              # Project root
├── index.html                 # App shell; single HTML file
├── style.css                  # All styles; CSS custom properties design system
├── app.js                     # Entry point (type="module"); wires modules together
├── sw.js                      # Service worker; cache-first strategy; versioned cache name
├── package.json               # dev-only: vitest, jsdom, @vitest/coverage-v8
├── vitest.config.js           # jsdom environment, coverage thresholds ≥ 80%
├── .eslintrc.json             # ESLint config (ES2022, browser globals)
├── data/
│   └── curriculum.json        # Pre-loaded module/topic definitions (read-only)
├── modules/
│   ├── storage.js             # localStorage abstraction (get, set, clear, migrate)
│   ├── state.js               # In-memory app state; mutation functions; event emitter
│   ├── router.js              # Hash router; route registration; active route tracking
│   ├── renderer.js            # DOM rendering; template helpers; event delegation setup
│   ├── progress.js            # Pure functions: overall %, per-module %, completion state
│   ├── streak.js              # Streak increment logic; calendar-day comparison
│   ├── notes.js               # Debounced note auto-save (≤ 1 s debounce)
│   └── sw-registration.js     # Service worker registration; graceful failure handling
└── tests/
    ├── storage.test.js
    ├── state.test.js
    ├── progress.test.js
    ├── streak.test.js
    └── notes.test.js
```

---

## 4. Data Model

### 4.1 `data/curriculum.json` — Static Curriculum Definition

```json
{
  "version": "1.0",
  "modules": [
    {
      "id": "mod-001",
      "title": "Introduction to AI",
      "topics": [
        { "id": "top-001-001", "title": "What is Artificial Intelligence?" },
        { "id": "top-001-002", "title": "Machine Learning Fundamentals" },
        { "id": "top-001-003", "title": "Neural Networks and Deep Learning" },
        { "id": "top-001-004", "title": "Large Language Models (LLMs)" },
        { "id": "top-001-005", "title": "AI Ethics and Responsible Use" }
      ]
    },
    {
      "id": "mod-002",
      "title": "Prompt Engineering",
      "topics": [
        { "id": "top-002-001", "title": "Anatomy of a Good Prompt" },
        { "id": "top-002-002", "title": "Zero-Shot and Few-Shot Prompting" },
        { "id": "top-002-003", "title": "Chain-of-Thought Prompting" },
        { "id": "top-002-004", "title": "System Prompts and Personas" },
        { "id": "top-002-005", "title": "Iterative Prompt Refinement" },
        { "id": "top-002-006", "title": "Common Prompt Pitfalls" }
      ]
    },
    {
      "id": "mod-003",
      "title": "GitHub Copilot",
      "topics": [
        { "id": "top-003-001", "title": "Getting Started with Copilot" },
        { "id": "top-003-002", "title": "Inline Suggestions and Tab Completion" },
        { "id": "top-003-003", "title": "Copilot Chat and /commands" },
        { "id": "top-003-004", "title": "Copilot for Code Review" },
        { "id": "top-003-005", "title": "Copilot Best Practices" }
      ]
    },
    {
      "id": "mod-004",
      "title": "AI in DevOps",
      "topics": [
        { "id": "top-004-001", "title": "AI-Assisted CI/CD Pipelines" },
        { "id": "top-004-002", "title": "Automated Testing with AI" },
        { "id": "top-004-003", "title": "Intelligent Monitoring and Alerting" },
        { "id": "top-004-004", "title": "AI for Infrastructure as Code" },
        { "id": "top-004-005", "title": "Security Scanning with AI" }
      ]
    },
    {
      "id": "mod-005",
      "title": "Building with AI APIs",
      "topics": [
        { "id": "top-005-001", "title": "OpenAI API Fundamentals" },
        { "id": "top-005-002", "title": "Prompt Templates and Variables" },
        { "id": "top-005-003", "title": "Streaming Responses" },
        { "id": "top-005-004", "title": "Function Calling and Tools" },
        { "id": "top-005-005", "title": "RAG (Retrieval-Augmented Generation) Basics" },
        { "id": "top-005-006", "title": "Cost Management and Rate Limiting" }
      ]
    }
  ]
}
```

**Total topics: 27** (5 + 6 + 5 + 5 + 6)

### 4.2 App State — localStorage Schema

Stored under a single key `bst_appState`. Schema version tracked to enable migrations.

```json
{
  "schemaVersion": 1,
  "completions": {
    "top-001-001": true,
    "top-003-002": true
  },
  "notes": {
    "top-001-001": "My reflection on this topic...",
    "top-003-002": ""
  },
  "streak": {
    "count": 3,
    "lastActiveDate": "2026-07-09",
    "lastCompletionDate": "2026-07-09"
  }
}
```

**Storage key strategy:**
- Single key `bst_appState` — one JSON blob, one `JSON.parse`, atomic writes.
- No topic or note keys scattered across localStorage.
- `storage.js` is the only module allowed to read or write this key.

**Schema migration rules:**
- On load, compare stored `schemaVersion` against `CURRENT_SCHEMA_VERSION` constant.
- If stored < current → run forward migration functions (e.g., `migrate_v1_to_v2`).
- If stored > current → show user message: "Your data was saved by a newer version of this app. Reset or continue with limited compatibility."
- If key missing → treat as fresh install; write default state.

### 4.3 In-Memory State Shape (runtime only — never persisted directly)

```js
{
  curriculum: { version, modules: [{ id, title, topics: [{ id, title }] }] },
  completions: Map<topicId, boolean>,
  notes: Map<topicId, string>,
  streak: { count, lastActiveDate, lastCompletionDate },
  ui: {
    activeRoute: String,           // current hash route
    expandedModuleId: String|null, // which module accordion is open
    expandedTopicId: String|null,  // which topic note panel is open
    storageAvailable: Boolean      // false if localStorage blocked/full
  }
}
```

---

## 5. Module Contracts

### 5.1 `modules/storage.js`

```js
// Exported API
export function load(): AppState | null
export function save(state: AppState): void        // throws StorageError if quota exceeded
export function clear(): void
export function isAvailable(): boolean             // feature-detects localStorage
export function migrate(raw: object): AppState     // handles schema version upgrades
```

**Invariants:**
- `save()` performs a single `localStorage.setItem` call with the full serialised state.
- `load()` performs a single `localStorage.getItem` + `JSON.parse`.
- `save()` wraps in try/catch; on `QuotaExceededError` dispatches a `storage:error` custom event consumed by the UI to surface a user message.
- No other module imports from `localStorage` directly.

### 5.2 `modules/state.js`

```js
// Exported API
export function initialise(curriculum, persisted): void   // merges curriculum + stored state
export function getState(): Readonly<AppState>
export function toggleCompletion(topicId: string): void   // mutates + auto-saves + emits change
export function setNote(topicId: string, text: string): void  // used by notes.js debouncer
export function resetAll(): void                          // clears completions, notes, streak
export function onStateChange(listener: Function): () => void // returns unsubscribe fn
```

**Invariants:**
- State mutations always call `storage.save()` before emitting change events.
- `toggleCompletion` calls `streak.maybeIncrement()` when a topic transitions to complete.
- `getState()` returns a frozen (shallow) copy — callers cannot mutate state directly.

### 5.3 `modules/progress.js`

```js
// Pure functions — no side effects, no imports from state/storage
export function overallPercent(completions: Map, curriculum): number   // 0-100 integer
export function modulePercent(moduleId: string, completions: Map, curriculum): number
export function moduleStatus(moduleId: string, completions: Map, curriculum): 'not-started' | 'in-progress' | 'complete'
export function topicCounts(curriculum): { total: number, byModule: Map<moduleId, number> }
```

**Invariants:**
- All functions are pure — same inputs always produce same output.
- `overallPercent` rounds to nearest whole number (`Math.round`).
- `moduleStatus` returns `'complete'` only when every topic in that module is in `completions` with value `true`.

### 5.4 `modules/streak.js`

```js
// Exported API
export function maybeIncrement(streakRecord, now?: Date): StreakRecord
export function hasQualifyingActivityToday(streakRecord, now?: Date): boolean
export function computeStreak(streakRecord, now?: Date): StreakRecord  // handles gap detection
```

**Invariants:**
- `maybeIncrement` is idempotent within the same calendar day — calling it twice on the same day does not double-increment.
- Calendar day comparison uses `toLocaleDateString()` in the user's local timezone — no UTC offset bugs.
- If `lastActiveDate` is more than 1 day before `now`, `count` resets to 1 (not 0; current-day activity counts).
- `now` parameter is injectable for deterministic unit testing.

### 5.5 `modules/notes.js`

```js
// Exported API
export function createDebouncer(topicId: string, onSave: Function, delayMs?: number): {
  handleInput(event: InputEvent): void,
  flush(): void,      // force-save immediately (used on topic collapse)
  destroy(): void     // cancels pending timer
}
```

**Invariants:**
- Default `delayMs` is 800 ms (< 1 s requirement with margin).
- `flush()` is called when a topic panel closes so notes are not lost on fast collapse.
- `handleInput` reads `event.target.value`; passes raw text to `onSave` which calls `state.setNote()`.
- Maximum note length enforced at 5,000 characters; excess characters are silently trimmed on save (not on input, to preserve UX).

### 5.6 `modules/router.js`

```js
// Routes: '' | '/' → curriculum view; '/dashboard' → dashboard; '/module/:id' → auto-expand module
export function init(routes: Record<string, Function>): void  // registers routes, binds hashchange
export function navigate(path: string): void                  // sets location.hash
export function currentPath(): string                         // returns parsed hash path
```

**Route table:**

| Hash | View | Behaviour |
|---|---|---|
| `#` / `#/` | Curriculum (default) | Show all modules in accordion |
| `#/dashboard` | Dashboard | Show progress stats and streak |
| `#/module/:id` | Curriculum + auto-expand | Scroll to and expand named module |

### 5.7 `modules/renderer.js`

```js
// Exported API
export function renderCurriculum(state, curriculum, container): void
export function renderDashboard(state, curriculum, container): void
export function renderModuleCard(module, state): HTMLElement
export function renderTopicRow(topic, state): HTMLElement
export function showConfirmDialog(message: string): Promise<boolean>  // resolves true on confirm
export function showStorageError(message: string): void               // aria-live alert
```

**Invariants:**
- User-provided text (notes, topic titles from JSON) is always set via `element.textContent`, never `element.innerHTML`.
- `curriculum.json` content is authored by the developer and is safe to use in `textContent`; still follows the same rule for consistency.
- Event delegation is used at the container level — one listener per container, not per topic row.
- `showConfirmDialog` uses the native `<dialog>` element (not `window.confirm`) for accessibility and consistent styling.

### 5.8 `modules/sw-registration.js`

```js
export function register(): Promise<void>   // resolves when SW registered; rejects gracefully
```

**Invariants:**
- Registration is attempted only if `'serviceWorker' in navigator`.
- Rejection is logged to console but does not throw or block app startup.
- Registration failure emits no visible UI error (app works online without SW).

---

## 6. CSS Design System

### 6.1 Custom Properties (`:root`)

```css
:root {
  /* Colour palette */
  --color-brand-primary:    #6366f1;   /* indigo-500 */
  --color-brand-secondary:  #8b5cf6;   /* violet-500 */
  --color-success:          #22c55e;   /* green-500 */
  --color-warning:          #f59e0b;   /* amber-500 */
  --color-danger:           #ef4444;   /* red-500 */
  --color-bg:               #0f172a;   /* slate-900 */
  --color-surface:          #1e293b;   /* slate-800 */
  --color-surface-raised:   #334155;   /* slate-700 */
  --color-text-primary:     #f1f5f9;   /* slate-100 */
  --color-text-secondary:   #94a3b8;   /* slate-400 */
  --color-border:           #334155;   /* slate-700 */

  /* Typography scale */
  --font-sans:  system-ui, -apple-system, sans-serif;
  --text-xs:    0.75rem;
  --text-sm:    0.875rem;
  --text-base:  1rem;
  --text-lg:    1.125rem;
  --text-xl:    1.25rem;
  --text-2xl:   1.5rem;
  --text-3xl:   1.875rem;

  /* Spacing scale (8pt grid) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Animation */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   300ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* Layout */
  --max-width: 860px;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

### 6.2 Checkmark Animation

```css
@keyframes checkmark-draw {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

.topic__checkmark--complete .checkmark-path {
  animation: checkmark-draw var(--duration-slow) var(--easing-standard) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .topic__checkmark--complete .checkmark-path {
    animation: none;
    stroke-dashoffset: 0;  /* final state immediately */
  }
}
```

### 6.3 Responsive Breakpoints

| Viewport | Max-width | Notes |
|---|---|---|
| Mobile | 375px+ | Single column, full-width cards |
| Tablet | 768px+ | Slightly wider cards, side nav possible |
| Desktop | 1280px+ | Centred layout at `--max-width: 860px` |

---

## 7. Service Worker Strategy (`sw.js`)

```js
const CACHE_NAME = 'bst-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/data/curriculum.json',
  '/modules/storage.js',
  '/modules/state.js',
  '/modules/router.js',
  '/modules/renderer.js',
  '/modules/progress.js',
  '/modules/streak.js',
  '/modules/notes.js',
  '/modules/sw-registration.js',
];

// install: pre-cache all static assets
// activate: delete stale caches (CACHE_NAME !== 'bst-v1')
// fetch: cache-first — serve from cache, fall back to network, cache response
```

**Versioning**: When any static asset changes, increment cache name (e.g., `bst-v2`). Old cache is deleted in the `activate` event. No stale-while-revalidate complexity needed for this app scale.

---

## 8. Implementation Phases

### Phase A — Foundation (prerequisite for all other phases)

Tasks must be completed in order within this phase.

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| A1 | Write unit tests for `progress.js` (all functions, red) | `tests/progress.test.js` | Tests run and fail (no impl yet) |
| A2 | Write unit tests for `streak.js` (red) | `tests/streak.test.js` | Tests run and fail |
| A3 | Write unit tests for `storage.js` (red) | `tests/storage.test.js` | Tests run and fail |
| A4 | Write unit tests for `state.js` (red) | `tests/state.test.js` | Tests run and fail |
| A5 | Write unit tests for `notes.js` debouncer (red) | `tests/notes.test.js` | Tests run and fail |
| A6 | Create `data/curriculum.json` with full 5-module content | `data/curriculum.json` | Valid JSON, 27 topics |
| A7 | Implement `modules/storage.js` (green tests) | `modules/storage.js` | All storage tests pass |
| A8 | Implement `modules/progress.js` (green tests) | `modules/progress.js` | All progress tests pass |
| A9 | Implement `modules/streak.js` (green tests) | `modules/streak.js` | All streak tests pass |
| A10 | Implement `modules/state.js` (green tests) | `modules/state.js` | All state tests pass |
| A11 | Implement `modules/notes.js` (green tests) | `modules/notes.js` | All notes tests pass |
| A12 | Configure `vitest.config.js` and `package.json` | `vitest.config.js`, `package.json` | `npx vitest run` exits 0 |

### Phase B — Shell & Routing

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| B1 | Create `index.html` shell (semantic structure, no content) | `index.html` | Passes W3C validator; no inline scripts |
| B2 | Implement CSS design tokens and base styles | `style.css` | `:root` tokens, reset, typography, responsive grid |
| B3 | Implement `modules/router.js` hash router | `modules/router.js` | Navigate to `#/dashboard` renders correct container |
| B4 | Create `app.js` entry point (fetch curriculum, init state, init router) | `app.js` | App boots; curriculum loaded; no console errors |
| B5 | Implement `modules/sw-registration.js` | `modules/sw-registration.js` | SW registered in DevTools; no crash on `file://` |
| B6 | Implement `sw.js` (install + activate + fetch handlers) | `sw.js` | All assets cached on first load; offline reload works |

### Phase C — Curriculum View (User Story 1 & 2)

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| C1 | Implement `renderCurriculum()` — module accordion list | `modules/renderer.js` | All 5 modules visible with topic counts |
| C2 | Implement module accordion expand/collapse | `modules/renderer.js`, `style.css` | Click expands; keyboard Enter/Space works; ARIA `expanded` correct |
| C3 | Implement `renderTopicRow()` — topic with checkmark toggle | `modules/renderer.js` | Topic row renders; checkbox role with `aria-checked` |
| C4 | Wire `toggleCompletion()` to topic click/keyboard event | `app.js`, `modules/renderer.js` | Toggle persists; page refresh retains state |
| C5 | Implement checkmark SVG animation | `style.css` | Animation ≤ 300 ms; `prefers-reduced-motion` respected |
| C6 | Implement module completion auto-transition | `modules/state.js`, `modules/renderer.js` | Marking all topics in mod-001 marks module complete |
| C7 | Implement ARIA live region for completion announcements | `index.html`, `modules/renderer.js` | Screen reader announces "Topic marked complete" |
| C8 | Deep-link routing to `#/module/:id` (auto-expand) | `modules/router.js`, `app.js` | URL `#/module/mod-003` expands GitHub Copilot module |

### Phase D — Notes (User Story 3)

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| D1 | Implement topic detail panel expand/collapse | `modules/renderer.js`, `style.css` | Click topic row opens panel with textarea |
| D2 | Wire `notes.js` debouncer to textarea `input` event | `modules/renderer.js`, `modules/notes.js` | Typing saves within 1 s; verified in DevTools Application tab |
| D3 | Flush debounce on topic panel close | `modules/renderer.js`, `modules/notes.js` | Fast open-type-close preserves note |
| D4 | Render note indicator on topic row when note exists | `modules/renderer.js`, `style.css` | Subtle icon visible; aria-label describes presence of note |
| D5 | Restore note text on panel re-open | `modules/renderer.js` | Textarea pre-filled from state |
| D6 | Handle empty note (indicator removed when text cleared) | `modules/state.js`, `modules/renderer.js` | Clear text → save → indicator disappears |

### Phase E — Dashboard (User Story 4)

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| E1 | Implement `renderDashboard()` skeleton with `#/dashboard` route | `modules/renderer.js` | Navigate to dashboard via nav link |
| E2 | Render overall completion percentage (large, prominent) | `modules/renderer.js`, `style.css` | Shows 0% on fresh install; updates reactively |
| E3 | Render per-module progress bars with topic counts | `modules/renderer.js`, `style.css` | Each module shows "X / Y topics" and a filled bar |
| E4 | Render streak counter | `modules/renderer.js`, `style.css` | Shows correct day count; resets after skipped day |
| E5 | Render congratulatory message when 100% complete | `modules/renderer.js` | Message appears only when all 27 topics complete |
| E6 | Implement navigation between curriculum and dashboard views | `index.html`, `style.css`, `app.js` | Nav links update `location.hash`; active state styled |
| E7 | Dashboard reactively updates without page reload (SC-004) | `modules/state.js`, `modules/renderer.js` | Toggle topic → switch to dashboard → correct % shown |

### Phase F — Reset & Edge Cases (User Stories 5 & 6)

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| F1 | Implement `showConfirmDialog()` using `<dialog>` element | `modules/renderer.js`, `style.css` | Focus-trapped; Escape cancels; Enter confirms |
| F2 | Wire Reset Progress action to confirm flow | `app.js`, `modules/renderer.js` | Cancel preserves data; Confirm clears all state |
| F3 | Reset reflects immediately in UI without page reload (SC-009) | `modules/state.js`, `modules/renderer.js` | All topics unchecked; all notes cleared; streak 0 |
| F4 | Implement storage unavailability detection and user message | `modules/storage.js`, `modules/renderer.js` | ARIA-live alert appears if `isAvailable()` returns false |
| F5 | Handle concurrent tab writes (last-write-wins, no corruption) | `modules/storage.js` | Two tabs writing simultaneously produce valid JSON |
| F6 | Implement schema migration guard on `load()` | `modules/storage.js` | Future schema version shows user message; no data loss |

### Phase G — Quality & Polish

| # | Task | Files Touched | Acceptance |
|---|---|---|---|
| G1 | Run `axe-core` audit; fix all WCAG AA violations | All | Zero violations |
| G2 | Keyboard navigation end-to-end test | All | All flows completable without mouse |
| G3 | Run Lighthouse CI; achieve Performance ≥ 90, Accessibility ≥ 95 | All | Report attached to PR |
| G4 | Verify all UI states: loading, empty, partial, complete | All | All states visually designed and implemented |
| G5 | Cross-viewport check: 375px, 768px, 1280px | `style.css` | No broken layouts at any breakpoint |
| G6 | Offline smoke test: disable network in DevTools, reload | `sw.js` | App loads and all features work offline |
| G7 | Verify total page weight < 200 KB uncompressed | All | Network tab confirms |

---

## 9. Testing Strategy

### Test Runner Setup

```bash
# Run all tests once
npx vitest run

# Run with coverage (must meet ≥ 80% branch coverage)
npx vitest run --coverage

# Watch mode during development
npx vitest
```

### `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['modules/**/*.js'],
      exclude: ['modules/renderer.js', 'modules/sw-registration.js'],
      thresholds: { branches: 80, functions: 80, lines: 80 },
    },
  },
});
```

`renderer.js` and `sw-registration.js` are excluded from coverage thresholds (DOM-heavy; covered by manual and E2E checks instead).

### Unit Test Scope by Module

| Module | Key test scenarios |
|---|---|
| `storage.js` | Save/load round-trip; `isAvailable()` false path; `QuotaExceededError` handling; schema migration v1→v2 |
| `state.js` | `toggleCompletion` mutates completions; emits change event; calls `storage.save`; `resetAll` clears everything |
| `progress.js` | `overallPercent` with 0, partial, and all complete; `moduleStatus` transitions; rounding at 0.5 boundary |
| `streak.js` | Same-day idempotency; next-day increment; two-day gap resets to 1; injectable `now` date |
| `notes.js` | Debounce fires after delay; `flush()` triggers immediately; `destroy()` cancels pending timer |

---

## 10. Quickstart Validation Guide

### Prerequisites

- A modern browser (Chrome 90+, Firefox 90+, Safari 15+)
- `node` on PATH (for `npx`; app itself requires none)
- Optional: `npx serve` for SW testing (SW requires `localhost` or `https://`)

### Run Tests

```bash
cd "/Users/toby.brock/Documents/Projects/Bootcamp Demo"
npx vitest run --coverage
# Expected: all tests pass, coverage ≥ 80% for all included modules
```

### Run the App (without SW)

```bash
# Open directly in browser — full functionality except SW/offline
open index.html
```

### Run the App (with SW — required for offline testing)

```bash
npx serve . -p 3000
# Then open http://localhost:3000 in browser
```

### Validation Scenarios

**Scenario 1 — Fresh Install (FR-001, FR-002, FR-003)**
1. Open the app with no prior state.
2. Verify: all 5 modules visible, each showing topic count, all topics uncompleted.

**Scenario 2 — Toggle Completion (FR-004, FR-005)**
1. Click a topic → checkmark animation plays → topic marked complete.
2. Refresh page → topic remains complete (persistence verified).
3. Mark all topics in one module → module auto-transitions to complete.
4. Unmark one topic → module reverts to in-progress.

**Scenario 3 — Notes (FR-006, FR-007)**
1. Expand a topic → textarea appears.
2. Type a note → wait 1 s → collapse topic → re-expand → note present.
3. Refresh page → note persists.
4. Clear note → topic note indicator disappears.

**Scenario 4 — Dashboard (FR-008, FR-009, FR-010)**
1. Mark 14 of 27 topics complete → navigate to Dashboard.
2. Verify: overall % shows 52%; each module bar reflects its ratio.
3. Verify: streak counter reflects qualifying days.

**Scenario 5 — Reset (FR-015, FR-016)**
1. Mark several topics and add notes.
2. Trigger Reset Progress → Cancel → data preserved.
3. Trigger Reset Progress → Confirm → all cleared → UI reflects empty state immediately.

**Scenario 6 — Offline (FR-014, FR-020)**
1. Load app at `localhost:3000` with network.
2. Open DevTools → Network → set Offline.
3. Reload page → app loads from SW cache.
4. Mark topics, add notes, view dashboard → all work identically.

---

## 11. Key Architectural Decisions (Summary)

| Decision | Chosen Approach | Rejected Alternatives |
|---|---|---|
| State management | Single in-memory object + custom event emitter | Flux/Redux patterns (overkill), reactive proxies (complexity) |
| Rendering | Full re-render of changed sections on state change | Virtual DOM diffing (overkill for this data size), framework components |
| Persistence | Single localStorage key (`bst_appState`) as JSON blob | Separate keys per topic (fragmented, harder to migrate), IndexedDB (over-engineered for < 50 KB) |
| Routing | Hash-based (`#/dashboard`, `#/module/:id`) | History API pushState (requires server config; breaks `file://` usage) |
| Offline | Hand-rolled SW cache-first | Workbox (30+ KB dependency), no SW (breaks Principle V) |
| Curriculum data | `data/curriculum.json` fetched at startup | Hardcoded in JS (harder to update), editable admin UI (out of scope) |
| Note saving | Debounce 800 ms on `input` event | `blur` event only (loses in-progress text on crash), `keydown` throttle |
| Dialog | Native `<dialog>` element | `window.confirm` (cannot style), custom div modal (focus trap complexity) |
| Testing | Vitest + jsdom (dev-only, `npx vitest run`) | Jest (heavier config), browser-native test harness (no coverage) |
| Animation | CSS keyframes on SVG `stroke-dashoffset` | JS animation (GSAP adds weight), CSS `transform` scale (less checkmark feel) |

---

## 12. Constitution Check — Post-Design

| Principle | Post-Design Status | Notes |
|---|---|---|
| **I. Simplicity & Vanilla First** | PASS | Zero runtime deps; all app modules are plain `.js` ES2022 |
| **II. Intuitive UX** | PASS | All primary actions in ≤ 2 clicks; empty states designed for every view |
| **III. Accessibility** | PASS | `<dialog>` for focus-trapped confirm; `aria-live` on progress region; `aria-expanded` on accordion; `aria-checked` on topic toggle |
| **IV. Client-Side Persistence** | PASS | `storage.js` is sole localStorage interface; schema migration defined |
| **V. Performance & Offline** | PASS | SW precaches 10 files; JSON data file < 5 KB; JS total < 30 KB |
| **VI. Test-Driven Core Logic** | PASS | Tests written red-first in Phase A for all 5 logic modules |
| **VII. Demo-Ready Polish** | PASS | Design tokens defined; all UI states planned; animation spec provided |

**Gate result: ALL PASS — proceed to task generation.**
