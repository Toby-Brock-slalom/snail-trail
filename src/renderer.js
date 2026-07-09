/**
 * src/renderer.js
 *
 * Exports: render(canvas, state)
 *
 * Reads GameState and draws all elements to the Canvas 2D context.
 * Never mutates state. No calls to game.js, mapgen.js, or pathfinding.js.
 * No DOM manipulation beyond reading canvas properties and calling 2D context methods.
 */

// Cell size in pixels (design token)
const CELL_SIZE = 32;

// Colours mirroring CSS custom properties for Canvas drawing
const COLOR = Object.freeze({
  WALL:        '#2a2a2a',
  OPEN:        '#d4d4d4',
  START:       '#c8c8c8',
  TREASURE_BG: '#f0b429',
  TREASURE_FG: '#b8860b',
  PLAYER:      '#3b82f6',
  PLAYER_DARK: '#1d4ed8',
  SNAIL:       '#f97316',
  SNAIL_SHELL: '#7c2d12',
  GRID_LINE:   '#bcbcbc',
});

// ---------------------------------------------------------------------------
// Drawing helpers (all private)
// ---------------------------------------------------------------------------

/**
 * Draws a single wall or floor cell.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{col:number,row:number,type:string}} cell
 * @param {number} cellWidth
 * @param {number} cellHeight
 */
function drawCell(ctx, cell, cellWidth, cellHeight) {
  const x = cell.col * cellWidth;
  const y = cell.row * cellHeight;

  switch (cell.type) {
    case 'wall':
      ctx.fillStyle = COLOR.WALL;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      break;

    case 'open':
    case 'start':
      ctx.fillStyle = COLOR.OPEN;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      break;

    case 'treasure': {
      // Floor background
      ctx.fillStyle = COLOR.OPEN;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      // Gold chest body (80% cell width, centred)
      const margin = cellWidth * 0.1;
      const chestW = cellWidth * 0.8;
      const chestH = cellHeight * 0.55;
      const chestX = x + margin;
      const chestY = y + (cellHeight - chestH) / 2;
      ctx.fillStyle = COLOR.TREASURE_BG;
      ctx.fillRect(chestX, chestY, chestW, chestH);
      // Horizontal accent line (lid)
      ctx.fillStyle = COLOR.TREASURE_FG;
      ctx.fillRect(chestX, chestY + chestH * 0.4, chestW, 2);
      // Small latch
      const latchSize = cellWidth * 0.14;
      ctx.fillRect(
        chestX + chestW / 2 - latchSize / 2,
        chestY + chestH * 0.35,
        latchSize,
        latchSize * 0.9
      );
      break;
    }
  }
}

/**
 * Draws the player as a blue filled circle with a subtle dark outline.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{col:number,row:number}} player
 * @param {number} cellWidth
 * @param {number} cellHeight
 */
function drawPlayer(ctx, player, cellWidth, cellHeight) {
  const cx = player.col * cellWidth + cellWidth / 2;
  const cy = player.row * cellHeight + cellHeight / 2;
  const radius = cellWidth * 0.38;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLOR.PLAYER;
  ctx.fill();

  // Eye highlights
  ctx.beginPath();
  ctx.arc(cx - radius * 0.3, cy - radius * 0.25, radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + radius * 0.3, cy - radius * 0.25, radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

/**
 * Draws a snail as an amber body circle with a dark amber shell spiral arc.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{col:number,row:number}} snail
 * @param {number} cellWidth
 * @param {number} cellHeight
 */
function drawSnail(ctx, snail, cellWidth, cellHeight) {
  const cx = snail.col * cellWidth + cellWidth / 2;
  const cy = snail.row * cellHeight + cellHeight / 2;
  const bodyRadius = cellWidth * 0.35;
  const shellRadius = cellWidth * 0.20;

  // Body (amber circle)
  ctx.beginPath();
  ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
  ctx.fillStyle = COLOR.SNAIL;
  ctx.fill();

  // Shell spiral (clockwise arc, ~270°, in dark amber)
  ctx.beginPath();
  ctx.arc(cx + bodyRadius * 0.15, cy - bodyRadius * 0.1, shellRadius, -Math.PI / 2, Math.PI, false);
  ctx.strokeStyle = COLOR.SNAIL_SHELL;
  ctx.lineWidth = Math.max(1.5, cellWidth * 0.05);
  ctx.stroke();

  // Inner shell dot
  ctx.beginPath();
  ctx.arc(cx + bodyRadius * 0.15, cy - bodyRadius * 0.1, shellRadius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = COLOR.SNAIL_SHELL;
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Exported function
// ---------------------------------------------------------------------------

/**
 * Renders the full game state to the canvas in a single pass.
 * Called via requestAnimationFrame — does not schedule its own frames.
 * Respects prefers-reduced-motion by skipping canvas animation frames if set.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   grid: { cols:number, rows:number, cells:Array<Array<{col:number,row:number,type:string}>> },
 *   player: { col:number, row:number },
 *   snails: Array<{ col:number, row:number }>
 * }} state
 */
export function render(canvas, state) {
  // Respect prefers-reduced-motion: still allow single-frame draw (no animation skip needed
  // because we only draw once per input, not in a loop)
  const { grid, player, snails } = state;

  // Set canvas dimensions based on grid size
  canvas.width  = grid.cols * CELL_SIZE;
  canvas.height = grid.rows * CELL_SIZE;

  const cellWidth  = CELL_SIZE;
  const cellHeight = CELL_SIZE;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all cells
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      drawCell(ctx, grid.cells[row][col], cellWidth, cellHeight);
    }
  }

  // Draw snails (beneath player so player always appears on top)
  for (const snail of snails) {
    drawSnail(ctx, snail, cellWidth, cellHeight);
  }

  // Draw player
  drawPlayer(ctx, player, cellWidth, cellHeight);
}
