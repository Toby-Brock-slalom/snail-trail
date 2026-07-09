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
| `generateMap(70, 70)` (Infinite ~Level 10) | < 100 ms | `test/mapgen.test.js` |
| `generateMap(120, 120)` (Infinite ~Level 20) | < 100 ms | `test/mapgen.test.js` |
| `findPath` on 25×25 grid (worst case) | < 100 ms | `test/pathfinding.test.js` |
| `findPath` on 120×120 grid (Infinite worst case) | < 100 ms | `test/pathfinding.test.js` |

Run `node test/mapgen.test.js` and `node test/pathfinding.test.js` to verify these thresholds pass on your machine.

---

## v2 Validation Scenarios

### Scenario 10 — Level Timer Display (US-6, FR-021–FR-023)

**Prerequisites**: Open `index.html` in a browser.

**Steps**:
1. Start a game (any difficulty).
2. Observe the HUD bar above the canvas.
3. Wait approximately 10 seconds.
4. Win or lose the game.
5. Inspect the win/lose overlay.

**Expected outcome**:
- The HUD timer (left side) shows a live count in `S.ms` format (e.g. `"10.34s"`) updating approximately every 100 ms during play.
- On win, the final elapsed time is displayed on the win overlay.
- The timer stops updating after win/lose (HUD value freezes).
- On starting a new game, the timer resets to `"0.00s"`.

**Automated**: `test/game.test.js` — "timer freezes on win/lose", "timer resets on new game", SC-009 mock-clock assertion.

---

### Scenario 11 — Infinite Mode Level Progression (US-8, FR-026–FR-030)

**Prerequisites**: Open `index.html` in a browser.

**Steps**:
1. Select Infinite Mode on the start screen.
2. Start the game; verify HUD shows "Level 1" and the grid is approximately 20×20.
3. Navigate to the treasure chest to win Level 1.
4. Observe the next level beginning automatically.
5. Verify HUD shows "Level 2" and the grid is visibly 5 cells wider and taller (25×25).
6. Count the snails — should be 3 (one more than Level 1).
7. Deliberately lose on Level 2 (let a snail catch you).
8. Verify the result overlay shows "Highest Level: 2" (or equivalent).

**Expected outcome**:
- Level 1: 20×20 grid, 2 snails, HUD shows "Level 1".
- Level 2: 25×25 grid, 3 snails, HUD shows "Level 2".
- On loss: overlay shows highest level reached in that run.
- On starting a new Infinite run: begins fresh at Level 1.

**Automated**: `test/game.test.js` — "infinite level increments on win", "grid size scales by formula", "snail count scales by formula".

---

### Scenario 12 — Leaderboard Persistence (US-9, FR-031–FR-035)

**Prerequisites**: Open `index.html` in a browser. Ensure localStorage is accessible.

**Steps**:
1. Play an Easy game and win (set a time).
2. When name entry appears, enter "ABC" and save.
3. Verify "ABC" appears in the on-screen win overlay or subsequent leaderboard view.
4. Close the browser tab completely.
5. Reopen `index.html`.
6. Click the Leaderboard button on the start screen.
7. Verify "ABC" still appears in the Easy category with the correct value and date.

**Expected outcome**:
- Leaderboard opens from start screen without starting a game.
- Easy category shows "ABC" with the recorded time and date.
- Closing and reopening the browser preserves the entry.

**Automated**: `test/leaderboard.test.js` — "round-trip localStorage write/read", "sort ascending for timed categories", "entry persists across reloads".

---

### Scenario 13 — Name Entry UX (US-10, FR-036–FR-039)

**Prerequisites**: Achieve a new record on any standard difficulty or reach a new highest Infinite level.

**Steps**:
1. Trigger a new record (first game always qualifies for an empty leaderboard).
2. Verify the name entry overlay appears with "NEW RECORD!" heading and three empty character boxes.
3. Press the `1` key — nothing should appear in the boxes (digit ignored).
4. Press `a` — "A" appears in box 1 (converted to uppercase).
5. Press `B` — "B" appears in box 2.
6. Verify the Save button is disabled (only 2 of 3 letters entered).
7. Press Enter — nothing happens (disabled).
8. Press `Z` — "Z" appears in box 3.
9. Verify the Save button is now enabled.
10. Press Enter — record saved; win/lose overlay shown; leaderboard updated.

**Expected outcome**:
- Non-alpha keys silently ignored.
- Input displayed uppercase.
- Save disabled until exactly 3 letters; enabled at exactly 3.
- After save, win/lose overlay is shown immediately.
- Leaderboard contains "ABZ" with the correct value.

**Automated**: `test/leaderboard.test.js` — "name validation accepts only A-Z", "name stored in uppercase", "save blocked with < 3 letters".

---

### Scenario 14 — In-Overlay Difficulty Change (US-7, FR-024–FR-025)

**Prerequisites**: Complete a game on Easy.

**Steps**:
1. On the win or lose overlay, locate the difficulty radio group (Easy / Medium / Hard / Infinite).
2. Verify Easy is pre-selected (matching the game just played).
3. Select Hard using the keyboard (Tab to the radio group, arrow keys to Hard).
4. Click or press Enter on "New Game".
5. Verify the new game starts with Hard settings (25×25 grid, 3 snails).

**Expected outcome**:
- Win/lose overlay contains all four difficulty options.
- Default selection matches the mode of the game that just ended.
- Selecting a new mode and clicking New Game applies that mode immediately.
- No page reload required.

---

### Scenario 15 — GitHub Actions Workflow Inspection (US-11, FR-040)

**Prerequisites**: Repository cloned or accessed via GitHub.

**Steps**:
1. Open `.github/workflows/deploy.yml` in a text editor or on GitHub.
2. Verify trigger: `on: push: branches: [main]`.
3. Verify actions: `actions/configure-pages`, `actions/upload-pages-artifact` with `path: '.'`, `actions/deploy-pages`.
4. Verify permissions: `contents: read`, `pages: write`, `id-token: write`.
5. Verify no `npm install`, `npm run build`, or any shell build commands are present.
6. Push a commit to `main` and verify the Actions tab shows a successful deployment.

**Expected outcome**:
- Workflow file contains no build steps.
- Entire repository root is uploaded as the Pages artifact.
- Deployment succeeds and the game is reachable at the GitHub Pages URL.
