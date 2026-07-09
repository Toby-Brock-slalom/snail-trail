# Tasks: Snail Trail Game

**Input**: Design documents from `specs/001-snail-trail-game/`

**Tech Stack**: Vanilla JavaScript ES2020+, HTML5 Canvas 2D, pure CSS — no build step, no npm runtime dependencies. Launched directly from `index.html` via `file://`.

**Prerequisites consumed**: plan.md ✅ spec.md ✅ data-model.md ✅ research.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Included — plain JavaScript inline helpers (`assert`, `assertEqual`, `assertDeepEqual`), runnable with `node test/<file>.test.js`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Every task includes an exact file path

---

## Phase 1: Setup (Project Scaffolding)

**Purpose**: Create the complete file and directory structure. No logic implemented — stubs only. Unblocks all parallel work in Phase 2 onward.

- [X] T001 Create `src/` and `test/` directories at the repository root
- [X] T002 Create `index.html` with the complete DOM skeleton: `<canvas id="game-canvas">`, `<div id="screen-start">` (with title, difficulty radio group placeholder, and Play button), `<div id="overlay-win">` (with congratulatory message and Restart button), `<div id="overlay-lose">` (with loss message and Restart button), and `<script type="module" src="./src/game.js">` entry point
- [X] T003 Add CSS to `index.html` `<style>` block: `:root` custom properties (`--color-wall: #2a2a2a`, `--color-open: #d4d4d4`, `--color-treasure: #f0b429`, `--color-player: #3b82f6`, `--color-snail: #f97316`, `--color-snail-shell: #7c2d12`); canvas sizing; overlay/screen layout (positioned above canvas); `.hidden { display: none }` utility; `@media (prefers-reduced-motion: reduce)` block suppressing all transitions
- [X] T004 [P] Create `src/game.js` stub: empty file with a top-of-file comment declaring its exports (`CELL`, `PHASE`, `DIFFICULTY`, `createGameState`, `movePlayer`, `resolveSnailTurns`, `checkEndConditions`) and an `// TODO: implement` placeholder
- [X] T005 [P] Create `src/mapgen.js` stub: empty file with a top-of-file comment declaring its export (`generateMap`) and an `// TODO: implement` placeholder
- [X] T006 [P] Create `src/pathfinding.js` stub: empty file with a top-of-file comment declaring its export (`findPath`) and an `// TODO: implement` placeholder
- [X] T007 [P] Create `src/renderer.js` stub: empty file with a top-of-file comment declaring its export (`render`) and an `// TODO: implement` placeholder
- [X] T008 [P] Create `src/ui.js` stub: empty file with a top-of-file comment declaring its exports (`showScreen`, `getSelectedDifficulty`, `bindControls`) and an `// TODO: implement` placeholder
- [X] T009 [P] Create `test/game.test.js` with inline helper definitions at the top of the file: `assert(condition, message)` (throws on false), `assertEqual(actual, expected, message)` (strict equality), `assertDeepEqual(actual, expected, message)` (JSON-serialised equality), and a final `console.log('All tests passed')` guard that runs after all test cases
- [X] T010 [P] Create `test/mapgen.test.js` with the same inline helpers as T009 plus a `benchmark(label, fn, maxMs)` helper using `performance.now()` that fails if `fn()` exceeds `maxMs` milliseconds
- [X] T011 [P] Create `test/pathfinding.test.js` with the same inline helpers as T009 plus the `benchmark` helper from T010

**Checkpoint**: All files exist. `open index.html` shows a blank page without console errors. `node test/game.test.js` prints "All tests passed (0/0)".

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core constants and the map generation engine. Every subsequent user story depends on these. No user story phase may begin until this phase is complete.

**⚠️ CRITICAL**: `CELL`, `PHASE`, and `DIFFICULTY` constants are imported by all other modules. `generateMap` is called by `createGameState`. Both must be complete before Phase 3.

