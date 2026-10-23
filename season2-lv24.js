import {MUSIC_MAZE_SONGS as songs,MAZE,musicBeatMap,audibleClock,createMusicRoute,musicRouteAt,previewBeats,musicTime} from './lib/music-maze.mjs?v=2';
const $=id=>document.getElementById(id),canvas=$('maze'),ctx=canvas.getContext('2d'),seek=$('seek'),play=$('play');
let index=0,phase='ready',context,output,source,buffer=null,analysis=null,controller=null,loadEpoch=0,playEpoch=0,offset=0,startedAt=0,volume=.65,muted=false,lastDraw=0,renderTime=0,previousHit=-1;
let route=createMusicRoute(previewBeats(),180),completed=new Set();
try{const rows=JSON.parse(localStorage.getItem('lava-s2-lv24-played')??'[]');if(Array.isArray(rows))completed=new Set(rows.filter(id=>songs.some(s=>s.id===id)));}catch{}
const art=[
  '<path d="M8 32c6-19 21-30 29-21-2 14-10 24-29 21Z" fill="none" stroke="currentColor"/><circle cx="25" cy="17" r="3" fill="currentColor"/><circle cx="12" cy="13" r="1.5" fill="currentColor"/><circle cx="35" cy="32" r="1.5" fill="currentColor"/>',
  '<path d="m10 37 25-29M19 26q-13 0-9-10 9 0 9 10Zm6-8Q13 18 18 8q8 1 7 10Zm-6 9q0-12 11-8 0 8-11 8Zm6-8q0-12 11-8 0 8-11 8Z" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  '<path d="M7 7h30v30H7Z" fill="none" stroke="currentColor"/><path d="M12 30V12h13v18h-8V18h14v14" fill="none" stroke="currentColor"/><circle cx="31" cy="32" r="3" fill="currentColor"/>'
];
function renderSongs(){
  $('song-list').replaceChildren(...songs.map((song,i)=>{const button=document.createElement('button');button.type='button';button.className='song'+(i===index?' selected':'')+(completed.has(song.id)?' done':'');button.setAttribute('aria-label',`选择歌曲 ${song.title}`);button.setAttribute('aria-pressed',String(i===index));const visual=document.createElement('span');visual.className='song-art';visual.innerHTML=`<svg viewBox="0 0 44 44" aria-hidden="true">${art[i]}</svg>`;const info=document.createElement('span');info.className='song-info';const title=document.createElement('strong');title.textContent=song.title;const description=document.createElement('small');description.textContent=song.subtitle;info.append(title,description);const number=document.createElement('span');number.className='song-number';number.textContent=song.number;button.append(visual,info,number);button.addEventListener('click',()=>choose(i,phase==='playing'));return button;}));
  $('completion').replaceChildren(document.createTextNode(completed.size===3?'第24关已点亮':'听完三首，点亮第24关'),Object.assign(document.createElement('span'),{textContent:`${completed.size} / 3`}));
}
function setPhase(value,message){phase=value;document.body.classList.toggle('is-playing',value==='playing');const loading=value==='loading';play.disabled=loading;seek.disabled=!analysis;$('stage-start').disabled=loading;$('start-curtain').hidden=!['ready','loading','error'].includes(value);$('play-icon').textContent=value==='playing'?'Ⅱ':'▶';$('play-label').textContent=loading?'准备中':value==='playing'?'暂停':value==='paused'?'继续':value==='ended'?'重播':'开始';play.setAttribute('aria-label',value==='playing'?'暂停播放':value==='paused'?'继续播放':'开始播放');$('stage-state').textContent=({ready:'等待旋律',loading:'准备音乐',playing:'旋律进行中',paused:'旋律已暂停',ended:'本首已完成',error:'等待重试'})[value];if(message)$('audio-status').textContent=message;}
function ensureAudio(){if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('浏览器暂不支持音乐播放，请换一个浏览器再试。');context=new Audio();output=context.createGain();output.gain.value=muted?0:volume;output.connect(context.destination);context.addEventListener('statechange',()=>{if(context.state==='interrupted'||context.state==='suspended'){if(phase==='playing')pause('音乐已暂停，点击继续。');}});}return context;}
function position(){if(phase!=='playing')return offset;let timestamp;try{timestamp=context.getOutputTimestamp?.();}catch{}const clock=audibleClock(context.currentTime,(context.baseLatency||0)+(context.outputLatency||0),timestamp,performance.now());return Math.min(analysis.duration,offset+Math.max(0,clock-startedAt));}
function stopSource(){if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}}
function error(message){$('error').hidden=false;$('error').textContent=message;setPhase('error','音乐没有加载成功，点击开始可以重试。');}
async function prepare(){
  if(buffer&&analysis)return true;
  const epoch=++loadEpoch;controller?.abort();controller=new AbortController();const task=controller;
  setPhase('loading','正在准备歌曲和小球轨迹…');$('error').hidden=true;
  const timer=setTimeout(()=>task.abort(),30000);
  try{const response=await fetch(songs[index].file,{signal:task.signal});if(!response.ok)throw new Error('这首歌暂时没有加载成功，请刷新后重试。');const decoded=await context.decodeAudioData(await response.arrayBuffer());if(epoch!==loadEpoch)return false;
    analysis=musicBeatMap(songs[index].id,decoded.duration);buffer=decoded;route=createMusicRoute(analysis.beats,analysis.duration,index);seek.max=String(analysis.duration);$('duration').textContent=musicTime(analysis.duration);return true;
  }catch(e){if(epoch===loadEpoch)error(task.signal.aborted?'音乐加载超时，检查网络后点击开始重试。':e.message||'音乐暂时无法播放。');return false;}finally{clearTimeout(timer);if(controller===task)controller=null;}
}
async function start(){
  if(phase==='loading'||phase==='playing')return;
  const intent=++playEpoch;setPhase('loading','正在准备音乐…');
  try{ensureAudio();await context.resume();if(context.state!=='running')throw new Error('声音暂时未开启，请再次点击开始。');}catch(e){error(e.message);return;}
  if(intent!==playEpoch||!await prepare()||intent!==playEpoch)return;
  if(document.hidden){setPhase('paused','页面已切到后台，回来后点击继续。');return;}
  if(offset>=analysis.duration)offset=0;
  stopSource();source=context.createBufferSource();source.buffer=buffer;source.connect(output);startedAt=context.currentTime+.025;setPhase('playing',`正在播放《${songs[index].title}》 · 跟着节拍弹`);source.start(startedAt,offset);previousHit=-1;
}
function pause(message='已暂停，音乐和小球会一起等你。'){if(phase!=='playing')return;offset=position();stopSource();setPhase('paused',message);updateClock(offset);}
function choose(next,autoplay=false){loadEpoch++;playEpoch++;controller?.abort();controller=null;stopSource();index=(next+songs.length)%songs.length;offset=0;buffer=null;analysis=null;previousHit=-1;route=createMusicRoute(previewBeats(180,songs[index].bpm),180,index);seek.max='180';seek.value='0';seek.style.background='';$('duration').textContent='--:--';$('elapsed').textContent='0:00';$('hit-count').innerHTML='000 <small>次碰撞</small>';$('stage-track').textContent=`${songs[index].number} / ${songs[index].title}`;document.documentElement.style.setProperty('--accent',songs[index].color);$('error').hidden=true;$('end-message').hidden=true;setPhase('ready',`已选择《${songs[index].title}》 · 点击开始`);renderSongs();if(autoplay)start();}
function jump(value){if(!analysis)return;const playing=phase==='playing';stopSource();offset=Math.max(0,Math.min(analysis.duration-.01,Number(value)||0));setPhase('paused','已跳到这里，点击继续。');updateClock(offset);previousHit=-1;if(playing)start();}
function finish(){if(phase!=='playing')return;offset=analysis.duration;stopSource();completed.add(songs[index].id);try{localStorage.setItem('lava-s2-lv24-played',JSON.stringify([...completed]));if(completed.size===3)localStorage.setItem('lava-s2-lv24-cleared','true');}catch{}setPhase('ended',`《${songs[index].title}》播放完成`);renderSongs();updateClock(offset);if(completed.size===3){$('end-message').hidden=false;$('audio-status').textContent='三首歌都听完了，第24关完成！';}else if(index<songs.length-1)choose(index+1,true);}
function updateClock(t){$('elapsed').textContent=musicTime(t);seek.value=String(t);seek.style.background=`linear-gradient(to right,${songs[index].color} ${100*t/Number(seek.max)}%,#3b4138 0)`;}
function draw(t){
  const dpr=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0a0b0b';ctx.fillRect(0,0,width,height);
  const scale=Math.min(width/MAZE.width,height/MAZE.height),x=(width-MAZE.width*scale)/2,y=(height-MAZE.height*scale)/2;ctx.setTransform(scale,0,0,scale,x,y);
  const b=MAZE.bounds;ctx.fillStyle='#4e5052';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#606365';ctx.lineWidth=1;ctx.strokeRect(b.x+.5,b.y+.5,b.w-1,b.h-1);
  ctx.fillStyle='#0a0b0b';for(const wall of MAZE.obstacles)ctx.fillRect(wall.x,wall.y,wall.w,wall.h);
  const state=musicRouteAt(route,t),points=route.points,start=Math.max(1,state.index-25),end=Math.min(points.length-1,state.index+10);
  for(let i=start;i<=end;i++){const hit=points[i],age=t-hit.time;if(age>3.2||hit.time>=route.duration)continue;const pulse=Math.max(0,1-age/.16),active=age>=0&&age<.16;ctx.globalAlpha=active?1:age<0?.47:Math.max(.08,1-age/3.4);ctx.fillStyle=active?'#f4ffdd':`hsl(${(i*41+index*65)%360} 69% 66%)`;const vertical=hit.nx!==0;ctx.shadowColor=songs[index].color;ctx.shadowBlur=active?pulse*25:0;ctx.fillRect(hit.x-hit.nx*MAZE.radius+(vertical?-3:-20),hit.y-hit.ny*MAZE.radius+(vertical?-20:-3),vertical?7:40,vertical?40:7);}
  ctx.shadowBlur=0;
  ctx.globalAlpha=1;
  // Sample the route by elapsed audio time, so seeking and frame drops retain
  // the same rainbow trail and collision positions.
  const trail=3.6,steps=180;for(let i=0;i<steps;i++){const age=trail*(1-i/steps),at=t-age;if(at<0)continue;const p=musicRouteAt(route,at);ctx.globalAlpha=(i/steps)**.7*.85;ctx.strokeStyle=`hsl(${(at*95+index*65)%360} 80% 69%)`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,MAZE.radius*(.72+i/steps*.3),0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=1;
  if(state.flash>0){ctx.strokeStyle=songs[index].color;ctx.globalAlpha=state.flash*.5;ctx.lineWidth=2;ctx.beginPath();ctx.arc(state.impact.x,state.impact.y,13+(1-state.flash)*36,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  const impactAge=t-state.impact.time,bounce=state.index?Math.max(0,1-impactAge/.14):0,compression=1-bounce*.3,stretch=1+bounce*.23;
  ctx.shadowColor=songs[index].color;ctx.shadowBlur=state.flash*24;ctx.fillStyle=bounce>.6?songs[index].color:'#101313';ctx.strokeStyle='#f1f4eb';ctx.lineWidth=2.8;ctx.beginPath();ctx.ellipse(state.x,state.y,MAZE.radius*(state.impact.nx?compression:stretch),MAZE.radius*(state.impact.ny?compression:stretch),0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#f4f8ed';ctx.beginPath();ctx.arc(state.x-3,state.y-3,2,0,Math.PI*2);ctx.fill();
  $('live-dot').style.transform=`scale(${1+bounce})`;$('live-dot').style.opacity=String(.35+bounce*.65);canvas.dataset.beat=String(state.index);
  if(!['ready','loading','error'].includes(phase)&&state.index!==previousHit){previousHit=state.index;$('hit-count').replaceChildren(document.createTextNode(String(state.index).padStart(3,'0')+' '),Object.assign(document.createElement('small'),{textContent:'次碰撞'}));}
}
function frame(now){requestAnimationFrame(frame);let t=position();if(phase==='playing'&&t>=analysis.duration){finish();t=position();}if(phase==='playing')updateClock(t);if(now-lastDraw<(phase==='playing'?16:70))return;lastDraw=now;renderTime=phase==='ready'||phase==='loading'||phase==='error'?7.2:t;draw(renderTime);}
play.addEventListener('click',()=>phase==='playing'?pause():start());$('stage-start').addEventListener('click',start);$('previous').addEventListener('click',()=>choose(index-1,phase==='playing'));$('next').addEventListener('click',()=>choose(index+1,phase==='playing'));$('restart').addEventListener('click',()=>{stopSource();offset=0;setPhase('paused');updateClock(0);start();});
seek.addEventListener('input',()=>jump(seek.value));$('volume').addEventListener('input',()=>{volume=Number($('volume').value)/100;if(volume>0)muted=false;syncVolume();});
function syncVolume(){if(output)output.gain.setTargetAtTime(muted?0:volume,context.currentTime,.025);$('mute').setAttribute('aria-pressed',String(muted));$('mute').setAttribute('aria-label',muted?'取消静音':'静音');$('mute').textContent=muted?'♩':'♫';}
$('mute').addEventListener('click',()=>{muted=!muted;syncVolume();});$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.stage-panel').requestFullscreen();}catch{$('audio-status').textContent='浏览器暂不支持全屏，仍可继续播放。';}});$('replay-all').addEventListener('click',()=>choose(0,true));
window.addEventListener('keydown',event=>{if(event.target.closest('input,select,textarea,button,a')||event.ctrlKey||event.metaKey||event.altKey)return;if(event.code==='Space'){event.preventDefault();if(!event.repeat)phase==='playing'?pause():start();}if(['ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();jump(position()+(event.code==='ArrowLeft'?-5:5));}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('已切到后台，音乐和小球一起暂停。');});window.addEventListener('pagehide',()=>{loadEpoch++;playEpoch++;controller?.abort();pause();stopSource();});
window.addEventListener('pageshow',event=>{if(event.persisted&&phase==='loading')setPhase('ready','已返回迷宫，点击开始继续。');});
seek.disabled=true;renderSongs();requestAnimationFrame(frame);
