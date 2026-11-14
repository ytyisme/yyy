import {COLOR_LABEL,TRAY_LIMIT,DIAMOND_REWARD,createDuckMatch,previewFromSearch} from './lib/duck-tank.mjs';
import {createBodies,tossBodies,stepBodies,isSettled} from './lib/duck-tank-physics.mjs';
import {createDuckQuack} from './lib/duck-quack.mjs';
import {mountDuckTank} from './lib/duck-tank-view.mjs';
import {createLavaWallet,newLavaRunId,formatLavaCount} from './lib/lava-wallet.mjs';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wallet=createLavaWallet();
const audio=createDuckQuack();
const preview=previewFromSearch(location.search);
let view,match=null,bodies=[],poses=new Map(),mode='idle',motionSteps=0,motionMax=0;
let sessionId='',rewardNoted=false,pointer=null,last=performance.now();

try{view=mountDuckTank($('stage'));}
catch{ $('render-error').hidden=false; $('intro').hidden=true; }

function paintSound(){
  $('sound').textContent=audio.enabled?'音效：开':'音效：关';
  $('sound').setAttribute('aria-pressed',String(audio.enabled));
}
paintSound();
$('prize-exact').textContent=formatLavaCount(DIAMOND_REWARD);
$('prize-exact').dataset.exact=DIAMOND_REWARD;
$('prize-exact').title=DIAMOND_REWARD;
updateWallet();
if(view){
  const canvas=view.canvas;
  canvas.addEventListener('pointerdown',event=>{
    audio.unlock();
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,drag:false};
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.drag&&dx*dx+dy*dy>36)pointer.drag=true;
    if(pointer.drag){view.orbitBy(dx);pointer.x=event.clientX;pointer.y=event.clientY;}
  });
  canvas.addEventListener('pointerup',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const drag=pointer.drag;
    pointer=null;
    if(!drag)pickAt(event.clientX,event.clientY);
  });
  canvas.addEventListener('pointercancel',()=>{pointer=null;});
  requestAnimationFrame(frame);
}

function startRound(){
  if(!view||match?.busy)return;
  audio.unlock();
  sessionId=`s3duck4-${newLavaRunId()}`;
  rewardNoted=false;
  match=createDuckMatch(preview==='diamonds'?{diamonds:true,preview:true}:preview==='plain'?{diamonds:false,preview:true}:Math.random);
  bodies=createBodies(match.tank,Math.random,{reduced});
  poses=new Map(match.tank.map(duck=>[duck.id,{id:duck.id,kind:duck.kind,color:duck.color,x:0,y:0,z:0,yaw:0,roll:0,scale:1}]));
  for(const body of bodies)Object.assign(poses.get(body.id),{x:body.x,y:body.y,z:body.z,yaw:body.yaw,scale:1});
  view.setRoster(match.tank);
  beginMotion('pouring');
  $('intro').hidden=true;
  $('result').hidden=true;
  $('retry-save').hidden=true;
  $('save-warning').hidden=true;
  $('preview-note').hidden=!match.preview;
  $('status').textContent='鸭子正倒进玻璃缸，先看它们落稳。';
  refresh();
}

