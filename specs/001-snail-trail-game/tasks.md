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

---

## Phase 9: User Story 6 — Level Timer (Priority: P3)

**Goal**: A visible HUD timer starts when gameplay begins, ticks during play, freezes on win or loss, and the win overlay shows the final elapsed time.

**Independent Test**: Start a game, wait ~5 seconds, win, verify the win overlay shows a time value approximately matching the wait. Restart — timer resets to zero and counts again.

### Tests for User Story 6

- [X] T062 [P] [US6] Write test in `test/game.test.js`: `createGameState` returns state with `startTime` as a positive number (greater than 0) and `finalElapsedMs` equal to `null`
- [X] T063 [P] [US6] Write test in `test/game.test.js`: `checkEndConditions` when player is on the treasure cell returns state with `phase === PHASE.WIN` and `finalElapsedMs` as a non-null positive number
- [X] T064 [P] [US6] Write test in `test/game.test.js`: `checkEndConditions` when a snail shares the player's cell returns state with `phase === PHASE.LOSE` and `finalElapsedMs` as a non-null positive number

### Implementation for User Story 6

- [X] T065 [US6] Add `startTime` and `finalElapsedMs` fields to `GameState` in `src/game.js`: `createGameState` sets `startTime: performance.now()` and `finalElapsedMs: null`; add exported constants `HUD_INTERVAL_MS = 100` at the top of the file alongside the existing constants
- [X] T066 [US6] Extend `checkEndConditions` in `src/game.js`: when transitioning to `PHASE.WIN` or `PHASE.LOSE`, include `finalElapsedMs: performance.now() - state.startTime` in the returned state object; mirror this change in the inline script in `index.html`
- [X] T067 [US6] Add `<div id="hud" class="hidden">` immediately above `<canvas id="game-canvas">` in `index.html` with two child spans: `<span id="hud-timer">0.00s</span>` (left side) and `<span id="hud-mode">Easy</span>` (right side); add CSS to `<style>`: `#hud { display: flex; justify-content: space-between; padding: 4px 8px; font-family: monospace; font-size: 1rem; background: var(--color-hud-bg, #111); color: var(--color-hud-text, #eee); }` and add `--color-hud-bg` / `--color-hud-text` to the `:root` block
- [X] T068 [US6] Implement `showHud()`, `hideHud()`, `updateHudTimer(elapsedMs)`, and `updateHudMode(label)` in the inline script in `index.html`: `showHud()` removes `hidden` from `#hud`; `hideHud()` adds it; `updateHudTimer(ms)` sets `document.getElementById('hud-timer').textContent = (ms / 1000).toFixed(2) + 's'`; `updateHudMode(label)` sets `document.getElementById('hud-mode').textContent = label`; mirror stubs in `src/ui.js` for constitution consistency
- [X] T069 [US6] Wire the HUD interval in the inline script in `index.html`: declare `let hudInterval = null` at module scope; on game start call `showHud()`, `updateHudMode(modeName)`, then `hudInterval = setInterval(() => updateHudTimer(performance.now() - state.startTime), HUD_INTERVAL_MS)`; in the win/lose handler call `clearInterval(hudInterval); hudInterval = null` then call `updateHudTimer(state.finalElapsedMs)`; on restart clear any existing interval before starting a new one to prevent stacking
- [X] T070 [US6] Display the final elapsed time on the win overlay: add `<p id="win-time" class="hidden"></p>` inside `#overlay-win` in `index.html`; in the win handler of the inline script set `document.getElementById('win-time').textContent = 'Time: ' + (state.finalElapsedMs / 1000).toFixed(2) + 's'` and remove `hidden`; on restart re-add `hidden` to `#win-time` before showing the new game

**Checkpoint**: Start a game → HUD shows `0.00s` ticking up and the mode label. Win → timer freezes, win overlay shows `Time: X.XXs`. Restart → timer resets to `0.00s`.

---

## Phase 10: User Story 8 — Infinite Mode (Priority: P2)

**Goal**: Infinite Mode escalates grid size and snail count on each win. A level counter is visible during play. On loss the highest level reached is displayed.

**Independent Test**: Select Infinite Mode, win Level 1 (20×20, 2 snails) → Level 2 begins with 25×25, 3 snails, HUD shows "Infinite — Level 2". Lose → lose overlay shows "Reached Level 2".

