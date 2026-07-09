# Module Contract: `src/ui.js`

**Phase**: 1 | **Date**: 2026-07-09 | **Plan**: [../plan.md](../plan.md)

This module manages all DOM elements outside the canvas: the start screen, win overlay, lose overlay, difficulty selection, and all interactive buttons. It **does not interact with game logic or the canvas renderer** — it only manages HTML element visibility and registers event listeners on behalf of the caller.

---

## Exported Functions

### `showScreen(screenId)`

Shows one named screen/overlay and hides all others.

**Parameters**:
- `screenId` — `'start' | 'win' | 'lose' | 'game'` — the screen to make visible

**Returns**: `void`

**Screens**:
| `screenId` | Element shown | Elements hidden |
|------------|--------------|-----------------|
| `'start'` | `#screen-start` | `#overlay-win`, `#overlay-lose` |
| `'win'` | `#overlay-win` | `#screen-start`, `#overlay-lose` |
| `'lose'` | `#overlay-lose` | `#screen-start`, `#overlay-win` |
| `'game'` | None (canvas is always visible) | `#screen-start`, `#overlay-win`, `#overlay-lose` |

**Implementation**: uses CSS class toggling (`hidden` class or `display: none`) rather than inline style manipulation. The canvas element is always in the DOM and visible — overlays are positioned above it.

---

### `getSelectedDifficulty()`

Reads the currently selected difficulty from the start screen UI.

**Parameters**: None.

**Returns**: `DifficultyConfig` — one of `DIFFICULTY.EASY`, `DIFFICULTY.MEDIUM`, `DIFFICULTY.HARD`.

**Implementation**: Reads the value of the selected `<input type="radio" name="difficulty">` element and maps it to the corresponding `DIFFICULTY` constant (imported from `game.js`).

---

### `bindControls(handlers)`

Registers all event listeners for game controls. Called once during application initialisation.

**Parameters**:
- `handlers` — `object` with the following optional callback properties:

| Property | Type | Triggered By |
|----------|------|-------------|
| `onStart` | `() => void` | Start/Play button click on `#screen-start` |
| `onRestart` | `() => void` | Restart button click on `#overlay-win` or `#overlay-lose` |
| `onKeyDown` | `(direction: Direction) => void` | Arrow key or WASD `keydown` event on `document`; only fires for valid movement keys; non-movement keys are ignored |

**Returns**: `void`

**Key mapping**:
| Key | `direction` value |
|-----|-----------------|
| `ArrowUp` / `w` / `W` | `'up'` |
| `ArrowDown` / `s` / `S` | `'down'` |
| `ArrowLeft` / `a` / `A` | `'left'` |
| `ArrowRight` / `d` / `D` | `'right'` |

**Invariants**:
- `onKeyDown` is only fired when the current game phase is `PHASE.PLAYING`. The keydown handler reads the current phase from a shared state reference passed at bind time or via closure — it does not trigger movement in `win`, `lose`, or `start` phases.
- Arrow key `keydown` events call `event.preventDefault()` to suppress page scrolling.
- `bindControls` must be idempotent — calling it multiple times does not register duplicate listeners (use `{ once: false }` and guard with a `bound` flag or remove existing listeners before re-adding).

---

## DOM Structure Expected by `ui.js`

`ui.js` assumes the following element IDs exist in `index.html`:

```html
<!-- Start screen -->
<div id="screen-start">
  <h1>Snail Trail</h1>
  <fieldset>
    <input type="radio" name="difficulty" value="easy" checked> Easy
    <input type="radio" name="difficulty" value="medium"> Medium
    <input type="radio" name="difficulty" value="hard"> Hard
  </fieldset>
  <button id="btn-start">Play</button>
</div>

<!-- Game canvas (always in DOM) -->
<canvas id="game-canvas" aria-label="Snail Trail game grid"></canvas>

<!-- Win overlay (hidden initially) -->
<div id="overlay-win" class="hidden">
  <p>You escaped!</p>
  <button class="btn-restart">Play Again</button>
</div>

<!-- Lose overlay (hidden initially) -->
<div id="overlay-lose" class="hidden">
  <p>Caught by a snail!</p>
  <button class="btn-restart">Try Again</button>
</div>
```

**`aria-label` on canvas**: The canvas element must have `aria-label="Snail Trail game grid"` (or an equivalent `aria-labelledby` reference) to satisfy Constitution Principle VI.

---

## Internal (non-exported) Helpers

The following helpers must NOT be exported:

- `mapKeyToDirection(event)` — maps a `KeyboardEvent` to a `Direction` string or `null` for non-movement keys
- `setVisible(element, visible)` — sets/removes the `hidden` CSS class on a DOM element
