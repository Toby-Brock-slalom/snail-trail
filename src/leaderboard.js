/**
 * src/leaderboard.js
 *
 * Exports: LEADERBOARD_KEY, LEADERBOARD_MAX_ENTRIES,
 *          makeStore, qualifies, addEntry, loadLeaderboard, saveLeaderboard
 *
 * Pure functions (makeStore, qualifies, addEntry) have no side-effects.
 * loadLeaderboard / saveLeaderboard access localStorage with try/catch.
 *
 * Identical function bodies are mirrored inline in index.html for file:// compat.
 */

export const LEADERBOARD_KEY        = 'snailTrailLeaderboard';
export const LEADERBOARD_MAX_ENTRIES = 5;

/** Returns a fresh empty store. */
export function makeStore() {
  return { easy: [], medium: [], hard: [], infinite: [] };
}

/**
 * Returns true if the given value qualifies for the leaderboard category.
 * @param {{ easy: Entry[], medium: Entry[], hard: Entry[], infinite: Entry[] }} store
 * @param {'easy'|'medium'|'hard'|'infinite'} category
 * @param {number} value  – ms for timed categories; level index for infinite
 */
export function qualifies(store, category, value) {
  const cat = store[category];
  if (!cat || cat.length < LEADERBOARD_MAX_ENTRIES) return true;
  const lastValue = cat[LEADERBOARD_MAX_ENTRIES - 1].value;
  return category === 'infinite' ? value > lastValue : value < lastValue;
}

/**
 * Inserts an entry, sorts and caps the category, returns a new store (immutable).
 * @param {object} store
 * @param {'easy'|'medium'|'hard'|'infinite'} category
 * @param {{ name: string, value: number, date: string }} entry
 */
export function addEntry(store, category, entry) {
  const cat = [...(store[category] || []), entry];
  if (category === 'infinite') {
    cat.sort((a, b) => b.value - a.value);   // descending – higher level is better
  } else {
    cat.sort((a, b) => a.value - b.value);   // ascending  – lower time is better
  }
  return { ...store, [category]: cat.slice(0, LEADERBOARD_MAX_ENTRIES) };
}

/**
 * Loads the leaderboard from localStorage.
 * Returns makeStore() on missing key, corrupt JSON, or any error.
 */
export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return makeStore();
    return JSON.parse(raw) ?? makeStore();
  } catch {
    return makeStore();
  }
}

/**
 * Persists the store to localStorage.  Silently ignores all errors.
 * @param {object} store
 */
export function saveLeaderboard(store) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(store));
  } catch { /* silent – e.g. private mode quota */ }
}