### Tests for User Story 8

- [X] T071 [P] [US8] Write test in `test/game.test.js`: `createGameState` with a config of `{ mode: 'infinite', infiniteLevel: 0 }` produces a state with `grid.cols === 20`, `grid.rows === 20`, `snails.length === 2`, and `infiniteLevel === 0`
- [X] T072 [P] [US8] Write test in `test/game.test.js`: calling `createGameState` with `infiniteLevel = 1` produces `grid.cols === 25`, `grid.rows === 25`, and `snails.length === 3` (validates formulas `20 + level * 5` and `2 + level`)
- [X] T073 [P] [US8] Write benchmark test in `test/mapgen.test.js`: `generateMap(120, 120, 22)` (simulating Infinite Level 20: `20 + 20*5 = 120` cols/rows, `2 + 20 = 22` snails) completes in < 100 ms (use `benchmark` helper from T010)

### Implementation for User Story 8

- [X] T074 [US8] Add `DIFFICULTY.INFINITE = { mode: 'infinite' }` to the frozen `DIFFICULTY` constant in `src/game.js`; add exported constants `INFINITE_BASE_SIZE = 20`, `INFINITE_SIZE_STEP = 5`, `INFINITE_BASE_SNAILS = 2`; extend `createGameState` to accept an `{ mode, infiniteLevel }` config object — when `mode === 'infinite'`, compute `cols = rows = INFINITE_BASE_SIZE + infiniteLevel * INFINITE_SIZE_STEP` and `snailCount = INFINITE_BASE_SNAILS + infiniteLevel`; store `mode` and `infiniteLevel` on the returned state; mirror all changes in the inline script in `index.html`
- [X] T075 [US8] Add `<input type="radio" name="difficulty" value="infinite">` with `<label>` text "Infinite — Escalating" to the `<fieldset>` in `#screen-start` in `index.html`; update `getSelectedDifficulty()` in the inline script (and `src/ui.js`) to map `'infinite'` → `DIFFICULTY.INFINITE`; add a `currentInfiniteLevel` module-level variable (initialised to `0`) in the inline script, reset to `0` on any fresh game start
- [X] T076 [US8] Extend the win handler in the inline script in `index.html` for Infinite Mode: `if (state.mode === 'infinite')` increment `currentInfiniteLevel`, call `createGameState({ mode: 'infinite', infiniteLevel: currentInfiniteLevel })`, call `showScreen('game')`, reset `isProcessing`, call `updateHudMode('Infinite — Level ' + (currentInfiniteLevel + 1))`, restart the HUD interval, and schedule `requestAnimationFrame(() => render(canvas, state))`; do NOT show the win overlay in this branch
- [X] T077 [US8] Extend the lose handler in the inline script in `index.html` for Infinite Mode: when `state.mode === 'infinite'`, set the text of `<p id="lose-infinite-level"></p>` (add this element inside `#overlay-lose` in `index.html`) to `'Reached Level ' + (state.infiniteLevel + 1)` and remove `hidden` from it; for all other modes add `hidden` back to `#lose-infinite-level` before showing the lose overlay; reset `currentInfiniteLevel = 0` after displaying the lose overlay

**Checkpoint**: Select Infinite, start game → HUD shows "Infinite — Level 1" on a 20×20 grid with 2 snails. Win → HUD changes to "Infinite — Level 2", new 25×25 grid with 3 snails, no win overlay shown. Lose → lose overlay shows "Reached Level 2".

---

## Phase 11: User Story 7 — In-Overlay Difficulty Change (Priority: P4)

**Goal**: Win and lose overlays both include a compact difficulty selector so the player can change mode between games without returning to the start screen.

**Independent Test**: Win on Easy → win overlay contains a radio group with Easy/Medium/Hard/Infinite. Change to Hard, click New Game → new game starts on Hard (25×25, 3 snails).

### Implementation for User Story 7

