<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 2.0.0
Bump type: MAJOR — all seven principles replaced; project domain changed from
           a bootcamp skills tracker to a vanilla browser-based maze/game.

Modified principles (old title → new title):
  I.   Simplicity & Vanilla First           → I.   Code Quality
  II.  Intuitive UX                         → II.  Testing
  III. Accessibility (WCAG 2.1 AA)          → III. User Experience
  IV.  Client-Side Persistence (No Backend) → IV.  Performance
  V.   Performance & Offline Capability     → V.   Simplicity
  VI.  Test-Driven Core Logic               → VI.  Accessibility
  VII. Demo-Ready Polish                    → VII. Architecture

Added sections:
  - Technology Stack (rewritten for game context)
  - Quality Gates & Development Workflow (rewritten for game context)

Removed sections:
  - Client-Side Persistence (No Backend) — not applicable to a game without user data sync
  - Service Worker / Offline rules — out of scope for this project

Templates requiring updates:
  ✅ constitution.md — this file (fully filled)
  ✅ plan-template.md — Constitution Check rows are generic; compatible with new principles
  ✅ spec-template.md — user story / acceptance scenario format is unchanged; compatible
  ✅ tasks-template.md — path conventions and task format are unchanged; compatible

Follow-up TODOs: None — all placeholders resolved.
-->

# Bootcamp Demo Game Constitution

## Core Principles

### I. Code Quality

All code MUST be clean, readable, and well-structured with a clear separation of
concerns. Every module MUST have a single, well-defined responsibility. Code MUST
be written as though the next reader is a bootcamp participant learning from it.

**Rationale**: This project is used as a live AI-assisted development demo. Messy,
tangled code undermines the credibility of the methodology and makes the codebase
impossible to reason about or test.

Non-negotiable rules:
- Functions MUST be short and single-purpose; any function longer than ~30 lines
  MUST be split unless there is a documented justification.
- Magic numbers and string literals MUST be replaced by named constants.
- File and symbol names MUST be descriptive and unambiguous — abbreviations are
  not permitted unless industry-standard (e.g., `x`, `y` for coordinates).
- Dead code MUST NOT be committed. Commented-out blocks are treated as dead code.
- Every module MUST export a documented public API; internal helpers MUST NOT
  be exported.

### II. Testing

All core game logic MUST have corresponding unit tests. The areas listed below
are non-negotiably covered before any feature that touches them is considered done.

**Rationale**: Game logic (pathfinding, collision, movement) is invisible to manual
play-testing at the edge cases that matter most. A subtle bug in A* will produce
snails that clip through walls only on certain grid configurations — impossible to
catch without a test harness. Tests also serve as executable documentation of the
game rules.

Non-negotiable rules:
- The following modules MUST be unit-tested: pathfinding (A* or equivalent),
  map generation, collision detection, player and snail movement resolution.
- Tests MUST be written before or alongside the implementation — never after.
- Tests MUST be runnable with a single command and MUST NOT require a browser
  (use a DOM-free test runner such as Node's built-in test runner or Vitest with
  a non-browser environment for pure logic).
- A feature MUST NOT be marked complete if any test related to its logic is failing.
- Test coverage for the four core logic modules MUST be ≥ 80% (branch coverage).

### III. User Experience

The game MUST be immediately playable in any modern browser without any installation,
build step, account, or configuration. Visual feedback MUST unambiguously communicate
the game state at all times.

**Rationale**: The game is demonstrated live to bootcamp cohorts. A play experience
that requires setup or leaves the player guessing about what just happened wastes
demo time and reduces impact. Instant play is a feature.

Non-negotiable rules:
- The game MUST launch by opening a single HTML file — no server, no npm install,
  no CLI command required.
- Player position, snail positions, and the treasure chest MUST each have a
  visually distinct, unambiguous representation on screen at all times.
- Game-state transitions (player moves, snail moves, win, lose, new game) MUST
  produce immediate visual feedback within one animation frame.
- A win state (reaching the treasure chest) and a lose state (caught by a snail)
  MUST each trigger a clear, unmissable UI response — not just a console message.
- Restart MUST be available at any time without a page reload.

### IV. Performance

Map generation and pathfinding MUST be responsive even for large grids. Players
MUST never experience a perceptible freeze while the engine computes.

**Rationale**: A game that stutters is unplayable and embarrassing in a live demo.
Pathfinding and map generation are the two computationally intensive operations;
both have well-known algorithmic solutions that comfortably meet the threshold below.

Non-negotiable rules:
- Map generation for any supported grid size MUST complete in under 100 ms on a
  mid-range laptop (measured in the test suite, not just informally).
- Each pathfinding call (one snail, one tick) MUST complete in under 100 ms on
  the same benchmark hardware.
- Performance benchmarks for these two operations MUST be included in the test
  suite and MUST fail the build if the threshold is exceeded.
- No synchronous blocking operations (e.g., `alert`, `prompt`, busy loops) are
  permitted on the main thread during gameplay.
- If a grid size is added that cannot meet the 100 ms threshold, it MUST be
  documented as out-of-scope and gated behind a development flag.

### V. Simplicity

The entire game MUST be built with vanilla HTML, CSS, and JavaScript only. No
front-end frameworks, build tools, bundlers, or transpilers are permitted in the
deliverable.

**Rationale**: This is an AI bootcamp demo. The simpler the stack, the easier
it is to walk a room through the codebase in real time. Vanilla tech also
eliminates all supply-chain and tooling risk — the game works in perpetuity by
opening a file.

