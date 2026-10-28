import * as THREE from './lib/three.module.js';
import {createBookRun, LANE_WIDTH, RUN_LENGTH} from './lib/book-run.mjs';
import {createHazmatAvatar} from './lib/chase-avatar.mjs';

const $ = id => document.getElementById(id);
const game = createBookRun({seed: 290428});
const state = game.state;
const names = {chinese: '语文', math: '数学', english: '英语'};
const colors = {chinese: '#ce5151', math: '#419cb5', english: '#d9a453'};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer, last = performance.now(), thirdPerson = true, soundEnabled = true;
let audioContext, messageUntil = 0, flash = 0, saved = false, hudTime = 0;
let currentSection = 0, contextLost = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8c7b7);
scene.fog = new THREE.Fog(0xc4cdb6, 42, 155);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, .08, 185);
try {
  renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
} catch (error) {
  $('start').disabled = true;
  $('start').textContent = '此浏览器无法开启 3D 画面';
  document.querySelector('.intro-copy').textContent = '请换用支持 WebGL 的浏览器，再打开第29关。';
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
$('world').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff6d9, 0x52766a, 2.6));
const sun = new THREE.DirectionalLight(0xffe5ad, 2.4);
sun.position.set(-8, 7, 4);
scene.add(sun);

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map();
function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({color, roughness: .78}));
  return materials.get(color);
}
function block(parent, x, y, z, w, h, d, color) {
  const mesh = new THREE.Mesh(unitBox, material(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  parent.add(mesh);
  return mesh;
}
function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}
const signTexture = canvasTexture(1536, 384, (ctx, w, h) => {
  ctx.fillStyle = '#ebe5cc'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#315447'; ctx.lineWidth = 10; ctx.strokeRect(17, 17, w - 34, h - 34);
  ctx.fillStyle = '#843d31'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 126px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('别跑了 兄弟', w / 2, 142, w - 110);
  ctx.fillStyle = '#315447'; ctx.font = '500 56px sans-serif';
  ctx.fillText("Don't run, man", w / 2, 270, w - 110);
});
const exitTexture = canvasTexture(640, 160, (ctx, w, h) => {
  ctx.fillStyle = '#245e4e'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f7f2cd'; ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('出口  EXIT  →', w / 2, h / 2);
});
const classTexture = canvasTexture(320, 160, (ctx, w, h) => {
  ctx.fillStyle = '#f2ead3'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3b6454'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 56px sans-serif'; ctx.fillText('六年级', w / 2, 61);
  ctx.font = '20px sans-serif'; ctx.fillText('CLASSROOM', w / 2, 117);
});
const signMaterial = new THREE.MeshBasicMaterial({map: signTexture});
const exitMaterial = new THREE.MeshBasicMaterial({map: exitTexture});
const classroomMaterial = new THREE.MeshBasicMaterial({map: classTexture});
const windowMaterial = new THREE.MeshBasicMaterial({color: 0xd5e7d0});
const lampMaterial = new THREE.MeshBasicMaterial({color: 0xfff2c4});

// Recycled 24 m sections keep the scene lightweight on phones. Shared blocks
// in each section are instanced; the runner never renders the entire 900 m.
const sectionLength = 24, corridor = [];
function makeSection(index) {
  const group = new THREE.Group(), batches = new Map();
  function wall(x, y, z, w, h, d, color) {
    const m = material(color), list = batches.get(m) || [];
    list.push([x, y, z, w, h, d]); batches.set(m, list);
  }
  wall(0, -.15, -12, 9.2, .3, 24, 0xaab5a5);
  wall(0, 5.24, -12, 9.5, .22, 24, 0xd0ceba);
  wall(-4.68, 2.55, -12, .22, 5.1, 24, 0xddd7bf);
  wall(4.68, 2.55, -12, .22, 5.1, 24, 0xddd7bf);
  for (const side of [-1, 1]) {
    wall(side * 4.53, .8, -12, .13, 1.6, 24, 0x78998a);
    wall(side * 4.43, 1.64, -12, .13, .09, 24, 0x416957);
    wall(side * 4.42, .11, -12, .12, .22, 24, 0x3d6150);
    wall(side * 4.43, 4.86, -12, .13, .15, 24, 0xa2ac94);
  }
  for (let row = 0; row < 10; row++) wall(0, .008, -row * 2.4, 9.1, .008, .022, 0x899c8a);
  for (const x of [-3.6, -1.2, 1.2, 3.6]) wall(x, .009, -12, .022, .009, 24, 0x899c8a);
  // Wide windows on the left and classroom doors on the right.
  for (const z of [-6, -18]) {
    wall(-4.4, 2.98, z, .1, 2.5, 4.25, 0x476d5c);
    wall(-4.27, 1.73, z, .4, .12, 4.55, 0xe7dfc3);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(4.06, 2.26), windowMaterial);
    pane.position.set(-4.33, 2.99, z); pane.rotation.y = Math.PI / 2; group.add(pane);
    wall(-4.21, 2.98, z, .09, 2.4, .07, 0x557864);
    wall(-4.2, 3.06, z, .09, .07, 4.18, 0x557864);
    wall(4.46, 1.58, z, .13, 3.16, 2.06, 0x3d5d4a);
    wall(4.34, 1.57, z, .13, 3.02, 1.88, 0x78917b);
    wall(4.24, 2.29, z, .08, .75, 1.25, 0x415b50);
    wall(4.23, 1.23, z - .61, .14, .09, .35, 0xcac3a0);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.96, .48), classroomMaterial);
    label.position.set(4.28, 3.56, z); label.rotation.y = -Math.PI / 2; group.add(label);
    const lamp = new THREE.Mesh(unitBox, lampMaterial);
    lamp.position.set(0, 5.07, z); lamp.scale.set(.45, .04, 2.8); group.add(lamp);
    wall(0, 5.13, z, .65, .09, 3.1, 0x798b78);
    // Geometric pools of daylight; they remain behind the gameplay objects.
    const light = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.7), new THREE.MeshBasicMaterial({color: 0xffedb5, transparent: true, opacity: .14, depthWrite: false}));
    light.rotation.set(-Math.PI / 2, 0, -.28); light.position.set(-1.7, .022, z + 1); group.add(light);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), signMaterial);
  sign.position.set(0, 4.48, -11); group.add(sign);
  wall(0, 4.48, -11.06, 4.56, 1.2, .12, 0x315447);
  for (const x of [-1.7, 1.7]) wall(x, 5.105, -11, .035, .05, .035, 0x586f59);
  for (const [m, list] of batches) {
    const mesh = new THREE.InstancedMesh(unitBox, m, list.length), dummy = new THREE.Object3D();
    list.forEach(([x, y, z, w, h, d], i) => {dummy.position.set(x, y, z); dummy.scale.set(w, h, d); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);});
    mesh.instanceMatrix.needsUpdate = true; group.add(mesh);
  }
  group.userData.sign = sign;
  scene.add(group); corridor.push(group);
}
for (let i = 0; i < 10; i++) makeSection(i);
function updateCorridor() {
  const base = Math.floor(state.distance / sectionLength) - 2;
  corridor.forEach((g, i) => {g.position.z = -(base + i) * sectionLength;});
}

