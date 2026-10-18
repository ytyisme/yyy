import {MOVES,createTraining,samplePose} from './lib/flash-step.mjs';
import {createPlayerView} from './lib/flash-step-avatar.mjs';

const $=id=>document.getElementById(id),video=$('reference-video'),training=createTraining(),s=training.state;
let view,ready=false,action=null,freeIndex=0,playToken=0,muted=false,last=performance.now(),clock=0,buffering=false;
try { view=createPlayerView($('player-view'),video); }
catch {
  $('feedback').textContent='玩家双手需要 WebGL，请换用支持 3D 的浏览器后刷新。';
  $('start').textContent='3D 画面暂时无法启动';
}
video.volume=.55;
const controls=MOVES.map((move,index)=>{
  const button=document.createElement('button');button.type='button';button.className='move-button';button.disabled=true;
  button.dataset.move=move.id;button.setAttribute('aria-label',`${move.key}：${move.name}`);
  const key=document.createElement('kbd');key.textContent=move.key;
  const label=document.createElement('span');label.textContent=move.name;
  button.append(key,label);button.addEventListener('click',()=>perform(index));$('move-controls').append(button);return button;
});
const active=()=>['training','free'].includes(s.phase);
const selected=()=>s.phase==='free'||(s.phase==='paused'&&freeMode)?freeIndex:s.index;
let freeMode=false;
function say(text){$('feedback').textContent=text;}
function ui() {
  const index=selected(),move=MOVES[index];
  document.body.className=s.phase;
  $('intro').hidden=s.phase!=='ready';$('paused').hidden=s.phase!=='paused';$('won').hidden=s.phase!=='won';
  $('move-number').textContent=String(index+1).padStart(2,'0');$('move-title').textContent=move.name;$('move-hint').textContent=move.hint;
  $('current-key').textContent=move.key;$('perform-label').textContent=action?'动作进行中…':'做出这一招';
  $('perform-current').disabled=!active()||!!action;
  $('progress').value=s.completed;$('completion').textContent=freeMode?'自由练习 · 任意招式':`已完成 ${s.completed} / 10`;
  $('pause').disabled=!active();$('restart').disabled=!ready||!view;
  controls.forEach((button,i)=>{
    button.disabled=!active()||(!freeMode&&!!action);
    button.classList.toggle('current',i===index);button.classList.toggle('done',i<s.completed);
    button.classList.toggle('active',action?.index===i);button.setAttribute('aria-pressed',String(action?.index===i));
    if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  });
}
function loaded() {
  if(!view||video.readyState<2)return;
  ready=true;$('start').disabled=$('free-start').disabled=false;$('start').textContent='开始跟练 →';
  if(s.phase==='ready')say('视频已准备好。开始后，按提示做出动作。');
  ui();
}
video.addEventListener('loadeddata',loaded);video.addEventListener('canplay',loaded);
video.addEventListener('waiting',()=>{buffering=true;});
video.addEventListener('playing',()=>{buffering=false;});
video.addEventListener('canplay',()=>{buffering=false;});
video.addEventListener('error',()=>{
  ready=false;video.pause();action=null;training.reset();ui();
  $('start').disabled=$('free-start').disabled=true;$('start').textContent='视频加载失败，请刷新重试';
  say('视频未能加载，请刷新页面。也可通过右下角的原视频链接查看。');
});
async function play() {
  if(!active()||(s.phase==='training'&&s.reachedEnd))return;
  const token=++playToken;
  try {await video.play();if(!active()||(s.phase==='training'&&s.reachedEnd))video.pause();}
  catch {if(token===playToken&&active()){pause();say('播放已暂停，请点击“继续练习”重试。');}}
}
function start(free=false) {
  if(!ready||!view)return;
  playToken++;video.pause();
  freeMode=free;freeIndex=0;action=null;training.start(free);last=performance.now();
  video.loop=free;buffering=false;
  ui();say(free?'点击任意招式，双手和脚步会立即跟着动。':'先看背景示范，按 1 或点击“做出这一招”。');
  // Reload resets playback reliably on static and native servers without a seek.
  video.load();play();
}
function perform(index) {
  if(!active()||!ready||!view||(!freeMode&&action))return;
  const move=MOVES[index];if(!move)return;
  if(freeMode)freeIndex=index;
  action={index,elapsed:0};
  say(`正在做：${move.name}${!freeMode&&index!==s.index?` · 当前跟练需要「${training.move.name}」`:''}`);ui();
}
function next() {
  if(!training.advance(!action))return;
  if(s.phase==='won') {
    playToken++;video.pause();
    try{localStorage.setItem('lava-s2-lv17-cleared','true');}catch{}
    say('十个动作全部完成！');
  } else {
    say(`第 ${s.index+1} 招：${training.move.name}。看示范，按 ${training.move.key} 做出动作。`);
    play();
  }
  ui();
}
function mediaFrame(time) {
  if(!active()||video.seeking||s.phase==='free')return;
  if(training.syncVideo(time)) {
    video.pause();
    if(!s.performed&&!action)say(`示范已暂停。按 ${training.move.key} 或点击「${training.move.name}」，完成后继续下一招。`);
    next();
  }
}
if(video.requestVideoFrameCallback) {
  const frame=(_,metadata)=>{mediaFrame(metadata.mediaTime);video.requestVideoFrameCallback(frame);};video.requestVideoFrameCallback(frame);
} else video.addEventListener('timeupdate',()=>{if(video.readyState>=2)mediaFrame(video.currentTime);});
video.addEventListener('ended',()=>mediaFrame(video.duration));
function pause() {
  if(!training.pause())return;
  playToken++;video.pause();ui();
}
function resume() {
  if(!training.resume())return;
  last=performance.now();ui();play();
}
$('start').onclick=()=>start();$('free-start').onclick=()=>start(true);
$('again').onclick=()=>start();$('after-free').onclick=()=>start(true);$('restart').onclick=()=>start();
$('pause').onclick=pause;$('resume').onclick=resume;$('perform-current').onclick=()=>perform(selected());
$('view-toggle').onclick=()=>{if(!view)return;view.setFullBody(!view.fullBody);$('view-toggle').textContent=view.fullBody?'回到双手':'查看全身';};
$('sound-toggle').onclick=()=>{muted=!muted;video.muted=muted;$('sound-toggle').textContent=muted?'声音关':'声音开';$('sound-toggle').setAttribute('aria-pressed',String(!muted));};
window.addEventListener('keydown',event=>{
  if(event.repeat||event.metaKey||event.ctrlKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  const index=MOVES.findIndex(move=>event.code===`Digit${move.key}`||event.code===`Numpad${move.key}`);
  if(index>=0&&active()){event.preventDefault();perform(index);}
  if(event.code==='Space'&&active()){event.preventDefault();perform(selected());}
  if(event.code==='KeyV'){event.preventDefault();$('view-toggle').click();}
  if(['KeyP','Escape'].includes(event.code)){event.preventDefault();s.phase==='paused'?resume():pause();}
});
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',()=>{playToken++;video.pause();});
function frame(now) {
  requestAnimationFrame(frame);
  const dt=Math.max(0,Math.min(.25,(now-last)/1000));last=now;
  const moving=active()&&!document.hidden&&video.readyState>=2&&!video.seeking&&(!buffering||s.reachedEnd)&&(!video.paused||s.reachedEnd);
  if(moving)clock+=dt;
  if(action&&moving) {
    action.elapsed+=dt;
    const move=MOVES[action.index];
    if(action.elapsed>=move.duration) {
      const success=training.perform(move.id);action=null;
      say(freeMode?`${move.name} · 再按一次可以重做。`:success?'动作完成！看完这一段示范后进入下一招。':`已做出${move.name}；这一段需要练习「${training.move.name}」。`);
      ui();next();
    }
  }
  const pose=action?samplePose(MOVES[action.index].id,action.elapsed/MOVES[action.index].duration):samplePose('',0);
  view?.render(pose,clock);
}
ui();loaded();requestAnimationFrame(frame);