Non-negotiable rules:
- Zero npm runtime dependencies for the game itself. `package.json` is permitted
  only for dev-only tooling (test runner, linter).
- The game MUST run correctly from the local filesystem (`file://`) without any
  server-side component.
- External resources (fonts, icons) MUST be either inlined or vendored with a
  pinned version — no unpinned CDN URLs.
- Any dev-only tool (test runner, linter) MUST NOT be bundled into or referenced
  by the deliverable HTML/CSS/JS files.
- CSS MUST use custom properties for all design tokens (colours, sizes, speeds);
  hard-coded values for repeated tokens are not permitted.

### VI. Accessibility

The game MUST be fully keyboard-operable and MUST make its visual elements clearly
distinguishable without relying on colour alone.

**Rationale**: Game accessibility often gets ignored in demos. Including it here
demonstrates that AI-assisted development does not skip quality concerns and that
accessibility is achievable without significant extra effort when built in from
the start.

Non-negotiable rules:
- All movement MUST be controllable via keyboard (arrow keys and/or WASD) without
  requiring a mouse or touch input.
- Each distinct game element (player, snail, treasure chest, wall, open floor)
  MUST differ by shape or icon — not by colour alone.
- The game canvas or grid MUST have an `aria-label` or equivalent describing the
  current game state for screen reader users.
- Focus indicators MUST be visible on any non-canvas interactive UI elements
  (buttons, menus).
- Animations MUST respect the `prefers-reduced-motion` media query — motion MUST
  be suppressible.

### VII. Architecture

Game logic MUST be strictly separated from rendering. The engine MUST be testable
without a DOM or canvas context. Rendering MUST be a thin layer that reads from
game state and draws — it MUST NOT contain logic.

**Rationale**: Without this separation, the game logic cannot be unit-tested (the
engine requires a browser to run) and every logic change risks breaking rendering
in unexpected ways. Clean separation also makes it trivial to swap renderers (e.g.,
canvas vs. DOM grid) without touching game rules.

Non-negotiable rules:
- All game-rule logic (pathfinding, collision resolution, movement, win/lose checks,
  map generation) MUST live in modules that have no dependency on the DOM, Canvas
  API, or any browser global.
- The renderer MUST be a single module (or group of tightly-scoped modules) that
  receives a game-state snapshot and produces pixels/DOM updates — it MUST NOT
  mutate game state.
- The game loop MUST separate the `update(state) → newState` step from the
  `render(state)` step, even if they run in the same `requestAnimationFrame` callback.
- Modules MUST communicate via well-defined interfaces (plain objects / function
  arguments); no global mutable state is permitted outside the single authoritative
  game-state object.

## Technology Stack

| Layer | Choice | Constraint |
|---|---|---|
| Language | Vanilla JavaScript (ES2022 modules) | No TypeScript compilation in the deliverable |
| Markup | Semantic HTML5 | Single `index.html` entry point |
| Styles | Vanilla CSS with custom properties | No preprocessors; no external CSS frameworks |
| Rendering | HTML Canvas or CSS Grid (TBD per plan) | Renderer module is interchangeable |
| Testing | Node built-in test runner or Vitest (dev-only) | No browser required for logic tests |
| Linting | ESLint (dev-only) | Not bundled into deliverable |
| Distribution | Static file (no build step) | Must run on `file://` and any static host |

## Quality Gates & Development Workflow

All work MUST pass the following gates before a feature is considered done:

1. **Constitution Check** — Does the implementation comply with all seven principles?
   Any violation MUST be flagged and resolved before the feature is marked complete.

2. **Unit Tests Green** — All tests pass. Core logic modules (pathfinding, map
   generation, collision, movement) maintain ≥ 80% branch coverage.

3. **Performance Gate** — Map generation and per-snail pathfinding benchmarks pass
   their 100 ms threshold. Failing benchmarks block completion.

4. **Playability Check** — The game can be opened from the filesystem (`file://`)
   in a modern browser with no extra steps and a complete game loop (move → win/lose
   → restart) can be demonstrated.

5. **Keyboard-Only Playthrough** — The full game loop MUST be completable using
   only the keyboard. Mouse-only paths are not accepted.

6. **Visual Distinction Audit** — Each game element MUST be identifiable without
   relying solely on colour. Verified by briefly switching the display to greyscale.

7. **Separation of Concerns Review** — A reviewer MUST confirm that no DOM or Canvas
   API calls exist in logic modules, and that no game-state mutations exist in the
   renderer.

## Governance

This constitution is the authoritative reference for all architectural and quality
decisions in the Bootcamp Demo Game project. It supersedes all informal agreements,
earlier drafts, and feature-level conventions.

**Amendment process**:
- PATCH amendments (clarifications, wording): single-author edit with a note in the
  Sync Impact Report header and a PATCH version bump.
- MINOR amendments (new principle or new section): require documented rationale
  reviewed by the project lead before merge; MINOR version bump.
- MAJOR amendments (removal or complete redefinition of a core principle): require
  a written justification, an impact assessment against in-flight specs, and MUST
  trigger re-review of all open features; MAJOR version bump.

**Compliance**:
- Every spec and plan MUST include a Constitution Check section that cites the
  relevant principles from this document.
- Every PR description MUST include a one-line statement confirming constitution
  compliance or listing approved exceptions.
- Exceptions to any NON-NEGOTIABLE rule MUST be documented in the Sync Impact
  Report of the amendment that permits them; ad-hoc exceptions are not permitted.

**Version**: 2.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09

