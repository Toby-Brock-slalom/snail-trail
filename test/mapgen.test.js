/**
 * test/mapgen.test.js
 *
 * Tests for mapgen.js — solvability, wall/open ratio, layout uniqueness, timing.
 * Runnable with: node test/mapgen.test.js
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
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  const { generateMap } = await import('../src/mapgen.js').catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
  const { findPath, } = await import('../src/pathfinding.js').catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
  const { CELL } = await import('../src/game.js').catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });

  console.log('\n=== mapgen.test.js ===\n');

  // T042: exactly one START and one TREASURE
  console.log('generateMap — exactly one START and one TREASURE:');
  {
    const { grid } = generateMap(15, 15, 1);
    let startCount = 0;
    let treasureCount = 0;
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        if (grid.cells[row][col].type === CELL.START)    startCount++;
        if (grid.cells[row][col].type === CELL.TREASURE) treasureCount++;
      }
    }
    assertEqual(startCount,    1, 'exactly one START cell');
    assertEqual(treasureCount, 1, 'exactly one TREASURE cell');
  }

  // T043: solvability — findPath returns non-null for 10 maps
  console.log('generateMap — solvability guaranteed (10 maps):');
  {
    for (let i = 0; i < 10; i++) {
      const { grid, startCell, treasureCell } = generateMap(15, 15, 1);
      const path = findPath(grid, startCell, treasureCell);
      assert(path !== null, `map ${i + 1}/10 is solvable (findPath non-null)`);
      assert(path.length >= 2, `map ${i + 1}/10 path has at least 2 cells`);
    }
  }

  // T044: wall/open ratio between 20%–80% open
  console.log('generateMap — wall/open ratio between 20% and 80% open:');
  {
    const { grid } = generateMap(15, 15, 1);
    const total = grid.cols * grid.rows;
    let openCount = 0;
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const type = grid.cells[row][col].type;
        if (type === CELL.OPEN || type === CELL.START || type === CELL.TREASURE) {
          openCount++;
        }
      }
    }
    const ratio = openCount / total;
    assert(ratio >= 0.20, `open ratio ${(ratio * 100).toFixed(1)}% is at least 20%`);
    assert(ratio <= 0.80, `open ratio ${(ratio * 100).toFixed(1)}% is at most 80%`);
  }

  // T045: two successive maps are not identical
  console.log('generateMap — two successive maps differ:');
  {
    const mapA = generateMap(15, 15, 1);
    const mapB = generateMap(15, 15, 1);

    const sigA = mapA.grid.cells.flat().map((c) => c.type).join('');
    const sigB = mapB.grid.cells.flat().map((c) => c.type).join('');
    assert(sigA !== sigB, 'two successive 15×15 maps have different wall layouts');
  }

  // T046: benchmark — 25×25 in < 100 ms
  console.log('generateMap — benchmark 25×25 < 100ms:');
  benchmark('generateMap(25, 25, 3)', () => generateMap(25, 25, 3), 100);

  // Additional: snailStartCells count matches snailCount
  console.log('generateMap — snailStartCells has correct count:');
  {
    for (const [cols, rows, snailCount] of [[15,15,1],[20,20,2],[25,25,3]]) {
      const { snailStartCells } = generateMap(cols, rows, snailCount);
      assertEqual(snailStartCells.length, snailCount,
        `snailStartCells.length === ${snailCount} for ${cols}×${rows}`);
    }
  }

  console.log('\nAll mapgen tests passed.\n');
}

runTests().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
