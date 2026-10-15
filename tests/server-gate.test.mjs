import test from 'node:test';
import assert from 'node:assert/strict';
import { managedGameUrl, installServerGate } from '../lib/server-gate.mjs';

function harness() {
  let network = async () => { throw new Error('off'); }, frameId = 0;
  const pending = new Map(), events = new Map(), title = { textContent: '' }, link = { focus() {} };
  const overlay = { style: {}, hidden: false, open: false, setAttribute() {},
    querySelector(selector) { return selector.endsWith('-title') ? title : link; },
    contains(target) { return target === link || target === this; },
    showModal() { this.open = true; }, close() { this.open = false; }, addEventListener() {} };
  const doc = { body: { append() {} }, documentElement: { dataset: {} }, hidden: false,
    createElement() { return overlay; }, querySelectorAll() { return []; }, addEventListener() {} };
  const win = { location: new URL('http://127.0.0.1:8080/season2-lv15.html'), AbortController, Event,
    KeyboardEvent: class { constructor(type, value) { Object.assign(this, { type }, value); } },
    requestAnimationFrame(callback) { const id = ++frameId; pending.set(id, callback); return id; },
    cancelAnimationFrame(id) { pending.delete(id); },
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 2; },
    fetch(...args) { return network(...args); },
    addEventListener(type, callback) { events.set(type, callback); }, dispatchEvent() {} };
  const gate = installServerGate(win, doc);
  return { win, doc, gate, overlay, link, events, title,
    network(fn) { network = fn; },
    frame() { const entries = [...pending.values()]; pending.clear(); entries.forEach(callback => callback(16)); } };
}

test('only the 8080 HTTP game is controlled; hosted and native offline play is unchanged', () => {
  assert.ok(managedGameUrl('http://127.0.0.1:8080/app.html'));
  assert.ok(managedGameUrl('http://192.168.31.96:8080/app.html'));
  for (const href of ['https://game.example/app.html', 'file:///game/app.html', 'http://127.0.0.1:8081/']) {
    assert.ok(!managedGameUrl(href));
    assert.equal(installServerGate({ location: { href } }, {}), null);
  }
});

test('offline startup and shutdown freeze frames; a verified restart resumes the same game', async () => {
  const h = harness();
  await h.gate.check(); // Initial automatic check may still be pending.
  await Promise.resolve();
  assert.equal(h.gate.online, false);
  assert.equal(h.overlay.open, true);
  let frames = 0;
  function step() { frames++; h.win.requestAnimationFrame(step); }
  h.win.requestAnimationFrame(step);
  h.frame(); assert.equal(frames, 0);
  h.network(async (_path, options) => {
    assert.equal(options.cache, 'no-store');
    return { ok: true, async json() { return { gameServer: true }; } };
  });
  await h.gate.check(); assert.equal(h.gate.online, true); assert.equal(h.overlay.open, false);
  h.frame(); assert.equal(frames, 1);
  h.network(async () => { throw new Error('server stopped'); });
  await h.gate.check();
  assert.equal(h.gate.online, false); assert.equal(h.title.textContent, '服务器已关闭');
  h.frame(); assert.equal(frames, 1);
  h.network(async () => ({ ok: true, async json() { return { gameServer: true }; } }));
  await h.gate.check(); h.frame(); assert.equal(frames, 2);
});

test('HTTP errors and unrelated successful responses cannot unlock the game', async () => {
  const h = harness(); await Promise.resolve(); await Promise.resolve();
  for (const response of [{ ok: false }, { ok: true, async json() { return { build: 'other' }; } }]) {
    h.network(async () => response); await h.gate.check(); assert.equal(h.gate.online, false);
  }
});

test('shutdown blocks keyboard and pointer controls, including keys focused on the maintenance dialog', async () => {
  const h = harness(); await Promise.resolve(); await Promise.resolve();
  for (const type of ['keydown', 'click', 'touchstart']) {
    const event = { type, target: {}, isTrusted: true, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
    h.events.get(type)(event); assert.equal(event.prevented, true); assert.equal(event.stopped, true);
  }
  const onLink = { type: 'keydown', key: 'e', target: h.link, isTrusted: true, stopImmediatePropagation() { this.stopped = true; } };
  h.events.get('keydown')(onLink); assert.equal(onLink.stopped, true);
  let fired = false; const frame = h.win.requestAnimationFrame(() => { fired = true; }); h.win.cancelAnimationFrame(frame);
  h.network(async () => ({ ok: true, async json() { return { gameServer: true }; } }));
  await h.gate.check(); h.frame(); assert.equal(fired, false);
});
