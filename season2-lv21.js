import * as THREE from './lib/three.module.js';
import {BANK_RUN,BANK_STORY,bankStoryAt,createBankRun} from './lib/bank-run.mjs';
import {createLavaWallet,newLavaRunId} from './lib/lava-wallet.mjs';
import {createSkinShop} from './lib/skin-shop.mjs';
import {playerSkins} from './lib/player-skins.mjs';
import {makeBankRunner,makeBankDog,makeLeash,makeBankIntro,makeBankRoadTile,makeBankObstacle,makeBankCoinField,disposeBankView} from './lib/bank-run-visuals.mjs';

const $=id=>document.getElementById(id),wallet=createLavaWallet();
let runId=newLavaRunId(),last=performance.now(),lastPhase='',lastHitSerial=0,lastCoins=-1,lastHud=-1,lastStory=-1,storyBark=false,resultDone=false,duckHeld=false,renderer,saveOkay=true,renderNeeded=true;
const duckKeys=new Set(),controlReleases=[];
function readBest(){try{const n=Number(localStorage.getItem('lava-bank-run-best-v1'));return Number.isSafeInteger(n)&&n>=0?n:0;}catch{return 0;}}
let best=readBest();$('best-intro').textContent=`最好距离 ${best.toLocaleString('zh-CN')} 米`;
const audio=createSound();
const game=createBankRun({onCoin:({earned})=>{const receipt=wallet.creditRun(runId,earned);saveOkay=receipt.persisted;$('save-warning').hidden=saveOkay;$('total-coins').textContent=receipt.balance.toLocaleString('zh-CN');audio.coin();},onHit:()=>audio.hit()}),s=game.state;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xe9cfae);scene.fog=new THREE.Fog(0xe9cfae,55,180);
const camera=new THREE.PerspectiveCamera(59,innerWidth/innerHeight,.1,230),rearCamera=new THREE.PerspectiveCamera(52,1.8,.1,90);
camera.layers.enable(1);
scene.add(new THREE.HemisphereLight(0xffefcf,0x6e7880,2.6));
const sun=new THREE.DirectionalLight(0xffe2b0,3.1);sun.position.set(-22,32,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.camera.far=90;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
const intro=makeBankIntro(),road=new THREE.Group();scene.add(intro,road);
const tiles=Array.from({length:12},(_,i)=>{const tile=makeBankRoadTile(i);road.add(tile);return tile;});
const skinShop=createSkinShop(),friend=makeBankRunner(0xd88c67),police=makeBankRunner(0x304e70,{police:true}),dog=makeBankDog(),leash=makeLeash();
let currentSkin=skinShop.equipped().id,me=makeBankRunner(0x4b9695,{skinId:currentSkin});scene.add(me,friend,police,dog,leash);
if($('equipped-skin-name'))$('equipped-skin-name').textContent=skinShop.equipped().name;
function watchSkinImage(actor){actor.userData.ready?.then(()=>{renderNeeded=true;});}
watchSkinImage(me);
for(const actor of [me,friend])actor.traverse(part=>part.layers.set(1));
function refreshSkin(){const skin=skinShop.equipped(),id=skin.id;if($('equipped-skin-name'))$('equipped-skin-name').textContent=skin.name;if(id===currentSkin)return;currentSkin=id;const previous=me;me=makeBankRunner(0x4b9695,{skinId:id});me.traverse(part=>part.layers.set(1));scene.add(me);watchSkinImage(me);previous.removeFromParent();previous.userData.dispose?.();renderNeeded=true;}
playerSkins.subscribe(refreshSkin);
window.addEventListener('storage',()=>{refreshSkin();$('total-coins').textContent=wallet.balance().toLocaleString('zh-CN');});window.addEventListener('pageshow',refreshSkin);window.addEventListener('lava-skin-change',refreshSkin);
const coins=makeBankCoinField();road.add(coins);const obstacleViews=new Map();
const dots=Array.from({length:BANK_RUN.maxHits},()=>{const dot=document.createElement('i');$('hit-dots').append(dot);return dot;});
const rearFrom=new THREE.Vector3(),rearTo=new THREE.Vector3(),tagPosition=new THREE.Vector3();let rearBounds=null;
let webglReady=true;
try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','跑酷画面：方向键换道，空格跳跃，S或下方向键下蹲');$('world').append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();$('render-error').hidden=false;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
}catch{webglReady=false;$('render-error').hidden=false;$('welcome').hidden=true;$('start').disabled=true;}

