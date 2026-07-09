# Data Model: Snail Trail Game

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [plan.md](plan.md)

---

## Enumerations

### `CellType` (string union)

```
'wall'     — impassable; blocks player and snail movement
'open'     — passable floor cell
'start'    — passable; player's initial position (rendered as open floor after game begins)
'treasure' — passable; win condition cell
```

Exactly one `start` cell and exactly one `treasure` cell must exist per generated map.

### `GamePhase` (string union)

```
'start'    — pre-game; start screen is visible; no game state has been initialised
'playing'  — active game; input is processed; snail turns are triggered
'win'      — player reached the treasure chest; win overlay is displayed
'lose'     — a snail occupies the player's cell; lose overlay is displayed
```

### `Direction` (string union)

```
'up'    — row decreases by 1
'down'  — row increases by 1
'left'  — col decreases by 1
'right' — col increases by 1
```

---

## Entities

### `Cell`

A single tile on the grid.

| Field | Type | Description |
|-------|------|-------------|
| `col` | `number` (integer ≥ 0) | Column index, 0-based, left to right |
| `row` | `number` (integer ≥ 0) | Row index, 0-based, top to bottom |
| `type` | `CellType` | One of `'wall'`, `'open'`, `'start'`, `'treasure'` |

**Validation rules**:
- `0 ≤ col < grid.cols`
- `0 ≤ row < grid.rows`
- `type` must be one of the four valid `CellType` values

---

### `Grid`

The 2D array of cells representing the map.

| Field | Type | Description |
|-------|------|-------------|
| `cols` | `number` (integer ≥ 1) | Number of columns |
| `rows` | `number` (integer ≥ 1) | Number of rows |
| `cells` | `Cell[][]` | 2D array indexed as `cells[row][col]` |

**Validation rules**:
- `cells.length === rows`
- `cells[r].length === cols` for every row `r`
- Exactly one cell has `type === 'start'`
- Exactly one cell has `type === 'treasure'`
- The `start` cell and `treasure` cell are not the same cell
- A valid path from `start` to `treasure` must exist through non-wall cells (guaranteed by DFS generation)

**Accessor convention**: `grid.cells[row][col]` — row-major order. This matches the Canvas Y-axis (row 0 = top).

---

### `Player`

The user-controlled entity.

| Field | Type | Description |
|-------|------|-------------|
| `col` | `number` (integer ≥ 0) | Current column |
| `row` | `number` (integer ≥ 0) | Current row |
| `stepCount` | `number` (integer ≥ 0) | Cumulative number of successful moves taken this game |

**Validation rules**:
- Player position must be within grid bounds
- Player position must not be a `wall` cell
- `stepCount` increments by exactly 1 on each successful move; it does not increment when movement is blocked

**Snail trigger rule**: Snail turns resolve when `stepCount % 2 === 0 && stepCount > 0` (i.e., on every even step after the game begins). This means: after the player's 2nd step, 4th step, 6th step, etc.

---

### `Snail`

