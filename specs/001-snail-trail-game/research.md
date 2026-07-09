# Research: Snail Trail Game — Algorithm & Design Decisions

**Phase**: 0 | **Date**: 2026-07-09 | **Plan**: [plan.md](plan.md)

All technical decisions for this feature were provided in the user's brief. This document records each decision with its rationale and the alternatives that were evaluated.

---

## Decision 1 — Rendering: HTML5 Canvas 2D API

**Decision**: Use the Canvas 2D API (`CanvasRenderingContext2D`) for all game rendering.

**Rationale**: Canvas gives full pixel-level control of the game grid with a single `<canvas>` element, making it straightforward to draw cells, circles, and squares at exact pixel positions. It integrates natively with `requestAnimationFrame` and requires no DOM element per cell — which simplifies both rendering logic and the module boundary between game state and display.

**Alternatives considered**:
- **CSS Grid + DOM elements**: Natural fit for a grid layout, but requires manipulating hundreds of DOM nodes on each render tick. Harder to draw arbitrary shapes (circles for player/snails) without SVG or Canvas anyway. Creates tight coupling between rendering and DOM structure.
- **SVG**: Vector shapes are easy, but SVG DOM manipulation at 15×15–25×25 scale is unnecessarily heavyweight for this use case.
- **WebGL**: Overkill for a 2D tile game; adds significant complexity without benefit at this scale.

---

## Decision 2 — Map Generation: Randomised DFS (Recursive Backtracking)

**Decision**: Generate the maze using randomised depth-first search with a visited-cell stack (iterative implementation to avoid call-stack overflow on large grids).

**Algorithm outline**:
1. Initialise all cells as `WALL`.
2. Choose a start cell; mark it `OPEN`; push to stack.
3. While stack is non-empty:
   a. Peek the current cell.
   b. Collect all unvisited grid neighbours **two steps away** (N/S/E/W) that are still walls.
   c. If neighbours exist: pick one at random, carve the wall cell between current and chosen neighbour to `OPEN`, mark chosen cell `OPEN`, push chosen cell to stack.
   d. If no neighbours: pop current cell from stack (backtrack).
4. Place `START` and `TREASURE` cells at positions guaranteed to be `OPEN` (e.g., top-left region and bottom-right region of the maze, snapped to the nearest open cell).
5. Place snail start cells on randomly selected `OPEN` cells not equal to `START` or `TREASURE`.

**Solvability guarantee**: DFS on a grid carves a spanning tree of open cells — every open cell is reachable from every other open cell. The path from `START` to `TREASURE` is guaranteed to exist because both cells are open and part of the same spanning tree.

**"Interesting corridor structure"**: Pure DFS mazes are "perfect mazes" (exactly one path between any two cells — no loops). To introduce junctions and open areas, after generation a configurable number of random wall cells that border two or more open cells are removed. This creates cycles, making the maze more explorable and less linear. The solvability guarantee is unaffected (extra open cells only add routes).

**Rationale**: DFS recursive backtracking is the simplest correct algorithm for this requirement. It is O(rows × cols) in time and space, easily understood, and produces mazes with long winding corridors well-suited to snail pursuit gameplay.

**Alternatives considered**:
- **Prim's algorithm**: Produces mazes with shorter dead ends and more branching — slightly less dramatic corridor feel.
- **Recursive division**: Produces mazes with longer straight passages and clear room-like regions. More complex to implement correctly.
- **Cellular automaton (cave generation)**: Does not guarantee solvability without a separate flood-fill pass. Produces open-cave aesthetics, not corridor mazes.
- **Pre-designed static maps**: Fails FR-002/FR-004 (randomisation requirement) and eliminates replayability.

---

## Decision 3 — Pathfinding: A* with Manhattan Distance Heuristic

**Decision**: Each snail computes its next move using A* search with the Manhattan distance heuristic: `h(n) = |n.col - goal.col| + |n.row - goal.row|`.

**Why A* over BFS**:
- BFS (Dijkstra on unweighted grid) guarantees the shortest path but explores cells in all directions equally.
- A* with an admissible, consistent heuristic (Manhattan distance on a grid with cardinal movement) is guaranteed to find the optimal path and explores significantly fewer cells in practice, keeping per-call time well within the 100 ms budget even on 25×25 grids.
- The heuristic is admissible because Manhattan distance never overestimates actual distance (no diagonal movement is permitted).

