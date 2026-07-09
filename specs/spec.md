# Feature Specification: Bootcamp Skills Tracker

**Feature Branch**: `001-bootcamp-skills-tracker`

**Created**: 2026-07-09

**Status**: Draft

**Input**: Build a Bootcamp Skills Tracker web app for AI enablement bootcamp participants.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Bootcamp Modules and Topics (Priority: P1)

A bootcamp participant opens the app for the first time and immediately sees the full curriculum laid out: all pre-loaded modules (e.g., "Introduction to AI", "Prompt Engineering", "GitHub Copilot", "AI in DevOps", "Building with AI APIs") and the sub-topics within each. Each topic shows its completion state at a glance. No login or setup is required — the content is ready to go.

**Why this priority**: Without a legible, pre-populated curriculum view there is nothing to interact with. Every other story depends on content being visible and navigable. This is the entry point for every participant every time they open the app.

**Independent Test**: Open the app in a browser (or directly from the filesystem). Verify all modules and their sub-topics are visible and that each topic shows a clear uncompleted state. Delivers value as a read-only reference even before any completion tracking is implemented.

**Acceptance Scenarios**:

1. **Given** the app is opened for the first time, **When** the page loads, **Then** all pre-loaded modules are visible with their titles and the count of sub-topics each contains.
2. **Given** a module is displayed, **When** the participant views it, **Then** all sub-topics within that module are listed beneath it and each shows an uncompleted visual state (e.g., an empty checkbox or ring).
3. **Given** the app is refreshed after no interactions, **When** the page reloads, **Then** the same modules and topics are shown in the same order with no data loss.
4. **Given** the app has previously been used, **When** the page loads, **Then** any previously saved completion states and notes are restored exactly.

---

### User Story 2 — Mark Topics and Modules as Complete (Priority: P1)

A participant clicks (or taps) on a topic to toggle it between complete and incomplete. A satisfying checkmark animation confirms the action. When every topic in a module is marked complete, the module itself is automatically marked complete. Progress is saved automatically to local browser storage — no "Save" button is needed.

**Why this priority**: This is the core interaction of the app. Without the ability to mark progress, the tracker delivers no value as a tracking tool. It is equally foundational to Story 1.

**Independent Test**: Mark a single topic complete, refresh the page, and verify the topic remains marked complete. Then mark all topics in one module complete and verify the module shows a completed state. Delivers standalone value as a durable progress tracker.

**Acceptance Scenarios**:

1. **Given** a topic is uncompleted, **When** the participant clicks or taps it, **Then** it transitions to a completed state accompanied by a visible checkmark animation (≤ 300 ms, respects `prefers-reduced-motion`).
2. **Given** a topic is already completed, **When** the participant clicks or taps it, **Then** it returns to an uncompleted state (toggling is supported).
3. **Given** all sub-topics in a module are marked complete, **When** the last topic is toggled, **Then** the parent module automatically transitions to a completed state without any additional user action.
4. **Given** a completed module has one topic un-toggled, **When** the topic is marked incomplete, **Then** the module immediately reverts to an in-progress state.
5. **Given** any completion toggle occurs, **When** the action resolves, **Then** the updated state is persisted automatically — no explicit save action required.
6. **Given** the page is refreshed after marking topics complete, **When** the page reloads, **Then** all previously marked topics remain in their completed state.

---

### User Story 3 — Add and Edit Personal Notes per Topic (Priority: P2)

A participant clicks on any topic to expand it and sees a text area where they can write a personal note or reflection. They can type freely, edit, or delete their note. Notes auto-save as the participant types. The note is accessible again the next time they expand the topic.

**Why this priority**: Notes provide the reflective layer that transforms passive completion tracking into active learning. They are secondary to marking progress but significantly increase the tool's educational value.

**Independent Test**: Expand a topic, type a note, close the topic, reopen it, and verify the note is still present. Refresh the page and verify the note persists. Delivers standalone value as a personal learning journal.

**Acceptance Scenarios**:

1. **Given** a topic is displayed, **When** the participant clicks or taps on it, **Then** an expanded view appears containing the topic title and a text input area for notes.
2. **Given** the note area is visible, **When** the participant types text, **Then** the note is saved automatically (within 1 second of the last keystroke) with no manual save required.
3. **Given** a note has been saved, **When** the participant collapses and re-expands the topic, **Then** the previously entered note text is displayed in the input area.
4. **Given** a note exists, **When** the participant clears all text and stops typing, **Then** the empty note state is saved and the topic no longer shows a note indicator.
5. **Given** a topic has a note, **When** the participant views the topic in the list, **Then** a subtle indicator (e.g., a note icon) shows that a note exists without revealing its content.
6. **Given** the page is refreshed, **When** the participant reopens a topic that previously had a note, **Then** the full note text is restored exactly.

---

### User Story 4 — View Progress Dashboard (Priority: P2)

The participant views a dashboard that prominently shows: (1) their overall completion percentage across all modules, (2) a per-module progress bar showing how many topics are complete in each module, and (3) a motivational streak counter showing how many consecutive days they have opened the app and completed at least one topic.

**Why this priority**: The dashboard provides the motivational feedback loop that encourages continued engagement. It synthesises completion data into meaningful, at-a-glance insight. It depends on Story 2 but adds a distinct layer of value.

**Independent Test**: Mark several topics complete across different modules, navigate to the dashboard, and verify the overall percentage, per-module bars, and streak counter all reflect the current state accurately. Delivers standalone motivational value.

**Acceptance Scenarios**:

1. **Given** the participant opens the dashboard, **When** no topics have been completed, **Then** overall progress shows 0%, all module bars show 0%, and the streak counter shows 0 days.
2. **Given** some topics have been completed, **When** the participant views the dashboard, **Then** the overall completion percentage is displayed prominently and accurately (topics complete ÷ total topics × 100, rounded to the nearest whole number).
3. **Given** some topics have been completed, **When** the participant views the dashboard, **Then** each module shows an individual progress bar with a label indicating topics complete out of total (e.g., "3 / 5 topics").
4. **Given** the participant has opened the app and completed at least one topic on consecutive days, **When** they view the dashboard, **Then** the streak counter shows the correct count of consecutive qualifying days.
5. **Given** the participant skips a day (no qualifying activity), **When** they return and view the dashboard, **Then** the streak counter resets to 1 for the current qualifying day (or 0 if no topic completed today).
6. **Given** all topics across all modules are completed, **When** the participant views the dashboard, **Then** the overall percentage shows 100%, all module bars show full, and a congratulatory message is displayed.
7. **Given** the page is refreshed, **When** the participant returns to the dashboard, **Then** all progress figures and the streak counter are restored from persisted data.

---

### User Story 5 — Offline Access After First Load (Priority: P3)

A participant who has previously loaded the app can use it in full — viewing modules, marking topics complete, editing notes, and viewing the dashboard — even when they have no internet connection.

**Why this priority**: Bootcamp sessions may occur in venues with unreliable Wi-Fi. Offline capability ensures the app never fails mid-session. It is a background capability that supports all other stories but is not visible during normal use.

**Independent Test**: Load the app once with network access, then disconnect the network in browser DevTools and reload the page. Verify all features work identically. Delivers standalone value by guaranteeing session reliability.

**Acceptance Scenarios**:

1. **Given** the app has been loaded at least once with network access, **When** the participant opens the app without a network connection, **Then** the full app UI loads and is usable.
2. **Given** the participant is offline, **When** they mark topics complete, add notes, and view the dashboard, **Then** all interactions work identically to the online experience.
3. **Given** the participant goes offline mid-session, **When** they continue using the app, **Then** no errors or degraded states appear; the app continues working seamlessly.
4. **Given** the participant is offline and makes changes, **When** they go back online, **Then** no data is lost and no synchronisation step is required (all data is local).

---

### User Story 6 — Reset Progress (Priority: P3)

An instructor or participant can reset all progress and notes back to the default state — as if the app were opened for the first time. A confirmation dialog prevents accidental resets. This is used when a new cohort starts a fresh session.

**Why this priority**: Without a reset mechanism the app cannot be reused across cohorts. It is a low-frequency but high-importance administrative action.

**Independent Test**: Mark several topics complete and add notes, then trigger a reset, confirm the action, and verify all topics are uncompleted and all notes are cleared. Delivers standalone value as a cohort management tool.

**Acceptance Scenarios**:

1. **Given** the participant or instructor is in the app, **When** they choose the "Reset Progress" option, **Then** a confirmation dialog appears asking them to confirm the destructive action before any data is changed.
2. **Given** the confirmation dialog is shown, **When** the participant selects "Cancel" or dismisses the dialog, **Then** all existing progress and notes are preserved unchanged.
3. **Given** the confirmation dialog is shown, **When** the participant selects "Reset" (confirm), **Then** all topic completion states are cleared, all notes are deleted, and the streak counter resets to zero.
4. **Given** a reset has been confirmed, **When** the app reloads or the participant refreshes, **Then** the app shows the default empty state as if opened for the first time.
5. **Given** a reset is in progress, **When** the storage clear operation completes, **Then** the UI immediately reflects the cleared state without requiring a manual page refresh.

---

### Edge Cases

- What happens when the participant opens the app on a browser that has storage quota restrictions or blocks `localStorage`? The app must surface a clear, user-friendly message explaining that saving is unavailable and why.
- How does the app handle a topic being marked complete on the same day the streak last updated? The streak counter must not double-increment for multiple completions within the same calendar day.
- What happens if the stored data schema is from a future or past version of the app? The app must detect a schema mismatch and either migrate gracefully or prompt the user before overwriting their data.
- What if all topics in a module are already complete when the participant un-marks one? The module must immediately revert from "complete" to "in-progress" state.
- What happens if the service worker fails to install (e.g., in a non-HTTPS context)? The app must still function online; service worker registration failure must be a graceful degradation, not a fatal error.
- What if the participant opens the app in two browser tabs simultaneously? Changes in one tab must not conflict with or silently overwrite changes in the other; at minimum, the last write wins and data is never corrupted.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display all pre-loaded bootcamp modules and their sub-topics on initial load, in a defined order, without requiring any user input.
- **FR-002**: Each module MUST show: its title, the total number of sub-topics, the number of completed sub-topics, and its overall completion state (not started / in progress / complete).
- **FR-003**: Each sub-topic MUST show: its title, its completion state (complete / incomplete), and a visual indicator when a personal note is attached.
- **FR-004**: A participant MUST be able to toggle any topic between complete and incomplete with a single click or tap, accompanied by a visible animation.
- **FR-005**: When all sub-topics in a module are toggled complete, the module MUST automatically transition to a completed state; removing any completion from a sub-topic MUST revert the module to in-progress.
- **FR-006**: A participant MUST be able to expand any topic to reveal a text input for a personal note or reflection.
- **FR-007**: Notes MUST be saved automatically within 1 second of the last keystroke, with no explicit save action required from the participant.
- **FR-008**: The dashboard MUST display the overall completion percentage across all modules and topics, calculated as: (total completed topics ÷ total topics) × 100, rounded to the nearest whole number.
- **FR-009**: The dashboard MUST display an individual progress indicator for each module showing the ratio of completed sub-topics to total sub-topics.
- **FR-010**: The dashboard MUST display a streak counter showing the number of consecutive calendar days on which the participant opened the app and marked at least one topic complete.
- **FR-011**: The streak counter MUST increment at most once per calendar day and MUST reset to zero if one or more days pass with no qualifying activity.
- **FR-012**: All user data (completion states, notes, streak data, last-active date) MUST be persisted automatically in browser-local storage — no server, account, or network connection required.
- **FR-013**: All read/write operations to persistent storage MUST be encapsulated in a dedicated storage module; no direct storage calls from UI code are permitted.
- **FR-014**: The app MUST register a service worker that caches all static assets on first load using a cache-first strategy, enabling full offline use after the initial visit.
- **FR-015**: A "Reset Progress" action MUST be available that, after user confirmation via a dialog, clears all completion states, notes, and streak data and returns the app to its default state.
- **FR-016**: The reset confirmation dialog MUST offer a clear cancel path; cancelling MUST preserve all data untouched.
- **FR-017**: All interactive elements MUST be keyboard-navigable, and visible focus indicators MUST be present on all focusable elements at all times.
- **FR-018**: Dynamic content changes (progress updates, streak increments, completion state changes) MUST be announced to screen readers via appropriate ARIA live regions.
- **FR-019**: The app MUST render correctly and be fully usable at 375px (mobile), 768px (tablet), and 1280px (desktop) viewport widths.
- **FR-020**: The service worker registration failure MUST be handled gracefully — the app must continue to work online if the service worker cannot be installed.
- **FR-021**: If browser storage is unavailable or full, the app MUST surface a clear, user-readable message explaining the limitation.

