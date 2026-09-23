const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, props = {}) {
      const event = { button: 0, pointerId: 1, clientX: 0, clientY: 0, preventDefault() {}, ...props };
      for (const fn of listeners.get(type) || []) fn(event);
    },
    setPointerCapture() {},
    releasePointerCapture() {},
  };
}

function runtime(files = ["lib/util.js", "lib/levelkit.js", "lib/progress.js", "lib/scenes.js"]) {
  const storage = new Map();
  const sandbox = {
    ...eventTarget(),
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) },
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const file of files) vm.runInContext(source(file), context, { filename: file });
  return { context, storage, ...sandbox };
}

function drawing() {
  const env = runtime();
  let scene = { phase: "draw", strokes: [], drawing: null, ink: 10 };
  let blocked = false;
  let exhausted = 0;
  const canvas = eventTarget();
  const tool = env.GameLevelKit.createStrokeTool({
    sceneRef: () => scene,
    clampPoint: (x, y) => ({ x, y }),
    makeStroke: (p, width) => ({ points: [p], width, supported: true }),
    onInkOut: () => exhausted++,
  });
  const cfg = { canvas, sceneRef: () => scene, tool, clientToWorld: (x, y) => ({ x, y }), isBlocked: () => blocked, boundKey: "drawBound" };
  const dispose = env.GameLevelKit.bindDrawPointer(cfg);
  return { env, tool, canvas, cfg, dispose, get scene() { return scene; }, set scene(s) { scene = s; }, block() { blocked = true; }, exhausted: () => exhausted };
}

test("drawing consumes only available ink, preserves custom fields and ends once", () => {
  const d = drawing();
  d.tool.begin(0, 0);
  d.tool.extend(30, 0);
  assert.equal(d.scene.ink, 0);
  assert.equal(d.scene.inkSpent, 10);
  assert.equal(d.scene.strokes[0].points[1].x, 10);
  assert.equal(d.scene.strokes[0].supported, true);
  assert.equal(d.scene.drawing, null);
  d.tool.extend(50, 0);
  assert.equal(d.exhausted(), 1);
});

test("drawing supports infinite ink, removes taps and rejects invalid input or finished scenes", () => {
  const d = drawing();
  d.scene.ink = Infinity;
  assert.equal(d.tool.begin(NaN, 0), false);
  d.tool.begin(0, 0);
  d.tool.end();
  assert.equal(d.scene.strokes.length, 0);
  d.tool.begin(0, 0);
  d.tool.extend(Infinity, 2);
  d.tool.extend(100, 0);
  assert.equal(d.scene.ink, Infinity);
  assert.equal(d.scene.inkSpent, 100);
  d.scene.phase = "flow";
  d.tool.extend(200, 0);
  assert.equal(d.scene.inkSpent, 100);
  assert.equal(d.tool.begin(0, 0), false);
  d.scene.phase = "draw";
  d.scene.done = true;
  assert.equal(d.tool.begin(0, 0), false);
});

test("only the pointer that started a stroke can move or end it", () => {
  const d = drawing();
  d.canvas.emit("pointerdown");
  d.canvas.emit("pointerdown", { pointerId: 2 });
  d.canvas.emit("pointermove", { pointerId: 2, clientX: 8 });
  d.env.emit("pointerup", { pointerId: 2 });
  assert.equal(d.scene.strokes.length, 1);
  assert.equal(d.scene.drawing.points.length, 1);
  d.canvas.emit("pointermove", { clientX: 5 });
  d.env.emit("pointerup");
  assert.equal(d.scene.strokes[0].points.length, 2);
  assert.equal(d.scene.drawing, null);
});

test("drawing stops on cancellation, capture loss, window blur and blocked UI", () => {
  for (const reason of ["pointercancel", "lostpointercapture", "blur", "blocked"]) {
    const d = drawing();
    d.canvas.emit("pointerdown");
    if (reason === "blocked") {
      d.block();
      d.canvas.emit("pointermove", { clientX: 5 });
    } else if (reason === "blur") d.env.emit(reason);
    else d.canvas.emit(reason);
    assert.equal(d.scene.drawing, null, reason);
    assert.equal(d.scene.strokes.length, 0, reason);
  }
});

test("scene switches cannot extend the new scene; bindings are reusable and disposable", () => {
  const d = drawing();
  assert.equal(d.env.GameLevelKit.bindDrawPointer(d.cfg), d.dispose);
  d.canvas.emit("pointerdown");
  const oldScene = d.scene;
  const newStroke = { points: [{ x: 1, y: 1 }] };
  d.scene = { phase: "draw", ink: 10, drawing: newStroke, strokes: [newStroke] };
  d.canvas.emit("pointermove", { clientX: 9 });
  assert.equal(oldScene.drawing, null);
  assert.equal(d.scene.drawing, newStroke);
  assert.equal(newStroke.points.length, 1);
  d.dispose();
  assert.equal(d.canvas.drawBound, undefined);
  d.canvas.emit("pointerdown");
  assert.equal(d.scene.drawing, newStroke);
  assert.equal(typeof d.env.GameLevelKit.bindDrawPointer(d.cfg), "function");
});

