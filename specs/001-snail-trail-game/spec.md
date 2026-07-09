# Feature Specification: Snail Trail Game

**Feature Branch**: `001-snail-trail-game`

**Created**: 2026-07-09

**Status**: Revised — v2 (2026-07-09)

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

### User Story 6 - Level Timer (Priority: P3)

A player completes a game and sees how long it took them. The timer starts the moment gameplay begins and stops on a win or loss. During play the timer is always visible. The win screen shows the final time.

**Why this priority**: A visible timer adds tension and gives players a personal best to chase, directly supporting replayability without changing core mechanics.

**Independent Test**: Start a game, wait a known number of seconds (e.g., 10 s), win or lose the game, verify the displayed time on the overlay matches the elapsed time within ±1 second.

**Acceptance Scenarios**:

1. **Given** the player presses Play, **When** the game transitions to the playing state, **Then** the timer begins counting from zero
2. **Given** the game is in the playing state, **When** the timer is inspected, **Then** it is displayed prominently on screen in MM:SS or S.ms format
3. **Given** the player reaches the treasure chest, **When** the win screen appears, **Then** the final elapsed time is displayed alongside the congratulatory message
4. **Given** a snail catches the player, **When** the lose screen appears, **Then** the timer stops; the final time is available but need not be shown on the lose screen
5. **Given** the player restarts the game, **When** the new game begins, **Then** the timer resets to zero and starts again

---

### User Story 7 - In-Overlay Difficulty Change (Priority: P4)

After finishing a game (win or lose), a player decides to try a different difficulty level before playing again. They select the new difficulty directly on the result overlay without navigating back to the start screen.

**Why this priority**: Removing the extra navigation step reduces friction between games and is the natural place to reconsider difficulty after seeing a result.

**Independent Test**: Win a game on Easy, verify the win overlay contains a difficulty selector, change selection to Hard, click New Game, verify the new game starts on Hard with the correct grid size and snail count.

**Acceptance Scenarios**:

1. **Given** the win overlay is displayed, **When** the player inspects it, **Then** a difficulty selector is present showing all available modes (Easy, Medium, Hard, Infinite)
2. **Given** the lose overlay is displayed, **When** the player inspects it, **Then** the same difficulty selector is present
3. **Given** the player changes the difficulty on the overlay, **When** they activate the new game control, **Then** the next game uses the newly selected difficulty
4. **Given** the player does not change the difficulty on the overlay, **When** they activate the new game control, **Then** the next game uses the difficulty that was active when the finished game began

---

### User Story 8 - Infinite Mode (Priority: P2)

A skilled player wants an escalating challenge with no fixed end. They select Infinite Mode, play progressively larger maps with more snails, and try to reach the highest level they can before being caught. Their best run is recorded.

**Why this priority**: Infinite Mode is the primary high-skill engagement loop and directly supports the leaderboard feature.

**Independent Test**: Select Infinite Mode, win level 1 (20×20, 2 snails), verify level 2 begins with a 25×25 grid and 3 snails; the on-screen level counter shows "Level 2". Lose on level 2; verify the result overlay shows the highest level reached as 2.

**Acceptance Scenarios**:

1. **Given** Infinite Mode is selected, **When** the first game starts, **Then** the map is 20×20 columns/rows with 2 snails and the level counter shows "Level 1"
2. **Given** the player wins level N in Infinite Mode, **When** the next level begins, **Then** the map is (20 + 5×N) wide × (20 + 5×N) tall with (N + 2) snails and the level counter shows "Level N+1"
3. **Given** the game is in Infinite Mode, **When** the player inspects the playing screen, **Then** the current level number is displayed on screen
4. **Given** a snail catches the player during Infinite Mode, **When** the result overlay appears, **Then** Infinite Mode ends and the highest level reached in that run is displayed
5. **Given** Infinite Mode ends, **When** the player starts a new Infinite Mode run, **Then** the run begins fresh at Level 1 with the initial dimensions and snail count
6. **Given** each Infinite Mode level is generated, **When** the map is inspected, **Then** the guaranteed-solvable-path constraint holds regardless of increased grid size or snail count

---

### User Story 9 - Leaderboard (Priority: P5)

A returning player checks the leaderboard from the start screen to see top scores and their own records. Leaderboard data persists between browser sessions.

**Why this priority**: Without persistence the name entry and infinite mode high-score features have no lasting value.

**Independent Test**: Set a record on Easy, reload the page, open the leaderboard from the start screen, verify the record is still present with the correct name, time, and date.

**Acceptance Scenarios**:

1. **Given** the start screen is displayed, **When** the player activates the Leaderboard button, **Then** a leaderboard view is shown without starting a game
2. **Given** the leaderboard is displayed, **When** the player inspects it, **Then** it shows separate categories for Easy, Medium, Hard, and Infinite Mode
3. **Given** each category, **When** the leaderboard is displayed, **Then** at most 5 entries are shown, sorted ascending by time (standard difficulties) or descending by level (Infinite Mode)
4. **Given** a leaderboard entry, **When** it is rendered, **Then** it shows the 3-letter player name, the recorded value, and the date it was set
5. **Given** a record has been set, **When** the player reloads the page and reopens the leaderboard, **Then** the record is still present with its original values
6. **Given** localStorage is unavailable, **When** the game attempts to load or save leaderboard data, **Then** the game remains playable and displays an empty leaderboard without crashing

