const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function fixture({ running = false, fail = false } = {}) {
  let now = 0, timerId = 0, toggles = 0;
  const timers = new Map(), nodes = new Map(), popups = [], events = new Map();
  function node() {
    return { hidden: false, dataset: {}, attributes: {}, handlers: {}, textContent: '', value: 0,
      addEventListener(type, handler) { this.handlers[type] = handler; },
      setAttribute(key, value) { this.attributes[key] = value; }, focus() {}, append() {} };
  }
  const element = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const status = () => ({ running, controllable: true, csrf: 'session-csrf', urls: ['http://127.0.0.1:8080/'] });
  const win = { location: new URL('http://127.0.0.1:8081/'), focus() {},
    addEventListener(type, handler) { events.set(type, handler); }, removeEventListener(type) { events.delete(type); },
    open() {
      const tab = { closed: false, document: { body: {} }, close() { this.closed = true; }, blur() {}, focus() {},
        location: { replace(url) { tab.gameUrl = url; } } };
      popups.push(tab); return tab;
    } };
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  vm.runInNewContext(fs.readFileSync('server-control/app.js', 'utf8'), {
    window: win, document: { querySelector: element, createElement: node }, URL, AbortController,
    performance: { now: () => now },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { due: now + delay, callback }); return id; },
    clearTimeout(id) { timers.delete(id); }, setInterval() {},
    async fetch(path) {
      if (path === '/api/toggle') {
        toggles++;
        if (fail) return { ok: false, status: 409, async json() { return { error: '测试启动失败' }; } };
        running = !running;
      }
      return { ok: true, async json() { return status(); } };
    }
  });
  await flush();
  return { element, popups, events, get toggles() { return toggles; },
    click() { return element('#server-switch').handlers.click(); },
    async advance(milliseconds) {
      const target = now + milliseconds;
      while (true) {
        const entry = [...timers].filter(([, timer]) => timer.due <= target).sort((a, b) => a[1].due - b[1].due)[0];
        if (!entry) break;
        const [id, timer] = entry; timers.delete(id); now = timer.due; timer.callback(); await flush();
      }
      now = target; await flush();
    } };
}

test('startup holds for exactly 2, 6, and 6 seconds, then confirms startup before opening the game', async () => {
  const h = await fixture(), operation = h.click(), progress = h.element('#server-progress');
  assert.equal(h.element('#operation-progress').hidden, false);
  assert.equal(h.element('#operation-message').textContent, '启动中…');
  assert.equal(h.element('#server-switch').disabled, true);
  await h.click(); assert.equal(h.popups.length, 1); assert.equal(h.toggles, 0);
  await h.advance(500); assert.equal(progress.value, 12);
  await h.advance(1999); assert.equal(progress.value, 12); assert.equal(h.toggles, 0);
  await h.advance(1); await h.advance(1000); assert.equal(progress.value, 50);
  await h.advance(5999); assert.equal(progress.value, 50);
  await h.advance(1); await h.advance(800); assert.equal(progress.value, 92);
  await h.advance(5999); assert.equal(progress.value, 92); assert.equal(h.toggles, 0);
  await h.advance(1); assert.equal(h.toggles, 1); assert.equal(h.popups[0].gameUrl, undefined);
  await h.advance(500); await operation;
  assert.equal(progress.value, 100);
  assert.equal(h.popups[0].gameUrl, 'http://127.0.0.1:8080/app.html');
  assert.equal(h.element('#server-status').textContent, '服务器已开启');
  assert.equal(h.element('#server-switch').disabled, false);
  assert.equal(h.element('#operation-progress').hidden, true);
});

test('shutdown progress finishes in 0.5 seconds without holds or opening a game tab', async () => {
  const h = await fixture({ running: true }), operation = h.click(), progress = h.element('#server-progress');
  assert.equal(h.element('#operation-message').textContent, '关闭中…');
  assert.equal(h.toggles, 1); assert.equal(h.popups.length, 0);
  let previous = 0;
  for (let i = 0; i < 5; i++) {
    await h.advance(100); assert.ok(progress.value > previous); previous = progress.value;
  }
  await operation;
  assert.equal(progress.value, 100);
  assert.equal(h.element('#server-status').textContent, '服务器已关闭');
  assert.equal(h.element('#server-switch').disabled, false);
});

test('startup failure closes the reserved tab and restores the real server status', async () => {
  const h = await fixture({ fail: true }), operation = h.click();
  await h.advance(16300); await operation;
  assert.equal(h.popups[0].closed, true);
  assert.equal(h.popups[0].gameUrl, undefined);
  assert.equal(h.element('#control-error').textContent, '测试启动失败');
  assert.equal(h.element('#server-status').textContent, '服务器已关闭');
  assert.equal(h.element('#operation-progress').hidden, true);
});

test('leaving the control page during the pauses cancels startup and closes the waiting tab', async () => {
  const h = await fixture(), operation = h.click();
  await h.advance(500); h.events.get('pagehide')(); await h.advance(20000); await operation;
  assert.equal(h.toggles, 0); assert.equal(h.popups[0].closed, true);
});
