# Implementation Plan: Snail Trail Game

**Branch**: `001-snail-trail-game` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-snail-trail-game/spec.md`

## Summary

Build a browser-based grid game called "Snail Trail" using vanilla HTML5 Canvas, modular ES2020+ JavaScript, and pure CSS — launchable by opening a single `index.html` with no installation or build step. Players navigate a procedurally generated maze (randomised depth-first search / recursive backtracking) to reach a treasure chest while being pursued by AI-controlled snails that use A* pathfinding with Manhattan distance heuristic. Snails move every two player steps. Three difficulty levels are offered at the start screen: Easy (15×15 grid, 1 snail), Medium (20×20 grid, 2 snails), and Hard (25×25 grid, 3 snails). All core logic is DOM-free and covered by a plain-JavaScript test suite runnable in Node.js without a browser.

## Technical Context

**Language/Version**: Vanilla JavaScript, ES2020+ (`import`/`export` modules; nullish coalescing `??`, optional chaining `?.`, `Array.flat` all permitted)

**Primary Dependencies**: None (runtime). Browser built-ins only — Canvas 2D Context, `requestAnimationFrame`, `KeyboardEvent`, ES module `<script type="module">`.

**Storage**: N/A — no persistence required in v1.

**Testing**: Plain JavaScript helper functions (`assert`, `assertEqual`, `assertDeepEqual`) defined inline in each test file; runnable with `node test/game.test.js`. No external test framework; no browser required for logic tests.

**Target Platform**: Modern desktop browsers (Chrome, Firefox, Safari, Edge — current stable). Must launch from `file://` without CORS errors; all module specifiers must be relative paths.

**Project Type**: Browser game — single HTML entry point, modular ES JavaScript, CSS UI chrome.

**Performance Goals**:
- Map generation: < 100 ms for all supported grid sizes (15×15, 20×20, 25×25) on a mid-range laptop
- Per-snail A* call: < 100 ms per turn on the same benchmark hardware
- State transition rendering: ≤ 1 animation frame (~16 ms at 60 fps)

**Constraints**:
- Zero npm runtime dependencies; zero build step
- CSS custom properties (`--color-wall`, `--size-cell`, etc.) for every design token; no hard-coded repeated values
- `file://` compatible — all module specifiers are relative paths (`./mapgen.js`, not bare `mapgen`)
- `prefers-reduced-motion` must suppress all CSS transitions and Canvas animations
- No `alert`, `prompt`, or synchronous blocking operations on the main thread during gameplay

**Scale/Scope**: 3 difficulty levels; 1–3 snails; single-player; 5 source modules; 3 test files; no persistence.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Status | Justification |
|---|-----------|--------|---------------|
| I | Code Quality | ✅ PASS | One responsibility per module; all magic numbers extracted to named `CONSTANTS` exports (`CELL`, `PHASE`, `DIFFICULTY`); functions kept under 30 lines |
| II | Testing | ✅ PASS | `test/game.test.js`, `test/mapgen.test.js`, `test/pathfinding.test.js` cover pathfinding, map generation, collision detection, and movement resolution; DOM-free; runnable via `node` |
| III | User Experience | ✅ PASS | `index.html` opens directly from filesystem; win/lose/start overlays in `ui.js`; canvas redrawn within one rAF of each state change |
| IV | Performance | ✅ PASS | DFS generation is O(rows × cols); A* bounded by grid cell count; benchmark assertions in test suite fail if 100 ms thresholds are exceeded |
| V | Simplicity | ✅ PASS | Zero runtime npm dependencies; CSS custom properties for all design tokens; test helpers inlined — no bundler, no preprocessor |
| VI | Accessibility | ✅ PASS | Arrow keys + WASD movement; player = blue filled circle, snail = amber circle + shell arc, treasure = gold square (distinct shape per element, not colour alone); `aria-label` on canvas; `prefers-reduced-motion` respected |
| VII | Architecture | ✅ PASS | `game.js`, `mapgen.js`, `pathfinding.js` contain no DOM or Canvas API calls; `renderer.js` reads state and produces pixels only — never mutates; `ui.js` manages DOM overlays only |

**Post-Phase 1 re-check**: All principles upheld. Module interface contracts in `contracts/` confirm renderer never mutates state and all logic modules carry zero DOM imports.

## Project Structure

### Documentation (this feature)

```text
specs/001-snail-trail-game/
├── plan.md              # This file
├── research.md          # Phase 0 — algorithm and design decisions with rationale
├── data-model.md        # Phase 1 — entity definitions, state machine, validation rules
├── quickstart.md        # Phase 1 — end-to-end validation guide
├── contracts/           # Phase 1 — module interface contracts
│   ├── game-api.md
│   ├── mapgen-api.md
│   ├── pathfinding-api.md
│   ├── renderer-api.md
│   └── ui-api.md
└── tasks.md             # Phase 2 output — /speckit.tasks (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
index.html                  # Single entry point; <script type="module" src="./src/game.js">
src/
├── game.js                 # Core state & logic: createGameState, movePlayer,
│                           #   resolveSnailTurns, checkEndConditions; exports CONSTANTS
├── mapgen.js               # Procedural maze generation: randomised DFS recursive
│                           #   backtracking; exports generateMap(cols, rows)
├── pathfinding.js          # A* with Manhattan distance; exports findPath(grid, from, to)
├── renderer.js             # Canvas 2D rendering: reads GameState, draws all elements;
│                           #   exports render(canvas, state) — never mutates state
└── ui.js                   # DOM overlay management: start/win/lose screens, keyboard
                            #   and button bindings; exports showScreen, bindControls
test/
├── game.test.js            # Movement, collision, win/lose resolution, snail turn triggering
├── mapgen.test.js          # Maze solvability, wall/open ratio, layout uniqueness, timing
└── pathfinding.test.js     # Path correctness, wall avoidance, no-path cases, timing
```

**Structure Decision**: Flat single-project layout. Five source files with one clear responsibility each. `test/` is a sibling of `src/` at the repository root. `index.html` lives at the root for direct `file://` launch. No build artefacts, no `node_modules` in the deliverable.
