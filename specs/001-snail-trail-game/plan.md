# Implementation Plan: Snail Trail Game

**Branch**: `001-snail-trail-game` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md) | **Version**: v2

**Input**: Feature specification v2 from `specs/001-snail-trail-game/spec.md` — adds Timer, Infinite Mode, Leaderboard, Name Entry, In-Overlay Difficulty, HUD Bar, and GitHub Pages deployment

## Summary

Build a browser-based grid game called "Snail Trail" using vanilla HTML5 Canvas, modular ES2020+ JavaScript, and pure CSS — launchable by opening a single `index.html` with no installation or build step. Core mechanics: procedurally generated maze (randomised DFS), player navigation with arrow keys / WASD, A* pathfinding AI for snails that move every two player steps. Three base difficulty levels — Easy (15×15 grid, 1 snail), Medium (20×20 grid, 2 snails), Hard (25×25 grid, 3 snails) — plus a fourth Infinite Mode that escalates grid size and snail count on each win.

**v2 additions**:
- **HUD bar**: A DOM `<div>` above the canvas showing live timer (left) and mode/level info (right), updated every 100 ms via `setInterval` during play
- **Timer**: `performance.now()` for high-resolution timing; `startTime` stored in game state; displayed as `S.ms` format (e.g. `"12.34s"`) in the HUD; frozen on win/lose
- **Infinite Mode**: Fourth mode alongside Easy/Medium/Hard — begins at Level 1 (20×20, 2 snails); on each win `infiniteLevel` increments, grid grows to `(20 + infiniteLevel × 5) × (20 + infiniteLevel × 5)`, snails become `2 + infiniteLevel`; current level shown in HUD; on loss, name-entry triggers if it qualifies as a new high score
- **Leaderboard** (`localStorage` key `snailTrailLeaderboard`): Per-category top-5 entries `{ name, value, date }`; easy/medium/hard sorted ascending by ms; infinite sorted descending by level; new entry qualifies if category has < 5 entries or beats the 5th-place value
- **Name Entry**: DOM overlay with "NEW RECORD!" heading, score display, and three arcade character boxes; A–Z only; Backspace deletes last character; Enter/Save enabled only when exactly 3 characters entered; saves uppercase to leaderboard then shows normal win/lose screen
- **In-Overlay Difficulty Selector**: Win and lose overlays each include a compact radio group (Easy / Medium / Hard / Infinite) for selecting difficulty before the next game; start-screen selector remains for the very first game
- **GitHub Actions**: `.github/workflows/deploy.yml` deploys static content to GitHub Pages on push to `main`; no build step

**Implementation constraint**: All new game logic, HUD, name entry, and leaderboard code lives in `index.html`'s inline `<script>` block to preserve `file://` compatibility (Chrome CORS blocks cross-file ES module imports from `file://` origins). The `src/` module files are kept in sync but `index.html` is the browser source of truth.

## Technical Context

**Language/Version**: Vanilla JavaScript, ES2020+ (`import`/`export` modules; nullish coalescing `??`, optional chaining `?.`, `Array.flat` all permitted)

**Primary Dependencies**: None (runtime). Browser built-ins only — Canvas 2D Context, `requestAnimationFrame`, `KeyboardEvent`, ES module `<script type="module">`.

**Storage**: N/A — no persistence required in v1.

## Technical Context

**Language/Version**: Vanilla JavaScript, ES2020+

**Primary Dependencies**: None (runtime). Browser built-ins: Canvas 2D Context, `requestAnimationFrame`, `KeyboardEvent`, `performance.now()`, `localStorage`, ES module `<script type="module">`.

**Storage**: `localStorage` — key `snailTrailLeaderboard`. JSON-encoded `{ easy: Entry[], medium: Entry[], hard: Entry[], infinite: Entry[] }` where `Entry = { name: string, value: number, date: string }`.

