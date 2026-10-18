import * as THREE from './lib/three.module.js';
import {createChase,RUN_LENGTH,PLAYER_SPEED,MONSTER_SPEED,LANE_WIDTH} from './lib/chase-run.mjs';
import {batchCityChunk} from './lib/city-batch.mjs';
import {createHazmatAvatar} from './lib/chase-avatar.mjs';
import {setupChaseOnline} from './lib/chase-lobby.mjs';
const $=id=>document.getElementById(id),game=createChase(),s=game.state;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x260007);scene.fog=new THREE.FogExp2(0x390309,.025);
const camera=new THREE.PerspectiveCamera(73,innerWidth/innerHeight,.08,300);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(error){$('status').textContent='3D画面无法启动，请使用支持 WebGL 的浏览器。';$('start').textContent='暂时无法启动';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);$('world').append(renderer.domElement);
scene.add(new THREE.AmbientLight(0xff5b61,2.2));
const lamp=new THREE.PointLight(0xffd8bc,8,38,1.4);scene.add(lamp);
const geometry=new THREE.BoxGeometry(1,1,1),materials=new Map();
function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.08}));return materials.get(color);}
function box(group,x,y,z,w,h,d,color){const mesh=new THREE.Mesh(geometry,mat(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);group.add(mesh);return mesh;}
function labelTexture(text,bg='#a70817',fg='#fff3bf'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;ctx.font='bold 76px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66,480);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
const exitTexture=labelTexture('EXIT →');
const signMat=new THREE.MeshBasicMaterial({map:exitTexture,side:THREE.DoubleSide});
const glowMat=new THREE.MeshBasicMaterial({color:0xffb4a0});
const corridor=[];
for(let i=0;i<18;i++){
  const g=new THREE.Group();scene.add(g);corridor.push(g);
  box(g,0,-.17,-12,8,.3,24,0x6c2633);box(g,-4.15,2.5,-12,.3,5,24,0x930c1e);box(g,4.15,2.5,-12,.3,5,24,0x930c1e);box(g,0,5.1,-12,8,.2,24,0x630518);
  for(const side of [-1,1]){box(g,side*3.98,1.18,-12,.025,.09,24,0x28030d);box(g,side*3.92,.16,-12,.09,.3,24,0x3d0816);for(const z of [-4,-12,-20]){box(g,side*3.96,1.6,z,.035,3.2,1.6,0x3b0716);box(g,side*3.93,1.7,z,.08,2.92,1.37,0x790b20);box(g,side*3.84,1.35,z+.5,.13,.06,.17,0xc48d83);}}
  for(const z of [-6,-18]){const light=new THREE.Mesh(geometry,glowMat);light.position.set(0,4.91,z);light.scale.set(.26,.045,2.8);g.add(light);const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.41),signMat);sign.position.set(0,4,z);g.add(sign);box(g,0,4.48,z,.035,.5,.035,0x22020c);}
  for(let j=0;j<12;j++)box(g,0,.006,-j*2,7.9,.01,.025,0x401521);
  for(const x of [-2,0,2])box(g,x,.006,-12,.018,.01,24,0x401521);
}
corridor.forEach(g=>batchCityChunk(THREE,g));
// Geometry is streamed around the runner rather than drawing all 3,000 metres.
function updateCorridor(){const base=Math.floor(s.distance/24)-3;corridor.forEach((g,i)=>{g.position.z=-(base+i)*24;});}
const obstacleViews=new Map();
for(const obstacle of game.obstacles){const g=new THREE.Group();g.position.set(obstacle.x,0,-obstacle.distance);g.visible=false;scene.add(g);obstacleViews.set(obstacle.id,g);
  if(obstacle.kind==='barrier'){box(g,0,.48,0,1.5,.34,.35,0xf1b89a);for(const x of [-.57,.57])box(g,x,.34,0,.14,.68,.25,0x402124);for(const x of [-.4,0,.4])box(g,x,.49,-.19,.12,.35,.02,0x9a1330);}
  else{box(g,0,.66,0,1.45,.18,2.15,0x928084);box(g,0,.88,0,1.32,.28,1.97,0xf5b8b1);box(g,0,1.16,-.89,1.42,.2,.12,0x9e7d7e);box(g,0,.45,.99,1.4,.78,.09,0x916465);box(g,0,1.06,-.61,.85,.11,.42,0xf6d9c1);for(const x of [-.58,.58])for(const z of [-.85,.85])box(g,x,.25,z,.15,.5,.15,0x4b1727);}
}
const finish=new THREE.Group();finish.position.z=-RUN_LENGTH-1;scene.add(finish);
box(finish,-3,2.5,0,2,5,.25,0x5a1230);box(finish,3,2.5,0,2,5,.25,0x5a1230);box(finish,0,4.65,0,4,1,.25,0x5a1230);
const portal=new THREE.Mesh(new THREE.PlaneGeometry(4,4.2),new THREE.MeshBasicMaterial({color:0xf1f9d2,side:THREE.DoubleSide}));portal.position.y=2.1;finish.add(portal);
const endSign=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.8),new THREE.MeshBasicMaterial({map:labelTexture('EXIT 3000m','#29694f'),side:THREE.DoubleSide}));endSign.position.set(0,4.55,.18);finish.add(endSign);
const monster=new THREE.Group();scene.add(monster);
let textureReady=false;
new THREE.TextureLoader().load('assets/chase/smiler.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;const face=new THREE.Mesh(new THREE.PlaneGeometry(4.8,3.4),new THREE.MeshBasicMaterial({map:texture,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));monster.add(face);textureReady=true;$('start').disabled=false;$('start').textContent='单人逃离 →';},undefined,()=>{$('status').textContent='怪物图片未加载，请刷新后再试。';});
const music=$('music');music.volume=.6;let musicEnabled=true,rear=false,last=performance.now(),lastHit=null,saveDone=false;
let thirdPerson=false;
const localAvatar=createHazmatAvatar(THREE,'我');localAvatar.children.at(-1).visible=false;scene.add(localAvatar);
const remoteAvatars=new Map(),hands=new THREE.Group();camera.add(hands);scene.add(camera);
for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.27,4,10),mat(0xe1c72c));arm.position.set(side*.32,-.37,-.47);arm.rotation.x=.8;hands.add(arm);const glove=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),mat(0x101714));glove.position.set(side*.32,-.28,-.56);hands.add(glove);}
function pose(){return {distance:s.distance,x:s.x,jump:s.jumpHeight,elapsed:s.elapsed,phase:s.phase};}
function resetRun(){game.reset();lastHit=null;saveDone=false;music.currentTime=0;last=performance.now();}
const online=setupChaseOnline({onPause:pause,onLeave:()=>{resetRun();syncPhase();},onStart:({lateSeconds,index})=>{resetRun();game.start();game.lane(index%3-1);for(let age=Math.min(lateSeconds,3);age>0;age-=.1)game.step(Math.min(age,.1));syncPhase();$('status').textContent='和朋友一起逃离 · 3,000米出口';}});
function updateAvatars(dt){const members=online.members;for(const [id,avatar] of remoteAvatars)if(!members.has(id)){scene.remove(avatar);avatar.userData.dispose();remoteAvatars.delete(id);}
  for(const p of members.values()){if(p.id===online.id)continue;let avatar=remoteAvatars.get(p.id);if(!avatar){avatar=createHazmatAvatar(THREE,p.name);avatar.position.set(p.pose.x,p.pose.jump,-p.pose.distance);scene.add(avatar);remoteAvatars.set(p.id,avatar);}const age=Math.max(0,(Date.now()-p.last)/1000),advance=p.pose.phase==='running'?Math.min(.18,age)*PLAYER_SPEED:0;const target=-Math.min(RUN_LENGTH,p.pose.distance+advance);avatar.position.x+=(p.pose.x-avatar.position.x)*Math.min(1,dt*16);avatar.position.y+=(p.pose.jump-avatar.position.y)*Math.min(1,dt*16);avatar.position.z+=(target-avatar.position.z)*Math.min(1,dt*16);avatar.visible=Math.abs(p.pose.distance-s.distance)<180&&p.pose.phase!=='caught';avatar.userData.animate(p.pose.elapsed+Math.min(age,.2),p.pose.phase==='running');}
  localAvatar.position.set(s.x,s.jumpHeight,-s.distance);localAvatar.visible=thirdPerson;localAvatar.userData.animate(s.elapsed,s.phase==='running');hands.visible=!thirdPerson;hands.position.y=s.phase==='running'?Math.sin(s.elapsed*13)*.022:0;
}
$('view-mode').onclick=()=>{thirdPerson=!thirdPerson;$('view-mode').textContent=thirdPerson?'第一人称':'第三人称';};
document.addEventListener('click',event=>{if(['multiplayer','room-ready','room-start','start','resume'].includes(event.target.closest('button')?.id)&&musicEnabled){music.play().then(()=>{if(s.phase!=='running')music.pause();}).catch(()=>{});}},true);
function syncMusic(){if(musicEnabled&&s.phase==='running'&&!document.hidden){const p=music.play();if(p)p.then(()=>{$('music-status').textContent='♫ 正在播放你指定的音乐';}).catch(()=>{$('music-status').textContent='点击“音乐开”重试播放';});}else music.pause();$('music-toggle').setAttribute('aria-pressed',String(musicEnabled));$('music-toggle').textContent=musicEnabled?'♫ 音乐开':'♫ 音乐关';if(!musicEnabled)$('music-status').textContent='音乐已关闭';}
function hud(){const d=Math.floor(s.distance);$('remaining').innerHTML=(RUN_LENGTH-d).toLocaleString('zh-CN')+' <small>米</small>';$('distance').textContent=d.toLocaleString('zh-CN')+' / 3,000 米';$('progress').value=s.distance;$('gap').innerHTML=Math.floor(game.gap).toLocaleString('zh-CN')+' <small>米</small>';$('section').textContent=d<500?'起点':d>=RUN_LENGTH?'终点':Math.floor(d/500)*500+'m 已通过';$('gap').style.color=game.gap<15?'#ff736c':'';}
function setRear(value){rear=value&&s.phase==='running';$('rear-label').hidden=!rear;$('look').classList.toggle('active',rear);}
function syncPhase(){document.body.classList.toggle('running',s.phase==='running');$('intro').hidden=s.phase!=='ready'||online.active;$('paused').hidden=s.phase!=='paused';$('result').hidden=!['won','caught'].includes(s.phase);$('pause').disabled=s.phase!=='running';$('retry').textContent=online.active?'回房间准备下一局':'再跑一次';if(s.phase!=='running')setRear(false);syncMusic();}
function complete(){if(saveDone)return;saveDone=true;const win=s.phase==='won';$('result-label').textContent=win?'3,000 米 · 逃离成功':'笑脸追上来了';$('result-title').textContent=win?'你跑出了长廊！':'再快一点，别撞路障';$('result-detail').textContent=win?`跑完 3,000 米，用时 ${Math.floor(s.elapsed/60)} 分 ${Math.floor(s.elapsed%60)} 秒。它比你慢，你成功甩开了它！`:`你跑了 ${Math.floor(s.distance).toLocaleString('zh-CN')} 米。躲开病床，跳过矮路障，再试一次。`;
  $('next-level').hidden=!win;
  if(win){try{const old=Number(localStorage.getItem('lava-s2-lv16-best'))||Infinity;if(s.elapsed<old)localStorage.setItem('lava-s2-lv16-best',String(s.elapsed));localStorage.setItem('lava-s2-lv16-cleared','true');}catch{}}
  syncPhase();
}
function start(){if(!textureReady)return;if(online.active){online.show();return;}game.start();last=performance.now();syncPhase();$('status').textContent='正在逃离 · 左右避开病床，空格跳过矮路障';}
function pause(){if(game.pause()){syncPhase();$('music-status').textContent='音乐已暂停';}}
function resume(){if(game.resume()){last=performance.now();syncPhase();}}
$('start').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;$('retry').onclick=()=>{if(online.retry())return;resetRun();hud();game.start();syncPhase();$('status').textContent='重新出发 · 跑到 3,000 米出口';};
$('music-toggle').onclick=()=>{musicEnabled=!musicEnabled;syncMusic();};
music.addEventListener('error',()=>{$('music-status').textContent='音乐加载失败，可打开音乐参考链接';});
for(const [id,action]of [['left',()=>game.lane(-1)],['right',()=>game.lane(1)],['jump',()=>game.jump()]]){$(id).addEventListener('pointerdown',e=>{e.preventDefault();action();$(id).classList.add('active');$(id).setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(event,()=>$(id).classList.remove('active'));$(id).addEventListener('click',e=>{if(e.detail===0)action();});}
$('look').addEventListener('pointerdown',e=>{e.preventDefault();$('look').setPointerCapture(e.pointerId);setRear(true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('look').addEventListener(event,()=>setRear(false));$('look').addEventListener('click',e=>{if(e.detail===0)setRear(!rear);});
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(!$('lobby').hidden){if(e.code==='Escape')online.hide();return;}if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyC','KeyP','KeyV','Escape'].includes(e.code))e.preventDefault();if(e.repeat)return;if(['KeyA','ArrowLeft'].includes(e.code))game.lane(-1);if(['KeyD','ArrowRight'].includes(e.code))game.lane(1);if(['Space','KeyW','ArrowUp'].includes(e.code))game.jump();if(e.code==='KeyC')setRear(true);if(e.code==='KeyV')$('view-mode').click();if(['KeyP','Escape'].includes(e.code)){if(s.phase==='paused')resume();else pause();}});
window.addEventListener('keyup',e=>{if(e.code==='KeyC')setRear(false);});window.addEventListener('blur',()=>{setRear(false);pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',()=>music.pause());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;game.step(dt);online.tick(pose());updateAvatars(dt);updateCorridor();for(const o of game.obstacles)obstacleViews.get(o.id).visible=o.distance-s.distance>-8&&o.distance-s.distance<155;finish.visible=s.distance>RUN_LENGTH-170;monster.position.set(s.monsterX,2.2+Math.sin(now*.004)*.18,-s.monsterDistance);monster.lookAt(camera.position);
  const moving=s.phase==='running',bob=moving?Math.sin(s.elapsed*16)*.035:0;camera.position.set(s.x,thirdPerson?2.65+s.jumpHeight:1.68+s.jumpHeight+bob,-s.distance+(thirdPerson?(rear?-4.7:4.7):0));camera.lookAt(s.x+(rear?0:s.lane*LANE_WIDTH-s.x)*.15,thirdPerson?1.35+s.jumpHeight:1.66+s.jumpHeight,-s.distance+(rear?12:-15));lamp.position.set(s.x,3.7,-s.distance-5);
  if(s.lastHit!==lastHit){lastHit=s.lastHit;$('hit-flash').style.opacity='.75';$('status').textContent='撞到障碍，暂时减速！赶快换道，怪物在靠近。';}else{$('hit-flash').style.opacity=String(Math.max(0,Number($('hit-flash').style.opacity||0)-dt*1.6));if(s.stumble===0&&moving)$('status').textContent=`你 ${PLAYER_SPEED} 米/秒 · 怪物 ${MONSTER_SPEED} 米/秒 · 持续向前跑`;}
  hud();if(['won','caught'].includes(s.phase))complete();renderer.render(scene,camera);
}
hud();updateCorridor();requestAnimationFrame(frame);