- [X] T012 Export `CELL`, `PHASE`, and `DIFFICULTY` frozen constant objects from `src/game.js` exactly as specified in `contracts/game-api.md` (CELL: wall/open/start/treasure; PHASE: start/playing/win/lose; DIFFICULTY: Easy 15×15 1 snail, Medium 20×20 2 snails, Hard 25×25 3 snails)
- [X] T013 Implement private (non-exported) helpers in `src/mapgen.js`: `makeGrid(cols, rows, defaultType)` creates a `cols × rows` `Cell[][]` array indexed `cells[row][col]`; `shuffle(array)` Fisher-Yates in-place shuffle using `Math.random()`; `getNeighboursTwoAway(grid, col, row)` returns all wall neighbours exactly 2 steps away (N/S/E/W) within bounds; `carveWall(grid, fromCol, fromRow, toCol, toRow)` sets the intermediate cell and target cell to `CELL.OPEN`
- [X] T014 [P] Implement remaining private helpers in `src/mapgen.js`: `findOpenCellInQuadrant(grid, colRange, rowRange)` finds the first `OPEN` cell within the given column and row index ranges; `removeRandomWalls(grid, count)` removes `count` randomly chosen interior wall cells that border two or more open cells (creates maze cycles for junctions and open areas)
- [X] T015 Implement and export `generateMap(cols, rows)` in `src/mapgen.js` using iterative DFS recursive backtracking: (1) initialise all cells as `CELL.WALL` via `makeGrid`; (2) mark cell `(1,1)` as `CELL.OPEN`, push to stack; (3) while stack non-empty — peek top, find unvisited wall neighbours 2 away via `getNeighboursTwoAway`, if found pick one at random, `carveWall`, push to stack, else pop; (4) call `removeRandomWalls` with a small count (e.g. `Math.floor(cols * rows * 0.04)`); (5) assign `startCell` to first OPEN cell in top-left quadrant, set its type to `CELL.START`; (6) assign `treasureCell` to last OPEN cell in bottom-right quadrant, set its type to `CELL.TREASURE`; return `{ grid, startCell, treasureCell, snailStartCells: [] }` (snailStartCells populated in T036)

**Checkpoint**: `node -e "import('./src/mapgen.js').then(m => console.log(m.generateMap(15,15).grid.rows))"` prints `15` without error.

---

## Phase 3: User Story 1 — Player Navigation (Priority: P1) 🎯 MVP

**Goal**: A player can open `index.html`, see a start screen, begin a game, move their character with arrow keys / WASD across open cells, be blocked by walls, step onto the treasure chest, and see the win screen.

**Independent Test**: Open `index.html`, click Play, press arrow keys to move across open cells, verify the character cannot enter wall cells, navigate to the treasure chest, verify the win overlay appears immediately.

### Tests for User Story 1

> **Write these tests FIRST — they must FAIL before implementation begins.**

- [X] T016 [P] [US1] Write test in `test/game.test.js`: `movePlayer` returns state with updated position when moving to an adjacent open cell
- [X] T017 [P] [US1] Write test in `test/game.test.js`: `movePlayer` returns unchanged state (same position) when the target cell is a wall
- [X] T018 [P] [US1] Write test in `test/game.test.js`: `movePlayer` returns unchanged state when the target direction would move the player out of grid bounds
- [X] T019 [P] [US1] Write test in `test/game.test.js`: `movePlayer` increments `player.stepCount` by exactly 1 on a successful move and does not increment on a blocked move
- [X] T020 [P] [US1] Write test in `test/game.test.js`: `checkEndConditions` returns a state with `phase === PHASE.WIN` when `player.col === treasureCell.col && player.row === treasureCell.row`

### Implementation for User Story 1