- [X] T078 [US7] Add an overlay difficulty selector to both `#overlay-win` and `#overlay-lose` in `index.html`: inside each overlay, add `<fieldset class="overlay-difficulty-selector"><legend>Next game mode</legend>` containing four `<input type="radio" name="overlay-difficulty" value="easy|medium|hard|infinite">` inputs each with a `<label>` (e.g. "Easy", "Medium", "Hard", "Infinite"); close `</fieldset>`; add CSS for `.overlay-difficulty-selector` to render as a compact inline row (e.g. `display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem`) with label text small enough to fit; both fieldsets share `name="overlay-difficulty"` so they act as two independent groups
- [X] T079 [US7] Implement `getOverlaySelectedDifficulty()` in the inline script in `index.html`: query `document.querySelector('input[name="overlay-difficulty"]:checked')?.value ?? 'easy'` and map to the same `DIFFICULTY.*` objects as `getSelectedDifficulty()`; implement `setOverlayDifficulty(mode)` that programmatically checks the radio matching `mode` value in both overlay selectors (query all `input[name="overlay-difficulty"][value="${mode}"]` and set `.checked = true`)
- [X] T080 [US7] Update the win and lose handler in the inline script in `index.html`: when showing a win or lose overlay (non-infinite win, standard lose) call `setOverlayDifficulty(state.mode)` to pre-select the just-played mode; update `onRestart` (for the overlay buttons) to call `getOverlaySelectedDifficulty()` to determine the next game's mode, reset `currentInfiniteLevel = 0`, and pass the result to `createGameState`; the start screen's `onStart` handler continues to use `getSelectedDifficulty()` unchanged

**Checkpoint**: Win on Medium → overlay difficulty selector shows Medium pre-selected. Change to Infinite, click New Game → Infinite game starts at Level 1.

---

## Phase 12: User Story 9 — Leaderboard (Priority: P5)

**Goal**: Per-category top-5 entries persist in `localStorage`. A Leaderboard button on the start screen shows all categories with correct sorting.

**Independent Test**: Set a record on Easy, reload the page, open the leaderboard — the record appears with the correct name, time, and date.

### Tests for User Story 9

- [X] T081 [P] [US9] Create `test/leaderboard.test.js` with inline helpers (`assert`, `assertEqual`, `assertDeepEqual`) matching the pattern from `test/game.test.js`; add a `makeStore()` helper that returns `{ easy: [], medium: [], hard: [], infinite: [] }`; end the file with `console.log('All leaderboard tests passed')`
- [X] T082 [P] [US9] Write test in `test/leaderboard.test.js`: `qualifies(makeStore(), 'easy', 999)` returns `true` when the easy array has 0 entries (fewer than 5)
- [X] T083 [P] [US9] Write test in `test/leaderboard.test.js`: `qualifies` returns `false` when easy already has 5 entries and the new value (99999 ms) is worse than the 5th-place value (ascending sort for timed — higher ms is worse)
- [X] T084 [P] [US9] Write test in `test/leaderboard.test.js`: `qualifies` returns `true` for `'infinite'` when the new level value beats (is greater than) the current 5th-place value (descending sort — higher level is better)
- [X] T085 [P] [US9] Write test in `test/leaderboard.test.js`: `addEntry` on `'easy'` inserts the entry, sorts the category ascending by `value`, and the array length never exceeds 5 even after 6 insertions
- [X] T086 [P] [US9] Write test in `test/leaderboard.test.js`: `addEntry` on `'infinite'` sorts the category descending by `value` and caps at 5 entries
- [X] T087 [P] [US9] Write test in `test/leaderboard.test.js`: `loadLeaderboard()` returns `makeStore()` (all-empty arrays) when `localStorage` contains corrupt JSON (simulate by setting the key to `"not-json"` before calling — use a `globalThis.localStorage` mock object in Node: `{ getItem: () => 'not-json', setItem: () => {} }`)
- [X] T088 [P] [US9] Write test in `test/leaderboard.test.js`: a `saveLeaderboard(store)` → `loadLeaderboard()` round-trip returns an object deeply equal to the original `store` (use the same `globalThis.localStorage` mock with a `Map`-backed implementation to capture the write)

### Implementation for User Story 9