function beginMotion(kind){
  mode=kind;
  match.setBusy(true);
  motionSteps=0;
  motionMax=kind==='pouring'?(reduced?220:840):420;
  updateButtons();
}
function finishMotion(){
  if(mode!=='pouring'&&mode!=='shuffling')return;
  mode='playing';
  match.setBusy(false);
  $('status').textContent=mode==='playing'
    ?(match.diamonds?'落稳了。钻石鸭会发光，点你看得到的鸭子。':'落稳了。点你看得到的鸭子，三只同色消除。')
    :$('status').textContent;
  updateButtons();
}
function shuffle(){
  if(!match||match.busy||mode!=='playing'||match.status!=='playing')return;
  const result=match.shuffle(Math.random);
  if(!result.ok)return;
  audio.unlock();
  tossBodies(bodies,Math.random);
  beginMotion('shuffling');
  $('status').textContent='正在洗罐。鸭子还是原来那些，不会重抽钻石。';
}
function pickAt(x,y){
  if(!match||mode!=='playing'||match.busy)return;
  audio.unlock();
  const allow=new Set(match.tank.map(duck=>duck.id));
  const id=view.pick(x,y,allow);
  if(id==null)return;
  const result=match.pick(id);
  if(!result.ok)return;
  bodies=bodies.filter(body=>body.id!==id);
  if(result.sounds)audio.quack();
  if(result.matched?.reward)persistReward(result.matched.reward);
  $('status').textContent=result.matched
    ?`消除了 3 只${COLOR_LABEL[result.matched.color]}橡皮鸭。`
    :`选中 1 只${COLOR_LABEL[result.duck.color]}。槽里 ${match.tray.length}/${TRAY_LIMIT}。`;
  refresh();
  if(match.status!=='playing')showResult();
}
function persistReward(amount){
  if(rewardNoted)return;
  rewardNoted=true;
  const exact=amount;
  $('result-exact').textContent=formatLavaCount(exact);
  $('result-exact').dataset.exact=exact;
  if(match.preview){
    $('status').textContent='造型预览里的钻石鸭已消除。这串数字只展示，不写入余额。';
    return;
  }
  const receipt=wallet.creditExact(sessionId,exact);
  updateWallet();
  $('save-warning').hidden=receipt.persisted;
  $('retry-save').hidden=receipt.persisted;
}
function retrySave(){
  if(!match?.rewardGranted||match.preview)return;
  const receipt=wallet.creditExact(sessionId,match.rewardAmount);
  updateWallet();
  $('save-warning').hidden=receipt.persisted;
  $('retry-save').hidden=receipt.persisted;
  $('status').textContent=receipt.persisted?'奖励已保存，重复保存不会再加一次。':'还是没能保存，请再试一次。';
}
function showResult(){
  mode='over';
  match.setBusy(false);
  const won=match.status==='won';
  $('result-title').textContent=won?'玻璃缸清空了':'选取槽满了';
  let text=won?'普通通关。这一局没有发放超大奖励。':'7 个格子都占满了，还没凑成三消。';
  if(match.rewardGranted){
    text=match.preview?'3 只钻石鸭已经消除。这是造型预览，下面的整数不会入账。':'3 只钻石鸭已经消除。奖励按下面的整数入账，同一局只记一次。';
  }else if(match.diamonds){
    text+='钻石鸭还没被凑成三只，所以没有发放奖励。';
  }else if(won){
    text='普通通关。这一局没有钻石鸭，不另发岩浆币。';
  }
  $('result-text').textContent=text;
  $('result-prize').hidden=!match.rewardGranted;
  $('result').hidden=false;
  updateButtons();
}
function refresh(){
  if(!match)return;
  $('remain').textContent=String(match.tank.length);
  $('cleared').textContent=String(match.eliminated.length);
  $('diamond-flag').textContent=match.diamonds?(match.preview?'预览：3 只钻石鸭':'本局有 3 只钻石鸭'):'本局没有钻石鸭';
  const tray=$('tray');
  tray.replaceChildren();
  for(let i=0;i<TRAY_LIMIT;i++){
    const duck=match.tray[i];
    const slot=document.createElement('div');
    slot.className='slot'+(duck?' '+duck.color:'');
    slot.textContent=duck?COLOR_LABEL[duck.color].slice(0,1):'';
    slot.setAttribute('aria-label',duck?`第 ${i+1} 格，${COLOR_LABEL[duck.color]}橡皮鸭`:`第 ${i+1} 格，空`);
    tray.append(slot);
  }
  updateWallet();
  updateButtons();
}
function updateWallet(){
  const exact=wallet.balanceExact();
  const el=$('wallet-exact');
  el.textContent=formatLavaCount(exact);
  el.dataset.exact=exact;
  el.title=exact+' 颗岩浆币';
  el.classList.toggle('is-long',exact.length>15);
}
function updateButtons(){
  const playing=!!match&&mode==='playing'&&match.status==='playing';
  $('shuffle').disabled=!playing;
  $('restart').disabled=!match||!!match.busy;
}
function syncPoses(dt){
  const follow=1-Math.pow(0.0015,dt);
  const slots=new Map(match.tray.map((duck,index)=>[duck.id,index]));
  for(const body of bodies){
    const pose=poses.get(body.id);
    pose.x=body.x;pose.y=body.y;pose.z=body.z;pose.yaw=body.yaw;
    pose.roll=Math.max(-0.55,Math.min(0.55,body.spin*0.08));
    pose.scale=1;
  }
  for(const duck of match.tray){
    const pose=poses.get(duck.id);
    const target=traySlot(slots.get(duck.id));
    const dx=target.x-pose.x,dy=target.y-pose.y,dz=target.z-pose.z;
    pose.x+=dx*follow;pose.y+=dy*follow;pose.z+=dz*follow;
    const distance=Math.hypot(dx,dy,dz);
    pose.yaw=view.getYaw();pose.roll=0;
    if(distance>0.65){pose.y+=Math.min(1.3,distance)*0.2;pose.scale=1;}
    else pose.scale+=(0-pose.scale)*Math.min(1,follow*1.6);
  }
  for(const duck of match.eliminated){
    const pose=poses.get(duck.id);
    pose.scale+=(0-pose.scale)*follow;
  }
  view.sync([...poses.values()]);
}
function traySlot(index){return {x:(index-3)*0.46,y:-0.35,z:7.4};}
function frame(now){
  requestAnimationFrame(frame);
  const elapsed=Math.min(1/30,Math.max(0,(now-last)/1000));last=now;
  if(!document.hidden&&bodies.length&&(mode==='pouring'||mode==='shuffling')){
    let remain=elapsed;
    while(remain>0.0001){
      const step=Math.min(remain,1/60);
      stepBodies(bodies,step);
      remain-=step;
      motionSteps++;
    }
    if(isSettled(bodies)||motionSteps>motionMax)finishMotion();
  }
  if(match)syncPoses(elapsed||0.016);
  view.tick();
}

$('start').addEventListener('click',startRound);
$('again').addEventListener('click',startRound);
$('restart').addEventListener('click',startRound);
$('shuffle').addEventListener('click',shuffle);
$('retry-save').addEventListener('click',retrySave);
$('sound').addEventListener('click',()=>{audio.toggle();if(audio.enabled)audio.unlock();paintSound();});
$('copy-prize').addEventListener('click',async()=>{
  const exact=$('prize-exact').dataset.exact;
  try{await navigator.clipboard.writeText(exact);$('status').textContent='已复制完整奖励数字。';}
  catch{$('status').textContent='请长按奖励数字手动复制。';}
});
window.addEventListener('storage',updateWallet);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateWallet();});
