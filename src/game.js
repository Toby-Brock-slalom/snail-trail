/**
 * src/game.js
 *
 * Exports (constants): CELL, PHASE, DIFFICULTY
 * Exports (functions):  createGameState, movePlayer, resolveSnailTurns, checkEndConditions
 *
 * This module is also the ES module entry point loaded by index.html.
 * It contains the game loop wiring at the bottom of the file.
 *
 * All exported functions are pure transformations — no DOM or Canvas API calls.
 * DOM wiring uses imported helpers from ui.js and renderer.js.
 */

import { generateMap } from './mapgen.js';
import { findPath }   from './pathfinding.js';
import { render }     from './renderer.js';
import { showScreen, bindControls, getSelectedDifficulty } from './ui.js';

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

export const CELL = Object.freeze({
  WALL:     'wall',
  OPEN:     'open',
  START:    'start',
  TREASURE: 'treasure',
});

export const PHASE = Object.freeze({
  START:   'start',
  PLAYING: 'playing',
  WIN:     'win',
  LOSE:    'lose',
});

export const DIFFICULTY = Object.freeze({
  EASY:     Object.freeze({ name: 'Easy',   cols: 15, rows: 15, snailCount: 1, mode: 'easy' }),
  MEDIUM:   Object.freeze({ name: 'Medium', cols: 20, rows: 20, snailCount: 2, mode: 'medium' }),
  HARD:     Object.freeze({ name: 'Hard',   cols: 25, rows: 25, snailCount: 3, mode: 'hard' }),
  INFINITE: Object.freeze({ mode: 'infinite' }),
});

export const INFINITE_BASE_SIZE  = 20;
export const INFINITE_SIZE_STEP  = 5;
export const INFINITE_BASE_SNAILS = 2;
export const HUD_INTERVAL_MS     = 100;

// ---------------------------------------------------------------------------
// Direction deltas
// ---------------------------------------------------------------------------

const DIRECTION_DELTA = Object.freeze({
  up:    { dcol:  0, drow: -1 },
  down:  { dcol:  0, drow:  1 },
  left:  { dcol: -1, drow:  0 },
  right: { dcol:  1, drow:  0 },
});

// ---------------------------------------------------------------------------
// Exported pure functions
// ---------------------------------------------------------------------------

/**
 * Creates a fresh GameState for the given difficulty.
 *
 * @param {{ name:string, cols:number, rows:number, snailCount:number }} difficulty
 * @returns {GameState}
 */
export function createGameState(difficulty) {
  let cols, rows, snailCount, mode, infiniteLevel;

  if (difficulty.mode === 'infinite') {
    infiniteLevel = difficulty.infiniteLevel ?? 0;
    cols  = INFINITE_BASE_SIZE + infiniteLevel * INFINITE_SIZE_STEP;
    rows  = cols;
    snailCount = INFINITE_BASE_SNAILS + infiniteLevel;
    mode  = 'infinite';
  } else {
    cols       = difficulty.cols;
    rows       = difficulty.rows;
    snailCount = difficulty.snailCount;
    mode       = difficulty.mode || (difficulty.name || 'easy').toLowerCase();
    infiniteLevel = 0;
  }

  const mapData = generateMap(cols, rows, snailCount);
  const { grid, startCell, treasureCell, snailStartCells } = mapData;

  const player = {
    col: startCell.col,
    row: startCell.row,
    stepCount: 0,
  };

  const snails = snailStartCells.map((cell, index) => ({
    id: index,
    col: cell.col,
    row: cell.row,
  }));

  return {
    phase: PHASE.PLAYING,
    difficulty,
    mode,
    infiniteLevel,
    grid,
    player,
    snails,
    treasureCell: { col: treasureCell.col, row: treasureCell.row },
    startTime:     performance.now(),
    finalElapsedMs: null,
  };
}

/**
 * Attempts to move the player one cell in the given direction.
 * Returns state unchanged if the move is blocked.
 *
 * @param {GameState} state
 * @param {'up'|'down'|'left'|'right'} direction
 * @returns {GameState}
 */
export function movePlayer(state, direction) {
  const { dcol, drow } = DIRECTION_DELTA[direction];
  const targetCol = state.player.col + dcol;
  const targetRow = state.player.row + drow;

  // Bounds check
  if (
    targetRow < 0 ||
    targetRow >= state.grid.rows ||
    targetCol < 0 ||
    targetCol >= state.grid.cols
  ) {
    return state;
  }

  // Wall check
  const targetCell = state.grid.cells[targetRow][targetCol];
  if (targetCell.type === CELL.WALL) {
    return state;
  }

  return {
    ...state,
    player: {
      col: targetCol,
      row: targetRow,
      stepCount: state.player.stepCount + 1,
    },
  };
}

/**
 * Moves each snail one step toward the player using A* pathfinding.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function resolveSnailTurns(state) {
  const updatedSnails = state.snails.map((snail) => {
    const path = findPath(
      state.grid,
      { col: snail.col, row: snail.row },
      { col: state.player.col, row: state.player.row }
    );
    if (path && path.length >= 2) {
      return { ...snail, col: path[1].col, row: path[1].row };
    }
    return snail;
  });

  return { ...state, snails: updatedSnails };
}

/**
 * Checks win/lose conditions and updates the game phase accordingly.
 * Returns state unchanged if already in a terminal phase.
 *
 * @param {GameState} state
 * @returns {GameState}
 */
export function checkEndConditions(state) {
  if (state.phase !== PHASE.PLAYING) return state;

  const now = performance.now();

  // Win: player reached the treasure
  if (
    state.player.col === state.treasureCell.col &&
    state.player.row === state.treasureCell.row
  ) {
    return { ...state, phase: PHASE.WIN, finalElapsedMs: now - state.startTime };
  }

  // Lose: any snail occupies the player's cell
  const caught = state.snails.some(
    (snail) => snail.col === state.player.col && snail.row === state.player.row
  );
  if (caught) {
    return { ...state, phase: PHASE.LOSE, finalElapsedMs: now - state.startTime };
  }

  return state;
}

// ---------------------------------------------------------------------------
// Game loop wiring (ES module entry point — browser only)
// Pure functions above this line are importable in Node.js for testing.
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  {
    const canvas = document.getElementById('game-canvas');
    let state = null;
    let isProcessing = false;

    function handleStart() {
      const difficulty = getSelectedDifficulty();
      state = createGameState(difficulty);
      isProcessing = false;
      showScreen('game');
      requestAnimationFrame(() => render(canvas, state));
    }

    function handleRestart() {
      isProcessing = false;
      handleStart();
    }

    function handleKeyDown(direction) {
      if (!state || state.phase !== PHASE.PLAYING) return;
      if (isProcessing) return;

      isProcessing = true;

      state = movePlayer(state, direction);

      // Snails move every 2 player steps
      if (state.player.stepCount % 2 === 0 && state.player.stepCount > 0) {
        state = resolveSnailTurns(state);
      }

      state = checkEndConditions(state);

      if (state.phase === PHASE.WIN) {
        showScreen('win');
      } else if (state.phase === PHASE.LOSE) {
        showScreen('lose');
      }

      requestAnimationFrame(() => {
        render(canvas, state);
        isProcessing = false;
      });
    }

    // Initialise UI
    showScreen('start');
    bindControls({
      onStart:   handleStart,
      onRestart: handleRestart,
      onKeyDown: handleKeyDown,
    });
  }
}
