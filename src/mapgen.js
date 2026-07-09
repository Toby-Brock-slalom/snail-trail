/**
 * src/mapgen.js
 *
 * Exports: generateMap(cols, rows, snailCount)
 *
 * Generates a solvable maze using iterative DFS recursive backtracking.
 * All helpers are module-private (not exported).
 */

import { CELL } from './game.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Creates a cols × rows grid of Cell objects, indexed as cells[row][col].
 * @param {number} cols
 * @param {number} rows
 * @param {string} defaultType - a CELL.* value
 * @returns {{ cols: number, rows: number, cells: Array<Array<{col:number,row:number,type:string}>> }}
 */
function makeGrid(cols, rows, defaultType) {
  const cells = [];
  for (let row = 0; row < rows; row++) {
    const rowArr = [];
    for (let col = 0; col < cols; col++) {
      rowArr.push({ col, row, type: defaultType });
    }
    cells.push(rowArr);
  }
  return { cols, rows, cells };
}

/**
 * Fisher-Yates in-place shuffle.
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffle(array) {
  for (let index = array.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

/**
 * Returns wall neighbours exactly 2 steps away (N/S/E/W) that are still WALL.
 * @param {{ cols:number, rows:number, cells:Array<Array<{col:number,row:number,type:string}>> }} grid
 * @param {number} col
 * @param {number} row
 * @returns {Array<{col:number,row:number}>}
 */
function getNeighboursTwoAway(grid, col, row) {
  const candidates = [
    { col, row: row - 2 },
    { col, row: row + 2 },
    { col: col - 2, row },
    { col: col + 2, row },
  ];
  return candidates.filter(
    (n) =>
      n.row >= 0 &&
      n.row < grid.rows &&
      n.col >= 0 &&
      n.col < grid.cols &&
      grid.cells[n.row][n.col].type === CELL.WALL
  );
}

/**
 * Sets the intermediate cell (wall between) and the target cell to CELL.OPEN.
 * @param {{ cells:Array<Array<{type:string}>> }} grid
 * @param {number} fromCol
 * @param {number} fromRow
 * @param {number} toCol
 * @param {number} toRow
 */
function carveWall(grid, fromCol, fromRow, toCol, toRow) {
  const midCol = (fromCol + toCol) / 2;
  const midRow = (fromRow + toRow) / 2;
  grid.cells[midRow][midCol].type = CELL.OPEN;
  grid.cells[toRow][toCol].type = CELL.OPEN;
}

/**
 * Finds the first OPEN cell whose col is in [colMin, colMax) and row in [rowMin, rowMax).
 * Returns null if none found.
 * @param {{ cells:Array<Array<{col:number,row:number,type:string}>> }} grid
 * @param {[number,number]} colRange
 * @param {[number,number]} rowRange
 * @returns {{col:number,row:number,type:string}|null}
 */
function findOpenCellInQuadrant(grid, colRange, rowRange) {
  const [colMin, colMax] = colRange;
  const [rowMin, rowMax] = rowRange;
  for (let row = rowMin; row < rowMax; row++) {
    for (let col = colMin; col < colMax; col++) {
      const cell = grid.cells[row][col];
      if (cell.type === CELL.OPEN || cell.type === CELL.START) {
        return cell;
      }
    }
  }
  return null;
}

/**
 * Finds the LAST OPEN cell in the given quadrant (bottom-right priority).
 * @param {{ cells:Array<Array<{col:number,row:number,type:string}>> }} grid
 * @param {[number,number]} colRange
 * @param {[number,number]} rowRange
 * @returns {{col:number,row:number,type:string}|null}
 */
function findLastOpenCellInQuadrant(grid, colRange, rowRange) {
  const [colMin, colMax] = colRange;
  const [rowMin, rowMax] = rowRange;
  let found = null;
  for (let row = rowMin; row < rowMax; row++) {
    for (let col = colMin; col < colMax; col++) {
      const cell = grid.cells[row][col];
      if (cell.type === CELL.OPEN) {
        found = cell;
      }
    }
  }
  return found;
}

/**
 * Removes `count` randomly chosen interior wall cells that border ≥ 2 open cells.
 * Creates maze cycles so the layout isn't a pure tree.
 * @param {{ cols:number, rows:number, cells:Array<Array<{col:number,row:number,type:string}>> }} grid
 * @param {number} count
 */
function removeRandomWalls(grid, count) {
  const candidates = [];
  for (let row = 1; row < grid.rows - 1; row++) {
    for (let col = 1; col < grid.cols - 1; col++) {
      if (grid.cells[row][col].type !== CELL.WALL) continue;
      const neighbours = [
        grid.cells[row - 1]?.[col],
        grid.cells[row + 1]?.[col],
        grid.cells[row][col - 1],
        grid.cells[row][col + 1],
      ].filter((c) => c && c.type === CELL.OPEN);
      if (neighbours.length >= 2) {
        candidates.push({ col, row });
      }
    }
  }
  shuffle(candidates);
  const toRemove = Math.min(count, candidates.length);
  for (let index = 0; index < toRemove; index++) {
    const { col, row } = candidates[index];
    grid.cells[row][col].type = CELL.OPEN;
  }
}

// ---------------------------------------------------------------------------
// Exported function
// ---------------------------------------------------------------------------

/**
 * Generates a solvable maze using iterative DFS recursive backtracking.
 *
 * @param {number} cols - Grid width
 * @param {number} rows - Grid height
 * @param {number} snailCount - Number of snail start positions to select
 * @returns {{
 *   grid: { cols:number, rows:number, cells:Array<Array<{col:number,row:number,type:string}>> },
 *   startCell: {col:number,row:number,type:string},
 *   treasureCell: {col:number,row:number,type:string},
 *   snailStartCells: Array<{col:number,row:number,type:string}>
 * }}
 */
export function generateMap(cols, rows, snailCount) {
  // 1. Initialise all cells as WALL
  const grid = makeGrid(cols, rows, CELL.WALL);

  // 2. Iterative DFS from (1,1)
  grid.cells[1][1].type = CELL.OPEN;
  const stack = [{ col: 1, row: 1 }];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const unvisited = getNeighboursTwoAway(grid, current.col, current.row);
    if (unvisited.length === 0) {
      stack.pop();
    } else {
      shuffle(unvisited);
      const chosen = unvisited[0];
      carveWall(grid, current.col, current.row, chosen.col, chosen.row);
      stack.push(chosen);
    }
  }

  // 3. Create additional openings for variety
  const extraOpenings = Math.floor(cols * rows * 0.04);
  removeRandomWalls(grid, extraOpenings);

  // 4. Place START in top-left quadrant
  const startCell = findOpenCellInQuadrant(
    grid,
    [1, Math.ceil(cols / 2)],
    [1, Math.ceil(rows / 2)]
  );
  if (startCell) {
    startCell.type = CELL.START;
  }

  // 5. Place TREASURE in bottom-right quadrant
  const treasureCell = findLastOpenCellInQuadrant(
    grid,
    [Math.floor(cols / 2), cols - 1],
    [Math.floor(rows / 2), rows - 1]
  );
  if (treasureCell) {
    treasureCell.type = CELL.TREASURE;
  }

  // 6. Select snail start cells (random OPEN cells, not start or treasure)
  const openCells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid.cells[row][col];
      if (cell.type === CELL.OPEN) {
        openCells.push(cell);
      }
    }
  }
  shuffle(openCells);
  const snailStartCells = openCells.slice(0, snailCount);

  return { grid, startCell, treasureCell, snailStartCells };
}