### Key Entities *(include if feature involves data)*

- **Module**: A top-level curriculum unit. Has a title, an ordered list of Topics, and a derived completion state (not-started / in-progress / complete) based on its Topics' states.
- **Topic**: A single learning item within a Module. Has a title, a boolean completion state, an optional personal note (text), and a timestamp of last completion toggle.
- **Progress Snapshot**: Derived from all Modules and Topics — represents overall completion percentage and per-module completion ratios. Not stored separately; calculated on demand.
- **Streak Record**: Tracks the current streak count (integer) and the date of the last qualifying activity (ISO date string). Stored in the persistence layer alongside Module/Topic data.
- **App State**: The complete persisted state — all Modules, all Topics (with notes and completion), and the Streak Record.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time participant can open the app, view all modules and topics, mark their first topic complete, and read their dashboard — all within 60 seconds and without any instructions.
- **SC-002**: All progress and notes survive a full page refresh with zero data loss, verified across 10 consecutive refresh cycles.
- **SC-003**: The app is fully functional (all features usable) after the network is disabled, provided the app has been loaded at least once with a network connection.
- **SC-004**: The overall completion percentage and all per-module progress bars update to reflect a newly toggled topic within 500 ms of the toggle action, with no page reload required.
- **SC-005**: The app achieves a Lighthouse Performance score ≥ 90 on a simulated mid-range mobile device (Moto G Power equivalent).
- **SC-006**: The app achieves a Lighthouse Accessibility score ≥ 95 with zero WCAG 2.1 AA violations detected by automated audit.
- **SC-007**: Total initial page weight (HTML + CSS + JS) is less than 200 KB uncompressed.
- **SC-008**: The app is usable — all primary flows completable — using only keyboard navigation, verified with zero mouse interaction.
- **SC-009**: The reset flow (trigger → confirm → cleared state) completes within 2 seconds of confirmation, with the UI immediately reflecting the cleared state.
- **SC-010**: The streak counter correctly reflects consecutive qualifying days across a minimum 3-day manual test sequence, resetting after one skipped day.

---

## Assumptions

- The full list of bootcamp modules and sub-topics is defined and fixed at build time (hard-coded as a data file); no admin interface for editing the curriculum is required in this feature.
- The five named modules ("Introduction to AI", "Prompt Engineering", "GitHub Copilot", "AI in DevOps", "Building with AI APIs") and their sub-topics represent the complete initial content set; the exact sub-topics per module will be finalised during planning.
- Each module contains between 3 and 8 sub-topics; no module has a single sub-topic (which would make module-level completion trivial).
- All data is stored per-browser and per-device; there is no cross-device sync, cloud backup, or account system — participants who switch devices start fresh on the new device.
- The app will be accessed primarily via modern evergreen browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+); no support for Internet Explorer is required.
- The "streak" definition is: calendar days (midnight to midnight, local browser time) on which the user opened the app AND marked at least one topic complete for the first time that day.
- Notes are free-form text with no length enforcement in the UI; the persistence layer may silently truncate at a reasonable limit (e.g., 5,000 characters per note) without breaking the app.
- The app will be served over HTTPS in production (required for service worker registration); local development over `file://` or `http://localhost` is acceptable for development only.
- No analytics, telemetry, or event tracking of any kind is collected or transmitted.
- "Reset Progress" is intended for instructor use at the start of a new cohort; no per-user multi-cohort history is required.

---

## Constitution Check

| Principle | Compliance |
|---|---|
| I. Simplicity & Vanilla First | All UI built with vanilla HTML/CSS/JS; no framework dependencies in app code |
| II. Intuitive UX | All primary actions reachable in ≤ 2 clicks; plain-English labels required |
| III. Accessibility (WCAG 2.1 AA) | Keyboard navigation, ARIA live regions, colour contrast, and focus indicators are all captured in requirements |
| IV. Client-Side Persistence | All data in localStorage/IndexedDB via a dedicated storage module; no backend |
| V. Performance & Offline | Service worker (cache-first), < 200 KB budget, Lighthouse ≥ 90 captured in success criteria |
| VI. Test-Driven Core Logic | Progress calculation, storage, note CRUD, and streak logic all require unit tests |
| VII. Demo-Ready Polish | Animations, responsive viewports, all UI states designed — all captured in requirements |
