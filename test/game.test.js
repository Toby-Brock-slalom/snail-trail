/**
 * test/game.test.js
 *
 * Tests for game.js — movement, collision, win/lose resolution, snail turn triggering.
 * Runnable with: node test/game.test.js
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

// ---------------------------------------------------------------------------
// Minimal stubs for testing pure functions without a DOM
// ---------------------------------------------------------------------------

// We import game logic via dynamic import at the bottom (Node.js ESM)
// to avoid browser-specific imports (renderer, ui) crashing Node.

// ---------------------------------------------------------------------------
// Build a minimal test GameState
// ---------------------------------------------------------------------------

/**
 * Creates a minimal 5×5 test grid:
 *
 *   W W W W W
 *   W S O O W    S=start(1,1), O=open, T=treasure(3,3)
 *   W O W O W
 *   W O O T W
 *   W W W W W
 *
 * @param {object} CELL - CELL constant from game.js
 */
function buildTestGrid(CELL) {
  const cells = [];
  for (let row = 0; row < 5; row++) {
    const rowArr = [];
    for (let col = 0; col < 5; col++) {
      rowArr.push({ col, row, type: CELL.WALL });
    }
    cells.push(rowArr);
  }
  // Carve corridors
  const open = [
    [1,1],[2,1],[3,1],  // row 1
    [1,2],[3,2],        // row 2 (col 2 stays wall)
    [1,3],[2,3],[3,3],  // row 3
  ];
  for (const [col, row] of open) {
    cells[row][col].type = CELL.OPEN;
  }
  cells[1][1].type = CELL.START;
  cells[3][3].type = CELL.TREASURE;
  return { cols: 5, rows: 5, cells };
}

