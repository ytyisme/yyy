const audio = document.getElementById('music');
const canvas = document.getElementById('beatline');
const ctx = canvas.getContext('2d');
const start = document.getElementById('start');
const curtain = document.getElementById('start-curtain');
const state = document.getElementById('stage-state');
const seek = document.getElementById('seek');
const elapsed = document.getElementById('elapsed');
const duration = document.getElementById('duration');

const FALLBACK_DURATION = 195.135;
const BPM = 82;
const BEAT_OFFSET = .42;
let points = [];
let raf = 0;
let lastBeat = -1;

const formatTime = seconds => {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
};

function makePoints(total) {
  const interval = 60 / BPM;
  const count = Math.max(2, Math.ceil(Math.max(total, 1) / interval));
  return Array.from({length: count + 1}, (_, index) => {
    const progress = index / count;
    const turn = index * 1.73;
    return {time: BEAT_OFFSET + index * interval, x: .06 + progress * .88, y: .5 + Math.sin(turn) * .25 + Math.sin(turn * .41) * .1};
  });
}

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
}

function pointAt(time) {
  const current = Math.max(0, Math.min(points.at(-1)?.time || FALLBACK_DURATION, time));
  let high = points.findIndex(point => point.time >= current);
  if (high < 0) high = points.length - 1;
  const low = Math.max(0, high - 1);
  const before = points[low];
  const after = points[high];
  const fraction = after.time === before.time ? 0 : (current - before.time) / (after.time - before.time);
  return {x: before.x + (after.x - before.x) * fraction, y: before.y + (after.y - before.y) * fraction, index: low};
}

function draw(time = audio.currentTime || 0) {
  resize();
  const width = canvas.width;
  const height = canvas.height;
  const scale = Math.min(width / 1200, height / 640);
  const xOffset = (width - 1200 * scale) / 2;
  const yOffset = (height - 640 * scale) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#211506';
  ctx.fillRect(0, 0, width, height);
  ctx.setTransform(scale, 0, 0, scale, xOffset, yOffset);
  ctx.strokeStyle = 'rgba(255, 215, 105, .08)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 1200; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 640); ctx.stroke(); }
  for (let y = 40; y < 640; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
  const current = pointAt(time);
  const currentIndex = current.index;
  const pulse = Math.max(0, 1 - Math.max(0, time - (points[currentIndex]?.time || 0)) / .22);
  ctx.beginPath();
  points.forEach((point, index) => { const x = point.x * 1200; const y = point.y * 640; index ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.strokeStyle = 'rgba(255, 219, 116, .18)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  points.slice(0, currentIndex + 1).forEach((point, index) => { const x = point.x * 1200; const y = point.y * 640; index ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.lineTo(current.x * 1200, current.y * 640);
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ffc12f';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;
  points.forEach((point, index) => {
    const active = index === currentIndex || index === currentIndex + 1;
    ctx.fillStyle = active ? '#fff4bf' : 'rgba(255, 211, 77, .38)';
    ctx.beginPath();
    ctx.arc(point.x * 1200, point.y * 640, active ? 5 + pulse * 8 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#fff8d8';
  ctx.shadowColor = '#ffd34d';
  ctx.shadowBlur = 24 + pulse * 26;
  ctx.beginPath();
  ctx.arc(current.x * 1200, current.y * 640, 11 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(current.x * 1200, current.y * 640, 4, 0, Math.PI * 2);
  ctx.fill();
}

function updateClock() {
  const time = audio.currentTime || 0;
  const total = Number.isFinite(audio.duration) ? audio.duration : FALLBACK_DURATION;
  seek.max = String(total);
  seek.value = String(time);
  elapsed.textContent = formatTime(time);
  duration.textContent = formatTime(total);
  const beat = Math.max(0, Math.floor((time - BEAT_OFFSET) / (60 / BPM)));
  if (beat !== lastBeat) {
    lastBeat = beat;
    state.textContent = audio.ended ? '本关完成' : `节拍 ${String(Math.min(beat + 1, points.length)).padStart(3, '0')} / ${points.length}`;
  }
  draw(time);
}

function frame() {
  updateClock();
  if (!audio.paused && !audio.ended) raf = requestAnimationFrame(frame);
}

function startMusic() {
  if (audio.ended) audio.currentTime = 0;
  audio.play().catch(() => { state.textContent = '浏览器阻止播放，请再点一次开始'; });
}

audio.addEventListener('loadedmetadata', () => { points = makePoints(audio.duration); updateClock(); });
audio.addEventListener('play', () => { curtain.hidden = true; start.textContent = 'Ⅱ 暂停'; state.textContent = '节拍进行中'; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); });
audio.addEventListener('pause', () => { if (!audio.ended) { curtain.hidden = false; start.textContent = '▶ 继续'; state.textContent = '音乐已暂停'; } cancelAnimationFrame(raf); updateClock(); });
audio.addEventListener('ended', () => { curtain.hidden = false; start.textContent = '↺ 再来一次'; state.textContent = '本关完成'; cancelAnimationFrame(raf); updateClock(); });
audio.addEventListener('error', () => { state.textContent = '音乐加载失败，请刷新后重试'; });
start.addEventListener('click', () => audio.paused ? startMusic() : audio.pause());
seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); updateClock(); });
window.addEventListener('resize', () => draw());

points = makePoints(FALLBACK_DURATION);
draw();
