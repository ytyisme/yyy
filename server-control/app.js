const loginPanel = document.querySelector('#login-panel');
const controlPanel = document.querySelector('#control-panel');
const loginForm = document.querySelector('#login-form');
const loginButton = document.querySelector('#login-button');
const serverSwitch = document.querySelector('#server-switch');
const loginError = document.querySelector('#login-error');
const controlError = document.querySelector('#control-error');
const progressPanel = document.querySelector('#operation-progress');
const progressBar = document.querySelector('#server-progress');
const progressMessage = document.querySelector('#operation-message');
const progressPercent = document.querySelector('#operation-percent');
const switchHint = document.querySelector('#switch-hint');
let csrf = '';
let busy = false;
let disconnected = false;

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/login') showLogin();
    throw new Error(data.error || '连接失败，请重试');
  }
  return data;
}

function showLogin() {
  csrf = '';
  serverSwitch.disabled = true;
  controlPanel.hidden = true;
  loginPanel.hidden = false;
}

function showStatus(data) {
  if (data.csrf) csrf = data.csrf;
  loginPanel.hidden = true;
  controlPanel.hidden = false;
  controlPanel.dataset.running = String(data.running);
  document.querySelector('#server-status').textContent = data.running ? '服务器已开启' : '服务器已关闭';
  document.querySelector('#switch-hint').textContent = data.running ? '点击关闭服务器' : '点击开启服务器';
  serverSwitch.setAttribute('aria-pressed', String(data.running));
  serverSwitch.disabled = busy || !data.controllable;
  if (disconnected) { controlError.textContent = ''; disconnected = false; }
  const lan = data.urls.find(url => new URL(url).hostname.startsWith('192.')) || data.urls[1];
  document.querySelector('#lan-label').textContent = lan ? `局域网 · ${new URL(lan).hostname}` : '局域网 · 等待连接';
  if (!data.controllable) controlError.textContent = '8080端口被其他服务占用，无法控制。';
}

function prepareGameTab() {
  // Reserve the tab during the click, before awaiting server startup, so browsers
  // recognize the opening as a user action.
  try {
    const tab = window.open('about:blank', '_blank');
    if (tab) {
      tab.opener = null;
      tab.document.title = '游戏启动中';
      tab.document.body.textContent = '正在开启服务器，稍后进入游戏…';
      try { tab.blur(); window.focus(); } catch (_) {}
    }
    return tab;
  } catch (_) { return null; }
}

function openGame(tab) {
  const url = new URL(window.location.href);
  url.port = '8080';
  url.pathname = '/app.html';
  url.search = '';
  url.hash = '';
  if (tab && !tab.closed) {
    try {
      tab.location.replace(url.href);
      try { tab.focus(); } catch (_) {}
      return;
    } catch (_) {}
  }
  controlError.textContent = '服务器已开启，浏览器未能自动打开新标签页。';
  const link = document.createElement('a');
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = '进入游戏';
  controlError.append(' ', link);
}

function setProgress(value) {
  progressBar.value = value;
  progressPercent.textContent = `${Math.round(value)}%`;
}

function animateProgress(from, to, duration, signal) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    let timer;
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      reject(signal.reason || new Error('操作已取消'));
    };
    const tick = () => {
      const elapsed = performance.now() - started;
      setProgress(from + (to - from) * Math.min(1, elapsed / duration));
      if (elapsed >= duration) {
        signal.removeEventListener('abort', cancel);
        resolve();
      } else {
        // Timers also complete if the reserved game tab is in the foreground.
        timer = setTimeout(tick, Math.min(40, duration - elapsed));
      }
    };
    if (signal.aborted) { cancel(); return; }
    signal.addEventListener('abort', cancel, { once: true });
    tick();
  });
}

async function startupProgress(signal) {
  for (const [from, to, duration] of [
    [0, 12, 500], [12, 12, 2000],
    [12, 50, 1000], [50, 50, 6000],
    [50, 92, 800], [92, 92, 6000]
  ]) await animateProgress(from, to, duration, signal);
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.textContent = '';
  loginButton.disabled = true;
  try {
    const data = await request('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: document.querySelector('#name').value, password: document.querySelector('#password').value })
    });
    document.querySelector('#password').value = '';
    showStatus(data);
    serverSwitch.focus();
  } catch (error) {
    loginError.textContent = error.message;
  } finally {
    loginButton.disabled = false;
  }
});

serverSwitch.addEventListener('click', async () => {
  if (busy || !csrf) return;
  const opening = controlPanel.dataset.running !== 'true';
  const gameTab = opening ? prepareGameTab() : null;
  const animation = new AbortController();
  const abandon = () => {
    animation.abort(new Error('操作已取消'));
    if (gameTab && !gameTab.closed) gameTab.close();
  };
  window.addEventListener('pagehide', abandon, { once: true });
  busy = true;
  serverSwitch.disabled = true;
  serverSwitch.setAttribute('aria-busy', 'true');
  serverSwitch.setAttribute('aria-describedby', 'operation-message');
  controlError.textContent = '';
  setProgress(0);
  progressPanel.hidden = false;
  switchHint.hidden = true;
  progressMessage.textContent = opening ? '启动中…' : '关闭中…';
  document.querySelector('#server-status').textContent = opening ? '正在启动服务器' : '正在关闭服务器';
  try {
    const toggle = () => request('/api/toggle', { method: 'POST', headers: { 'X-CSRF-Token': csrf } });
    let data;
    if (opening) {
      await startupProgress(animation.signal);
      data = await toggle();
      await animateProgress(92, 100, 500, animation.signal);
    } else {
      [data] = await Promise.all([toggle(), animateProgress(0, 100, 500, animation.signal)]);
    }
    busy = false;
    showStatus(data);
    if (opening && data.running) openGame(gameTab);
    else if (gameTab && !gameTab.closed) gameTab.close();
  } catch (error) {
    animation.abort();
    if (gameTab && !gameTab.closed) gameTab.close();
    busy = false;
    controlError.textContent = error.message;
    try { showStatus(await request('/api/status')); } catch (_) {}
  } finally {
    window.removeEventListener('pagehide', abandon);
    progressPanel.hidden = true;
    switchHint.hidden = false;
    serverSwitch.setAttribute('aria-busy', 'false');
    serverSwitch.setAttribute('aria-describedby', 'switch-hint');
  }
});

request('/api/session').then(showStatus).catch(error => {
  if (error.message !== '请先输入正确的姓名和密码') loginError.textContent = '无法连接控制服务，请刷新重试。';
});
setInterval(async () => {
  if (!csrf || busy) return;
  try {
    const data = await request('/api/status');
    if (!busy) showStatus(data);
  } catch (error) {
    if (busy) return;
    disconnected = true;
    serverSwitch.disabled = true;
    document.querySelector('#server-status').textContent = '控制网站连接中断';
    document.querySelector('#switch-hint').textContent = '正在重新连接…';
    controlError.textContent = error.message;
  }
}, 5000);
