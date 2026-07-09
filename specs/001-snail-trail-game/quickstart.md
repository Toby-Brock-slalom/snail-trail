# Quickstart & Validation Guide: Snail Trail Game

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [plan.md](plan.md)

This document describes how to open, play, and validate the game end-to-end. It is the reference for the Playability Check and Keyboard-Only Playthrough quality gates defined in the constitution.

---

## Prerequisites

**To play the game**:
- Any modern desktop browser: Chrome, Firefox, Safari, or Edge (current stable release)
- No server, no npm, no installation required

**To run the logic tests**:
- Node.js 18 or later (for ES module support via `--experimental-vm-modules` or native `node:test`)
- No npm install required; tests use only built-in Node APIs

---

## Opening the Game

1. Download or clone the repository to your local machine.
2. Navigate to the repository root folder.
3. Open `index.html` in your browser:
   - **macOS**: double-click `index.html` in Finder, or run `open index.html` in Terminal
   - **Windows**: double-click `index.html` in Explorer, or run `start index.html` in PowerShell
   - **Linux**: run `xdg-open index.html` in a terminal

> **Note**: The game uses ES modules (`<script type="module">`). All module specifiers are relative paths (`./src/mapgen.js`), so the game works from `file://` in all major browsers. No local server is required.

The start screen should appear immediately.

---

## Running the Tests

```bash
# From the repository root:
node test/game.test.js
node test/mapgen.test.js
node test/pathfinding.test.js
```

Each test file prints `PASS` or `FAIL` lines to stdout, followed by a summary. A non-zero exit code indicates at least one test failure.

**Expected output (all passing)**:
```
PASS  movePlayer: blocks wall entry
PASS  movePlayer: blocks out-of-bounds move
PASS  movePlayer: increments stepCount on success
PASS  resolveSnailTurns: snail moves toward player
PASS  resolveSnailTurns: snail stays when no path
PASS  checkEndConditions: win when player on treasure
PASS  checkEndConditions: lose when snail on player
...
All tests passed (N/N)
```

---

## End-to-End Validation Scenarios

The following scenarios map directly to the User Stories in [spec.md](spec.md) and to the quality gates in the constitution.

### Scenario 1 — Start Screen and Difficulty Selection (US-1, US-4, US-5)

**Steps**:
1. Open `index.html` in a browser.
2. Verify the start screen is visible with a title, three difficulty radio buttons (Easy / Medium / Hard), and a Play button.
3. Select "Medium".
4. Click the Play button.

**Expected outcome**:
- The start screen disappears.
- A 20×20 grid appears on the canvas with the player (blue circle) visible and 2 snails (amber circles) placed elsewhere on the grid.
- A treasure chest (gold square) is visible somewhere on the map.

---

### Scenario 2 — Player Movement and Wall Collision (US-1)

**Steps** (with keyboard only — no mouse after clicking Play):
1. Start a game (any difficulty).
2. Press the right arrow key several times.
3. Navigate toward a wall cell (observe the grid; walls are dark grey filled cells).
4. Press the key that would move the player into a wall.

**Expected outcome**:
- Each valid arrow key press moves the player exactly one cell in that direction.
- When a key press would move the player into a wall, the player stays in place; the grid is unchanged.
- No movement occurs on key presses that would go out of bounds.

---

### Scenario 3 — Snail Pursuit (US-2)

**Steps**:
1. Start a game on Easy (1 snail).
2. Observe the snail's starting position.
3. Press an arrow key twice (two valid player moves).
4. Observe the snail's position.
5. Press two more arrow keys.

**Expected outcome**:
- After every 2 player moves, the snail moves exactly one step.
- The snail's path visibly trends toward the player, navigating around walls.

---

### Scenario 4 — Win Condition (US-1, US-5)

**Steps**:
1. Start a game on Easy.
2. Navigate the player to the gold square (treasure chest).

**Expected outcome**:
- Immediately upon stepping onto the treasure cell, a win overlay appears on screen.
- The overlay contains a congratulatory message and a Play Again button.
- No page reload occurs.

---

### Scenario 5 — Lose Condition (US-2, US-5)

**Steps**:
1. Start a game on Easy.
2. Move back and forth in place (two moves that cancel each other: right, left) repeatedly until the snail catches up.

**Expected outcome**:
- When the snail occupies the same cell as the player, a lose overlay immediately appears.
- The overlay contains a loss message and a Try Again button.
- No page reload occurs.

---

### Scenario 6 — Restart Without Page Reload (US-1, US-5)

**Steps**:
1. Win or lose a game.
2. Click the Play Again / Try Again button on the overlay.

**Expected outcome**:
- A new map is generated and displayed immediately.
- The overlay disappears.
- The player is reset to the start position.
- Snails are placed at new starting positions.
- The browser URL and page title do not change; the page was not reloaded.

---

### Scenario 7 — Map Randomness and Solvability (US-3)

**Steps** (manual spot check; automated in `test/mapgen.test.js`):
1. Start 5 games in a row.
2. Observe the wall layout of each map.

**Expected outcome**:
- Each map looks visually distinct from the others.
- Every map contains a mix of wall clusters and open corridor areas (not a completely open grid, not a single straight corridor).
- The automated test suite verifies 100% solvability across 100 generated maps per grid size.

---

### Scenario 8 — Keyboard-Only Playthrough (Constitution Gate 5)

**Steps**:
1. Open `index.html`.
2. Use only the Tab key and Enter/Space to select a difficulty and start the game (do not use the mouse).
3. Use only arrow keys or WASD to play through to a win or lose state.
4. Use only Tab + Enter/Space to activate the restart button.

**Expected outcome**:
- The full game loop (start → play → win/lose → restart) is completable without touching the mouse.
- Focus indicators are visible on all interactive UI elements (buttons, radio inputs).

---

### Scenario 9 — Visual Distinction (Constitution Gate 6 — Greyscale Check)

**Steps**:
1. Open `index.html` and start a game.
2. Apply greyscale display filter (macOS: Accessibility > Display > Colour Filters > Greyscale; or browser devtools CSS filter).

**Expected outcome**:
- The player (circle), snails (circle + shell arc), treasure (inset square), walls (dark fill), and open floor (lighter fill) are still distinguishable from each other.
- No two element types are visually identical in greyscale.

---

## Performance Benchmarks (verified by test suite)

| Operation | Target | Test File |
|-----------|--------|-----------|
| `generateMap(15, 15)` | < 100 ms | `test/mapgen.test.js` |
| `generateMap(20, 20)` | < 100 ms | `test/mapgen.test.js` |
| `generateMap(25, 25)` | < 100 ms | `test/mapgen.test.js` |
| `findPath` on 25×25 grid (worst case) | < 100 ms | `test/pathfinding.test.js` |

Run `node test/mapgen.test.js` and `node test/pathfinding.test.js` to verify these thresholds pass on your machine.