function buildTestState(CELL, PHASE) {
  const grid = buildTestGrid(CELL);
  return {
    phase: PHASE.PLAYING,
    difficulty: { name: 'Easy', cols: 5, rows: 5, snailCount: 1 },
    grid,
    player: { col: 1, row: 1, stepCount: 0 },
    snails: [],
    treasureCell: { col: 3, row: 3 },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  // Import game module (ES module in Node)
  // We use a shim so we can test the pure functions without browser globals
  const { CELL, PHASE, movePlayer, checkEndConditions, resolveSnailTurns } =
    await import('../src/game.js').catch((err) => {
      // If import fails due to browser globals (canvas element missing),
      // patch minimal stubs and re-throw useful message
      console.error('Import failed — ensure running in Node 18+:', err.message);
      process.exit(1);
    });

  console.log('\n=== game.test.js ===\n');

  // --- movePlayer ---

  console.log('movePlayer — successful move:');
  {
    const state = buildTestState(CELL, PHASE);
    // Move right: (1,1) → (2,1), both OPEN/START
    const next = movePlayer(state, 'right');
    assertEqual(next.player.col, 2, 'player col updated to 2');
    assertEqual(next.player.row, 1, 'player row unchanged at 1');
    assertEqual(next.player.stepCount, 1, 'stepCount incremented to 1');
  }

  console.log('movePlayer — blocked by wall:');
  {
    const state = buildTestState(CELL, PHASE);
    // Move up from (1,1): row 0 is wall
    const next = movePlayer(state, 'up');
    assertEqual(next.player.col, 1, 'player col unchanged');
    assertEqual(next.player.row, 1, 'player row unchanged');
    assertEqual(next.player.stepCount, 0, 'stepCount unchanged on blocked move');
    assert(next === state || JSON.stringify(next.player) === JSON.stringify(state.player),
      'state reference or player unchanged on blocked move');
  }

  console.log('movePlayer — blocked by out-of-bounds:');
  {
    const state = { ...buildTestState(CELL, PHASE), player: { col: 0, row: 0, stepCount: 0 } };
    const next = movePlayer(state, 'up');
    assertEqual(next.player.row, 0, 'row unchanged when out of bounds');
    assertEqual(next.player.stepCount, 0, 'stepCount unchanged when out of bounds');
  }

  console.log('movePlayer — stepCount increments only on success:');
  {
    const state = buildTestState(CELL, PHASE);
    const afterMove    = movePlayer(state, 'right'); // success → stepCount 1
    const afterBlocked = movePlayer(afterMove, 'up'); // blocked (row 0 wall) → stepCount stays 1
    assertEqual(afterMove.player.stepCount, 1, 'stepCount is 1 after successful move');
    assertEqual(afterBlocked.player.stepCount, 1, 'stepCount does not change on blocked move');
  }

  // --- checkEndConditions ---

  console.log('checkEndConditions — WIN when player on treasure:');
  {
    const state = buildTestState(CELL, PHASE);
    const winning = { ...state, player: { col: 3, row: 3, stepCount: 10 } };
    const next = checkEndConditions(winning);
    assertEqual(next.phase, PHASE.WIN, 'phase becomes WIN when player on treasure');
  }

  console.log('checkEndConditions — LOSE when snail on player:');
  {
    const state = buildTestState(CELL, PHASE);
    const losing = {
      ...state,
      snails: [{ id: 0, col: state.player.col, row: state.player.row }],
    };
    const next = checkEndConditions(losing);
    assertEqual(next.phase, PHASE.LOSE, 'phase becomes LOSE when snail on player');
  }

  console.log('checkEndConditions — no change when not on treasure or snail:');
  {
    const state = buildTestState(CELL, PHASE);
    const next = checkEndConditions(state);
    assertEqual(next.phase, PHASE.PLAYING, 'phase stays PLAYING when no end condition');
  }

  // --- resolveSnailTurns ---

  console.log('resolveSnailTurns — snail moves one step closer to player:');
  {
    const state = buildTestState(CELL, PHASE);
    // Snail at (3,1), player at (1,1). Grid row 1 is open (1,1)→(3,1).
    // A* should route snail from (3,1) toward (1,1): next step = (2,1)
    const withSnail = { ...state, snails: [{ id: 0, col: 3, row: 1 }] };
    const next = resolveSnailTurns(withSnail);
    const snail = next.snails[0];
    assert(
      snail.col === 2 && snail.row === 1,
      `snail moved one step toward player: got (${snail.col},${snail.row}), expected (2,1)`
    );
  }

  console.log('resolveSnailTurns — snail stays when enclosed by walls:');
  {
    const state = buildTestState(CELL, PHASE);
    // Manually place snail in the wall area at (2,2) which in our grid IS a wall cell
    // We'll build a state where snail is surrounded by walls by using col=2, row=2
    // (which is WALL in our test grid). For the test we force it into an isolated pocket.
    // Simplest: create a tiny 3x3 all-wall grid with snail at centre
    const tinyGrid = {
      cols: 3,
      rows: 3,
      cells: [
        [{ col:0, row:0, type: CELL.WALL }, { col:1, row:0, type: CELL.WALL }, { col:2, row:0, type: CELL.WALL }],
        [{ col:0, row:1, type: CELL.WALL }, { col:1, row:1, type: CELL.OPEN }, { col:2, row:1, type: CELL.WALL }],
        [{ col:0, row:2, type: CELL.WALL }, { col:1, row:2, type: CELL.WALL }, { col:2, row:2, type: CELL.WALL }],
      ],
    };
    // Snail at (1,1) enclosed — player also at (1,1) would be instant lose.
    // Put player at (0,0) which is a wall to test null-path case
    const enclosed = {
      ...state,
      grid: tinyGrid,
      player: { col: 0, row: 0, stepCount: 0 },
      snails: [{ id: 0, col: 1, row: 1 }],
    };
    const next = resolveSnailTurns(enclosed);
    assertEqual(next.snails[0].col, 1, 'enclosed snail col unchanged');
    assertEqual(next.snails[0].row, 1, 'enclosed snail row unchanged');
  }

  console.log('\nAll game tests passed.\n');
}

runTests().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
