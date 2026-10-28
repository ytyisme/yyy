import {SIZE, TARGET, MOVES, POINTS_PER_TILE, CHARACTERS, matchRating, adjacent, matches, swapped, hint, freshBoard, collapse} from './lib/sad-match.mjs?v=ratings';
import {SadMatchAudio} from './lib/sad-match-audio.mjs?v=ratings';
import {SadMatchMusic} from './lib/sad-match-music.mjs';
const $ = id => document.getElementById(id);
const boardEl = $('board'), status = $('status');
const musicButton = $('music');
function updateMusicButton(music) {
  musicButton.textContent = music.failed ? '音乐：重试' : music.enabled ? '音乐：开' : '音乐：关';
  musicButton.setAttribute('aria-pressed', String(music.enabled && !music.failed));
  musicButton.title = music.failed ? '主题曲未能播放，点击重试' : '主题曲循环播放，首次点击棋盘后开始';
}
const music = new SadMatchMusic($('theme'), updateMusicButton);
music.setVisible(!document.hidden);
updateMusicButton(music);
musicButton.addEventListener('click', () => music.toggle());
const soundButton = $('sound');
function updateSoundButton(sound) {
  soundButton.textContent = sound.failed ? '音效：重试' : sound.enabled ? '音效：开' : '音效：关';
  soundButton.setAttribute('aria-pressed', String(sound.enabled && !sound.failed));
  soundButton.title = sound.failed ? '未能加载音效，点击重试' : '切换消除音效';
}
const sound = new SadMatchAudio({onChange: updateSoundButton});
updateSoundButton(sound);
soundButton.addEventListener('click', () => sound.toggle());
boardEl.addEventListener('pointerdown', () => { void sound.unlock(); music.unlock(); });
boardEl.addEventListener('keydown', () => { void sound.unlock(); music.unlock(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sound.stop();
  music.setVisible(!document.hidden);
});
window.addEventListener('pagehide', () => { sound.stop(); music.setVisible(false); });
window.addEventListener('pageshow', () => music.setVisible(!document.hidden));
let board, score, moves, selected = null, busy = false, finished = false, round = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function update() {
  $('score').textContent = score.toLocaleString();
  $('moves').textContent = moves;
  $('progress').value = score;
}
function render() {
  boardEl.replaceChildren(...board.map((type, i) => {
    const character = CHARACTERS[type];
    const button = document.createElement('button');
    button.className = `tile ${character.id}${i === selected ? ' selected' : ''}`;
    button.dataset.index = i;
    button.setAttribute('aria-label', `第${Math.floor(i/SIZE)+1}行第${i%SIZE+1}列，${character.name}`);
    button.setAttribute('aria-pressed', String(i === selected));
    const img = document.createElement('img');
    img.src = `assets/sad-match/${character.id}-cutout.png`;
    img.alt = ''; img.draggable = false;
    button.append(img);
    return button;
  }));
  update();
}
function start() {
  sound.stop();
  round++; busy = false; finished = false; selected = null;
  board = freshBoard(); score = 0; moves = MOVES;
  $('result').hidden = true; $('next-level-row').hidden = true; $('effects').replaceChildren();
  status.textContent = '点击两个相邻哭脸，或按住滑动交换。';
  render();
}
async function animateSwap(a, b) {
  const first = boardEl.children[a], second = boardEl.children[b];
  const ar = first.getBoundingClientRect(), br = second.getBoundingClientRect();
  await Promise.all([first.animate([{transform:'translate(0,0)'},{transform:`translate(${br.x-ar.x}px,${br.y-ar.y}px)`}],{duration:reducedMotion ? 1 : 180}).finished,
    second.animate([{transform:'translate(0,0)'},{transform:`translate(${ar.x-br.x}px,${ar.y-br.y}px)`}],{duration:reducedMotion ? 1 : 180}).finished]);
}
function celebrate(indices, chain, gained) {
  if (!document.hidden) sound.play(chain);
  const rect = $('effects').getBoundingClientRect();
  for (const index of indices) {
    boardEl.children[index].classList.add('pop');
    const r = boardEl.children[index].getBoundingClientRect();
    for (let n=0;n<2;n++) {
      const particle = document.createElement('span'); particle.className = 'spark'; particle.textContent = n ? '✧' : '💧';
      particle.style.cssText = `left:${r.x-rect.x+r.width/2}px;top:${r.y-rect.y}px;--dx:${Math.random()*90-45}px;--dy:${Math.random()*-80-20}px;color:#fff`;
      $('effects').append(particle); setTimeout(()=>particle.remove(),700);
    }
  }
  const label = document.createElement('span'); label.className = 'combo';
  label.textContent = chain > 1 ? `${chain} 连消！ +${gained}` : `+${gained} 眼泪飞走啦`;
  $('effects').append(label); setTimeout(()=>label.remove(),900);
}
function praise(chain) {
  const rating = matchRating(chain);
  if (!document.hidden) sound.praise(chain);
  $('effects').querySelectorAll('.combo,.rating').forEach(el => el.remove());
  const label = document.createElement('span');
  label.className = `rating rating-${rating.id}`;
  label.textContent = rating.label;
  $('effects').append(label);
  setTimeout(() => label.remove(), 1250);
  status.textContent = `${rating.label} ${chain} 连消！`;
  return rating;
}
function end(rating) {
  finished = true;
  const won = score >= TARGET;
  $('next-level-row').hidden = !won;
  $('result-icon').textContent = won ? '🌈' : '☔';
  $('result-title').textContent = won ? '雨停了，通关成功！' : '差一点，再试试！';
  $('result-text').textContent = `${rating.label} 本局得分 ${score.toLocaleString()} / ${TARGET.toLocaleString()}。${won ? '你把伤心都变成了小星星。' : '多寻找连消的机会，就能得到更多分数。'}`;
  $('result').hidden = false;
}
async function move(a, b) {
  if (busy || finished || !adjacent(a,b)) return;
  busy = true; selected = null;
  const token = round;
  boardEl.querySelectorAll('.selected,.hinted').forEach(el => el.classList.remove('selected','hinted'));
  await animateSwap(a,b); if (token !== round) return;
  board = swapped(board,a,b); render();
  let found = matches(board);
  if (!found.length || board[a] === board[b]) {
    await animateSwap(a,b); if (token !== round) return;
    board = swapped(board,a,b); render();
    status.textContent = '没有连成三个，已换回来，不扣步数。'; busy = false; return;
  }
  moves--; let chain = 0;
  while (found.length) {
    chain++;
    const gained = found.length * POINTS_PER_TILE * Math.min(chain,5);
    score += gained; update();
    status.textContent = `${chain > 1 ? '连消！' : '消除成功！'} ${found.length} 个哭脸 · +${gained} 分`;
    celebrate(found, chain, gained);
    await sleep(280); if (token !== round) return;
    const result = collapse(board,found); board = result.board; render();
    const cellHeight = boardEl.children[0].getBoundingClientRect().height + 6;
    await Promise.all(result.drops.map(({to,distance}) => boardEl.children[to].animate([{transform:`translateY(${-distance*cellHeight}px)`,opacity:.2},{transform:'translateY(0)',opacity:1}],{duration:reducedMotion ? 1 : 260,easing:'ease-out'}).finished));
    if (token !== round) return;
    found = matches(board);
    if (chain >= 15 && found.length) {
      board = freshBoard(); render(); found = [];
      status.textContent = '超级连消！已整理好新的哭脸，继续吧。';
    }
  }
  const rating = praise(chain);
  if (score >= TARGET || moves === 0) { busy = false; end(rating); return; }
  if (!hint(board)) { board = freshBoard(); render(); status.textContent = '没有可交换的组合，已自动重新排列，不扣步数。'; }
  busy = false;
}
function select(index) {
  if (busy || finished) return;
  boardEl.querySelectorAll('.hinted').forEach(el=>el.classList.remove('hinted'));
  if (selected === index) selected = null;
  else if (selected !== null && adjacent(selected,index)) { void move(selected,index); return; }
  else selected = index;
  render();
}
let pointer = null, ignoreClickUntil = 0;
boardEl.addEventListener('pointerdown', e => {
  const tile = e.target.closest('.tile');
  if (!tile || busy || finished) return;
  pointer = {id:e.pointerId,index:Number(tile.dataset.index),x:e.clientX,y:e.clientY};
  boardEl.setPointerCapture(e.pointerId);
});
boardEl.addEventListener('pointerup', e => {
  if (!pointer || pointer.id !== e.pointerId) return;
  const p = pointer; pointer = null;
  const dx = e.clientX-p.x, dy = e.clientY-p.y;
  ignoreClickUntil = performance.now()+500;
  if (Math.max(Math.abs(dx),Math.abs(dy)) < 16) { select(p.index); return; }
  const to = p.index + (Math.abs(dx)>Math.abs(dy) ? (dx>0 ? 1 : -1) : (dy>0 ? SIZE : -SIZE));
  if (to>=0 && to<board.length && adjacent(p.index,to)) void move(p.index,to);
});
boardEl.addEventListener('pointercancel',()=>{pointer=null;});
boardEl.addEventListener('click',e=>{
  if (performance.now()<ignoreClickUntil && e.detail!==0) return;
  const tile=e.target.closest('.tile'); if(tile && e.detail===0) select(Number(tile.dataset.index));
});
$('hint').addEventListener('click',()=>{
  if(busy || finished) return;
  const pair=hint(board); if(!pair)return;
  boardEl.querySelectorAll('.hinted').forEach(el=>el.classList.remove('hinted'));
  pair.forEach(i=>boardEl.children[i].classList.add('hinted'));
  status.textContent='试着交换这两个闪亮的哭脸吧！';
});
$('restart').addEventListener('click',start); $('again').addEventListener('click',start);
start();