An AI-controlled enemy.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` (integer ≥ 0) | Unique identifier within the current game |
| `col` | `number` (integer ≥ 0) | Current column |
| `row` | `number` (integer ≥ 0) | Current row |

**Validation rules**:
- Snail position must be within grid bounds
- Snail position must not be a `wall` cell
- Initial placement must not be the `start` cell or the `treasure` cell
- Multiple snails may occupy the same cell (no snail-snail collision)
- Snails do not block each other's pathfinding

**Movement rule**: On each snail turn, each snail independently calls `findPath(grid, snailPos, playerPos)`. If a path is returned, the snail moves to `path[1]` (one step toward the player). If `null` is returned (no reachable path), the snail does not move.

---

### `DifficultyConfig`

A named configuration bundle for a difficulty level.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name shown on the start screen (e.g., `'Easy'`) |
| `cols` | `number` (integer, odd recommended) | Grid width in cells |
| `rows` | `number` (integer, odd recommended) | Grid height in cells |
| `snailCount` | `number` (integer ≥ 1) | Number of snails placed on the map |

**The three defined configurations**:

| Level | `name` | `cols` | `rows` | `snailCount` |
|-------|--------|--------|--------|--------------|
| Easy | `'Easy'` | `15` | `15` | `1` |
| Medium | `'Medium'` | `20` | `20` | `2` |
| Hard | `'Hard'` | `25` | `25` | `3` |

**Note on odd dimensions**: The DFS backtracking algorithm carves passages between cells two steps apart, producing a maze where only odd-indexed cells (both row and col) are candidate open cells. Using odd grid dimensions (15, 25) ensures the outermost walls are consistent. 20×20 is even but the algorithm still produces a valid maze; a 1-cell border of walls is enforced.

---

### `MapData`

The output of `generateMap` before it is merged into `GameState`.

| Field | Type | Description |
|-------|------|-------------|
| `grid` | `Grid` | Fully generated grid |
| `startCell` | `Cell` | The single `start` cell |
| `treasureCell` | `Cell` | The single `treasure` cell |
| `snailStartCells` | `Cell[]` | Array of `snailCount` starting cells for snails |

---

### `GameState`

The single authoritative record of all runtime game data. Treated as an immutable snapshot — every state-modifying function returns a new `GameState` rather than mutating in place.

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `GamePhase` | Current phase of the game |
| `difficulty` | `DifficultyConfig` | The difficulty configuration for the current game |
| `grid` | `Grid` | The current map |
| `player` | `Player` | Current player state |
| `snails` | `Snail[]` | Array of all snails; length equals `difficulty.snailCount` |

**Immutability convention**: Functions in `game.js` return a new `GameState` object with updated fields using spread/copy patterns — they do not mutate the existing state object. The renderer receives the latest state snapshot and draws from it.

---

## State Machine

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   [ start ] ──── user clicks Start ──────────────────► [ playing ]  │
│                                                              │        │
│   [ playing ] ◄── user clicks Restart ──────── [ win ] ◄──┤        │
│                                                              │        │
│   [ playing ] ◄── user clicks Restart ────── [ lose ] ◄──┤        │
│                                                              │        │
│   [ playing ] ── player steps on treasure ──► [ win ]       │        │
│   [ playing ] ── snail reaches player ──────► [ lose ]              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Transition rules

| From | Event | To | Side Effects |
|------|-------|----|--------------|
| `start` | Start button clicked, difficulty selected | `playing` | `createGameState(difficulty)` called; new `GameState` returned; canvas rendered |
| `playing` | Player moves onto treasure cell | `win` | Win overlay shown via `ui.js`; input handler disabled |
| `playing` | Any snail occupies player's cell after turn resolves | `lose` | Lose overlay shown via `ui.js`; input handler disabled |
| `win` | Restart button clicked | `playing` | `createGameState(difficulty)` called; new map generated; overlays hidden |
| `lose` | Restart button clicked | `playing` | `createGameState(difficulty)` called; new map generated; overlays hidden |

**Note**: Restart from `win` or `lose` regenerates the map with the same difficulty that was active when the game ended. To change difficulty, the user returns to the `start` screen — which requires a page reload in v1 (the start screen is only shown on initial load). A future enhancement could expose a "Change Difficulty" option from the overlay.

---

## Validation Rules Summary (from FR-*)

| Rule | Source | Enforcement Location |
|------|--------|----------------------|
| Player cannot enter wall cells | FR-006 | `movePlayer` in `game.js` |
| Player cannot move out of grid bounds | FR-006 | `movePlayer` in `game.js` |
| Every generated map has a valid path from start to treasure | FR-003 | DFS spanning tree guarantee in `mapgen.js`; verified in `mapgen.test.js` |
| Snails navigate around walls (not through them) | FR-009 | A* wall-avoidance in `pathfinding.js` |
| Snails that cannot reach the player stay in place | FR-010 | Null-path guard in `resolveSnailTurns` in `game.js` |
| Win triggered when player steps on treasure cell | FR-012 | `checkEndConditions` in `game.js` |
| Lose triggered when any snail shares the player's cell | FR-011 | `checkEndConditions` in `game.js` |
| Map must contain exactly one start and one treasure | FR-002 | Enforced by `generateMap` in `mapgen.js` |
| Grid must contain wall clusters, not just corridors | FR-004 | Wall-removal step post-DFS in `mapgen.js` produces cycles while retaining clusters |