function fallbackCover(type) {
  return canvasTexture(384, 560, (ctx, w, h) => {
    ctx.fillStyle = colors[type]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f8eed8'; ctx.fillRect(0, h * .3, w, h * .7);
    ctx.fillStyle = '#173d38'; ctx.textAlign = 'center'; ctx.font = 'bold 90px sans-serif';
    ctx.fillText(names[type], w / 2, 115);
    ctx.font = '24px sans-serif'; ctx.fillText('六年级 上册', w / 2, 185);
    ctx.font = 'bold 40px sans-serif'; ctx.fillText(type === 'english' ? 'ENGLISH' : type === 'math' ? '1 + 2 = 3' : '语 文', w / 2, 370);
  });
}
const coverMaterials = Object.fromEntries(Object.keys(names).map(type => [type, new THREE.MeshStandardMaterial({map: fallbackCover(type), roughness: .8})]));
const loader = new THREE.TextureLoader();
Promise.allSettled(Object.keys(names).map(type => loader.loadAsync(`assets/books/${type}-cover.webp`).then(texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  coverMaterials[type].map.dispose(); coverMaterials[type].map = texture;
  coverMaterials[type].needsUpdate = true;
}))).then(results => {
  if (results.some(r => r.status === 'rejected')) showMessage('有封面暂未载入，仍可按书上的科目名称避开。', 5);
});

