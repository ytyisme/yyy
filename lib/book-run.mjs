/** Pure simulation for Season 2, level 29. No DOM, clocks, or storage. */
export const LANE_WIDTH = 2.4;
export const RUN_LENGTH = 900;

const TYPES = ['chinese', 'math', 'english'];
const LANES = [-1, 0, 1];
const PLAYER_HALF_WIDTH = .34;
const PLAYER_HALF_DEPTH = .28;
const GRAVITY = 20;
const JUMP_SPEED = 7.5;
const INVULNERABLE_SECONDS = .95;

function randomFor(seed) {
  const text = String(seed);
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let n = value;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function createBooks(seed) {
  const random = randomFor(seed), obstacles = [];
  let safeLane = 0, row = 0;
  // Every row has a safe lane. Its route moves at most one lane per row,
  // with at least 20 m (1.4 s at maximum speed) to make the next turn.
  for (let distance = 48; distance < RUN_LENGTH - 35; row++) {
    const possible = LANES.filter(lane => Math.abs(lane - safeLane) <= 1);
    safeLane = possible[Math.floor(random() * possible.length)];
    const blocked = LANES.filter(lane => lane !== safeLane);
    const lanes = row > 2 && random() < .6
      ? blocked
      : [blocked[Math.floor(random() * blocked.length)]];
    lanes.forEach((lane, index) => {
      obstacles.push({
        id: `book-${row}-${index}`,
        type: TYPES[(row + index) % TYPES.length],
        row, lane, distance, x: lane * LANE_WIDTH,
        width: 1.3, depth: 1.85, height: .18,
        hit: false, passed: false,
      });
    });
    const difficulty = distance / RUN_LENGTH;
    distance += 20 + (1 - difficulty) * 7 + random() * 3;
  }
  return obstacles;
}

/**
 * API:
 * - start(): ready -> running; returns whether play started.
 * - restart({autoStart=true}): resets this run using the same seed.
 * - move(-1|1): shifts the target lane once. x follows it smoothly.
 * - jump(): starts a 0.75 s jump, with a 1.4 m apex; no double jump.
 * - setPaused(boolean): pauses/resumes a running game.
 * - step(seconds): advances only running games; caps a delayed frame at 0.1 s.
 * - drainEvents(): returns and removes queued start/jump/hit/dodged/won/lost
 *   and pause/resume events. A hit includes bookId, bookType and health.
 *
 * state and state.obstacles retain their identities across restarts. Obstacle
 * distance/x describe their fixed world positions; state.y is feet above
 * the floor. A passed book is counted once, and each book can damage once.
 */
export function createBookRun({seed = 'dont-run-man-29'} = {}) {
  const obstacles = createBooks(seed), events = [];
  const state = {obstacles, events};

  function emit(type, detail = {}) {
    events.push({type, distance: state.distance, elapsed: state.elapsed, ...detail});
    if (events.length > 96) events.shift();
  }

  function reset() {
    events.length = 0;
    obstacles.forEach(book => {book.hit = false; book.passed = false;});
    Object.assign(state, {
      mode: 'ready', distance: 0, elapsed: 0,
      lane: 0, x: 0, y: 0, vy: 0, jumping: false,
      health: 3, hits: 0, dodged: 0,
      speed: 0, invulnerable: 0, lastHit: null,
    });
  }

  function start() {
    if (state.mode !== 'ready') return false;
    state.mode = 'running';
    state.speed = 10;
    emit('start');
    return true;
  }

  function restart({autoStart = true} = {}) {
    reset();
    if (autoStart) start();
    return state;
  }

  function move(direction) {
    if (state.mode !== 'running' || !Number.isFinite(direction) || !direction) return false;
    const next = Math.max(-1, Math.min(1, state.lane + Math.sign(direction)));
    if (next === state.lane) return false;
    state.lane = next;
    return true;
  }

  function jump() {
    if (state.mode !== 'running' || state.jumping) return false;
    state.jumping = true;
    state.vy = JUMP_SPEED;
    emit('jump');
    return true;
  }

  function setPaused(paused) {
    if (paused && state.mode === 'running') {
      state.mode = 'paused';
      emit('pause');
      return true;
    }
    if (!paused && state.mode === 'paused') {
      state.mode = 'running';
      emit('resume');
      return true;
    }
    return false;
  }

  function step(dt) {
    if (state.mode !== 'running' || !Number.isFinite(dt) || dt <= 0) return state;
    // Substeps make collision checks independent of ordinary frame rate.
    // A suspended tab cannot instantly move the player across a row of books.
    let remaining = Math.min(dt, .1);
    while (remaining > 1e-8 && state.mode === 'running') {
      const h = Math.min(remaining, 1 / 120);
      remaining -= h;
      state.elapsed += h;
      state.invulnerable = Math.max(0, state.invulnerable - h);
      state.x += (state.lane * LANE_WIDTH - state.x) * (1 - Math.exp(-15 * h));
      if (state.jumping) {
        state.y += state.vy * h - .5 * GRAVITY * h * h;
        state.vy -= GRAVITY * h;
        if (state.y <= 0) {state.y = 0; state.vy = 0; state.jumping = false;}
      }
      state.speed = 10 + 4 * Math.min(1, state.distance / RUN_LENGTH);
      state.distance = Math.min(RUN_LENGTH, state.distance + state.speed * h);

      for (const book of obstacles) {
        if (book.passed || book.distance > state.distance + 3) continue;
        const zHalf = book.depth / 2 + PLAYER_HALF_DEPTH;
        const overlapsZ = Math.abs(book.distance - state.distance) < zHalf;
        const overlapsX = Math.abs(book.x - state.x) < book.width / 2 + PLAYER_HALF_WIDTH;
        if (!book.hit && overlapsZ && overlapsX && state.y < book.height + .08 && state.invulnerable <= 0) {
          book.hit = true;
          state.hits++;
          state.health = Math.max(0, state.health - 1);
          state.invulnerable = INVULNERABLE_SECONDS;
          state.lastHit = book.id;
          emit('hit', {bookId: book.id, bookType: book.type, health: state.health});
          if (state.health === 0) {
            state.mode = 'lost'; state.speed = 0;
            emit('lost', {hits: state.hits, dodged: state.dodged});
            break;
          }
        }
        if (state.distance > book.distance + zHalf) {
          book.passed = true;
          if (!book.hit) {
            state.dodged++;
            emit('dodged', {bookId: book.id, bookType: book.type});
          }
        }
      }
      if (state.mode === 'running' && state.distance >= RUN_LENGTH) {
        state.mode = 'won'; state.speed = 0;
        emit('won', {hits: state.hits, dodged: state.dodged, health: state.health});
      }
    }
    return state;
  }

  reset();
  return {state, start, restart, move, jump, setPaused, step, drainEvents: () => events.splice(0)};
}