test("toast follows the current scene and expires without negative timers", () => {
  const { GameLevelKit: kit } = runtime();
  let scene = null;
  const toast = kit.makeToast(() => scene, 2.2);
  toast("ignored");
  scene = {};
  toast("hello");
  assert.equal(scene.toastT, 2.2);
  kit.tickToast(scene, NaN);
  kit.tickToast(scene, -1);
  assert.equal(scene.toastT, 2.2);
  kit.tickToast(scene, 3);
  assert.equal(scene.toastT, 0);
  assert.equal(scene.toast, "");
  scene = {};
  toast("new", 1);
  assert.equal(scene.toastT, 1);
});

test("progress accepts legacy saves, restricts keys and sanitizes invalid counts", () => {
  const { GameProgress, storage } = runtime();
  storage.set("yyy_stars", "12.9");
  storage.set("yyy_cleared", "999");
  storage.set("yyy_inventory", JSON.stringify({ skip: "3", bucket: "Infinity", sword: -5, potion: true, unknown: 99 }));
  const result = GameProgress.load({ skip: 0, bucket: 0, sword: 0, potion: 0 }, 32);
  assert.equal(result.stars, 12);
  assert.equal(result.maxCleared, 32);
  assert.deepEqual({ ...result.inventory }, { skip: 3, bucket: 0, sword: 0, potion: 0 });
  for (const raw of ["{invalid", "null", "[]", "true", '"string"']) {
    storage.set("yyy_inventory", raw);
    storage.set("yyy_redeemed_codes", raw);
    assert.equal(GameProgress.load({ skip: 0 }, 32).inventory.skip, 0);
    assert.equal(Object.keys(GameProgress.loadRedeemedCodes()).length, 0);
  }
  storage.set("yyy_redeemed_codes", '{"used":123,"bad":"Infinity","__proto__":456}');
  const codes = GameProgress.loadRedeemedCodes();
  assert.equal(Object.getPrototypeOf(codes), null);
  assert.equal(codes.used, 123);
  assert.equal(codes.bad, undefined);
});

test("unavailable localStorage falls back to default progress", () => {
  const env = runtime();
  env.context.localStorage = { getItem() { throw new Error("denied"); } };
  const saved = env.GameProgress.load({ skip: 0 }, 32);
  assert.equal(saved.stars, 0);
  assert.equal(saved.maxCleared, 0);
  assert.equal(saved.inventory.skip, 0);
});

function registry() {
  const env = runtime();
  const reg = env.GameSceneReg;
  const state = {};
  const calls = [];
  reg.bind({ get: (key) => state[key], set: (key, value) => { state[key] = value; } });
  for (const d of reg.DEFS) {
    env.context[d.install] = (scope) => {
      for (const field of ["init", "update", "draw", "drawAfter", "leave", "click"]) {
        if (d[field]) scope[d[field]] = () => { calls.push(`${d.level}:${field}`); return false; };
      }
    };
  }
  reg.installAll({});
  return { env, reg, state, calls };
}

test("scene click priority includes zero and stops when handled", () => {
  const { reg, calls } = registry();
  reg.tryClickAll(0, 0);
  assert.deepEqual(calls, ["29:click", "30:click", "31:click", "32:click", "35:click", "14:click", "15:click", "20:click"]);
  calls.length = 0;
  reg.hooks.tryClickMaliang30 = () => true;
  assert.equal(reg.tryClickAll(0, 0), true);
  assert.deepEqual(calls, ["29:click"]);
});

test("scene lifecycle dispatches active hooks and clears scene state", () => {
  const { reg, state, calls } = registry();
  reg.applyOpts({ subwayScene: {} });
  reg.updateAll(0.01);
  reg.drawExtras(15);
  assert.deepEqual(calls, ["15:update", "15:draw", "15:drawAfter"]);
  calls.length = 0;
  reg.initLevel(15);
  assert.ok(calls.includes("15:init"));
  assert.equal(calls.filter((name) => name.endsWith(":leave")).length, reg.DEFS.length - 1);
  reg.clearScenes();
  assert.ok(Object.values(state).every((value) => value === null));
});

test("missing scene scripts or hooks fail with the affected level", () => {
  const { reg, env } = registry();
  env.context.installPipe32 = undefined;
  assert.throws(() => reg.installAll({}), /32.*installPipe32/);
  env.context.installPipe32 = () => {};
  assert.throws(() => reg.installAll({}), /32.*initPipe32/);
  assert.throws(() => reg.bind({}), /get\/set/);
});

test("all locally referenced scripts parse and real scene installers satisfy the registry", () => {
  const env = runtime([]);
  env.context.document = { getElementById: () => null };
  const scripts = [...source("index.html").matchAll(/<script src="([^"?]+)(?:\?[^" ]*)?"/g)]
    .map((match) => match[1]).filter((file) => !file.includes("://"));
  for (const file of scripts) {
    new vm.Script(source(file), { filename: file });
    if (file.startsWith("lib/") || file.startsWith("levels/")) {
      vm.runInContext(source(file), env.context, { filename: file });
    }
  }
  const scope = { canvas: eventTarget(), clientToWorld: (x, y) => ({ x, y }) };
  env.context.GameSceneReg.installAll(scope);
  for (let level = 1; level <= 32; level++) {
    assert.equal(typeof env.context.GameLevels.builders[level], "function", `level ${level}`);
  }
});
