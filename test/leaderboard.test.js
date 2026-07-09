/**
 * test/leaderboard.test.js
 *
 * Tests for leaderboard logic: qualification, sorting, capping, localStorage round-trip.
 * Runnable with: node test/leaderboard.test.js
 *
 * No external test framework.  All helpers defined inline.
 * Imports leaderboard functions from src/leaderboard.js (T096).
 */

// ---------------------------------------------------------------------------
// Inline test helpers
// ---------------------------------------------------------------------------

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  PASS: ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `FAIL: ${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`
    );
  }
  console.log(`  PASS: ${message}`);
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`FAIL: ${message}\n  Expected: ${e}\n  Actual:   ${a}`);
  }
  console.log(`  PASS: ${message}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  const { makeStore, qualifies, addEntry, loadLeaderboard, saveLeaderboard } =
    await import('../src/leaderboard.js').catch((err) => {
      console.error('Import failed:', err.message);
      process.exit(1);
    });

  console.log('\n=== leaderboard.test.js ===\n');

  // T082: qualifies returns true when category is empty (< 5 entries)
  console.log('qualifies — returns true when fewer than 5 entries:');
  {
    const store = makeStore();
    assert(qualifies(store, 'easy', 999), 'empty easy category qualifies any value');
    assert(qualifies(store, 'infinite', 0), 'empty infinite category qualifies any value');
  }

  // T083: qualifies returns false for timed category with 5 entries and a worse (higher ms) value
  console.log('qualifies — returns false when 5 timed entries and new value is worse:');
  {
    const store = makeStore();
    // Populate easy with 5 entries (ascending: 1000…5000 ms)
    let s = store;
    for (let i = 1; i <= 5; i++) {
      s = addEntry(s, 'easy', { name: 'AAA', value: i * 1000, date: '2026-07-01' });
    }
    // 5th-place value is 5000 ms; 99999 > 5000 → worse → should NOT qualify
    assert(!qualifies(s, 'easy', 99999), '99999ms does not beat 5th place 5000ms');
    // 500 < 1000 (1st place) → better → DOES qualify
    assert(qualifies(s, 'easy', 500), '500ms beats 5th place 5000ms');
  }

  // T084: qualifies for infinite when new level is better (higher) than 5th place
  console.log('qualifies — infinite returns true when new level beats 5th:');
  {
    const store = makeStore();
    let s = store;
    // Populate infinite descending: levels 10,8,6,4,2
    for (const lvl of [10, 8, 6, 4, 2]) {
      s = addEntry(s, 'infinite', { name: 'BBB', value: lvl, date: '2026-07-01' });
    }
    // 5th-place value is 2; new level 3 > 2 → qualifies
    assert(qualifies(s, 'infinite', 3), 'level 3 beats 5th-place level 2');
    // level 1 < 2 → does NOT qualify
    assert(!qualifies(s, 'infinite', 1), 'level 1 does not beat 5th-place level 2');
  }

  // T085: addEntry inserts, sorts ascending, caps at 5 for timed
  console.log('addEntry — timed: inserts, sorts ascending, caps at 5:');
  {
    let store = makeStore();
    // Insert 6 entries
    const times = [3000, 1000, 5000, 2000, 4000, 500];
    for (const t of times) {
      store = addEntry(store, 'easy', { name: 'TST', value: t, date: '2026-07-01' });
    }
    const cat = store.easy;
    assertEqual(cat.length, 5, 'easy category capped at 5 entries');
    // Should be the 5 lowest times in ascending order
    const expected = [500, 1000, 2000, 3000, 4000];
    for (let i = 0; i < 5; i++) {
      assertEqual(cat[i].value, expected[i], `entry ${i} value is ${expected[i]}`);
    }
  }

  // T086: addEntry inserts, sorts descending, caps at 5 for infinite
  console.log('addEntry — infinite: inserts, sorts descending, caps at 5:');
  {
    let store = makeStore();
    const levels = [3, 1, 5, 2, 4, 6];
    for (const l of levels) {
      store = addEntry(store, 'infinite', { name: 'INF', value: l, date: '2026-07-01' });
    }
    const cat = store.infinite;
    assertEqual(cat.length, 5, 'infinite category capped at 5 entries');
    // Should be top 5 levels in descending order: 6,5,4,3,2
    const expected = [6, 5, 4, 3, 2];
    for (let i = 0; i < 5; i++) {
      assertEqual(cat[i].value, expected[i], `entry ${i} value is ${expected[i]}`);
    }
  }

  // T087: loadLeaderboard returns makeStore() when localStorage has corrupt JSON
  console.log('loadLeaderboard — corrupt JSON returns empty store:');
  {
    globalThis.localStorage = { getItem: () => 'not-json', setItem: () => {} };
    const loaded = loadLeaderboard();
    assertDeepEqual(loaded, makeStore(), 'corrupt JSON → makeStore()');
    delete globalThis.localStorage; // clean up
  }

  // T088: saveLeaderboard → loadLeaderboard round-trip
  console.log('saveLeaderboard/loadLeaderboard — round-trip:');
  {
    const backingMap = new Map();
    globalThis.localStorage = {
      getItem(key)        { return backingMap.get(key) ?? null; },
      setItem(key, value) { backingMap.set(key, value); },
    };

    let store = makeStore();
    store = addEntry(store, 'easy', { name: 'ABC', value: 1234, date: '2026-07-09' });
    store = addEntry(store, 'infinite', { name: 'XYZ', value: 3, date: '2026-07-09' });
    saveLeaderboard(store);
    const loaded = loadLeaderboard();
    assertDeepEqual(loaded, store, 'loaded store deeply equals saved store');

    delete globalThis.localStorage; // clean up
  }

  console.log('\nAll leaderboard tests passed.\n');
}

runTests().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