- [X] T021 [US1] Implement `createGameState(difficulty)` in `src/game.js`: call `generateMap(difficulty.cols, difficulty.rows)`, set `player` to `{ col: startCell.col, row: startCell.row, stepCount: 0 }`, set `snails: []` (populated in US2), set `phase: PHASE.PLAYING`, return the full `GameState` object
- [X] T022 [US1] Implement `movePlayer(state, direction)` in `src/game.js`: compute target `col`/`row` from direction delta (`up`: row-1, `down`: row+1, `left`: col-1, `right`: col+1); if out of bounds or target cell type is `CELL.WALL` return `state` unchanged; otherwise return new state with updated `player.col`, `player.row`, and `player.stepCount + 1`
- [X] T023 [US1] Implement `checkEndConditions(state)` in `src/game.js`: if `state.phase !== PHASE.PLAYING` return state unchanged; if player position matches `treasureCell` coordinates return new state with `phase: PHASE.WIN`; if any snail in `state.snails` shares the player's position return new state with `phase: PHASE.LOSE`; otherwise return state unchanged
- [X] T024 [US1] Implement `render(canvas, state)` in `src/renderer.js`: (1) set `canvas.width`/`canvas.height` from grid dimensions × a fixed `CELL_SIZE` constant (e.g. 32px, defined at module top); (2) `clearRect` the full canvas; (3) iterate `state.grid.cells[row][col]` — draw `CELL.WALL` as dark-grey `fillRect`, `CELL.OPEN`/`CELL.START` as light-grey `fillRect`, `CELL.TREASURE` as a gold inset square (80% cell width centred) with a horizontal accent `fillRect`; (4) draw the player as a blue filled circle (`arc`) with radius 40% of cell width centred on `state.player.col`/`state.player.row`; never mutate `state`
- [X] T025 [US1] Implement `showScreen(screenId)` in `src/ui.js`: add class `hidden` to `#screen-start`, `#overlay-win`, `#overlay-lose`; then remove `hidden` from the element corresponding to the given `screenId` (`'start'` → `#screen-start`, `'win'` → `#overlay-win`, `'lose'` → `#overlay-lose`, `'game'` → no element shown)
- [X] T026 [US1] Implement `bindControls(handlers)` in `src/ui.js`: attach a `click` listener to the `#btn-start` button that calls `handlers.onStart()`; attach a `keydown` listener on `document` that maps `ArrowUp`/`w`/`W` → `'up'`, `ArrowDown`/`s`/`S` → `'down'`, `ArrowLeft`/`a`/`A` → `'left'`, `ArrowRight`/`d`/`D` → `'right'`, calls `event.preventDefault()` for all mapped keys, and calls `handlers.onKeyDown(direction)` for the mapped direction; guard with a module-level `bound` flag so multiple calls do not register duplicate listeners
- [X] T027 [US1] Wire the game loop in `src/game.js` (used as the ES module entry point via `index.html`): import `generateMap` from `./mapgen.js`, `render` from `./renderer.js`, `showScreen`, `bindControls`, `getSelectedDifficulty` from `./ui.js`; define a module-level `let state` variable; call `showScreen('start')` on load; call `bindControls` with `onStart: () => { state = createGameState(DIFFICULTY.EASY); showScreen('game'); requestAnimationFrame(() => render(canvas, state)); }` and `onKeyDown: (dir) => { if (state.phase !== PHASE.PLAYING) return; state = movePlayer(state, dir); state = checkEndConditions(state); if (state.phase === PHASE.WIN) { showScreen('win'); } requestAnimationFrame(() => render(canvas, state)); }`

**Checkpoint**: `open index.html` → click Play → arrow keys move the blue circle across open cells → walls block movement → stepping onto the gold square shows the win overlay.

---

## Phase 4: User Story 2 — Snail Pursuit (Priority: P2)

**Goal**: One or more snails pursue the player using A* pathfinding, moving once every two player steps. If a snail reaches the player's cell the lose overlay appears.

**Independent Test**: Start a game, move the player toward a snail (or stay near spawn), observe snails advance one cell every 2 player steps, verify snails navigate around walls, verify stepping onto a snail's cell (or vice versa) shows the lose overlay.

### Tests for User Story 2

> **Write these tests FIRST — they must FAIL before implementation begins.**

- [X] T028 [P] [US2] Write test in `test/pathfinding.test.js`: `findPath` returns a 2-element array `[from, to]` when `from` and `to` are adjacent with no wall between them
- [X] T029 [P] [US2] Write test in `test/pathfinding.test.js`: `findPath` returns a path that navigates around a wall blocking the direct route (verify path length > 2 and no cell in the path has type `CELL.WALL`)
- [X] T030 [P] [US2] Write test in `test/pathfinding.test.js`: `findPath` returns `null` when the target cell is completely enclosed by walls and unreachable
- [X] T031 [P] [US2] Write test in `test/pathfinding.test.js`: `findPath` returns `null` when the source cell is completely enclosed by walls
- [X] T032 [P] [US2] Write benchmark test in `test/pathfinding.test.js`: a worst-case `findPath` call on a 25×25 open grid completes in < 100 ms (use `benchmark` helper from T011)
- [X] T033 [P] [US2] Write test in `test/game.test.js`: `resolveSnailTurns` moves a snail exactly one cell closer to the player along the shortest path when a clear path exists
- [X] T034 [P] [US2] Write test in `test/game.test.js`: `resolveSnailTurns` leaves a snail in its current cell when no path to the player exists (snail fully enclosed by walls)
- [X] T035 [P] [US2] Write test in `test/game.test.js`: `checkEndConditions` returns state with `phase === PHASE.LOSE` when any snail occupies the same `col`/`row` as the player