- [X] T089 [US9] Create `src/leaderboard.js` exporting: `const LEADERBOARD_KEY = 'snailTrailLeaderboard'`; `const LEADERBOARD_MAX_ENTRIES = 5`; `function makeStore()`; `function qualifies(store, category, value)` — returns `true` if `store[category].length < LEADERBOARD_MAX_ENTRIES` OR (category is `'infinite'` ? `value > store[category][LEADERBOARD_MAX_ENTRIES - 1].value` : `value < store[category][LEADERBOARD_MAX_ENTRIES - 1].value`); `function addEntry(store, category, entry)` — pushes entry, sorts (ascending by `value` for timed, descending for infinite), slices to `LEADERBOARD_MAX_ENTRIES`, returns new store (immutable pattern); `function loadLeaderboard()` — `try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) ?? makeStore() } catch { return makeStore() }`; `function saveLeaderboard(store)` — `try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(store)) } catch { /* silent */ }`; mirror identical function bodies in the inline `<script>` in `index.html` (no import — preserves `file://` compat)
- [X] T090 [US9] Add a `<button id="btn-leaderboard">Leaderboard</button>` to `#screen-start` in `index.html` (below the Play button); create `<div id="screen-leaderboard" class="hidden">` containing `<h2>Leaderboard</h2>`, four `<section>` elements each with a `<h3>` category heading ("Easy", "Medium", "Hard", "Infinite") and an `<ol>` (`id="lb-easy"`, `id="lb-medium"`, `id="lb-hard"`, `id="lb-infinite"`), and a `<button id="btn-lb-back">Back</button>`; add CSS so `#screen-leaderboard` renders as a full-screen view matching the start screen styling
- [X] T091 [US9] Implement leaderboard view wiring in the inline script in `index.html`: define `showLeaderboard(store)` — iterate each category, clear the matching `<ol>`, append formatted `<li>` elements (`"AAA  12.34s  2026-07-09"` for timed; `"AAA  Lv 3  2026-07-09"` for infinite, where level displayed is `value + 1`), hide `#screen-start`, show `#screen-leaderboard`; attach `#btn-leaderboard` click → `showLeaderboard(loadLeaderboard())`; attach `#btn-lb-back` click → hide `#screen-leaderboard`, show `#screen-start`

**Checkpoint**: `node test/leaderboard.test.js` prints all tests passed. In browser: set a record → reload → click Leaderboard → entry visible. `localStorage` unavailable (private mode) → leaderboard shows empty, game fully playable.

---

## Phase 13: User Story 10 — Arcade Name Entry (Priority: P5)

**Goal**: When a new record qualifies, a name-entry overlay appears with 3 arcade-style letter boxes. Only A–Z input is accepted. Save is disabled until exactly 3 letters are entered. On save the entry is written to the leaderboard.

**Independent Test**: Achieve a qualifying time on Medium → name entry overlay appears, score displayed, 3 boxes empty. Type "ABC" → Save button enables. Press Enter → "ABC" in Medium leaderboard. Press non-letter keys → silently ignored.

### Implementation for User Story 10

- [X] T092 [US10] Add `<div id="name-entry-overlay" class="hidden" aria-label="Name entry for new record" role="dialog">` to `index.html` containing: `<h2>NEW RECORD!</h2>`, `<p id="ne-score"></p>`, `<div id="letter-display"><span class="letter-box" aria-label="Letter 1"></span><span class="letter-box" aria-label="Letter 2"></span><span class="letter-box" aria-label="Letter 3"></span></div>`, and `<button id="btn-save-name" disabled>Save</button>`; add CSS for `#name-entry-overlay` as a full-viewport centered overlay with `z-index` above win/lose overlays; style `.letter-box` as `display: inline-block; width: 2.5rem; height: 2.5rem; border: 2px solid var(--color-player); font-family: monospace; font-size: 1.5rem; text-align: center; line-height: 2.5rem; margin: 0 4px`
- [X] T093 [US10] Implement `startNameEntry(scoreLabel, onSave)` and `stopNameEntry()` in the inline script in `index.html`: `startNameEntry` — set `#ne-score` text to `scoreLabel`, reset `let letters = []`, update `#letter-display` spans from `letters` (empty boxes show `'_'`), attach `nameKeyHandler` on `document` (`keydown`): A–Z/a–z → push `key.toUpperCase()` if `letters.length < 3`, Backspace → pop last, Enter → call `onSave(letters.join(''))` only if `letters.length === 3`; all handled keys call `e.preventDefault()`; after each key update spans and toggle `#btn-save-name.disabled = letters.length !== 3`; attach `#btn-save-name` click → same as Enter; remove `hidden` from `#name-entry-overlay` and move focus to it; `stopNameEntry` — remove `nameKeyHandler`, add `hidden` to `#name-entry-overlay`
- [X] T094 [US10] Wire qualification and name-entry into game-end flow in the inline script in `index.html`: after `state = checkEndConditions(state)`, if `state.phase === PHASE.WIN` and `state.mode !== 'infinite'`: load store, check `qualifies(store, state.mode, state.finalElapsedMs)`, if true call `startNameEntry('Time: ' + (state.finalElapsedMs / 1000).toFixed(2) + 's', name => { const entry = { name, value: state.finalElapsedMs, date: new Date().toISOString() }; saveLeaderboard(addEntry(loadLeaderboard(), state.mode, entry)); stopNameEntry(); showScreen('win'); setOverlayDifficulty(state.mode); })`, else `showScreen('win')`; if `state.phase === PHASE.LOSE` and `state.mode === 'infinite'`: check `qualifies(store, 'infinite', state.infiniteLevel)`, if true call `startNameEntry('Level ' + (state.infiniteLevel + 1), name => { const entry = { name, value: state.infiniteLevel, date: new Date().toISOString() }; saveLeaderboard(addEntry(loadLeaderboard(), 'infinite', entry)); stopNameEntry(); showScreen('lose'); })`, else `showScreen('lose')`