**Testing**: Plain JavaScript helper functions (`assert`, `assertEqual`, `assertDeepEqual`) defined inline in each test file; runnable with `node test/*.test.js`. No external framework; no browser required for logic tests. New test coverage required for timer logic, leaderboard qualification/sorting, and infinite level progression.

**Target Platform**: Modern desktop browsers (Chrome, Firefox, Safari, Edge — current stable). `file://` compatible — all module specifiers must be relative paths.

**Performance Goals**:
- Map generation: < 100 ms for all supported grid sizes (including Infinite Mode levels through ~Level 20, i.e. up to 120×120 cells) on a mid-range laptop
- Per-snail A* call: < 100 ms per turn on the same benchmark hardware
- HUD timer: `setInterval` at 100 ms; display lag ≤ 100 ms relative to true elapsed time
- State transition rendering: ≤ 1 animation frame (~16 ms at 60 fps)

**Constraints**:
- Zero npm runtime dependencies; zero build step
- CSS custom properties for every design token; no hard-coded repeated values
- `file://` compatible — all logic inlined in `index.html`; `src/` modules retained for test runner
- `prefers-reduced-motion` must suppress all CSS transitions and Canvas animations
- No `alert`, `prompt`, or synchronous blocking operations on the main thread during gameplay
- `localStorage` operations must be wrapped in try/catch; leaderboard degrades gracefully if unavailable

**Scale/Scope**: 4 modes (Easy/Medium/Hard/Infinite); 1–N snails (escalating in Infinite); single-player; 5 source modules + inline script; 4 test files; localStorage persistence.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Status | Justification |
|---|-----------|--------|---------------|
| I | Code Quality | ✅ PASS | All new entities (Timer, InfiniteRun, LeaderboardStore, LeaderboardEntry) are named; magic numbers extracted to named constants (`INFINITE_BASE_SIZE = 20`, `INFINITE_SIZE_STEP = 5`, `LEADERBOARD_KEY`, `LEADERBOARD_MAX_ENTRIES = 5`, `HUD_INTERVAL_MS = 100`); functions kept single-purpose and under 30 lines |
| II | Testing | ✅ PASS | `test/game.test.js` extended for timer start/stop and infinite level progression; new `test/leaderboard.test.js` covers qualification logic, sorting (asc/desc), 5-entry cap, tie-breaking by date, and localStorage round-trip with graceful degradation; DOM-free; runnable via `node` |
| III | User Experience | ✅ PASS | HUD always visible during play; name entry is a DOM overlay (no canvas drawing); win/lose overlays contain in-place difficulty selector reducing navigation friction; game remains launchable by double-clicking `index.html` |
| IV | Performance | ✅ PASS | Infinite Mode grid grows by 25 cells (5×5 addition) per level — map generation and A* remain within 100 ms budget through at least Level 20 (120×120 = 14,400 cells); benchmark assertions in test suite extended to cover max expected Infinite size |
| V | Simplicity | ✅ PASS | No new runtime dependencies; all new code is vanilla JS in `index.html`'s inline script; leaderboard is plain JSON in `localStorage`; GitHub Actions uses standard pages actions only |
| VI | Accessibility | ✅ PASS | Name entry overlay is keyboard-driven (A–Z, Backspace, Enter); all new overlays have descriptive `aria-label`; HUD bar is a standard DOM element readable by screen readers; focus indicators preserved on new interactive elements; `prefers-reduced-motion` block extended to cover HUD and overlay transitions |
| VII | Architecture | ⚠️ JUSTIFIED DEVIATION | Principle VII requires game-rule logic modules to be DOM-free and independently testable. New features (leaderboard, timer, infinite state, name entry) are implemented inline in `index.html` due to Chrome's `file://` CORS restriction on cross-file ES module imports. **Justification**: The `src/` modules (`game.js`, `mapgen.js`, `pathfinding.js`) remain DOM-free and testable — their interfaces are unchanged. New inline code follows the same separation pattern (logic functions vs. rendering calls) within the inline script block. The `src/` files are updated to mirror inline logic for test coverage. This is a deployment constraint, not an architectural preference. |