---

### User Story 10 - Arcade Name Entry (Priority: P5)

A player sets a new record and is prompted to enter their 3-letter arcade name before the result is saved to the leaderboard.

**Why this priority**: Name entry is the mechanism that makes leaderboard entries personal and gives players ownership of their records.

**Independent Test**: Achieve a best time on Medium, verify the name entry screen appears before the leaderboard is updated, type "ABC", press Enter, verify "ABC" appears in the Medium leaderboard.

**Acceptance Scenarios**:

1. **Given** the player achieves a new record (best time on a standard difficulty or highest Infinite Mode level), **When** the game resolves the result, **Then** a name entry screen is shown before the leaderboard is updated
2. **Given** the name entry screen is displayed, **When** the player presses alphabetic keys (A–Z), **Then** up to 3 uppercase letters are entered into the name field
3. **Given** the player presses non-alphabetic keys (numbers, symbols, punctuation) during name entry, **When** the input is processed, **Then** those characters are silently ignored
4. **Given** fewer than 3 letters have been entered, **When** the player presses Enter or activates the Save button, **Then** the action is disabled and the name is not saved
5. **Given** exactly 3 letters have been entered, **When** the player presses Enter or activates the Save button, **Then** the name is saved in uppercase to the leaderboard entry and the result overlay is shown
6. **Given** the player enters lowercase letters via any mechanism, **When** the name is saved, **Then** it is stored and displayed in uppercase

---

### User Story 11 - GitHub Pages Hosting (Priority: P6)

A developer pushes changes to the `main` branch and the game is automatically deployed to GitHub Pages within minutes, without any manual build or upload step.

**Why this priority**: Automated deployment makes the game publicly accessible and shareable with no ongoing manual effort.

**Independent Test**: Inspect `.github/workflows/deploy.yml`; verify it triggers on push to `main`, uses `actions/upload-pages-artifact` and `actions/deploy-pages`, and contains no build commands beyond uploading the repository root as the artifact.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to `main`, **When** the GitHub Actions workflow runs, **Then** the site is deployed to GitHub Pages without manual intervention
2. **Given** the deployed site, **When** opened in a browser via the GitHub Pages URL, **Then** the game loads and is fully playable
3. **Given** the workflow file, **When** it is inspected, **Then** it contains no build steps — the static files are deployed as-is

---

### Edge Cases

- What happens when the player presses a movement key that would move them out of bounds? → Movement is blocked; the player stays in their current cell.
- What happens when a snail computes a path but the player moves before the snail resolves? → Pathfinding is computed at the moment the snail's turn triggers, based on the player's current position at that instant.
- What happens when multiple snails share the same cell? → Snails may coexist on the same cell; there is no snail-snail collision.
- What happens when a snail is completely trapped by walls and cannot reach the player? → The snail stays in its current cell each turn; it does not teleport or phase through walls.
- What happens if the treasure chest is placed adjacent to the start position? → This is a valid (though easy) layout; the solvability guarantee is still satisfied.
- What happens on very rapid key presses? → Each key press resolves one player step; the engine does not queue multiple steps from held keys unless explicitly designed to do so.
- What happens if the player closes the browser mid-game in Infinite Mode? → Progress for the current run is lost; only completed levels count toward the recorded high score.
- What happens if localStorage is unavailable or its quota is exceeded? → The leaderboard degrades gracefully — the game remains fully playable and displays an empty leaderboard without throwing an error.
- What happens if two entries share the same value on the leaderboard? → Ties are broken by date (earlier date ranks higher); both entries are shown if the limit of 5 has not been reached.
- What happens if the player enters fewer than 3 letters and attempts to save? → The Save/Enter action is disabled; the player must provide exactly 3 letters before the record can be written.
- What happens as Infinite Mode grids grow very large? → The guaranteed-solvable-path constraint still applies; the grid must render within the viewport or scroll gracefully — it MUST NOT break the layout.

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
- **FR-021**: A level timer MUST start when the player begins a new game and MUST stop when the game transitions to the win or lose state
- **FR-022**: The elapsed time MUST be displayed prominently on screen during gameplay in MM:SS or S.ms format
- **FR-023**: The win screen MUST display the player's final completion time for that game
- **FR-024**: The win overlay and lose overlay MUST each include a difficulty selector allowing the player to change difficulty before starting the next game
- **FR-025**: The difficulty selector on win/lose overlays MUST present all available modes: Easy, Medium, Hard, and Infinite Mode
- **FR-026**: Infinite Mode MUST be selectable as a distinct game mode from the start screen alongside Easy, Medium, and Hard
- **FR-027**: Infinite Mode MUST begin at Level 1 with a 20×20 grid and 2 snails
- **FR-028**: Upon winning a level in Infinite Mode, the next level MUST use a grid that is 5 columns wider and 5 rows taller than the previous level, and MUST add 1 additional snail
- **FR-029**: The current Infinite Mode level number MUST be displayed on screen during Infinite Mode gameplay
- **FR-030**: When the player loses during Infinite Mode, the mode MUST end immediately and the highest level reached in that run MUST be displayed on the result overlay
- **FR-031**: A leaderboard MUST persist between browser sessions using the browser's localStorage API
- **FR-032**: The leaderboard MUST track the best (lowest) completion time per standard difficulty (Easy, Medium, Hard) and the highest Infinite Mode level reached per run
- **FR-033**: Each leaderboard entry MUST store a 3-letter player name (uppercase), the recorded value, and the date the record was set
- **FR-034**: Each leaderboard category MUST display at most 5 entries, sorted ascending by time (standard difficulties) or descending by level (Infinite Mode)
- **FR-035**: A "Leaderboard" button MUST be visible on the start screen; activating it MUST display the leaderboard without starting a game
- **FR-036**: When a player achieves a new record (best time on a standard difficulty or highest Infinite Mode level in a run), the game MUST display a name entry screen before the record is saved
- **FR-037**: The name entry screen MUST accept exactly 3 uppercase alphabetic characters (A–Z) via keyboard; non-alphabetic input MUST be silently ignored
- **FR-038**: The Save/Enter action on the name entry screen MUST be disabled until exactly 3 letters have been entered; pressing Enter or Save with fewer than 3 letters MUST have no effect
- **FR-039**: Player names MUST be stored and displayed in uppercase regardless of how they were entered
- **FR-040**: A GitHub Actions workflow file MUST exist at `.github/workflows/deploy.yml`, trigger on every push to the `main` branch, and deploy the repository's static content to GitHub Pages using `actions/upload-pages-artifact` and `actions/deploy-pages` with no build step

