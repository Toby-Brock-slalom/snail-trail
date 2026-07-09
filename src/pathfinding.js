/**
 * src/pathfinding.js
 *
 * Exports: findPath(grid, from, to)
 *
 * A* pathfinding with Manhattan distance heuristic.
 * No DOM or Canvas API calls. Pure computation.
 */

import { CELL } from './game.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Manhattan distance heuristic (admissible for cardinal-movement grids).
 * @param {{col:number,row:number}} a
 * @param {{col:number,row:number}} b
 * @returns {number}
 */
function heuristic(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

/**
 * Encodes a position as a string key for Sets/Maps.
 * @param {number} col
 * @param {number} row
 * @returns {string}
 */
function key(col, row) {
  return `${col},${row}`;
}

/**
 * Returns cardinal neighbours within grid bounds that are not walls.
 * @param {{ cols:number, rows:number, cells:Array<Array<{type:string}>> }} grid
 * @param {number} col
 * @param {number} row
 * @returns {Array<{col:number,row:number}>}
 */
function getPassableNeighbours(grid, col, row) {
  const candidates = [
    { col, row: row - 1 },
    { col, row: row + 1 },
    { col: col - 1, row },
    { col: col + 1, row },
  ];
  return candidates.filter(
    (n) =>
      n.row >= 0 &&
      n.row < grid.rows &&
      n.col >= 0 &&
      n.col < grid.cols &&
      grid.cells[n.row][n.col].type !== CELL.WALL
  );
}

/**
 * Reconstructs the path from cameFrom map.
 * @param {Map<string,{col:number,row:number}>} cameFrom
 * @param {{col:number,row:number}} current
 * @returns {Array<{col:number,row:number}>}
 */
function reconstructPath(cameFrom, current) {
  const path = [{ col: current.col, row: current.row }];
  let node = current;
  while (cameFrom.has(key(node.col, node.row))) {
    node = cameFrom.get(key(node.col, node.row));
    path.unshift({ col: node.col, row: node.row });
  }
  return path;
}

// ---------------------------------------------------------------------------
// Exported function
// ---------------------------------------------------------------------------

/**
 * Finds the shortest path from `from` to `to` using A* with Manhattan distance.
 *
 * @param {{ cols:number, rows:number, cells:Array<Array<{type:string}>> }} grid
 * @param {{col:number,row:number}} from - source position
 * @param {{col:number,row:number}} to   - target position
 * @returns {Array<{col:number,row:number}>|null}
 *   Ordered path inclusive of from and to, or null if unreachable.
 */
export function findPath(grid, from, to) {
  // If source or target is a wall, immediately return null
  if (grid.cells[from.row]?.[from.col]?.type === CELL.WALL) return null;
  if (grid.cells[to.row]?.[to.col]?.type === CELL.WALL) return null;

  // If already at destination
  if (from.col === to.col && from.row === to.row) {
    return [{ col: from.col, row: from.row }];
  }

  const openSet = []; // sorted ascending by fScore
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const startKey = key(from.col, from.row);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(from, to));
  openSet.push({ col: from.col, row: from.row, f: fScore.get(startKey) });

  while (openSet.length > 0) {
    // Pop the node with lowest fScore (openSet is sorted ascending)
    const current = openSet.shift();
    const currentKey = key(current.col, current.row);

    if (current.col === to.col && current.row === to.row) {
      return reconstructPath(cameFrom, current);
    }

    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);

    for (const neighbour of getPassableNeighbours(grid, current.col, current.row)) {
      const neighbourKey = key(neighbour.col, neighbour.row);
      if (closedSet.has(neighbourKey)) continue;

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(neighbourKey) ?? Infinity)) {
        cameFrom.set(neighbourKey, { col: current.col, row: current.row });
        gScore.set(neighbourKey, tentativeG);
        const f = tentativeG + heuristic(neighbour, to);
        fScore.set(neighbourKey, f);

        // Insertion-sort into openSet for O(n) insertion on small grids
        const entry = { col: neighbour.col, row: neighbour.row, f };
        let inserted = false;
        for (let index = 0; index < openSet.length; index++) {
          if (f < openSet[index].f) {
            openSet.splice(index, 0, entry);
            inserted = true;
            break;
          }
        }
        if (!inserted) openSet.push(entry);
      }
    }
  }

  return null; // No path found
}