**Checkpoint**: Achieve a qualifying time → name entry overlay appears. Type "AB" → Save disabled. Type "C" → Save enabled. Press Enter → leaderboard updated, win overlay shown. Type numbers/symbols → no effect.

---

## Phase 14: User Story 11 — GitHub Pages Hosting (Priority: P6)

**Goal**: Pushing to `main` automatically deploys the static game to GitHub Pages with no build step.

**Independent Test**: Inspect `.github/workflows/deploy.yml` — trigger is `push: branches: [main]`; steps are `checkout`, `configure-pages`, `upload-pages-artifact path: '.'`, `deploy-pages`; no `npm install`, `npm run build`, or any build command present.

### Implementation for User Story 11

- [X] T095 [US11] Create `.github/workflows/deploy.yml` at the repository root with the exact content: `name: Deploy to GitHub Pages`; trigger `on: push: branches: [main]`; `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: true`; one job `deploy` running on `ubuntu-latest` with environment `{ name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }` and four steps: (1) `uses: actions/checkout@v4`, (2) `uses: actions/configure-pages@v5`, (3) `uses: actions/upload-pages-artifact@v3` with `with: path: '.'`, (4) `id: deployment` → `uses: actions/deploy-pages@v4`; no build commands, no `npm install`, no `node` invocation

**Checkpoint**: `.github/workflows/deploy.yml` exists. On inspection: trigger is `push: [main]`, no build step, path is `.`, `deploy-pages` action present with correct permissions.

---

## Phase 15: Integration, Sync & Final Test Pass

**Purpose**: Mirror inline logic to `src/` for testability, wire accessibility improvements for new overlays, extend `prefers-reduced-motion` coverage, and confirm the entire v2 test suite passes.

- [X] T096 [P] Verify `src/leaderboard.js` (created in T089) is importable by `test/leaderboard.test.js`: update `test/leaderboard.test.js` to `import { makeStore, qualifies, addEntry, loadLeaderboard, saveLeaderboard } from '../src/leaderboard.js'`; confirm all 7 tests still pass with `node --experimental-vm-modules test/leaderboard.test.js` (or adjust import to CJS `require` if Node version does not support ESM flags); the function bodies in `src/leaderboard.js` and `index.html` inline script must remain identical
- [X] T097 [P] Extend `test/game.test.js` to cover the new timer fields: add test that `createGameState` returns `startTime` as a number > 0 and `finalElapsedMs === null`; add test that after `checkEndConditions` returns a win state, `state.finalElapsedMs` is a positive number; add test that after `checkEndConditions` returns a lose state, `state.finalElapsedMs` is a positive number; run `node test/game.test.js` to confirm all pass
- [X] T098 Extend the `@media (prefers-reduced-motion: reduce)` CSS block in `index.html` `<style>` to add `#hud, #name-entry-overlay { transition: none !important; animation: none !important; }`; extend the JS reduced-motion check in the inline script to skip `setInterval` HUD updates when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true — instead compute a single static display at game start and update only on state transitions (win/lose)
- [X] T099 [P] Add focus management to the name-entry overlay in `index.html` inline script: in `startNameEntry`, after showing the overlay call `document.getElementById('btn-save-name').focus()` (or the first letter-box if it is focusable); in `stopNameEntry`, return focus to the element that triggered name entry (store a `let nameEntryTrigger` reference before calling `startNameEntry` and call `nameEntryTrigger.focus()` in `stopNameEntry`); ensure `#btn-save-name` has a visible `:focus-visible` CSS outline via `:focus-visible { outline: 2px solid var(--color-player); outline-offset: 2px }`
- [X] T100 Run the complete v2 test suite (`node test/game.test.js && node test/mapgen.test.js && node test/pathfinding.test.js && node test/leaderboard.test.js`) and verify zero failures; manually smoke-test the full v2 feature set per the quickstart: (a) timer ticks during play and freezes on win/lose, (b) win overlay shows elapsed time, (c) Infinite Mode escalates on win and records level on loss, (d) overlay difficulty selector changes mode between games, (e) name entry blocks save until 3 letters, names stored uppercase, (f) leaderboard persists after page reload, (g) Leaderboard button on start screen opens view and Back returns to start, (h) deploy.yml passes a lint/syntax check (`cat .github/workflows/deploy.yml`), (i) all four state transitions remain accessible by keyboard only