### Implementation for User Story 2

- [X] T036 [US2] Implement and export `findPath(grid, from, to)` in `src/pathfinding.js`: A* search with `h(n) = |n.col - to.col| + |n.row - to.row|`; open set as a plain array sorted ascending by `fScore` on each push (use insertion sort for small grids); closed set as `Set` of `"col,row"` strings; reconstruct path via `cameFrom` map; return ordered `{ col, row }[]` from `from` to `to` inclusive, or `null` if the open set empties without reaching `to`; never mutate `grid`
- [X] T037 [US2] Extend `generateMap` in `src/mapgen.js` to populate `snailStartCells`: after placing start and treasure cells, select `snailCount` random `CELL.OPEN` cells (not `startCell`, not `treasureCell`, no duplicates) using `shuffle`; include them in the returned `MapData` object as `snailStartCells` (note: `snailCount` must be passed as a parameter — update signature to `generateMap(cols, rows, snailCount)` and update all callers)
- [X] T038 [US2] Implement and export `resolveSnailTurns(state)` in `src/game.js`: import `findPath` from `./pathfinding.js`; for each snail, call `findPath(state.grid, { col: snail.col, row: snail.row }, { col: state.player.col, row: state.player.row })`; if path is non-null and has length ≥ 2, update snail position to `path[1]`; return new state with updated snails array
- [X] T039 [US2] Update `createGameState(difficulty)` in `src/game.js` to pass `difficulty.snailCount` to `generateMap`, then build the `snails` array from `mapData.snailStartCells` as `[{ id, col, row }]`
- [X] T040 [US2] Extend `render(canvas, state)` in `src/renderer.js` to draw snails: for each snail in `state.snails`, draw an amber filled circle (radius 35% of cell width) centred on the snail cell, then stroke a clockwise arc (radius 20% cell width, 270°) in dark amber to represent the shell
- [X] T041 [US2] Extend the `onKeyDown` handler in `src/game.js` to trigger snail turns: after `movePlayer`, if `state.player.stepCount % 2 === 0 && state.player.stepCount > 0`, call `state = resolveSnailTurns(state)`; then call `state = checkEndConditions(state)`; add an `isProcessing` module-level boolean flag that is set `true` at the start of `onKeyDown` and reset to `false` after `requestAnimationFrame` fires, preventing queued inputs from stacking

**Checkpoint**: Start a game on Easy, remain stationary by pressing a key toward a wall repeatedly — the snail should advance one cell every 2 key presses. Move into the snail's cell (or let it reach you) — the lose overlay appears.

---

## Phase 5: User Story 3 — Procedural Map Generation (Priority: P3)

**Goal**: Every new game generates a visually distinct maze with wall clusters, open corridors, a unique layout, and a guaranteed solvable path from start to treasure.

**Independent Test**: Call `generateMap` 20 times; verify each map has exactly one `start` and one `treasure` cell; verify a `findPath` call from `startCell` to `treasureCell` always returns a non-null path; verify no two consecutive maps have identical wall layouts.

### Tests for User Story 3

> **Write these tests FIRST — they must FAIL before implementation begins.**

- [X] T042 [P] [US3] Write test in `test/mapgen.test.js`: `generateMap(15, 15, 1)` returns a grid with exactly one `CELL.START` cell and exactly one `CELL.TREASURE` cell
- [X] T043 [P] [US3] Write test in `test/mapgen.test.js`: for 10 successive calls to `generateMap(15, 15, 1)`, `findPath(grid, startCell, treasureCell)` returns a non-null path every time (solvability guarantee)
- [X] T044 [P] [US3] Write test in `test/mapgen.test.js`: the generated grid contains both wall cells and open cells in a ratio between 20%–80% open (not entirely open, not entirely walled)
- [X] T045 [P] [US3] Write test in `test/mapgen.test.js`: two successive calls to `generateMap(15, 15, 1)` produce wall layouts that are not byte-for-byte identical (maps are randomised)
- [X] T046 [P] [US3] Write benchmark test in `test/mapgen.test.js`: `generateMap(25, 25, 3)` completes in < 100 ms (use `benchmark` helper from T010)