function createSound(){
  let context,enabled=true;
  const unlock=()=>{if(!enabled)return;try{context??=new (window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});}catch{}};
  function tone(frequency,time=.13,volume=.045,offset=0,end=frequency,type='sine'){
    if(!enabled||!context||context.state!=='running')return;const start=context.currentTime+offset,osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(Math.max(30,end),start+time);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+time);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+time+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  return {unlock,coin(){tone(700,.13,.035,0,1100);tone(1100,.14,.027,.08,1400);},jump(){tone(230,.17,.028,0,440);},hit(){tone(135,.24,.065,0,47,'triangle');},bark(){tone(230,.13,.07,0,110,'sawtooth');tone(270,.14,.06,.21,120,'sawtooth');},alarm(){tone(570,.28,.035,0,900);tone(900,.28,.035,.28,570);},toggle(){enabled=!enabled;if(enabled)unlock();else context?.suspend().catch(()=>{});return enabled;},sleep(){context?.suspend().catch(()=>{});}};
}
function resetRun(withStory=false){
  clearControls();game.reset();runId=newLavaRunId();lastHitSerial=0;lastCoins=-1;lastHud=-1;lastStory=-1;storyBark=false;resultDone=false;saveOkay=true;$('save-warning').hidden=true;$('hit-flash').style.opacity='0';$('hit-count').textContent='0 / 9';dots.forEach(dot=>dot.classList.remove('hit'));game.start();if(!withStory)game.skipIntro();last=performance.now();audio.unlock();syncPhase();renderer?.domElement.focus({preventScroll:true});
}
function syncPhase(){
  const phase=s.phase;if(phase===lastPhase)return;lastPhase=phase;renderNeeded=true;document.body.dataset.phase=phase;
  $('welcome').hidden=phase!=='ready'||!webglReady;$('story').hidden=phase!=='intro';$('run-hud').hidden=!['running','paused','caught'].includes(phase)||s.introTime<BANK_RUN.introDuration;$('chase-view').hidden=$('run-hud').hidden;$('controls').hidden=phase!=='running';$('run-tip').hidden=phase!=='running';$('friend-tag').hidden=phase!=='running';$('paused').hidden=phase!=='paused';$('result').hidden=phase!=='caught';$('pause').disabled=!['intro','running'].includes(phase);
  if(phase==='paused'||phase==='caught'){clearControls();audio.sleep();}
  if(phase==='running'){$('total-coins').textContent=wallet.balance().toLocaleString('zh-CN');audio.unlock();}
  if(phase==='caught')complete();
  rearBounds=$('rear-camera').getBoundingClientRect();if(rearBounds.width>0){rearCamera.aspect=rearBounds.width/rearBounds.height;rearCamera.updateProjectionMatrix();}
}
function complete(){
  if(resultDone)return;resultDone=true;best=Math.max(best,Math.floor(s.distance));try{localStorage.setItem('lava-bank-run-best-v1',String(best));}catch{}
  $('result-distance').textContent=Math.floor(s.distance).toLocaleString('zh-CN');$('result-coins').textContent=s.coins.toLocaleString('zh-CN');$('result-best').textContent=best.toLocaleString('zh-CN');audio.sleep();
}
function pause(){if(game.pause())syncPhase();}
function resume(){if(game.resume()){last=performance.now();audio.unlock();syncPhase();renderer?.domElement.focus({preventScroll:true});}}
function jump(){if(game.jump())audio.jump();}
$('start').onclick=()=>{if(!webglReady)return;audio.unlock();game.start();last=performance.now();syncPhase();};
$('skip-story').onclick=()=>{game.skipIntro();last=performance.now();syncPhase();renderer?.domElement.focus({preventScroll:true});};
$('pause').onclick=pause;$('resume').onclick=resume;$('retry').onclick=()=>resetRun();$('replay-story').onclick=()=>resetRun(true);
$('sound').onclick=()=>{const enabled=audio.toggle();$('sound').textContent=enabled?'声音 开':'声音 关';$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'关闭声音':'开启声音');};