**Checkpoint**: All four test files pass with zero failures. Full v2 game playable: timer, HUD, Infinite Mode, overlay difficulty selector, name entry, leaderboard, and deploy workflow all functioning.

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

Phase 8 complete (T001–T061)
  ├── Phase 9  (US6 Timer: T062–T070)        ← extends game state + index.html inline script
  ├── Phase 10 (US8 Infinite: T071–T077)     ← extends DIFFICULTY + game state + inline script
  ├── Phase 11 (US7 Overlay Selector: T078–T080) ← extends win/lose HTML; requires Phase 7
  ├── Phase 12 (US9 Leaderboard: T081–T091)  ← new src/leaderboard.js + new test file + HTML
  ├── Phase 13 (US10 Name Entry: T092–T094)  ← requires Phase 12 (leaderboard helpers exist)
  ├── Phase 14 (US11 GitHub Pages: T095)     ← independent; file-only task
  └── Phase 15 (Integration: T096–T100)      ← requires all phases above complete
```

**Phases that can be implemented in parallel after T061**:
- Phase 9 (Timer), Phase 10 (Infinite), Phase 11 (Overlay Selector), Phase 14 (Deploy) are all independent of each other
- Phase 12 (Leaderboard tests T081–T088) can be written in parallel with Phases 9–11
- Phase 13 (Name Entry) requires Phase 12 leaderboard helpers to exist first
- Phase 15 must be the final phase

## Parallel Execution Examples

**After Phase 2 is complete, these batches can run in parallel**:

- Batch A: T016, T017, T018, T019, T020 (all test writing for US1 — different test cases in the same file)
- Batch B (after US1 wired): T028, T029, T030, T031, T032 (pathfinding test writing) + T042, T044, T045, T046 (mapgen test writing) + T047 (difficulty HTML)
- Batch C: T059, T060 (module audits — different files)

**After Phase 8 complete (v2 work), these batches can run in parallel**:

- Batch D: T062–T070 (Timer) + T071–T077 (Infinite) + T078–T080 (Overlay Selector) + T081–T088 (Leaderboard tests) + T095 (deploy.yml)
- Batch E (after T089 src/leaderboard.js exists): T092–T094 (Name Entry) + T096 (import wiring)
- Batch F: T097–T099 (test extensions + a11y + reduced-motion — different concerns)

## Implementation Strategy

**MVP (deliver and validate first)**: Complete Phases 1–3 (T001–T027). This gives a fully playable single-difficulty game with player movement, collision, and a win condition — independently testable and demoable.

**Increment 2**: Add Phases 4 (snail AI) + 5 (map generation tests). Completes the core challenge mechanic.

**Increment 3**: Add Phase 6 (difficulty selection) + Phase 7 (game states). Delivers the full spec with difficulty scaling, win/lose overlays, and restart.

**Increment 4 (v2 core)**: Add Phases 9–11 in parallel (Timer, Infinite Mode, Overlay Selector). Delivers the escalation loop and HUD.

**Increment 5 (v2 persistence)**: Add Phase 12 (Leaderboard) then Phase 13 (Name Entry). Delivers persistent records and the arcade input experience.

**Final**: Phase 14 (GitHub Pages) + Phase 15 (integration + full test pass). Constitution compliance, accessibility, and complete test suite passage.