**Checkpoint**: `node test/mapgen.test.js` prints all PASS lines. Restarting the game multiple times in the browser shows clearly different maze layouts each time.

---

## Phase 6: User Story 4 — Difficulty Selection (Priority: P4)

**Goal**: Before starting a game, the player selects Easy, Medium, or Hard from the start screen. The chosen difficulty controls grid size and snail count.

**Independent Test**: Select each difficulty, click Play, verify Easy shows 15×15 with 1 snail, Medium shows 20×20 with 2 snails, Hard shows 25×25 with 3 snails.

### Implementation for User Story 4

- [X] T047 [US4] Add three `<input type="radio" name="difficulty" value="easy|medium|hard">` elements with visible `<label>` text ("Easy — 15×15, 1 Snail", "Medium — 20×20, 2 Snails", "Hard — 25×25, 3 Snails") and a default selection of `easy` inside `#screen-start` in `index.html`; ensure all labels are keyboard-focusable and the radio group has an accessible group label (`<fieldset>` + `<legend>`)
- [X] T048 [US4] Implement `getSelectedDifficulty()` in `src/ui.js`: query `document.querySelector('input[name="difficulty"]:checked').value`; map `'easy'` → `DIFFICULTY.EASY`, `'medium'` → `DIFFICULTY.MEDIUM`, `'hard'` → `DIFFICULTY.HARD` (import `DIFFICULTY` from `./game.js`); return the matching `DifficultyConfig`
- [X] T049 [US4] Update the `onStart` handler in `src/game.js` to call `getSelectedDifficulty()` and pass the result to `createGameState(difficulty)` instead of the hardcoded `DIFFICULTY.EASY`
- [X] T050 [US4] Update `render` in `src/renderer.js` to derive `cellWidth` and `cellHeight` dynamically from `canvas.width / state.grid.cols` and `canvas.height / state.grid.rows` so the canvas scales correctly for all three grid sizes; ensure `canvas.width` and `canvas.height` are set at the start of `render` based on `state.grid.cols * CELL_SIZE` and `state.grid.rows * CELL_SIZE`

**Checkpoint**: Select Hard, click Play — a 25×25 grid appears with 3 amber snails. Select Easy, restart — a 15×15 grid with 1 snail.

---

## Phase 7: User Story 5 — Game States & Feedback (Priority: P5)

**Goal**: The game transitions cleanly and visibly between start, playing, win, and lose states. The player can always restart without reloading the page.

**Independent Test**: Trigger each state transition (start game, win, lose, restart from win, restart from lose); verify each shows an unambiguous on-screen visual within one animation frame; verify restart generates a new map and resets state without a page reload.

### Implementation for User Story 5

- [X] T051 [US5] Verify `#overlay-win` in `index.html` contains: a heading (`<h2>`) with a congratulatory message, a descriptive sub-message, and a `<button id="btn-restart-win">New Game</button>`; apply CSS so the overlay covers the canvas with a semi-transparent background and centred content; it must have the `hidden` class initially
- [X] T052 [US5] Verify `#overlay-lose` in `index.html` contains: a heading (`<h2>`) with a loss message, a descriptive sub-message, and a `<button id="btn-restart-lose">Try Again</button>`; apply the same overlay CSS as win; hidden initially
- [X] T053 [US5] Extend `bindControls(handlers)` in `src/ui.js` to attach `click` listeners on both `#btn-restart-win` and `#btn-restart-lose` that call `handlers.onRestart()` when clicked
- [X] T054 [US5] Add an `onRestart` handler in `src/game.js`: call `getSelectedDifficulty()`, call `createGameState(difficulty)`, update module-level `state`, call `showScreen('game')`, reset `isProcessing` to `false`, schedule `requestAnimationFrame(() => render(canvas, state))`
- [X] T055 [US5] Ensure the `onKeyDown` handler in `src/game.js` is a no-op when `state.phase !== PHASE.PLAYING` — movement keys during win, lose, or start phases must not mutate state or schedule a render
- [X] T056 [US5] Smoke-test all five state transitions manually per `quickstart.md` Scenarios 1–5: start → playing, playing → win, playing → lose, win → restart, lose → restart; confirm each transition produces an unmissable visual change within one animation frame