**Post-Phase 1 re-check**: All principles upheld. Module interface contracts in `contracts/` updated to reflect new HUD, leaderboard, and name-entry responsibilities. Architecture deviation is documented and bounded.

## Project Structure

### Documentation (this feature)

```text
specs/001-snail-trail-game/
├── plan.md              # This file (v2)
├── research.md          # Phase 0 — algorithm and design decisions with rationale (v2 updated)
├── data-model.md        # Phase 1 — entity definitions, state machine, validation rules (v2 updated)
├── quickstart.md        # Phase 1 — end-to-end validation guide (v2 updated)
├── contracts/           # Phase 1 — module interface contracts (v2 updated)
│   ├── game-api.md          # createGameState, movePlayer, resolveSnailTurns (+ timer, infinite)
│   ├── mapgen-api.md        # generateMap — unchanged
│   ├── pathfinding-api.md   # findPath — unchanged
│   ├── renderer-api.md      # render — unchanged; HUD is DOM not canvas
│   └── ui-api.md            # showScreen, bindControls (+ showHud, showNameEntry, showLeaderboard)
└── tasks.md             # Phase 2 output — /speckit.tasks (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
index.html                      # Single entry point; all game logic inlined for file:// compat
                                # Contains: all v1 logic + HUD, timer, Infinite Mode,
                                #           leaderboard, name-entry overlay, in-overlay selector

src/                            # Module files — kept in sync with inline script for test use
├── game.js                     # createGameState, movePlayer, resolveSnailTurns, checkEndConditions
│                               #   + timer fields (startTime, finalElapsedMs),
│                               #   + infinite fields (infiniteLevel); exports CONSTANTS
├── mapgen.js                   # generateMap(cols, rows) — unchanged
├── pathfinding.js              # findPath(grid, from, to) — unchanged
├── renderer.js                 # render(canvas, state) — unchanged; HUD is DOM, not drawn here
└── ui.js                       # showScreen, bindControls, showHud, hideHud,
                                #   showNameEntry, showLeaderboard, showOverlay

test/
├── game.test.js                # Extended: timer start/stop, infinite level progression,
│                               #   snail count scaling, phase transitions with new states
├── mapgen.test.js              # Unchanged: solvability, wall/open ratio, layout uniqueness, timing
├── pathfinding.test.js         # Unchanged: path correctness, wall avoidance, no-path cases, timing
└── leaderboard.test.js         # NEW: qualification logic, sorting (asc/desc by category),
                                #   5-entry cap, ties broken by date, localStorage round-trip,
                                #   graceful degradation when localStorage unavailable

.github/
└── workflows/
    └── deploy.yml              # NEW: GitHub Actions Pages deployment on push to main
```

---

## Phase 0: Research

All foundational technical decisions were established in v1 research. The following records the additional v2 decisions. See [research.md](research.md) for the full decision log.

### Decision 3 — Timer Implementation: `performance.now()`

**Decision**: Store `startTime = performance.now()` in `GameState` when transitioning to `'playing'`. Compute `elapsedMs = performance.now() - startTime` on demand. Display in HUD via `setInterval` at `HUD_INTERVAL_MS = 100`. Freeze on win/lose by storing `finalElapsedMs` in state and clearing the interval.

**Display format**: `((elapsedMs / 1000).toFixed(2) + 's')`, e.g. `"12.34s"` — matches FR-022 S.ms format.

**Alternatives considered**: `Date.now()` (susceptible to clock adjustments); canvas-drawn timer (harder to read, not screen-reader accessible).

---

### Decision 4 — Infinite Mode State & Formulas

**Decision**: Track `infiniteLevel` (integer, 0-based internally, displayed as `infiniteLevel + 1`) in `GameState`. Initial value: 0 (displayed as Level 1). Formulas at any `infiniteLevel`:

- `cols = rows = 20 + (infiniteLevel * 5)` — at Level 1 display (level 0 internal): 20×20; Level 2 display: 25×25; etc.
- `snailCount = 2 + infiniteLevel` — at Level 1 display: 2 snails; Level 2 display: 3 snails; etc.

On win: `infiniteLevel++` then `createGameState('infinite')` with the new formula values. On loss: leaderboard value = `infiniteLevel` (the level the player reached, 0-based; displayed as `infiniteLevel + 1`).

**Alignment with spec**: FR-027 (Level 1 = 20×20, 2 snails) ✅. FR-028 (win Level N → grid 5 wider/taller, 1 more snail) ✅ — at `infiniteLevel = 0` (Level 1): win → `infiniteLevel = 1` → 25×25, 3 snails.

---

### Decision 5 — Leaderboard Storage Schema

**Decision**: localStorage key `snailTrailLeaderboard`. Value:

```json
{
  "easy":     [ { "name": "AAA", "value": 12340, "date": "2026-07-09T14:30:00.000Z" } ],
  "medium":   [],
  "hard":     [],
  "infinite": []
}
```

- `name`: 3 uppercase letters (A–Z only)
- `value`: elapsed milliseconds (easy/medium/hard) or internal `infiniteLevel` reached (infinite)
- `date`: `new Date().toISOString()`
- **Sort**: easy/medium/hard ascending by `value`; infinite descending by `value`
- **Cap**: 5 entries per category
- **Qualification**: `category.length < 5` OR beats `category[4].value` (lower for timed; higher for infinite)
- **Tie-breaking**: earlier date ranks first; newer same-value entry appended after

**Graceful degradation**: All `localStorage` reads/writes wrapped in `try/catch`; on any failure, return empty store and continue.

---

### Decision 6 — Name Entry UX: DOM Overlay

**Decision**: `<div id="name-entry-overlay">` positioned above canvas (same z-index layer as win/lose overlays). Contains: `<h2>NEW RECORD!</h2>`, score text, three `<span class="letter-box">` elements for character display, and a Save `<button>`. Keyboard handler: A–Z fills next empty box (uppercase); Backspace clears last filled box; Enter triggers save only if 3 letters entered. Save button `disabled` attribute toggled based on letter count.

**Rationale**: DOM elements are far easier to style (arcade look with border, monospace font) than canvas-drawn text inputs. Screen-reader accessible. Focus management straightforward.

---

### Decision 7 — In-Overlay Difficulty Radio Group

**Decision**: Both win and lose overlay templates include a `<div class="difficulty-selector">` with four `<input type="radio" name="overlay-difficulty">` inputs (easy/medium/hard/infinite) and `<label>` elements. Default selection = mode of the game that just ended. "New Game" button reads the currently selected radio to determine mode.

**Rationale**: Compact, keyboard-navigable (arrow keys between radio buttons), no new UI pattern required.

---

### Decision 8 — GitHub Actions: Static Pages Deployment

**Decision**: `.github/workflows/deploy.yml`:
1. `actions/configure-pages` — configures GitHub Pages for the repo
2. `actions/upload-pages-artifact` with `path: '.'` — uploads repo root as artifact (no build step)
3. `actions/deploy-pages` — deploys the artifact

**Permissions**: `contents: read`, `pages: write`, `id-token: write`. **Concurrency**: `group: pages`, `cancel-in-progress: true`.

---

## Phase 1: Design & Contracts

### Data Model Updates

See [data-model.md](data-model.md) for full entity definitions. v2 additions summarised below.

#### New Enumeration: `GameMode`

```
'easy'     — 15×15 grid, 1 snail
'medium'   — 20×20 grid, 2 snails
'hard'     — 25×25 grid, 3 snails
'infinite' — escalating grid; level tracked via infiniteLevel
```

#### `GamePhase` additions

```
'name-entry'  — name entry overlay visible; movement input disabled
'leaderboard' — leaderboard view visible from start screen; no game in progress
```