const contactTexture = canvasTexture(128, 128, (ctx, w, h) => {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, w / 2);
  gradient.addColorStop(0, 'rgba(10,32,22,.52)'); gradient.addColorStop(1, 'rgba(10,32,22,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
});
const shadowMaterial = new THREE.MeshBasicMaterial({map: contactTexture, transparent: true, depthWrite: false});
const bookViews = new Map();
const coverGeometry = new THREE.PlaneGeometry(1, 1);
for (const book of state.obstacles) {
  const group = new THREE.Group(); group.position.set(book.x, 0, -book.distance); group.visible = false;
  // Visual dimensions match the logical collision footprint exactly.
  block(group, 0, book.height / 2, 0, book.width, book.height, book.depth, 0xeee7d1);
  block(group, -book.width / 2 + .025, book.height / 2, 0, .05, book.height + .015, book.depth, colors[book.type]);
  block(group, 0, .015, 0, book.width + .025, .025, book.depth + .025, colors[book.type]);
  const cover = new THREE.Mesh(coverGeometry, coverMaterials[book.type]);
  cover.rotation.x = -Math.PI / 2; cover.position.y = book.height + .009;
  cover.scale.set(book.width, book.depth, 1); group.add(cover);
  for (const y of [.055, .095, .135]) block(group, .015, y, book.depth / 2 + .001, book.width - .05, .006, .003, 0xc8c5af);
  const shadow = new THREE.Mesh(coverGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .024;
  shadow.scale.set(book.width + .65, book.depth + .65, 1); group.add(shadow);
  scene.add(group); bookViews.set(book.id, group);
}

const player = createHazmatAvatar(THREE, '我');
player.children.at(-1).visible = false;
player.traverse(mesh => {if (mesh.material?.emissiveIntensity) mesh.material.emissiveIntensity = .16;});
scene.add(player);
const playerShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), shadowMaterial);
playerShadow.rotation.x = -Math.PI / 2; scene.add(playerShadow);
const finish = new THREE.Group(); finish.position.z = -RUN_LENGTH - 3; scene.add(finish);
block(finish, -3.4, 2.4, 0, 2.3, 4.8, .28, 0x426850);
block(finish, 3.4, 2.4, 0, 2.3, 4.8, .28, 0x426850);
block(finish, 0, 4.67, 0, 9, .66, .28, 0x426850);
const exitLight = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.3), new THREE.MeshBasicMaterial({color: 0xf4f0c8}));
exitLight.position.set(0, 2.15, 0); finish.add(exitLight);
const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .8), exitMaterial);
exitSign.position.set(0, 4.38, .19); finish.add(exitSign);

