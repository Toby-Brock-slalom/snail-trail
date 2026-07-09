# Feature Specification: Snail Trail Game

**Feature Branch**: `001-snail-trail-game`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Build a browser-based grid game called 'Snail Trail'. The game generates a complex grid-based map with walls, open paths, a start position, and a treasure chest as the goal. The player moves in cardinal directions using arrow keys or WASD. The player must navigate from the start to the treasure chest without being caught by snails. Snails use A*/BFS pathfinding to hunt the player at half the player's movement rate."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Navigation (Priority: P1)

A player opens the game, sees the start screen, begins a game, and moves their character around the grid using the keyboard to reach the treasure chest.

**Why this priority**: Navigation is the core interaction loop. Without working player movement and win detection, no other feature is demonstrable or testable.

**Independent Test**: Open the HTML file, click Start, press arrow keys or WASD to move the player character across open cells, verify the character cannot enter wall cells, navigate to the treasure chest, verify the win screen appears.

**Acceptance Scenarios**:

1. **Given** the game is on the start screen, **When** the player starts a new game, **Then** a grid map is displayed with the player at the start position and the treasure chest visible on screen
2. **Given** the player is on an open cell, **When** an arrow key or WASD key is pressed in a valid direction, **Then** the player moves one cell in that direction
3. **Given** the player is adjacent to a wall, **When** the player presses the key toward that wall, **Then** the player does not move and the grid is unchanged
4. **Given** the player has navigated to the treasure chest cell, **When** they step onto it, **Then** the win screen is displayed immediately
5. **Given** the game is in the playing state, **When** the restart/new game button is activated, **Then** a new map is generated and play resets without a page reload

---

### User Story 2 - Snail Pursuit (Priority: P2)

A player navigates the grid while one or more snails actively pursue them using pathfinding. The snails move toward the player after every two player steps. If a snail reaches the player's cell, the game ends in a loss.

**Why this priority**: Snail pursuit is the core challenge mechanic. A game without working enemy AI has no tension or replayability.

**Independent Test**: Start a game, remain stationary for several turns (move back and forth in place), observe snails moving toward the player every 2 steps, verify that when a snail occupies the player's cell the lose screen appears.

**Acceptance Scenarios**:

1. **Given** the player has taken 2 steps, **When** the engine resolves the snail turn, **Then** each snail moves exactly 1 cell toward the player along its computed path
2. **Given** a snail computes a path to the player, **When** the path is blocked by walls, **Then** the snail navigates around those walls rather than through them
3. **Given** a snail has no reachable path to the player, **When** the snail's turn resolves, **Then** the snail stays in its current cell
4. **Given** a snail has moved to the same cell as the player, **When** the game resolves that turn, **Then** the lose screen is displayed immediately
5. **Given** multiple snails are present, **When** each snail's turn resolves, **Then** each snail independently computes and takes its own move

---

### User Story 3 - Procedural Map Generation (Priority: P3)

Each new game presents a freshly generated map with a unique layout of walls and corridors, a randomised start position, and a randomised treasure chest position. Every generated map is guaranteed to have at least one navigable path from start to treasure chest.

**Why this priority**: Procedural generation drives replayability. A static map makes the game trivially solvable after one play.

**Independent Test**: Start 20 new games in succession; verify each map looks visually distinct, that walls and open corridors vary, and that in every case a path from start to treasure chest exists (verified by running the same pathfinding algorithm used by snails from start to goal with no snails present).

**Acceptance Scenarios**:

1. **Given** a new game is started, **When** map generation completes, **Then** the grid contains wall cells, open path cells, exactly one start cell, and exactly one treasure chest cell
2. **Given** a generated map, **When** a pathfinding algorithm traces a route from the start cell to the treasure chest cell avoiding wall cells, **Then** at least one valid route is found on every generated map
3. **Given** a generated map, **When** the layout is inspected, **Then** the map contains a mix of wall clusters and open corridor regions rather than a fully open or fully walled grid
4. **Given** two successive new games, **When** both maps are displayed, **Then** the wall layouts are not identical (maps are randomised)