**Implementation details**:
- Open set: a priority queue (min-heap by f-score) implemented as a sorted array for small grid sizes. At 625 cells (25×25) a simple sorted-insert array outperforms a binary heap in practice due to cache locality.
- g-score: number of steps from snail position.
- f-score: g + h.
- Closed set: a `Set` of `"col,row"` string keys for O(1) membership testing.
- Returns: ordered array of `{ col, row }` cells from source to target (inclusive), or `null` if no path exists.
- The snail reads `path[1]` (the next step) and moves there; the full path is discarded after each snail turn (recomputed on the next snail tick using the player's updated position).

**Rationale**: A* is the industry-standard algorithm for game pathfinding on grids. It is correct, efficient, well-understood, and produces optimal routes. The Manhattan heuristic is ideal for cardinal-movement grids.

**Alternatives considered**:
- **BFS**: Correct but less efficient. Acceptable for 25×25 but A* is strictly better and equally simple to implement.
- **Dijkstra's**: Equivalent to BFS on an unweighted grid.
- **Greedy best-first**: Not guaranteed to find the shortest path; snails would take suboptimal routes.
- **Pre-computed flow fields**: Overkill; adds state complexity; not beneficial for 1–3 snails on small grids.

---

## Decision 4 — Game Loop: Event-Driven State Updates + requestAnimationFrame Render

**Decision**: Game state updates are synchronous and triggered by keyboard events (`keydown`). After each update, a single `requestAnimationFrame` call schedules a render pass. There is no continuous rAF animation loop between player inputs.

**Turn sequence**:
1. Player presses a key → `keydown` handler fires.
2. `movePlayer(state, direction)` is called synchronously → returns new state with updated player position and incremented step count.
3. `checkEndConditions(state)` is called → detects win (player on treasure) or immediate snail collision.
4. If step count is a multiple of 2 → `resolveSnailTurns(state)` is called → each snail calls `findPath` and advances one cell; collision is re-checked.
5. Dirty flag set → `requestAnimationFrame(renderFrame)` scheduled.
6. `render(canvas, state)` fires on the next paint opportunity → canvas cleared and redrawn from state.

**Why not a continuous rAF loop**: Turn-based gameplay produces discrete state snapshots — there is nothing to interpolate between turns. A continuous loop wastes CPU cycles and introduces the risk of processing multiple state updates per frame. Event-driven updates + on-demand rAF is simpler and correct.

**Key debounce**: A `isProcessing` flag is set during each turn resolution and cleared after `requestAnimationFrame` fires. This prevents queuing multiple state updates from held keys or rapid presses. One keypress produces exactly one state change.

**Rationale**: This is the simplest correct model for turn-based browser games. No game framework or complex state machine is required.

---

## Decision 5 — Testing: Plain JavaScript Helpers (No Test Framework)

**Decision**: Each test file defines a minimal set of inline helper functions (`assert`, `assertEqual`, `assertThrows`) and runs tests synchronously on `import`. Output is written to `console.log` / `console.error`. Tests are runnable with `node test/game.test.js`.

**Rationale**: The constitution (Principle V) prohibits npm runtime dependencies. A test framework (Jest, Vitest, Mocha) would require `node_modules` even as a dev dependency — acceptable per the constitution, but adds setup friction for a bootcamp demo. Plain helpers produce equally readable output with zero friction: open a terminal, type `node test/pathfinding.test.js`, see pass/fail.

**Benchmark assertions**: `mapgen.test.js` and `pathfinding.test.js` include timing assertions using `performance.now()` to enforce the 100 ms thresholds required by Principle IV. These are included in the same plain-JS style.

**Alternatives considered**:
- **Node built-in `node:test` + `assert`**: Excellent option; slightly more setup but produces TAP-compatible output. Could be adopted in a future iteration without changing any logic module.
- **Vitest (non-browser environment)**: Idiomatic for ES modules; adds `node_modules`. Acceptable per constitution but adds friction to the bootcamp demo context.
- **Browser-based test runner**: Violates the constitution requirement that tests be runnable without a browser.

---

## Decision 6 — Visual Design: Pixel-Art-Inspired High Contrast

**Decision**: Render the game using solid filled shapes on a dark background, styled as pixel-art-inspired cells:

| Element | Shape | Primary Colour | Distinguishing Feature |
|---------|-------|---------------|------------------------|
| Open floor | Filled rectangle | Light grey (`--color-open`) | Background fill, no border |
| Wall | Filled rectangle | Dark grey (`--color-wall`) | Darker fill, slightly inset shadow |
| Player | Filled circle | Blue (`--color-player`) | Circle centred in cell |
| Snail | Filled circle + arc | Amber/orange (`--color-snail`) | Circle + clockwise arc (shell indicator) |
| Treasure chest | Filled square + accent | Gold (`--color-treasure`) | Smaller square inset with accent line |

**Shape-over-colour**: Each element uses a distinct shape, ensuring elements remain distinguishable in greyscale (satisfying Constitution Principle VI's visual distinction requirement).

**CSS custom properties**: All colours, cell size, and animation durations are declared as CSS custom properties on `:root` so they can be adjusted without touching JavaScript.

**Rationale**: Simple filled shapes are fast to render on Canvas, require no external image assets, look clean at any cell size, and make the codebase easy to walk through in a bootcamp context.

---

## Decision 7 — Difficulty Configuration

**Decision**: Three difficulty levels, each defined as a named constant object:

| Level | Constant | Grid | Snail Count |
|-------|----------|------|-------------|
| Easy | `DIFFICULTY.EASY` | 15 × 15 | 1 |
| Medium | `DIFFICULTY.MEDIUM` | 20 × 20 | 2 |
| Hard | `DIFFICULTY.HARD` | 25 × 25 | 3 |

**Rationale**: These values satisfy FR-017 (at least two difficulty levels with distinct snail counts / grid sizes). The cell counts (225, 400, 625) are well within the performance budget for both DFS generation and A* pathfinding. Hard (25×25, 3 snails) requires three A* calls per snail turn — 3 × < 100 ms = < 300 ms total, still imperceptible as a turn-based game processes this synchronously.

**Extensibility**: Adding a fourth difficulty is a one-line constant addition; no other code changes required.