function formatTime(seconds) {return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;}
function unlockAudio() {
  if (!soundEnabled) return;
  try {audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume()?.catch(() => {});} catch {}
}
function tone(frequency, duration = .1, type = 'sine', volume = .05) {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(now); oscillator.stop(now + duration);
  oscillator.onended = () => {oscillator.disconnect(); gain.disconnect();};
}
function showMessage(text, seconds = 2.8) {
  $('status').textContent = text;
  messageUntil = state.elapsed + seconds;
}
function updateHud() {
  const distance = Math.floor(state.distance);
  $('remaining').textContent = String(Math.max(0, RUN_LENGTH - distance));
  $('distance').textContent = `${distance} / ${RUN_LENGTH} m`;
  $('progress').value = state.distance;
  $('dodged').textContent = String(state.dodged);
  $('hearts').textContent = Array.from({length: 3}, (_, i) => i < state.health ? '♥' : '♡').join(' ');
  $('hearts').setAttribute('aria-label', `剩余${state.health}次机会`);
  const section = Math.min(2, Math.floor(state.distance / 300));
  $('section').textContent = ['第一段 · 留神脚下', '第二段 · 稳住节奏', '最后一段 · 出口在前'][section];
  if (section > currentSection && state.mode === 'running') {currentSection = section; showMessage(section === 1 ? '已通过 300 米，继续留神脚下！' : '最后 300 米，看到出口就快到了。'); tone(620, .15);}
}
function syncMode() {
  document.body.classList.toggle('running', state.mode === 'running');
  document.body.classList.toggle('paused', state.mode === 'paused');
  $('intro').hidden = state.mode !== 'ready';
  $('paused').hidden = state.mode !== 'paused';
  $('result').hidden = !['won', 'lost'].includes(state.mode);
  document.querySelector('.hud').hidden = state.mode === 'ready';
  document.querySelector('.touch-controls').hidden = state.mode !== 'running';
  $('pause').disabled = state.mode !== 'running';
  if (state.mode === 'paused') audioContext?.suspend()?.catch(() => {});
}
function complete() {
  if (saved) return;
  saved = true;
  const won = state.mode === 'won';
  $('result-label').textContent = won ? '900 M / LEVEL COMPLETE' : '留神脚下，再试一次';
  $('result-icon').textContent = won ? '✓' : '↻';
  $('result-title').textContent = won ? '过关了，兄弟！' : '被课本绊住了';
  $('result-detail').textContent = won ? `成功穿过走廊，避开 ${state.dodged} 本课本，剩余 ${state.health} 次机会。` : '左右换到空道，或提前一点起跳。每一排都留着可以通过的路。';
  $('result-distance').textContent = String(Math.floor(state.distance));
  $('result-books').textContent = String(state.dodged);
  $('result-time').textContent = formatTime(state.elapsed);
  if (won) {
    try {
      const previous = Number(localStorage.getItem('lava-s2-lv29-best')) || Infinity;
      if (state.elapsed < previous) localStorage.setItem('lava-s2-lv29-best', String(state.elapsed));
      localStorage.setItem('lava-s2-lv29-cleared', 'true');
    } catch {}
    tone(784, .35, 'sine', .075);
  } else tone(130, .3, 'triangle', .06);
  syncMode();
}
function startRun(restart = false) {
  if (contextLost) return;
  unlockAudio(); saved = false; flash = 0; currentSection = 0;
  if (restart) game.restart(); else game.start();
  last = performance.now();
  showMessage('开始前进！左右换道，空格跳过课本。', 4);
  updateHud(); syncMode(); $('start').blur(); $('retry').blur();
}
function pause() {if (state.mode === 'running') {game.setPaused(true); syncMode();}}
function resume() {if (!contextLost && state.mode === 'paused') {unlockAudio(); game.setPaused(false); last = performance.now(); syncMode(); $('resume').blur();}}
$('start').onclick = () => startRun();
$('retry').onclick = () => startRun(true);
$('pause').onclick = pause; $('resume').onclick = resume;
$('sound').onclick = () => {soundEnabled = !soundEnabled; $('sound').textContent = soundEnabled ? '音效 开' : '音效 关'; $('sound').setAttribute('aria-pressed', String(soundEnabled)); if (soundEnabled) {unlockAudio(); tone(560);}};
$('view-mode').onclick = () => {thirdPerson = !thirdPerson; $('view-mode').textContent = thirdPerson ? '切换第一人称' : '切换第三人称'; $('view-mode').blur();};
const actions = {left: () => game.move(-1), right: () => game.move(1), jump: () => game.jump()};
for (const [id, action] of Object.entries(actions)) {
  const button = $(id);
  button.addEventListener('pointerdown', event => {event.preventDefault(); unlockAudio(); action(); button.classList.add('active'); button.setPointerCapture(event.pointerId);});
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => button.classList.remove('active'));
  button.addEventListener('click', event => {if (event.detail === 0) action();});
}
window.addEventListener('keydown', event => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyP', 'KeyV', 'Escape'].includes(event.code)) {
    if (event.code === 'Space' && event.target.closest('button,a') && state.mode !== 'running') return;
    event.preventDefault();
  }
  if (event.repeat) return;
  if (['ArrowLeft', 'KeyA'].includes(event.code)) game.move(-1);
  if (['ArrowRight', 'KeyD'].includes(event.code)) game.move(1);
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) game.jump();
  if (['KeyP', 'Escape'].includes(event.code)) {if (state.mode === 'paused') resume(); else pause();}
  if (event.code === 'KeyV') $('view-mode').click();
});
let swipeStart = null;
renderer.domElement.addEventListener('pointerdown', event => {if (state.mode === 'running') {swipeStart = {x: event.clientX, y: event.clientY, id: event.pointerId}; renderer.domElement.setPointerCapture(event.pointerId);}});
renderer.domElement.addEventListener('pointerup', event => {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y; swipeStart = null;
  if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) game.move(Math.sign(dx));
  else if (dy < -34) game.jump();
});
renderer.domElement.addEventListener('pointercancel', () => {swipeStart = null;});
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
window.addEventListener('pagehide', () => {audioContext?.suspend()?.catch(() => {});});
window.addEventListener('resize', () => {camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);});
renderer.domElement.addEventListener('webglcontextlost', event => {event.preventDefault(); contextLost = true; pause(); $('paused-title').textContent = '画面暂时中断'; document.querySelector('#paused p').textContent = '浏览器正在恢复画面，请稍候；若未恢复，可以刷新页面重试。'; $('resume').disabled = true; $('start').disabled = true; $('retry').disabled = true;});
renderer.domElement.addEventListener('webglcontextrestored', () => {contextLost = false; $('paused-title').textContent = '画面已恢复'; document.querySelector('#paused p').textContent = '可以继续这次挑战了。'; $('resume').disabled = false; $('start').disabled = false; $('retry').disabled = false;});