**Checkpoint**: Win the game → win overlay appears. Click New Game → fresh map, playing state resumes. Lose → lose overlay appears. Click Try Again → fresh map. All achieved without `window.location.reload()`.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance validation, and code quality gates. Ensures all constitution principles are met before the feature is considered done.

- [X] T057 Verify the `@media (prefers-reduced-motion: reduce)` block in `index.html` `<style>` sets `transition: none` and `animation: none` on all CSS transitions and Canvas animation scheduling; add a JS check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at render entry in `src/renderer.js` and skip any Canvas-based animation frames if true (static single-frame draw is always permitted)
- [X] T058 Add `aria-label="Snail Trail game canvas"` and `role="img"` to the `<canvas id="game-canvas">` element in `index.html`; add `aria-live="polite"` to a visually hidden `<div id="game-status">` element; update `showScreen` in `src/ui.js` to set `document.getElementById('game-status').textContent` to a brief state announcement (`'Game started'`, `'You won!'`, `'Game over'`) on each transition
- [X] T059 [P] Audit `src/game.js` for constitution compliance: verify every function is ≤ 30 lines; all string literals are replaced by `CELL.*` or `PHASE.*` constants; no function is exported beyond the declared API (`CELL`, `PHASE`, `DIFFICULTY`, `createGameState`, `movePlayer`, `resolveSnailTurns`, `checkEndConditions`); no dead code or commented-out blocks remain
- [X] T060 [P] Audit `src/mapgen.js`, `src/pathfinding.js`, `src/renderer.js`, `src/ui.js` for constitution compliance: no DOM or Canvas API calls in `mapgen.js` or `pathfinding.js`; `renderer.js` never calls any function from `game.js`, `mapgen.js`, or `pathfinding.js` and never mutates state; `ui.js` never calls Canvas API; all private helpers are non-exported
- [X] T061 Run the full test suite (`node test/game.test.js && node test/mapgen.test.js && node test/pathfinding.test.js`) and verify all tests pass with zero failures; confirm benchmark assertions pass (mapgen < 100 ms, pathfinding < 100 ms per call); fix any failures before marking this task complete

**Checkpoint**: All three test files pass with zero failures. `open index.html` → full game playable by keyboard alone, all five state transitions work, overlays visible, canvas aria-labelled.

---

## Dependency Graph

```
Phase 1 (Setup)
  └── Phase 2 (Foundational: T012–T015)
        ├── Phase 3 (US1: T016–T027)
        │     ├── Phase 4 (US2: T028–T041)   ← requires US1 renderer + game loop
        │     │     └── Phase 5 (US3: T042–T046)  ← verifies mapgen (T037 also in US2)
        │     ├── Phase 6 (US4: T047–T050)   ← extends US1 start screen
        │     └── Phase 7 (US5: T051–T056)   ← extends US1 overlays + US4 restart
        │
        └── Phase 8 (Polish: T057–T061)  ← can begin after US1 complete; finalise last
```

**Stories that can be implemented independently after US1**:
- US3 (Procedural Map Generation) tests can be written in parallel with US2 implementation
- US4 (Difficulty Selection) HTML work (T047) can be done in parallel with any Phase 4 task
- US5 (Game States) overlay HTML (T051, T052) can be authored any time after Phase 1

## Parallel Execution Examples

**After Phase 2 is complete, these batches can run in parallel**:

- Batch A: T016, T017, T018, T019, T020 (all test writing for US1 — different test cases in the same file)
- Batch B (after US1 wired): T028, T029, T030, T031, T032 (pathfinding test writing) + T042, T044, T045, T046 (mapgen test writing) + T047 (difficulty HTML)
- Batch C: T059, T060 (module audits — different files)

## Implementation Strategy

**MVP (deliver and validate first)**: Complete Phases 1–3 (T001–T027). This gives a fully playable single-difficulty game with player movement, collision, and a win condition — independently testable and demoable.

**Increment 2**: Add Phases 4 (snail AI) + 5 (map generation tests). Completes the core challenge mechanic.

**Increment 3**: Add Phase 6 (difficulty selection) + Phase 7 (game states). Delivers the full spec with difficulty scaling, win/lose overlays, and restart.

**Final**: Phase 8 (polish). Constitution compliance, accessibility, and full test suite passage.
