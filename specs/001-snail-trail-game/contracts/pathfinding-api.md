# Module Contract: `src/pathfinding.js`

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [../plan.md](../plan.md)

This module implements A* search with the Manhattan distance heuristic for cardinal-movement grids. It has **no dependency on the DOM, Canvas API, or any browser global**. The function is a pure computation that returns a path or `null`.

---

## Exported Functions

### `findPath(grid, from, to)`

Finds the shortest path from `from` to `to` on `grid` using A* search, avoiding wall cells.

**Parameters**:
- `grid` — `Grid` — the current game grid; used for bounds checking and wall detection
- `from` — `{ col: number, row: number }` — source position (typically a snail's position)
- `to` — `{ col: number, row: number }` — target position (typically the player's position)

**Returns**: `Cell[] | null`
- If a path exists: an ordered array of `{ col, row }` positions from `from` (inclusive) to `to` (inclusive). Minimum length is 2 (source and target are distinct adjacent cells); length is 1 only if `from === to` (snail is already on the player — handled by `checkEndConditions` before this is called).
- If no path exists (target is unreachable due to wall enclosure): returns `null`.

**Algorithm**:
```
openSet  = min-heap priority queue keyed by fScore (f = g + h)
closedSet = Set of "col,row" strings

h(node) = |node.col - to.col| + |node.row - to.row|   // Manhattan distance

Initialise:
  gScore[from] = 0
  fScore[from] = h(from)
  push from onto openSet

Loop while openSet is not empty:
  current = openSet.pop() (lowest fScore)
  if current === to: reconstruct path via cameFrom map; return path
  add current to closedSet
  for each cardinal neighbour of current (up, down, left, right):
    if neighbour is out of bounds: skip
    if neighbour is CELL.WALL: skip
    if neighbour is in closedSet: skip
    tentativeG = gScore[current] + 1
    if tentativeG < gScore[neighbour] (or neighbour not yet seen):
      cameFrom[neighbour] = current
      gScore[neighbour] = tentativeG
      fScore[neighbour] = tentativeG + h(neighbour)
      push neighbour onto openSet (or update priority if already present)

If openSet exhausted without reaching to: return null
```

**Implementation note on priority queue**: For grid sizes ≤ 625 cells (25×25), a sorted array (`Array.push` + `Array.sort` or insertion sort) is used for simplicity. Binary heap is not required — profiling at 25×25 confirms < 100 ms constraint is met with a sorted array.

**Heuristic admissibility**: Manhattan distance never overestimates actual path length on a cardinal-only grid. A* is therefore guaranteed to find the optimal (shortest) path.

**Performance contract**: Each `findPath` call must complete in < 100 ms for all supported grid sizes. Verified by benchmark test in `test/pathfinding.test.js`.

**Side effects**: None. `grid` is read but not mutated.

---

## Behavioural Contracts (tested in `test/pathfinding.test.js`)

| Scenario | Expected Result |
|----------|----------------|
| Direct adjacent path, no walls | Returns 2-cell path `[from, to]` |
| Path around a wall | Returns path that navigates around the wall |
| Target completely surrounded by walls | Returns `null` |
| Source completely surrounded by walls | Returns `null` |
| Source and target are the same cell | Returns `[from]` (length 1) |
| Large grid, optimal path | Returns shortest-length path (verified by expected step count) |
| Timing: 25×25 grid, worst-case call | Completes in < 100 ms |

---

## Internal (non-exported) Helpers

The following helpers must NOT be exported:

- `heuristic(a, b)` — Manhattan distance between two `{col, row}` positions
- `key(pos)` — returns `"col,row"` string key for Set/Map lookups
- `getCardinalNeighbours(grid, pos)` — returns up to 4 adjacent non-wall, in-bounds positions
- `reconstructPath(cameFrom, current)` — walks `cameFrom` map backwards to build ordered path array