### Key Entities

- **GameState**: The single authoritative record of an in-progress game — grid dimensions, cell layout (wall/open/start/goal), current player position, snail positions, player step count, current game phase (start/playing/win/lose), active game mode (Easy/Medium/Hard/Infinite), and current Infinite Mode level
- **Grid Cell**: A single tile on the map defined by its type (wall, open, start, treasure) and its (column, row) coordinates within the grid
- **Player**: The user-controlled entity — current position on the grid and cumulative step count used to trigger snail turns
- **Snail**: An AI-controlled enemy — current position on the grid and a movement counter tracking when its next move is due
- **Difficulty**: A configuration bundle specifying grid width, grid height, and number of snails for a given difficulty level
- **Timer**: Tracks the elapsed time of the current game session — start timestamp and current elapsed milliseconds; frozen when the game transitions to win or lose
- **InfiniteRun**: The active state of an Infinite Mode run — current level number, current grid dimensions, current snail count, and the highest level reached before a loss
- **LeaderboardStore**: The persistent record of all leaderboard entries, grouped by category (Easy, Medium, Hard, Infinite) and stored in localStorage
- **LeaderboardEntry**: A single leaderboard record — player name (3 uppercase letters), value (elapsed milliseconds for standard difficulties; level number for Infinite), and ISO date string

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
- **SC-009**: The level timer is accurate to within ±100 ms of the true elapsed game time, verifiable against a mock clock in an automated test
- **SC-010**: Leaderboard entries persist correctly across at least three browser session reloads without data loss, as verified by manual or automated test
- **SC-011**: The GitHub Actions deployment workflow successfully deploys the site to GitHub Pages on every push to `main` without manual intervention
- **SC-012**: A player can set a record, enter their 3-letter name, verify the entry in the leaderboard, reload the page, and confirm the entry still exists — all within 2 minutes without external instructions

## Assumptions

- The game is single-player only; no multiplayer or networked play is in scope
- Leaderboard data is stored in the browser's localStorage; no server-side persistence is in scope
- Touch and mobile input are out of scope for v1; the game targets desktop browsers only
- Snails do not collide with each other; multiple snails may occupy the same cell simultaneously
- Snail starting positions are placed on open cells that are not the start or treasure chest; their initial placement does not guarantee the player has a snail-free route at turn 0
- "Modern browser" means the current stable release of Chrome, Firefox, Safari, and Edge; compatibility with older or non-standard browsers is not required
- Screen reader full accessibility is aspirational; keyboard operability and shape-based visual distinction (Principle VI of the constitution) are required; full ARIA game-state narration is a stretch goal
- The grid is rendered as a 2D top-down view; no isometric or 3D perspective is required
- Animations (if any) MUST respect the `prefers-reduced-motion` media query and MUST be suppressible
- Infinite Mode level counts are not capped; the game may theoretically continue indefinitely — no special victory condition beyond the player's eventual loss is required
- Infinite Mode does not track individual level completion times; only the highest level reached per run is recorded
- The GitHub Pages deployment assumes the repository is hosted on GitHub and the GitHub Pages feature is enabled for the repository
