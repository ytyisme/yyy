// Season 2, level 29: book obstacles, movement and run lifecycle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBookRun, LANE_WIDTH, RUN_LENGTH} from '../lib/book-run.mjs';

function advanceUntil(game, predicate, frames = 20000) {
  for (let i = 0; i < frames && !predicate(); i++) game.step(1 / 60);
  assert.ok(predicate(), 'simulation reached its expected outcome');
}
function chooseLane(game, lane) {
  while (game.state.lane !== lane) game.move(Math.sign(lane - game.state.lane));
}
function rows(game) {
  const grouped = new Map();
  game.state.obstacles.forEach(book => {
    if (!grouped.has(book.row)) grouped.set(book.row, []);
    grouped.get(book.row).push(book);
  });
  return [...grouped.values()];
}

test('deterministic three-subject course has an open route and sufficient reaction distance', () => {
  const game = createBookRun({seed: 29}), again = createBookRun({seed: 29});
  assert.deepEqual(game.state.obstacles, again.state.obstacles);
  assert.notDeepEqual(game.state.obstacles, createBookRun({seed: 30}).state.obstacles);
  assert.deepEqual(new Set(game.state.obstacles.map(book => book.type)), new Set(['chinese', 'math', 'english']));
  const grouped = rows(game);
  assert.ok(grouped[0][0].distance >= 40);
  for (let i = 0; i < grouped.length; i++) {
    const row = grouped[i];
    assert.ok(row.length <= 2);
    assert.equal(new Set(row.map(book => book.lane)).size, row.length);
    assert.ok(row.every(book => book.x === book.lane * LANE_WIDTH));
    if (i) assert.ok(row[0].distance - grouped[i - 1][0].distance >= 20);
  }
});

test('ordinary steering can win without jumping across ten seeded courses', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const game = createBookRun({seed}), course = rows(game);
    game.start();
    let index = 0;
    for (let i = 0; i < 10000 && game.state.mode === 'running'; i++) {
      while (index < course.length && game.state.distance > course[index][0].distance + 2) index++;
      if (index < course.length) {
        const blocked = new Set(course[index].map(book => book.lane));
        const safe = [-1, 0, 1].filter(lane => !blocked.has(lane));
        safe.sort((a, b) => Math.abs(a - game.state.lane) - Math.abs(b - game.state.lane));
        chooseLane(game, safe[0]);
      }
      game.step(1 / 60);
    }
    assert.equal(game.state.mode, 'won', `seed ${seed}`);
    assert.equal(game.state.health, 3, `seed ${seed}`);
    assert.equal(game.state.hits, 0);
    assert.equal(game.state.distance, RUN_LENGTH);
    assert.equal(game.state.dodged, game.state.obstacles.length);
    assert.ok(game.drainEvents().some(event => event.type === 'won'));
    const end = game.state.distance;
    game.step(20);
    assert.equal(game.state.distance, end);
  }
});

test('standing in a book lane takes damage once per book and eventually loses', () => {
  const game = createBookRun({seed: 29}), target = game.state.obstacles[0];
  game.start();
  chooseLane(game, target.lane);
  advanceUntil(game, () => game.state.hits === 1);
  assert.equal(game.state.health, 2);
  assert.equal(target.hit, true);
  assert.ok(game.state.invulnerable > 0);
  const hitEvents = game.drainEvents().filter(event => event.type === 'hit');
  assert.equal(hitEvents.length, 1);
  assert.equal(hitEvents[0].bookId, target.id);
  assert.equal(hitEvents[0].bookType, target.type);
  game.step(.1);
  assert.equal(game.state.hits, 1);
  advanceUntil(game, () => game.state.mode === 'lost');
  assert.equal(game.state.health, 0);
  assert.equal(game.state.hits, 3);
  assert.ok(game.drainEvents().some(event => event.type === 'lost'));
  const stopped = game.state.distance;
  game.step(.1);
  assert.equal(game.state.distance, stopped);
});

test('a timed jump clears a physical book, lands, and rejects a second midair jump', () => {
  const game = createBookRun({seed: 29}), target = game.state.obstacles[0];
  game.start();
  chooseLane(game, target.lane);
  advanceUntil(game, () => game.state.distance >= target.distance - 3.8);
  assert.equal(game.jump(), true);
  assert.equal(game.jump(), false);
  let apex = 0;
  for (let i = 0; i < 48; i++) {game.step(1 / 60); apex = Math.max(apex, game.state.y);}
  assert.ok(apex > 1.35 && apex < 1.45);
  assert.equal(game.state.y, 0);
  assert.equal(game.state.jumping, false);
  assert.equal(target.passed, true);
  assert.equal(target.hit, false);
  assert.equal(game.state.health, 3);
});

test('ready, paused, invalid and delayed frames cannot skip play; restart restores all state', () => {
  const game = createBookRun(), state = game.state, books = state.obstacles;
  game.step(10);
  assert.equal(state.distance, 0);
  assert.equal(game.move(1), false);
  assert.equal(game.jump(), false);
  game.start();
  game.step(1000);
  assert.ok(state.distance > .9 && state.distance < 1.1);
  const distance = state.distance, elapsed = state.elapsed;
  for (const bad of [NaN, Infinity, -1, 0]) game.step(bad);
  assert.equal(state.distance, distance);
  assert.equal(state.elapsed, elapsed);
  assert.equal(game.setPaused(true), true);
  const paused = structuredClone(state);
  game.step(.1);
  game.move(1);
  game.jump();
  assert.deepEqual(state, paused);
  assert.equal(game.setPaused(false), true);
  game.step(.1);
  assert.ok(state.distance > distance);
  game.restart({autoStart: false});
  assert.equal(game.state, state);
  assert.equal(state.obstacles, books);
  assert.equal(state.mode, 'ready');
  assert.equal(state.distance, 0);
  assert.equal(state.elapsed, 0);
  assert.equal(state.health, 3);
  assert.equal(state.x, 0);
  assert.equal(state.hits, 0);
  assert.equal(state.dodged, 0);
  assert.equal(state.events.length, 0);
  assert.ok(books.every(book => !book.hit && !book.passed));
  game.restart();
  assert.equal(state.mode, 'running');
  assert.equal(game.drainEvents().length, 1);
  assert.equal(game.drainEvents().length, 0);
});
