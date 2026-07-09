# Module Contract: `src/mapgen.js`

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [../plan.md](../plan.md)

This module generates procedural maze maps using a randomised depth-first search (iterative recursive backtracking) algorithm. It has **no dependency on the DOM, Canvas API, or any browser global**. Output is a plain data object ready for use by `game.js` and `renderer.js`.

---

## Exported Functions

### `generateMap(cols, rows)`

Generates a fully formed game map.

**Parameters**:
- `cols` — `number` (positive integer) — grid width in cells
- `rows` — `number` (positive integer) — grid height in cells

**Returns**: `MapData`

```js
{
  grid: {
    cols: number,
    rows: number,
    cells: Cell[][],   // indexed as cells[row][col]
  },
  startCell:       Cell,   // type === 'start'
  treasureCell:    Cell,   // type === 'treasure'
  snailStartCells: Cell[], // length === snailCount (passed separately to createGameState)
}
```

**Algorithm** (iterative DFS / recursive backtracking):
1. Create a `cols × rows` grid with all cells initialised to `CELL.WALL`.
2. Select the origin cell `(1, 1)` (or the nearest valid odd-indexed cell). Mark it `CELL.OPEN`.
3. Push origin onto the stack.
4. While the stack is non-empty:
   a. Current cell = stack top.
   b. Find all grid neighbours exactly 2 steps away (N/S/E/W) that are still `CELL.WALL`.
   c. If neighbours exist: choose one at random; carve both the wall between them and the neighbour to `CELL.OPEN`; push neighbour to stack.
   d. If no neighbours: pop current from stack.
5. After DFS: remove a small number of random interior wall cells that separate two or more open cells, creating cycles. This adds loops and open junctions to the otherwise perfect maze.
6. Assign `startCell`: the first `CELL.OPEN` cell in the top-left quadrant of the grid. Set its `type` to `CELL.START`.
7. Assign `treasureCell`: the last `CELL.OPEN` cell in the bottom-right quadrant. Set its `type` to `CELL.TREASURE`.
8. Select `snailCount` random open cells (not `startCell`, not `treasureCell`, chosen without replacement) as snail starting positions. Return them in `snailStartCells`.

**Guarantees**:
- Every `CELL.OPEN` cell is reachable from `startCell` (spanning tree guarantee of DFS).
- A path from `startCell` to `treasureCell` always exists (both are open and connected).
- Exactly one `CELL.START` and one `CELL.TREASURE` cell exist in the returned grid.
- No snail starting cell equals `startCell` or `treasureCell`.
- All cells outside the maze border are `CELL.WALL`.

**Performance contract**: Must complete in < 100 ms for any of the three supported grid sizes (15×15, 20×20, 25×25) on a mid-range laptop. Verified by benchmark test in `test/mapgen.test.js`.

**Side effects**: Uses `Math.random()` — output is non-deterministic. Seeded random is not required for v1.

---

## Internal (non-exported) Helpers

The following helpers must NOT be exported:

- `makeGrid(cols, rows, defaultType)` — creates a 2D array of `Cell` objects
- `getNeighboursTwoAway(grid, col, row)` — returns unvisited wall neighbours 2 steps away
- `carveWall(grid, fromCol, fromRow, toCol, toRow)` — sets the intermediate and target cell to `CELL.OPEN`
- `shuffle(array)` — Fisher-Yates in-place shuffle using `Math.random()`
- `findOpenCellInQuadrant(grid, colRange, rowRange)` — finds first open cell within given column/row ranges
- `removeRandomWalls(grid, count)` — removes `count` random interior wall cells to create cycles
