# Module Contract: `src/game.js`

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [../plan.md](../plan.md)

This module owns all core game-rule logic. It has **no dependency on the DOM, Canvas API, or any browser global**. Every exported function is a pure transformation: it takes a `GameState` (and optional arguments) and returns a new `GameState`. No in-place mutation.

---

## Exported Constants

### `CELL`

```js
export const CELL = Object.freeze({
  WALL:     'wall',
  OPEN:     'open',
  START:    'start',
  TREASURE: 'treasure',
});
```

### `PHASE`

```js
export const PHASE = Object.freeze({
  START:   'start',
  PLAYING: 'playing',
  WIN:     'win',
  LOSE:    'lose',
});
```

### `DIFFICULTY`

```js
export const DIFFICULTY = Object.freeze({
  EASY:   { name: 'Easy',   cols: 15, rows: 15, snailCount: 1 },
  MEDIUM: { name: 'Medium', cols: 20, rows: 20, snailCount: 2 },
  HARD:   { name: 'Hard',   cols: 25, rows: 25, snailCount: 3 },
});
```

---

## Exported Functions

### `createGameState(difficulty)`

Initialises a new game for the given difficulty.

**Parameters**:
- `difficulty` — `DifficultyConfig` — one of `DIFFICULTY.EASY`, `DIFFICULTY.MEDIUM`, `DIFFICULTY.HARD`

**Returns**: `GameState`
- `phase`: `PHASE.PLAYING`
- `difficulty`: the supplied config
- `grid`: result of `generateMap(difficulty.cols, difficulty.rows)`
- `player`: `{ col: startCell.col, row: startCell.row, stepCount: 0 }`
- `snails`: array of `difficulty.snailCount` snail objects placed at the generated `snailStartCells`

**Side effects**: None. Calls `generateMap` (from `mapgen.js`) internally.

**Precondition**: `difficulty` is one of the three defined `DifficultyConfig` values.

---

### `movePlayer(state, direction)`

Attempts to move the player one cell in the given direction.

**Parameters**:
- `state` — `GameState` — current game state; must have `phase === PHASE.PLAYING`
- `direction` — `Direction` — one of `'up'`, `'down'`, `'left'`, `'right'`

**Returns**: `GameState`
- If the target cell is within bounds and not a wall: returns new state with updated player position and `stepCount` incremented by 1.
- If the target cell is out of bounds or is a wall: returns state unchanged (same object reference acceptable).

**Invariants**:
- `player.stepCount` increments by exactly 1 on a successful move.
- `player.stepCount` does not change on a blocked move.
- Snail positions are not modified by this function.

---

### `resolveSnailTurns(state)`

Moves each snail one step toward the player using A* pathfinding.

**Parameters**:
- `state` — `GameState` — current game state

**Returns**: `GameState` with updated `snails` positions.

**Per-snail logic**:
1. Call `findPath(state.grid, snailPosition, playerPosition)` (from `pathfinding.js`).
2. If `path` is non-null and has length ≥ 2: move snail to `path[1]`.
3. If `path` is null or has length < 2: snail does not move.

**Invariants**:
- Each snail moves at most one cell per call.
- Snails do not move through wall cells.
- Snails may share the same destination cell (no snail-snail collision).
- Player position is not modified by this function.

---

### `checkEndConditions(state)`

Checks whether the current state is a win or loss and updates `phase` accordingly.

**Parameters**:
- `state` — `GameState`

**Returns**: `GameState`
- If `player` is on the `treasure` cell: returns state with `phase === PHASE.WIN`.
- If any snail shares the player's cell: returns state with `phase === PHASE.LOSE`.
- Otherwise: returns state unchanged.

**Evaluation order**: Win is checked before lose. (If a snail is also on the treasure cell when the player reaches it, the win condition takes precedence.)

**Invariants**:
- Only `phase` may change. No positions are modified.
- If the current `phase` is already `WIN` or `LOSE`, this function returns the state unchanged.

---

## Internal (non-exported) Helpers

The following helpers must NOT be exported. They are implementation details of the module:

- `cellAt(grid, col, row)` — returns the `Cell` at `(col, row)` or `null` if out of bounds
- `isPassable(cell)` — returns `true` if `cell.type !== CELL.WALL`
- `samePosition(a, b)` — returns `true` if `a.col === b.col && a.row === b.row`