for(const [id,action]of [['left',()=>game.lane(-1)],['right',()=>game.lane(1)],['jump',jump],['duck',()=>game.duck()]]){
  const button=$(id);let pointer=null;
  button.addEventListener('pointerdown',event=>{if(s.phase!=='running'||pointer!==null)return;event.preventDefault();pointer=event.pointerId;button.setPointerCapture(pointer);button.classList.add('active');if(id==='duck')duckHeld=true;action();});
  const release=event=>{if(pointer!==null&&event.pointerId!==undefined&&pointer!==event.pointerId)return;pointer=null;button.classList.remove('active');if(id==='duck')duckHeld=false;};
  controlReleases.push(()=>release({}));
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
  button.addEventListener('click',event=>{if(event.detail===0)action();});
}
const commands=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyP','Escape']);
window.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(!commands.has(event.code))return;
  if(['KeyP','Escape'].includes(event.code)){if(!event.repeat){if(s.phase==='paused')resume();else pause();}event.preventDefault();return;}
  if(s.phase!=='running')return;event.preventDefault();if(event.repeat)return;
  if(['KeyA','ArrowLeft'].includes(event.code))game.lane(-1);else if(['KeyD','ArrowRight'].includes(event.code))game.lane(1);else if(['Space','KeyW','ArrowUp'].includes(event.code))jump();else if(['KeyS','ArrowDown'].includes(event.code)){duckKeys.add(event.code);game.duck();}
});
window.addEventListener('keyup',event=>duckKeys.delete(event.code));
window.addEventListener('blur',()=>{clearControls();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',()=>{pause();audio.sleep();});
let gesture=null;
function clearControls(){duckHeld=false;duckKeys.clear();gesture=null;for(const release of controlReleases)release();}
$('world').addEventListener('pointerdown',event=>{if(s.phase!=='running'||gesture)return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY};event.target.setPointerCapture?.(event.pointerId);});
$('world').addEventListener('pointermove',event=>{if(!gesture||gesture.id!==event.pointerId)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(Math.max(Math.abs(dx),Math.abs(dy))<32)return;if(Math.abs(dx)>Math.abs(dy))game.lane(Math.sign(dx));else if(dy<0)jump();else game.duck();gesture=null;});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(name,event=>{if(gesture?.id===event.pointerId)gesture=null;});
window.addEventListener('resize',()=>{renderNeeded=true;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer?.setSize(innerWidth,innerHeight);rearBounds=$('rear-camera').getBoundingClientRect();if(rearBounds.width){rearCamera.aspect=rearBounds.width/rearBounds.height;rearCamera.updateProjectionMatrix();}});

const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n)),smooth=n=>{const v=clamp(n);return v*v*(3-2*v);};
function introFrame(){
  const time=s.introTime,walk=smooth((time-3)/1.4),retreat=smooth((time-5.8)/3),escape=smooth((time-9)/2.5),lift=smooth((time-.55)/1.8);
  intro.visible=true;road.visible=false;
  me.position.set(-.65,0,-4-walk*2.4+retreat*5.5+escape*3);friend.position.set(.7,0,-3.8-walk*2.4+retreat*5.4+escape*3);
  me.rotation.y=friend.rotation.y=time>6?Math.PI:0;me.userData.animate(time,{masked:time>.55,lift,running:time>3&&time<4.4||time>6});friend.userData.animate(time+.17,{masked:time>.8,lift:clamp(lift-.06),running:time>3&&time<4.4||time>6});
  const discovery=smooth((time-5.8)/2.3);police.position.set(9-discovery*6.6,0,1-discovery*2);police.rotation.y=.7;dog.position.set(7-discovery*6,0,-.2-discovery*1.6);dog.rotation.y=.7;dog.userData.animate(time,time>5.8&&time<8.5);police.userData.animate(time,{running:time>5.8&&time<8.5});police.visible=dog.visible=leash.visible=time>5.2;
  leash.userData.update(new THREE.Vector3(police.position.x-.25,1,police.position.z-.1),new THREE.Vector3(dog.position.x,.65,dog.position.z+.2));
  const alert=time>3&&time<9?(.5+.5*Math.sin(time*17)):0;intro.userData.alarm.material.emissiveIntensity=alert*5;intro.userData.lamp.intensity=alert*12;intro.userData.portal.visible=time>=9;intro.userData.portal.scale.setScalar(.05+smooth((time-9)/.8)*1.1);intro.userData.portal.rotation.z=time*1.8;
  camera.position.set(11-escape*6,6.8-escape*1.8,14-escape*2);camera.lookAt(0,2.3,-6+escape*7);
  if(s.phase==='intro'){
    const shot=bankStoryAt(time),index=BANK_STORY.indexOf(shot);if(index!==lastStory){lastStory=index;$('story-step').textContent=`0${index+1} / 04`;$('story-label').textContent=shot.label;$('story-text').textContent=shot.text;if(index===1)audio.alarm();}
    $('story-progress').value=time;if(time>6&&!storyBark){storyBark=true;audio.bark();}
  }
  $('portal-flash').style.opacity=String(smooth((time-10.5)/1.5)*.95);
}
function runFrame(){
  intro.visible=false;road.visible=true;police.visible=dog.visible=leash.visible=true;
  const running=s.phase==='running',duck=s.duckTime>0,jumping=!s.grounded,caught=s.phase==='caught';
  me.position.set(s.x-(me.userData.imageSkin?.58:.42),s.y,0);friend.position.set(s.x+(me.userData.imageSkin?.72:.57),s.y,-.85);me.rotation.y=friend.rotation.y=0;
  me.userData.animate(s.elapsed,{running,duck,jump:jumping,masked:false});friend.userData.animate(s.elapsed+.18,{running,duck,jump:jumping,masked:true});
  police.position.set(s.x-1.3,0,game.policeGap);police.rotation.y=0;dog.position.set(s.x+.7,0,game.policeGap-1.25);dog.rotation.y=0;police.userData.animate(s.elapsed+.6,{running});dog.userData.animate(s.elapsed,running);
  if(caught){police.position.set(s.x-1.1,0,.55);dog.position.set(s.x+.9,0,.1);}
  leash.userData.update(new THREE.Vector3(police.position.x+.3,1.05,police.position.z-.1),new THREE.Vector3(dog.position.x,.65,dog.position.z+.2));
  const base=Math.floor(s.distance/24)-2;tiles.forEach((tile,i)=>{tile.position.z=s.distance-(base+i)*24;});
  const active=new Set();
  for(const obstacle of game.obstacles){if(obstacle.distance-s.distance>170||obstacle.distance+obstacle.length-s.distance< -12)continue;active.add(obstacle.id);let view=obstacleViews.get(obstacle.id);if(!view){view=makeBankObstacle(obstacle);road.add(view);obstacleViews.set(obstacle.id,view);}view.position.set(obstacle.lane*BANK_RUN.laneWidth,0,s.distance-obstacle.distance);view.visible=!game.wasHit(obstacle.id);if(view.userData.hint)view.userData.hint.visible=obstacle.distance-s.distance> -2;}
  for(const [id,view]of obstacleViews)if(!active.has(id)){view.removeFromParent();disposeBankView(view);obstacleViews.delete(id);}
  coins.userData.update(game.coins,s);
  const shake=s.stumble>0?Math.sin(s.elapsed*78)*s.stumble*.12:0,mobile=innerWidth<=680;camera.position.set(s.x*(mobile?.92:.43)+shake,5.7+s.y*.12,10.8);camera.lookAt(s.x*(mobile?.9:.35),1.15,-14);
  rearCamera.position.set(s.x,2+Math.min(1.4,s.y),-2);rearCamera.lookAt(s.x-.1,1.0,game.policeGap+3);
  tagPosition.set(friend.position.x,friend.position.y+2.4,friend.position.z).project(camera);$('friend-tag').style.left=(tagPosition.x*.5+.5)*innerWidth+'px';$('friend-tag').style.top=(-tagPosition.y*.5+.5)*innerHeight+'px';
  $('portal-flash').style.opacity=String(Math.max(0,1-s.elapsed*1.6));
}
function hud(){
  const tick=Math.floor(s.elapsed*10);if(tick===lastHud&&s.coins===lastCoins&&s.hitSerial===lastHitSerial)return;lastHud=tick;
  $('distance').innerHTML=Math.floor(s.distance).toLocaleString('zh-CN')+' <small>米</small>';
  if(s.coins!==lastCoins){lastCoins=s.coins;$('run-coins').textContent=s.coins.toLocaleString('zh-CN');}
  if(s.hitSerial!==lastHitSerial){lastHitSerial=s.hitSerial;$('hit-flash').style.opacity='.8';$('hit-count').textContent=`${s.hits} / 9`;dots.forEach((dot,i)=>dot.classList.toggle('hit',i<s.hits));}
  $('chase-status').textContent=s.phase==='caught'?'第9次碰撞，警察已经追上了你们':s.hits>=7?'小心！再撞'+(9-s.hits)+'次就会被抓':s.hits?`追兵更近了 · 再撞 ${9-s.hits} 次被抓`:'躲开障碍，保持距离';
  const ahead=game.obstacles.find(o=>o.distance>s.distance&&o.distance-s.distance<32&&Math.abs(s.x-o.lane*BANK_RUN.laneWidth)<1.2);
  $('run-tip').textContent=s.stumble>0?'撞到了！换道、跳跃或蹲下，朋友会跟上你':s.onRoof?'在车顶上了！这一排车顶都可以走':ahead?{row:'前面是一排车：跳上车顶 ↗',single:'前面只有一辆车：必须跳过去 ↑',duck:'前面是 🚧 横杆：蹲下通过 ↓'}[ahead.kind]:'自动向前跑 · 红色元宝捡到即保存';
}
function frame(now){
  requestAnimationFrame(frame);if(!webglReady)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(duckHeld||duckKeys.size)game.duck();game.step(dt);syncPhase();
  if(!['intro','running'].includes(s.phase)&&!renderNeeded)return;
  renderNeeded=false;
  const storyScene=s.introTime<BANK_RUN.introDuration;if(storyScene)introFrame();else runFrame();hud();
  $('hit-flash').style.opacity=String(Math.max(0,Number($('hit-flash').style.opacity||0)-dt*2));
  renderer.setViewport(0,0,innerWidth,innerHeight);renderer.setScissorTest(false);renderer.render(scene,camera);
  if(!storyScene&&rearBounds?.width>0&&!$('chase-view').hidden){renderer.setScissorTest(true);renderer.setScissor(rearBounds.left,innerHeight-rearBounds.bottom,rearBounds.width,rearBounds.height);renderer.setViewport(rearBounds.left,innerHeight-rearBounds.bottom,rearBounds.width,rearBounds.height);renderer.shadowMap.autoUpdate=false;renderer.render(scene,rearCamera);renderer.shadowMap.autoUpdate=true;renderer.setScissorTest(false);}
}
$('total-coins').textContent=wallet.balance().toLocaleString('zh-CN');syncPhase();requestAnimationFrame(frame);