---

### User Story 4 - Difficulty Selection (Priority: P4)

Before starting a game, the player selects a difficulty level. Harder difficulties increase the number of snails, the grid size, or both, making navigation more challenging.

**Why this priority**: Difficulty scaling extends the game's appeal across skill levels and is a key feature of the specification.

**Independent Test**: Select each difficulty level, start a game, verify that the number of snails and/or grid dimensions differ as specified for that difficulty.

**Acceptance Scenarios**:

1. **Given** the start screen is displayed, **When** the player views difficulty options, **Then** at least two distinct difficulty levels are available with descriptive labels
2. **Given** the player selects a harder difficulty level, **When** the game map is generated, **Then** the grid size, number of snails, or both are greater than the easier difficulty
3. **Given** a harder difficulty is selected, **When** map generation runs, **Then** the guaranteed-solvable-path constraint still holds regardless of the number of snails present

---

### User Story 5 - Game States & Feedback (Priority: P5)

The game transitions cleanly between start, playing, win, and lose states. Each state is visually unambiguous. The player can always restart without reloading the page.

**Why this priority**: Clear state transitions and restart functionality are required for a demo-ready experience.

**Independent Test**: Trigger each state transition (start game, win, lose, restart) and verify the correct screen is shown with unambiguous visual feedback within one animation frame.

**Acceptance Scenarios**:

1. **Given** the game first loads, **When** the page is rendered, **Then** the start screen is shown with difficulty selection and a start/play button
2. **Given** the player wins, **When** the win screen is shown, **Then** it contains a clear congratulatory message and a new game/restart button
3. **Given** the player loses, **When** the lose screen is shown, **Then** it contains a clear loss message and a new game/restart button
4. **Given** any game state (playing, win, lose), **When** the restart/new game button is activated, **Then** a new map is generated and the game resets to the playing state immediately without a page reload
5. **Given** the game transitions between states, **When** the new state is rendered, **Then** the visual change is immediate and unambiguous — not just a console message

---

### Edge Cases

- What happens when the player presses a movement key that would move them out of bounds? → Movement is blocked; the player stays in their current cell.
- What happens when a snail computes a path but the player moves before the snail resolves? → Pathfinding is computed at the moment the snail's turn triggers, based on the player's current position at that instant.
- What happens when multiple snails share the same cell? → Snails may coexist on the same cell; there is no snail-snail collision.
- What happens when a snail is completely trapped by walls and cannot reach the player? → The snail stays in its current cell each turn; it does not teleport or phase through walls.
- What happens if the treasure chest is placed adjacent to the start position? → This is a valid (though easy) layout; the solvability guarantee is still satisfied.
- What happens on very rapid key presses? → Each key press resolves one player step; the engine does not queue multiple steps from held keys unless explicitly designed to do so.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST display a start screen before gameplay begins, presenting difficulty options and a button to start play
- **FR-002**: The game MUST generate a grid-based map containing wall cells, open path cells, exactly one start cell, and exactly one treasure chest cell for each new game
- **FR-003**: Map generation MUST guarantee at least one valid navigable route from the start cell to the treasure chest cell that passes only through open cells
- **FR-004**: Maps MUST contain a mixture of wall clusters and open corridors — they MUST NOT be entirely open or consist of a single straight corridor
- **FR-005**: The player MUST be able to move one cell at a time in each cardinal direction (up, down, left, right) using arrow keys and WASD keys
- **FR-006**: Player movement into a wall cell or out of grid bounds MUST be blocked; the player's position MUST remain unchanged
- **FR-007**: The full map MUST be visible to the player at all times — there is no fog of war
- **FR-008**: The game MUST place one or more snail enemies on the map at cells that are not the start cell or the treasure chest cell
- **FR-009**: Each snail MUST compute a path toward the player's current position using a pathfinding algorithm (A* or BFS) that respects wall cells
- **FR-010**: Snails MUST move exactly once for every two steps the player takes; if a snail has no reachable path to the player it MUST remain stationary
- **FR-011**: If any snail occupies the same grid cell as the player after resolving a turn, the game MUST immediately transition to the lose state
- **FR-012**: If the player moves onto the treasure chest cell, the game MUST immediately transition to the win state
- **FR-013**: The win state MUST be communicated via an unmissable on-screen message or overlay; a console-only message does not satisfy this requirement
- **FR-014**: The lose state MUST be communicated via an unmissable on-screen message or overlay; a console-only message does not satisfy this requirement
- **FR-015**: A restart/new game control MUST be available and operable during the playing, win, and lose states
- **FR-016**: Activating the restart control MUST generate a new map and reset all game state without reloading the page
- **FR-017**: The game MUST offer at least two difficulty levels; harder levels MUST increase the number of snails, the grid size, or both relative to easier levels
- **FR-018**: The player character, snail enemies, treasure chest, wall cells, and open floor cells MUST each be visually distinct from one another using shape, icon, or symbol — not by colour alone
- **FR-019**: All game controls MUST be operable via keyboard alone; no mouse interaction MUST be required to play the game
- **FR-020**: The game MUST launch correctly by opening a single HTML file in any modern browser with no server, installation, or build step required