#### Updated `GameState`

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `phase` | `GamePhase` | updated | Now includes `'name-entry'` and `'leaderboard'` |
| `mode` | `GameMode` | NEW | Active game mode |
| `difficulty` | `DifficultyConfig` | retained | Grid/snail config for current game |
| `grid` | `Grid` | retained | Current map |
| `player` | `Player` | retained | Position and step count |
| `snails` | `Snail[]` | retained | Array of snail entities |
| `startTime` | `number \| null` | NEW | `performance.now()` at start; null before play |
| `finalElapsedMs` | `number \| null` | NEW | Frozen elapsed ms on win/lose; null during play |
| `infiniteLevel` | `number` | NEW | 0-based; displayed as `infiniteLevel + 1` |

#### New Entity: `LeaderboardEntry`

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | 3 uppercase letters, `/^[A-Z]{3}$/` |
| `value` | `number` | Elapsed ms (timed) or `infiniteLevel` reached (infinite) |
| `date` | `string` | ISO 8601 string |

#### New Entity: `LeaderboardStore`

| Field | Type | Description |
|-------|------|-------------|
| `easy` | `LeaderboardEntry[]` | ≤ 5 entries, ascending by `value` |
| `medium` | `LeaderboardEntry[]` | ≤ 5 entries, ascending by `value` |
| `hard` | `LeaderboardEntry[]` | ≤ 5 entries, ascending by `value` |
| `infinite` | `LeaderboardEntry[]` | ≤ 5 entries, descending by `value` |

---

### State Machine (v2)

```
[ start ] ──── Start button ────────────────────────────► [ playing ]
[ start ] ──── Leaderboard button ──────────────────────► [ leaderboard ]
[ leaderboard ] ── Back / Escape ───────────────────────► [ start ]

[ playing ] ── player steps on treasure (timed mode) ──► [ win ]
[ playing ] ── player wins level (infinite mode) ───────► [ playing ] (new level: infiniteLevel++)
[ playing ] ── snail reaches player ────────────────────► [ lose ]

[ win ]  ── qualifies for leaderboard ──────────────────► [ name-entry ]
[ lose ] ── qualifies for leaderboard ──────────────────► [ name-entry ]
[ win ]  ── does not qualify ───────────────────────────► (stays on win overlay)
[ lose ] ── does not qualify ───────────────────────────► (stays on lose overlay)

[ name-entry ] ── Save (3 letters) ─────────────────────► [ win ] or [ lose ]
                                                           (record written first)

[ win ]  ── New Game (selected difficulty) ─────────────► [ playing ]
[ lose ] ── New Game (selected difficulty) ─────────────► [ playing ]
```

#### Transition table

| From | Event | To | Side Effects |
|------|-------|----|--------------|
| `start` | Start clicked | `playing` | `createGameState(mode)` called; `startTime = performance.now()`; HUD shown; `setInterval(HUD_INTERVAL_MS)` started |
| `start` | Leaderboard clicked | `leaderboard` | Leaderboard overlay rendered from `localStorage`; no game state change |
| `leaderboard` | Back/Escape | `start` | Leaderboard overlay hidden |
| `playing` | Player steps on treasure (non-infinite) | `win` | `finalElapsedMs` frozen; interval cleared; HUD frozen; leaderboard qualification checked |
| `playing` | Player wins level (infinite) | `playing` | `infiniteLevel++`; new `GameState` with escalated grid/snails; `startTime` reset; interval continues |
| `playing` | Snail reaches player | `lose` | `finalElapsedMs` frozen; interval cleared; HUD frozen; leaderboard qualification checked |
| `win` or `lose` | Qualifies for leaderboard | `name-entry` | Name entry overlay shown; movement input disabled |
| `win` or `lose` | Does not qualify | (stays) | Win/lose overlay shown immediately |
| `name-entry` | Save clicked (3 letters) | `win` or `lose` | Record written to `localStorage`; name entry overlay hidden; win/lose overlay shown |
| `win` | New Game clicked | `playing` | New `GameState` created with selected difficulty; overlays hidden; HUD reset; interval restarted |
| `lose` | New Game clicked | `playing` | Same as win restart |

