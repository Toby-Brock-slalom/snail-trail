# Module Contract: `src/renderer.js`

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [../plan.md](../plan.md)

This module translates a `GameState` snapshot into Canvas 2D pixels. It **reads game state and draws — it never mutates any state object**. It depends on the browser Canvas API but has no dependency on game logic modules.

---

## Exported Functions

### `render(canvas, state)`

Clears the canvas and redraws the complete game scene from the current `GameState`.

**Parameters**:
- `canvas` — `HTMLCanvasElement` — the target canvas element; must already be present in the DOM
- `state` — `GameState` — the current (immutable) game state snapshot

**Returns**: `void`

**Rendering pipeline** (executed in this order):
1. Resize canvas dimensions if grid dimensions have changed (e.g., difficulty change between games).
2. Clear the canvas (`ctx.clearRect(0, 0, canvas.width, canvas.height)`).
3. Draw all cells by iterating `state.grid.cells[row][col]`:
   - `WALL` → filled dark-grey rectangle (`--color-wall`)
   - `OPEN` → filled light-grey rectangle (`--color-open`)
   - `START` → same as `OPEN` (start marker is implicit; no separate visual needed after game begins)
   - `TREASURE` → gold inset square with accent line (`--color-treasure`)
4. Draw all snails: for each snail in `state.snails`, draw an amber filled circle + clockwise arc (shell) centred on the snail's cell.
5. Draw the player: blue filled circle centred on the player's cell.
6. (Optional) If `state.phase === PHASE.WIN` or `PHASE.LOSE`, dim the canvas with a semi-transparent overlay before `ui.js` shows its HTML overlay. This is optional; `ui.js` may handle the overlay entirely.

**Invariants** (enforced by architecture — Constitution Principle VII):
- `render` does NOT call any function from `game.js`, `mapgen.js`, or `pathfinding.js`.
- `render` does NOT modify any field of `state`, `state.player`, `state.snails`, or `state.grid`.
- `render` does NOT register event listeners.
- All drawing calls use the Canvas 2D API only (`ctx.fillRect`, `ctx.arc`, `ctx.beginPath`, `ctx.fill`, etc.).

**Performance contract**: A complete render pass for a 25×25 grid (625 cells + 3 snails + 1 player) must complete well within one animation frame (~16 ms at 60 fps). Verified informally during playability check.

---

## Cell Sizing

Cell size in pixels is derived from the canvas element's CSS size and the grid dimensions:

```js
const cellWidth  = canvas.width  / state.grid.cols;
const cellHeight = canvas.height / state.grid.rows;
```

The canvas width/height is read from the element's `width`/`height` attributes (set by the renderer on initialisation based on the CSS-declared size of the `<canvas>` element). This ensures pixel-perfect alignment regardless of device pixel ratio adjustments.

---

## Visual Specification

| Element | Shape | Canvas Draw Method | Colour Token |
|---------|-------|--------------------|--------------|
| Open floor | Filled rect (full cell) | `fillRect` | `--color-open` |
| Wall | Filled rect (full cell) | `fillRect` | `--color-wall` |
| Treasure chest | Filled rect (80% cell) centred + horizontal accent line | `fillRect` + `fillRect` | `--color-treasure` |
| Player | Filled circle (radius 40% cell width) | `arc` + `fill` | `--color-player` |
| Snail body | Filled circle (radius 35% cell width) | `arc` + `fill` | `--color-snail` |
| Snail shell | Clockwise arc (radius 20% cell width, 270°) | `arc` + `stroke` | `--color-snail-shell` |

**Colour tokens** (read from CSS custom properties via `getComputedStyle` or defined as JS constants mirroring the CSS `:root` declaration):

```
--color-wall:         #2a2a2a  (dark grey)
--color-open:         #d4d4d4  (light grey)
--color-treasure:     #f0b429  (gold)
--color-player:       #3b82f6  (blue)
--color-snail:        #f97316  (amber/orange)
--color-snail-shell:  #7c2d12  (dark amber)
```

---

## Internal (non-exported) Helpers

The following helpers must NOT be exported:

- `drawCell(ctx, cell, cellWidth, cellHeight)` — draws a single cell based on type
- `drawPlayer(ctx, player, cellWidth, cellHeight)` — draws the player circle
- `drawSnail(ctx, snail, cellWidth, cellHeight)` — draws snail circle + shell arc
- `drawTreasure(ctx, cell, cellWidth, cellHeight)` — draws the treasure chest
- `getCellPixelOrigin(col, row, cellWidth, cellHeight)` — returns `{ x, y }` top-left pixel of a cell