### Key Entities

- **GameState**: The single authoritative record of an in-progress game — grid dimensions, cell layout (wall/open/start/goal), current player position, snail positions, player step count, and current game phase (start/playing/win/lose)
- **Grid Cell**: A single tile on the map defined by its type (wall, open, start, treasure) and its (column, row) coordinates within the grid
- **Player**: The user-controlled entity — current position on the grid and cumulative step count used to trigger snail turns
- **Snail**: An AI-controlled enemy — current position on the grid and a movement counter tracking when its next move is due
- **Difficulty**: A configuration bundle specifying grid width, grid height, and number of snails for a given difficulty level

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time player can understand the objective and controls within 30 seconds of the game loading, without reading external documentation
- **SC-002**: Map generation completes in under 100 ms for all supported grid sizes on a mid-range laptop
- **SC-003**: Each snail's pathfinding calculation completes in under 100 ms per turn on the same benchmark hardware
- **SC-004**: 100% of generated maps contain at least one navigable path from start to treasure chest (verified by automated test)
- **SC-005**: Win and lose state transitions are displayed within one animation frame of the triggering event — no perceptible lag
- **SC-006**: The game is fully playable using only keyboard input with no mouse interaction at any point in the game loop
- **SC-007**: The game renders and is playable on any screen 1024×768 pixels or larger without horizontal or vertical scrolling of the grid area
- **SC-008**: All core logic modules (pathfinding, map generation, collision detection, movement resolution) achieve ≥ 80% branch coverage in the automated test suite

## Assumptions

- The game is single-player only; no multiplayer or networked play is in scope
- No persistent data (scores, save states, leaderboards) is required in v1
- Touch and mobile input are out of scope for v1; the game targets desktop browsers only
- Snails do not collide with each other; multiple snails may occupy the same cell simultaneously
- Snail starting positions are placed on open cells that are not the start or treasure chest; their initial placement does not guarantee the player has a snail-free route at turn 0
- "Modern browser" means the current stable release of Chrome, Firefox, Safari, and Edge; compatibility with older or non-standard browsers is not required
- Screen reader full accessibility is aspirational; keyboard operability and shape-based visual distinction (Principle VI of the constitution) are required; full ARIA game-state narration is a stretch goal
- The grid is rendered as a 2D top-down view; no isometric or 3D perspective is required
- Animations (if any) MUST respect the `prefers-reduced-motion` media query and MUST be suppressible
