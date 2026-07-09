/**
 * test/pathfinding.test.js
 *
 * Tests for pathfinding.js — path correctness, wall avoidance, no-path cases, timing.
 * Runnable with: node test/pathfinding.test.js
 *
 * No external test framework. All helpers defined inline.
 */

// ---------------------------------------------------------------------------
// Inline test helpers
// ---------------------------------------------------------------------------

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `FAIL: ${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`
    );
  }
  console.log(`  PASS: ${message}`);
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(
      `FAIL: ${message}\n  Expected: ${e}\n  Actual:   ${a}`
    );
  }
  console.log(`  PASS: ${message}`);
}

/**
 * Benchmark helper — fails if fn() exceeds maxMs milliseconds.
 * @param {string} label
 * @param {() => void} fn
 * @param {number} maxMs
 */
function benchmark(label, fn, maxMs) {
  const start = performance.now();
  fn();
  const elapsed = performance.now() - start;
  if (elapsed > maxMs) {
    throw new Error(
      `FAIL: Benchmark "${label}" exceeded ${maxMs}ms — took ${elapsed.toFixed(2)}ms`
    );
  }
  console.log(`  PASS: Benchmark "${label}" completed in ${elapsed.toFixed(2)}ms (limit: ${maxMs}ms)`);
}

// ---------------------------------------------------------------------------
// Grid builder helpers
// ---------------------------------------------------------------------------

/**
 * Builds a simple open grid (all cells OPEN) of the given dimensions.
 */
function makeOpenGrid(CELL, cols, rows) {
  const cells = [];
  for (let row = 0; row < rows; row++) {
    const rowArr = [];
    for (let col = 0; col < cols; col++) {
      rowArr.push({ col, row, type: CELL.OPEN });
    }
    cells.push(rowArr);
  }
  return { cols, rows, cells };
}

/**
 * Builds a 7×7 grid with a wall barrier in the middle column (col=3),
 * except for a gap at row=5 — forcing the path to go around.
 *
 *   . . . W . . .
 *   . . . W . . .
 *   . . . W . . .
 *   . . . W . . .
 *   . . . W . . .
 *   . . . . . . .   ← gap at row 5, col 3
 *   . . . . . . .
 *
 * Player at (0,3), target at (6,3). Shortest path must go via the gap.
 */
function makeWallBarrierGrid(CELL) {
  const grid = makeOpenGrid(CELL, 7, 7);
  // Erect wall barrier at col=3, rows 0–4
  for (let row = 0; row <= 4; row++) {
    grid.cells[row][3].type = CELL.WALL;
  }
  return grid;
}

/**
 * Builds a 5×5 grid where the target at (3,3) is completely enclosed by walls.
 */
function makeEnclosedTargetGrid(CELL) {
  const grid = makeOpenGrid(CELL, 5, 5);
  // Surround (3,3) with walls
  grid.cells[2][3].type = CELL.WALL;
  grid.cells[4][3].type = CELL.WALL;
  grid.cells[3][2].type = CELL.WALL;
  grid.cells[3][4].type = CELL.WALL;
  return grid;
}

/**
 * Builds a 5×5 grid where the source at (1,1) is completely enclosed by walls.
 */
function makeEnclosedSourceGrid(CELL) {
  const grid = makeOpenGrid(CELL, 5, 5);
  // Surround (1,1) with walls
  grid.cells[0][1].type = CELL.WALL;
  grid.cells[2][1].type = CELL.WALL;
  grid.cells[1][0].type = CELL.WALL;
  grid.cells[1][2].type = CELL.WALL;
  return grid;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  const { findPath } = await import('../src/pathfinding.js').catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
  const { CELL } = await import('../src/game.js').catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });

  console.log('\n=== pathfinding.test.js ===\n');

  // T028: adjacent cells with no wall between them → 2-element path
  console.log('findPath — adjacent open cells returns 2-element path:');
  {
    const grid = makeOpenGrid(CELL, 5, 5);
    const from = { col: 1, row: 1 };
    const to   = { col: 2, row: 1 };
    const path = findPath(grid, from, to);
    assert(path !== null, 'path is not null');
    assertEqual(path.length, 2, 'path length is 2 for adjacent cells');
    assertDeepEqual(path[0], { col: 1, row: 1 }, 'path[0] is from');
    assertDeepEqual(path[1], { col: 2, row: 1 }, 'path[1] is to');
  }

  // T029: path navigates around a wall
  console.log('findPath — path navigates around a wall barrier:');
  {
    const grid = makeWallBarrierGrid(CELL);
    const from = { col: 0, row: 3 };
    const to   = { col: 6, row: 3 };
    const path = findPath(grid, from, to);
    assert(path !== null, 'path exists around wall barrier');
    assert(path.length > 2, `path length ${path.length} > 2 (must route around wall)`);
    const hasWall = path.some((pos) => grid.cells[pos.row][pos.col].type === CELL.WALL);
    assert(!hasWall, 'no cell in the path is a WALL');
    // Verify first and last cells are correct
    assertDeepEqual(path[0], { col: 0, row: 3 }, 'path starts at from');
    assertDeepEqual(path[path.length - 1], { col: 6, row: 3 }, 'path ends at to');
  }

  // T030: target completely enclosed → null
  console.log('findPath — target enclosed by walls returns null:');
  {
    const grid = makeEnclosedTargetGrid(CELL);
    const from = { col: 1, row: 1 };
    const to   = { col: 3, row: 3 };
    const path = findPath(grid, from, to);
    assert(path === null, 'path is null when target is enclosed by walls');
  }

  // T031: source completely enclosed → null
  console.log('findPath — source enclosed by walls returns null:');
  {
    const grid = makeEnclosedSourceGrid(CELL);
    const from = { col: 1, row: 1 };
    const to   = { col: 3, row: 3 };
    const path = findPath(grid, from, to);
    assert(path === null, 'path is null when source is enclosed by walls');
  }

  // T032: benchmark — worst-case 25×25 open grid < 100 ms
  console.log('findPath — benchmark worst-case 25×25 < 100ms:');
  {
    const grid = makeOpenGrid(CELL, 25, 25);
    benchmark(
      'findPath(25×25 open grid, corner to corner)',
      () => findPath(grid, { col: 0, row: 0 }, { col: 24, row: 24 }),
      100
    );
  }

  // Additional: same cell returns length-1 path
  console.log('findPath — same source and target returns length-1 path:');
  {
    const grid = makeOpenGrid(CELL, 5, 5);
    const pos = { col: 2, row: 2 };
    const path = findPath(grid, pos, pos);
    assert(path !== null, 'path is not null for same-cell call');
    assertEqual(path.length, 1, 'path length is 1 when from === to');
  }

  // Additional: optimal path on small open grid
  console.log('findPath — returns optimal (shortest) path on small grid:');
  {
    const grid = makeOpenGrid(CELL, 5, 5);
    // Manhattan distance from (0,0) to (4,4) is 8, so optimal path = 9 cells
    const path = findPath(grid, { col: 0, row: 0 }, { col: 4, row: 4 });
    assert(path !== null, 'path found on open 5×5 grid');
    assertEqual(path.length, 9, 'path length is optimal (9) for corner to corner on 5×5');
  }

  console.log('\nAll pathfinding tests passed.\n');
}

runTests().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
