/**
 * src/ui.js
 *
 * Exports: showScreen(screenId), getSelectedDifficulty(), bindControls(handlers)
 *
 * Manages DOM overlay transitions and keyboard/button bindings.
 * Never calls Canvas API. Never calls game logic functions directly.
 */

// Guard against duplicate listener registration
let bound = false;

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Hides all screens/overlays, then shows the one matching screenId.
 *
 * @param {'start'|'win'|'lose'|'game'} screenId
 */
export function showScreen(screenId) {
  const screenStart  = document.getElementById('screen-start');
  const overlayWin   = document.getElementById('overlay-win');
  const overlayLose  = document.getElementById('overlay-lose');
  const gameArea     = document.getElementById('game-area');
  const statusEl     = document.getElementById('game-status');

  // Hide everything first
  screenStart.classList.add('hidden');
  overlayWin.classList.add('hidden');
  overlayLose.classList.add('hidden');

  switch (screenId) {
    case 'start':
      gameArea.classList.add('hidden');
      screenStart.classList.remove('hidden');
      if (statusEl) statusEl.textContent = 'Start screen shown. Choose difficulty and press Play.';
      break;

    case 'game':
      gameArea.classList.remove('hidden');
      if (statusEl) statusEl.textContent = 'Game started. Use arrow keys or WASD to move.';
      break;

    case 'win':
      gameArea.classList.remove('hidden');
      overlayWin.classList.remove('hidden');
      if (statusEl) statusEl.textContent = 'You won! Press New Game to play again.';
      break;

    case 'lose':
      gameArea.classList.remove('hidden');
      overlayLose.classList.remove('hidden');
      if (statusEl) statusEl.textContent = 'Game over. A snail caught you. Press Try Again.';
      break;
  }
}

/**
 * Reads the currently selected difficulty radio and returns the matching DifficultyConfig.
 * Difficulty configs are defined inline to avoid a circular dependency with game.js.
 *
 * @returns {{ name:string, cols:number, rows:number, snailCount:number }}
 */
export function getSelectedDifficulty() {
  const checked = document.querySelector('input[name="difficulty"]:checked');
  const value = checked ? checked.value : 'easy';

  // Inline config objects mirror DIFFICULTY.* from game.js (no circular import)
  const configs = {
    easy:   { name: 'Easy',   cols: 15, rows: 15, snailCount: 1 },
    medium: { name: 'Medium', cols: 20, rows: 20, snailCount: 2 },
    hard:   { name: 'Hard',   cols: 25, rows: 25, snailCount: 3 },
  };

  return configs[value] ?? configs.easy;
}

/**
 * Attaches all keyboard and button event listeners exactly once.
 * Subsequent calls are silently ignored (guarded by `bound`).
 *
 * @param {{
 *   onStart:   () => void,
 *   onKeyDown: (direction: string) => void,
 *   onRestart: () => void,
 * }} handlers
 */
export function bindControls(handlers) {
  if (bound) return;
  bound = true;

  // Start button
  document.getElementById('btn-start').addEventListener('click', () => {
    handlers.onStart();
  });

  // Restart buttons (win + lose overlays)
  document.getElementById('btn-restart-win').addEventListener('click', () => {
    handlers.onRestart();
  });
  document.getElementById('btn-restart-lose').addEventListener('click', () => {
    handlers.onRestart();
  });

  // Keyboard direction mapping
  const KEY_MAP = {
    ArrowUp:    'up',
    w:          'up',
    W:          'up',
    ArrowDown:  'down',
    s:          'down',
    S:          'down',
    ArrowLeft:  'left',
    a:          'left',
    A:          'left',
    ArrowRight: 'right',
    d:          'right',
    D:          'right',
  };

  document.addEventListener('keydown', (event) => {
    const direction = KEY_MAP[event.key];
    if (!direction) return;
    event.preventDefault();
    handlers.onKeyDown(direction);
  });
}