---

### Interface Contracts

See `contracts/` for full module contracts. v2 changes:

**`game-api.md`** (updated):
- `createGameState(mode)` — accepts `GameMode` string; sets `startTime = null`, `finalElapsedMs = null`, `infiniteLevel = 0` for infinite mode; uses `getInfiniteConfig(0)` for initial infinite dimensions
- `freezeTimer(state, now)` — pure function; returns new state with `finalElapsedMs = now - state.startTime`
- `getInfiniteConfig(infiniteLevel)` — pure function; returns `{ cols: 20 + infiniteLevel * 5, rows: 20 + infiniteLevel * 5, snailCount: 2 + infiniteLevel }`
- `isNewRecord(store, mode, value)` — pure function; returns boolean; no DOM/storage access

**`ui-api.md`** (updated):
- `showHud()` / `hideHud()` — show/hide `#game-hud` DOM element
- `updateHud(elapsedMs, mode, infiniteLevel)` — sets timer text and mode/level text in HUD
- `showNameEntry(scoreText, onSave)` — shows name entry overlay; calls `onSave(name)` with 3-letter uppercase string on save
- `showLeaderboard(store)` — renders leaderboard overlay from `LeaderboardStore` data
- `showOverlay(phase, elapsedMs, mode, infiniteLevel, selectedMode, onNewGame)` — renders win or lose overlay with embedded difficulty radio group

**`renderer-api.md`** (unchanged): `render(canvas, state)` — no new canvas responsibilities; HUD and overlays are DOM

---

### Quickstart Validation Guide

See [quickstart.md](quickstart.md). v2 additions:

**Timer validation**: Start a game; wait ~10 s; win or lose; confirm HUD showed live count during play and the win overlay shows final elapsed within ±1 s of actual.

**Infinite Mode validation**: Select Infinite; win Level 1; confirm HUD shows "Level 2", grid is visibly larger, snail count increased. Lose on Level 2; confirm overlay shows "Highest Level: 2".

**Leaderboard validation**: Beat Easy record; enter "ABC"; reload page; open Leaderboard from start screen; confirm "ABC" appears with correct value and date.

**Name entry validation**: Achieve a record; confirm overlay shows "NEW RECORD!"; type "AB1" — only "AB" appears (digit ignored); Backspace → "A"; type "BZ" → "ABZ"; Enter saves and shows win/lose overlay.

**GitHub Actions validation**: Inspect `.github/workflows/deploy.yml`; confirm `push: branches: [main]` trigger; confirm `upload-pages-artifact` with `path: '.'`; confirm no build commands.

---

## Key Implementation Rules

1. **Timer interval**: `const HUD_INTERVAL_MS = 100` — always a named constant; `clearInterval` called in every path that exits `playing` phase
2. **Infinite level display**: Always `state.infiniteLevel + 1` when shown to player; state tracks 0-based for formula convenience
3. **Leaderboard writes**: `try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(store)) } catch (e) { /* silent */ }`
4. **Leaderboard reads**: On any parse failure, return `{ easy: [], medium: [], hard: [], infinite: [] }`
5. **Name entry save**: Validate `/^[A-Z]{3}$/` before writing; Save button `disabled` until condition met
6. **Overlay difficulty selector**: Pre-select radio matching mode of the game that just ended; reading selected radio determines mode for "New Game"
7. **HUD visibility**: Show on entering `playing`; hide on `start` and `leaderboard`; remains visible behind `name-entry` overlay
8. **`prefers-reduced-motion`**: All CSS transitions on overlays and HUD must be suppressed in `@media (prefers-reduced-motion: reduce)` block
9. **Deployment**: `deploy.yml` must use `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` — no `npm run build` or any build command
10. **Architecture within inline script**: Logic functions (timer math, leaderboard qualification, infinite level computation) must be named standalone functions, clearly separated from DOM manipulation — not anonymous inline callbacks
