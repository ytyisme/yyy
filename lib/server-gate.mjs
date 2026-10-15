// Only the locally controlled 8080 game requires a live server. Hosted and native
// copies keep their existing offline behavior.
export function managedGameUrl(value) {
  const url = new URL(value);
  return url.protocol === 'http:' && url.port === '8080';
}

export function installServerGate(win = window, doc = document) {
  if (!managedGameUrl(win.location.href)) return null;
  let online = false, checking = false, nextFrame = -1;
  const originalFrame = win.requestAnimationFrame.bind(win);
  const originalCancel = win.cancelAnimationFrame.bind(win);
  const frames = new Map(), heldKeys = new Set(), contexts = new Set();
  const overlay = doc.createElement('dialog');
  overlay.id = 'game-server-gate';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'game-server-gate-title');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;margin:0;width:100vw;height:100svh;max-width:none;max-height:none;border:0;padding:24px;box-sizing:border-box;background:#101816f5;color:#eef4ef;font-family:system-ui,"PingFang SC",sans-serif;text-align:center;';
  overlay.innerHTML = '<div style="max-width:360px"><div style="font-size:42px;color:#bfecc9;margin-bottom:22px" aria-hidden="true">⏻</div><h1 id="game-server-gate-title" style="font-size:26px;margin:0 0 16px">正在检查服务器</h1><p style="font-size:14px;color:#a6b8ac;line-height:1.8;margin:0 0 24px">服务器开启后才能进入游戏。<br>请在服务器开关网站登录并开启。</p><a id="game-server-control-link" style="display:inline-block;padding:13px 22px;border-radius:12px;background:#c5efcc;color:#183923;text-decoration:none;font-size:14px">打开服务器开关</a></div>';
  const controlUrl = new URL(win.location.href);
  controlUrl.port = '8081'; controlUrl.pathname = '/'; controlUrl.search = ''; controlUrl.hash = '';
  const link = overlay.querySelector('#game-server-control-link');
  link.href = controlUrl.href; link.target = '_blank'; link.rel = 'noopener';
  doc.body.append(overlay);
  overlay.addEventListener('cancel', event => event.preventDefault());
  overlay.showModal();

  function schedule(id, frame) {
    frame.native = originalFrame(time => {
      frame.native = null;
      if (!online) return;
      frames.delete(id);
      frame.callback(time);
    });
  }
  win.requestAnimationFrame = callback => {
    const id = nextFrame--, frame = { callback, native: null };
    frames.set(id, frame);
    if (online) schedule(id, frame);
    return id;
  };
  win.cancelAnimationFrame = id => {
    const frame = frames.get(id);
    if (!frame) { originalCancel(id); return; }
    if (frame.native !== null) originalCancel(frame.native);
    frames.delete(id);
  };

  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const Native = win[name];
    if (typeof Native !== 'function') continue;
    win[name] = new Proxy(Native, { construct(target, args) {
      const context = Reflect.construct(target, args);
      contexts.add(context);
      if (!online) context.suspend().catch(() => {});
      return context;
    } });
  }

  function setOnline(value) {
    const changed = value !== online;
    online = value;
    overlay.hidden = value;
    // Inline display overrides the UA's hidden style, so remove it explicitly.
    overlay.style.display = value ? 'none' : 'grid';
    if (value) overlay.close();
    else if (!overlay.open) overlay.showModal();
    doc.documentElement.dataset.gameServer = value ? 'on' : 'off';
    overlay.querySelector('#game-server-gate-title').textContent = '服务器已关闭';
    if (!changed) return;
    if (value) {
      for (const [id, frame] of frames) if (frame.native === null) schedule(id, frame);
      for (const context of contexts) if (context.state === 'suspended') context.resume().catch(() => {});
    } else {
      for (const frame of frames.values()) {
        if (frame.native !== null) originalCancel(frame.native);
        frame.native = null;
      }
      win.dispatchEvent(new win.Event('blur'));
      for (const code of heldKeys) win.dispatchEvent(new win.KeyboardEvent('keyup', { code }));
      heldKeys.clear();
      for (const media of doc.querySelectorAll('audio,video')) media.pause();
      for (const context of contexts) if (context.state === 'running') context.suspend().catch(() => {});
      link.focus({ preventScroll: true });
    }
  }

  function input(event) {
    // Synthetic key releases clear movement state when the server turns off.
    if (event.isTrusted === false) return;
    if (online) {
      if (event.type === 'keydown') heldKeys.add(event.code);
      if (event.type === 'keyup') heldKeys.delete(event.code);
      return;
    }
    if (overlay.contains(event.target)) {
      if (event.type === 'keydown' && event.key === 'Tab') { event.preventDefault(); link.focus(); }
      event.stopImmediatePropagation();
      return;
    }
    if (event.metaKey || event.ctrlKey) return;
    event.preventDefault(); event.stopImmediatePropagation();
  }
  for (const type of ['keydown', 'keyup', 'click', 'pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchmove', 'touchend', 'wheel']) {
    win.addEventListener(type, input, { capture: true, passive: false });
  }

  async function check() {
    if (checking) return;
    checking = true;
    const abort = new win.AbortController();
    const timeout = win.setTimeout(() => abort.abort(), 1500);
    try {
      // The worker deliberately never caches this endpoint.
      const result = await win.fetch(`/version.json?live=${Date.now()}`, { cache: 'no-store', signal: abort.signal });
      const status = result.ok ? await result.json() : null;
      setOnline(status?.gameServer === true);
    } catch { setOnline(false); }
    finally { win.clearTimeout(timeout); checking = false; }
  }
  win.addEventListener('online', check);
  win.addEventListener('offline', () => setOnline(false));
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) check(); });
  const timer = win.setInterval(check, 1000);
  check();
  return { check, get online() { return online; }, overlay, timer };
}