try {const best = Number(localStorage.getItem('lava-s2-lv29-best')); if (Number.isFinite(best) && best > 0) {$('best').hidden = false; $('best').textContent = `个人最快 · ${formatTime(best)}`;}} catch {}
$('start').disabled = false;
$('start').innerHTML = '<span>开始第 29 关</span><span aria-hidden="true">↗</span>';
updateHud(); syncMode(); updateCorridor();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
  game.step(dt);
  for (const event of game.drainEvents()) {
    if (event.type === 'hit') {flash = .68; showMessage(`碰到${names[event.bookType]}书了！还剩 ${event.health} 次机会。`, 2.3); tone(155, .19, 'sawtooth', .045);}
    if (event.type === 'jump') tone(420, .12, 'sine', .035);
    if (event.type === 'won' || event.type === 'lost') complete();
  }
  updateCorridor();
  for (const book of state.obstacles) {
    const view = bookViews.get(book.id), ahead = book.distance - state.distance;
    view.visible = ahead > -10 && ahead < 140;
    view.position.y = book.hit ? -.08 : 0;
    view.rotation.z = book.hit ? -.06 : 0;
  }
  const running = state.mode === 'running';
  player.position.set(state.x, state.y, -state.distance);
  player.visible = thirdPerson && (state.invulnerable <= 0 || reduceMotion || Math.floor(state.elapsed * 8) % 2 === 0);
  player.userData.animate(state.elapsed, running);
  playerShadow.position.set(state.x, .028, -state.distance);
  playerShadow.scale.setScalar(Math.max(.65, 1 - state.y * .16));
  playerShadow.visible = thirdPerson;
  if (state.mode === 'ready') {
    camera.position.set(-2.25, 2.7, 7.5);
    camera.lookAt(.2, 2.1, -17);
    player.visible = true; player.position.set(.3, 0, -5);
    playerShadow.position.set(.3, .028, -5);
  } else {
    const bob = running && !reduceMotion && !thirdPerson ? Math.sin(state.elapsed * 13) * .025 : 0;
    camera.position.set(thirdPerson ? state.x * .7 : state.x, (thirdPerson ? 3.05 : 1.66) + state.y * (thirdPerson ? .48 : 1) + bob, -state.distance + (thirdPerson ? 5.6 : 0));
    camera.lookAt(state.x * (thirdPerson ? .55 : 1), (thirdPerson ? 1.12 : 1.56) + state.y * .35, -state.distance - 16);
  }
  finish.visible = state.distance > RUN_LENGTH - 155;
  flash = Math.max(0, flash - dt * 1.8); $('hit-flash').style.opacity = String(flash);
  hudTime += dt;
  if (hudTime >= .08) {hudTime = 0; updateHud();}
  if (running && state.elapsed > messageUntil && state.elapsed < messageUntil + .2) $('status').textContent = '左右换道 · 空格跳跃 · 每一排都有空道';
  if (!contextLost) renderer.render(scene, camera);
}
requestAnimationFrame(frame);
