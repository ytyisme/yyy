import * as THREE from './lib/three.module.js';
import {attachPlayerSkin} from './lib/skin-visuals.mjs';
import {playerSkins} from './lib/player-skins.mjs';
import {ITEMS,itemInfo,MAX_OBJECTS,WORLD_LIMIT,makeBuildObject,cleanBuildObject,cleanBuildPose,loadBuildScene,saveBuildScene,supportHeight,slidePoint,localPoint} from './lib/build-world.mjs';
import {makeBuildView,disposeBuildView,makeBuilderAvatar,animateBuilder} from './lib/build-visuals.mjs';
import {setupBuildOnline} from './lib/build-online.mjs';
import {applyBuildAction} from './lib/build-room.mjs';
import {TRACK_SHAPES,isTrack,trackFrame,sampleTrack,trackAtDistance,snapTrack,nearestTrack} from './lib/coaster.mjs';
import {createCoasterRuntime} from './lib/coaster-runtime.mjs';
import {setupBuildMaps} from './lib/build-map-ui.mjs';
import {createBuildLoading} from './lib/build-loading.mjs';

const $=id=>document.getElementById(id),keys=new Set(),objects=new Map(),views=new Map(),peers=new Map();
let storage;try{storage=localStorage;}catch{}
const scene=new THREE.Scene();scene.background=new THREE.Color(0xd6e5e1);scene.fog=new THREE.Fog(0xd6e5e1,90,230);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,400);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(error){$('toast').textContent='当前浏览器无法开启3D场景，请使用支持 WebGL 的浏览器。';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;$('world').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff8df,0x819a86,2.7));const sun=new THREE.DirectionalLight(0xffeed2,3);sun.position.set(-30,65,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:130});sun.shadow.normalBias=.04;scene.add(sun);
function slab(x,y,z,w,h,d,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.95}));mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
// The ground is rebuilt with actual openings when a player excavates a tunnel.
for(let i=0;i<24;i++){const side=i%2?-1:1,z=-100+Math.floor(i/2)*18,x=side*(60+(i*7%20));slab(x,2.6,z,.5,5.2,.5,0x92957a);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(3.2,1),new THREE.MeshStandardMaterial({color:i%3?0x9db389:0xb6bf8e,roughness:1}));crown.position.set(x,6,z);crown.castShadow=true;scene.add(crown);}

const player=makeBuilderAvatar('',0xe4a358);scene.add(player.root);player.root.position.set(0,0,17);
const playerSkin=attachPlayerSkin(player.root,{height:2.1,maxWidth:2.1});
let loading=null,online=null,coaster=null,selected=null,pending=null,ghost=null,previewPoint={x:0,z:8},orbit=.38,pitch=.7,zoom=24,heading=.38,verticalSpeed=0,grounded=true,riding=null,near=null,toastUntil=0,saveTimer=0,editTimer=0,editDraft=null,drag=null,lastPointer=null,elapsed=0;
player.root.rotation.y=heading;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0),intersection=new THREE.Vector3();
const outline=new THREE.Box3Helper(new THREE.Box3(),0xf1ba55);outline.visible=false;scene.add(outline);
function toast(text){$('toast').textContent=text;$('toast').style.opacity=1;toastUntil=performance.now()+4500;}
function readScene(){return [...objects.values()].map(p=>({...p}));}
function savedScene(){return readScene().map(object=>{if(object.type!=='coaster')return object;const entry=coaster?.fleet.find(p=>p.car.id===object.id);return {...object,running:false,startedAt:0,distance:entry&&entry.train.leader.id===object.id?entry.motion.distance:object.distance};});}
let mapManager=null;
function saveSolo(values=readScene()){if(mapManager){mapManager.local(savedScene());return;}const success=saveBuildScene(storage,values);$('save-state').textContent=success?'已保存在本机':'暂时无法保存';}
function scheduleSave(){clearTimeout(saveTimer);$('save-state').textContent='保存中…';saveTimer=setTimeout(()=>saveSolo(),250);}
function replaceScene(values){
  const incoming=new Set(values.map(p=>p.id));
  for(const [id,view]of views)if(!incoming.has(id)){disposeBuildView(view);views.delete(id);objects.delete(id);}
  for(const object of values){const old=objects.get(object.id),view=views.get(object.id);if(old&&JSON.stringify(old)===JSON.stringify(object))continue;
    if(view)disposeBuildView(view);const next=makeBuildView(object);scene.add(next);views.set(object.id,next);objects.set(object.id,{...object});}
  $('object-count').textContent=objects.size+' 件物品';
  if(selected&&!objects.has(selected)){clearTimeout(editTimer);editDraft=null;selected=null;pending=null;clearGhost();}
  coaster?.sync();
  updateInspector();
}
function edit(action){
  if(online?.active){if(!online.edit(action)){toast('请等联机连接和场景同步完成后再建造。');return false;}return true;}
  const next=new Map(objects);if(!applyBuildAction(next,action)){toast('无法放置：请检查轨道、车厢空间和场景边界（最多150件物品）。');return false;}
  replaceScene([...next.values()]);scheduleSave();return true;
}
function objectId(){return 'obj_'+crypto.getRandomValues(new Uint32Array(3)).join('_');}
function current(){return pending?.object??(editDraft?.id===selected?editDraft:objects.get(selected));}
function flushEdit(){clearTimeout(editTimer);if(editDraft){const object=editDraft;editDraft=null;edit({kind:'put',object});}}
function clearGhost(){if(ghost){disposeBuildView(ghost);ghost=null;}}
function drawGhost(){clearGhost();if(!pending)return;ghost=makeBuildView(pending.object);ghost.userData.previewAnchor={...pending.object};ghost.traverse(mesh=>{if(mesh.material){mesh.material.transparent=true;mesh.material.opacity=.5;mesh.material.depthWrite=false;}});scene.add(ghost);}
function transformGhost(){if(!ghost||!pending)return;const object=pending.object;if(isTrack(object)){const before=ghost.userData.previewAnchor,angle=object.rotation-before.rotation;ghost.rotation.y=angle;ghost.position.set(object.x-Math.cos(angle)*before.x-Math.sin(angle)*before.z,(object.y??0)-(before.y??0),object.z+Math.sin(angle)*before.x-Math.cos(angle)*before.z);}else{ghost.position.set(object.x,object.type==='dig'?0:object.y??0,object.z);ghost.rotation.y=object.rotation;}}
function updateInspector(){
  const object=current();$('inspector').hidden=!object;$('placement-bar').hidden=!pending;if(!object){outline.visible=false;return;}
  $('selection-state').textContent=pending?(pending.mode==='move'?'正在移动':'正在放置'):'已选中';$('selection-name').textContent=itemInfo(object.type).name;
  for(const [name,key]of [['width','w'],['height','h'],['length','l']])for(const suffix of ['number','range']){const input=$(name+'-'+suffix);if(document.activeElement!==input)input.value=Number(object[key].toFixed(1));}
  $('move-object').disabled=$('copy-object').disabled=$('delete-object').disabled=!!pending;
  $('elevation-field').hidden=object.type==='dig';$('elevation-number').disabled=object.type==='coaster';if(document.activeElement!==$('elevation-number'))$('elevation-number').value=Number((object.y??0).toFixed(1));
  $('height-label').textContent=object.type==='dig'?'开挖深度':isTrack(object)?'坡高 / 回环高度':'高度';
  $('track-editor').hidden=!isTrack(object);$('shape-field').hidden=object.type!=='track';$('track-shape').value=object.shape||'straight';$('track-tunnel').checked=!!object.tunnel;$('track-extend').disabled=!!pending;
  $('train-editor').hidden=object.type!=='coaster';coaster?.inspector();
  $('selection-detail').textContent=`位置 X ${object.x.toFixed(1)} · Y ${(object.y??0).toFixed(1)} · Z ${object.z.toFixed(1)}　旋转 ${Math.round(object.rotation*180/Math.PI)}°`;
  $('placement-hint').textContent=pending?.mode==='move'?'点击地面移动物品':'点击地面，或按下放置键';
}
function cancelPlacement(){flushEdit();clearGhost();pending=null;updateInspector();}
function select(id){cancelPlacement();selected=id;updateInspector();}
function startPlacement(type,source=null,mode='new'){
  if(online?.active&&(!online.online||!online.synced)){toast('等房间同步完成后，就可以一起建造。');return;}
  flushEdit();clearGhost();const p=player.root.position;
  const object=source?{...source,id:mode==='move'?source.id:objectId()}:makeBuildObject(type,objectId(),p.x-Math.sin(heading)*7,p.z-Math.cos(heading)*7);
  if(!source&&isTrack(object)&&isTrack(objects.get(selected))){const end=trackFrame(objects.get(selected),1);Object.assign(object,end.position,{rotation:end.heading});}
  if(type==='coaster'){
    const anchor=isTrack(objects.get(selected))?objects.get(selected):nearestTrack(objects.values(),{x:p.x,y:p.y,z:p.z})?.object;
    if(!anchor){pending=null;updateInspector();toast('先放一段轨道，再把过山车放到轨道上。');return;}
    const along=Math.min(sampleTrack(anchor).length*.6,9),frame=trackAtDistance(sampleTrack(anchor),along);Object.assign(object,frame.position,{trackId:anchor.id,distance:along,rotation:frame.heading,trainId:object.id,slot:0,running:false,startedAt:0});
  }
  object.x=THREE.MathUtils.clamp(object.x,-WORLD_LIMIT,WORLD_LIMIT);object.z=THREE.MathUtils.clamp(object.z,-WORLD_LIMIT,WORLD_LIMIT);previewPoint={x:object.x,z:object.z};pending={object,mode};
  drawGhost();updateInspector();toast(mode==='move'?'点击地面选新位置，再放置物品。':'已拿出'+itemInfo(type).name+'，点击地面放置。');
}
function place(){if(!pending)return;const object={...pending.object};if(edit({kind:'put',object})){pending=null;clearGhost();selected=object.id;updateInspector();toast(itemInfo(object.type).name+'已放置，可以继续调整尺寸。');}}
function showBag(){keys.clear();$('bag').showModal();}
const itemArt={
  brick:'<path d="M24 49 79 30 132 51 76 72Z" fill="#d18b68"/><path d="M24 49 76 72 76 111 24 87Z" fill="#b5674e"/><path d="M76 72 132 51 132 91 76 111Z" fill="#98573f"/><path d="m25 68 51 23 56-20M49 61v17m54-16v18m-28 9v22" fill="none" stroke="#e7b89a" stroke-width="2"/>',
  slide:'<path d="m39 35 20 6v61l-20-7Z" fill="#527f78"/><path d="m59 41 23-8v61l-23 8Z" fill="#689990"/><path d="m49 49 26-8m-26 20 26-8m-26 20 26-8m-26 20 26-8" stroke="#c1d4b9" stroke-width="3"/><path d="m40 34 29-12c5 53 35 57 58 67l-33 17C59 93 48 70 40 34" fill="#e5b143"/><path d="m40 34 29-12m-29 12c8 36 19 59 54 72m-25-84c5 53 35 57 58 67" fill="none" stroke="#f7d678" stroke-width="5"/>',
  pool:'<path d="m18 58 65-31 57 28-65 33Z" fill="#e4e8d7"/><path d="m18 58 57 30v26L18 86Z" fill="#aebfb2"/><path d="m75 88 65-33v28l-65 31Z" fill="#90a99e"/><path d="m29 57 54-24 45 23-54 25Z" fill="#64b7c2"/><path d="m49 55 25 12m-5-20 24 11m-2-20 23 12" stroke="#c0e0d8" stroke-width="2"/>',
  beer:'<path d="M67 19h22v30c0 8 13 13 13 26v33c0 17-48 17-48 0V75c0-13 13-18 13-26Z" fill="#71884c"/><path d="M70 22v30c0 8-10 12-10 26v28" fill="none" stroke="#a6b579" stroke-width="5"/><path d="M54 78c13 7 35 7 48 0v26c-13 9-35 9-48 0Z" fill="#e7d8aa"/><path d="M65 17h26v8H65Z" fill="#cba454"/><text x="78" y="97" font-size="13" fill="#5a6e40" text-anchor="middle">啤酒</text>',
  tv:'<path d="m69 92 5 14 24 3-26 11-27-9 24-9Z" fill="#394d51"/><path d="m22 29 18-7 94 22v62l-18 7-94-24Z" fill="#3e555c"/><path d="m22 29 94 22v62L22 89Z" fill="#33464d"/><path d="m30 40 78 18v43L30 82Z" fill="#78a99d"/><path d="m30 40 78 18-78 24Z" fill="#9ebcac"/><circle cx="108" cy="106" r="2" fill="#d5d9a7"/>',
  track:'<path d="M28 103C34 43 122 92 129 26M48 111C52 58 143 103 145 34" stroke="#b96e4c" stroke-width="5" fill="none"/><path d="m28 92 21 8m-13-31 22 8m2-19 20 10m7-7 21 10m4-16 20 10m-4-29 19 10" stroke="#a9a48a" stroke-width="6"/>',
  stairs:'<path d="m24 100 25 10 86-42-25-11Z" fill="#a0aa98"/><path d="m24 100 1-19 21-1V62h22V44h22V26l20 8v23L49 110Z" fill="#c5cbb8"/><path d="m49 110 86-42V45l-25-11v23Z" fill="#84968b"/><path d="m46 80 26 10m-4-28 27 11m-5-29 27 11" stroke="#eef0de" stroke-width="3"/>',
  station:'<path d="m18 90 78-49 42 18-78 49Z" fill="#c8d1b8"/><path d="m42 103 78-48m-60 53 78-48" stroke="#af7152" stroke-width="4"/><path d="m33 80 1-53 29-8 1 22-30 8" fill="#5e8a75"/><text x="47" y="38" font-size="18" fill="#f5f0ce" text-anchor="middle">P</text>',
  coaster:'<path d="m30 61 43-22 58 29-44 24Z" fill="#e2a26d"/><path d="m30 61 57 31v28L30 91Z" fill="#b66a4e"/><path d="m87 92 44-24v28l-44 24Z" fill="#955c49"/><path d="m44 56 28-13 42 22-28 14Z" fill="#567d76"/><path d="m37 57 1-21 30 16 0 20m20 15 1-23 34-17" stroke="#c98560" stroke-width="9" fill="none"/><circle cx="48" cy="103" r="10" fill="#455653"/><circle cx="113" cy="108" r="10" fill="#455653"/>',
  tunnel:'<path d="M23 101V70C23 6 100 7 100 68v45L77 123V79c0-36-33-41-33-2v37Z" fill="#a2b2a9"/><path d="M100 113V68C100 38 82 23 59 24l27-13c28-4 50 19 50 48v38Z" fill="#81978e"/><path d="M44 114V77c0-39 33-34 33 2v44Z" fill="#526f66"/>',
  exit:'<path d="m18 90 78-49 42 18-78 49Z" fill="#d4caac"/><path d="m42 103 78-48m-60 53 78-48" stroke="#af7152" stroke-width="4"/><path d="M29 28h51v34H29Z" fill="#8eaa83"/><path d="M40 45h28m-8-8 8 8-8 8" stroke="#fff6d9" stroke-width="5" fill="none"/><path d="M40 62v26" stroke="#6c8a75" stroke-width="4"/>',
  dig:'<path d="m17 50 64-29 58 30-65 32Z" fill="#c4b998"/><path d="m25 51 56-25 49 25-56 26Z" fill="#a28b6a"/><path d="m25 51 49 26v32L25 81Z" fill="#816e58"/><path d="m74 77 56-26v33l-56 25Z" fill="#5d6c5f"/><path d="m30 81 44 22 51-24-47-23Z" fill="#b6a58b"/>'
};
for(const [i,item]of ITEMS.entries()){
  const button=document.createElement('button');button.type='button';button.dataset.item=item.type;button.dataset.category=i<5?'basic':'coaster';button.setAttribute('aria-label','选择'+item.name);
  const art=document.createElement('span');art.className='item-art';art.innerHTML='<svg viewBox="0 0 156 132" aria-hidden="true">'+itemArt[item.type]+'</svg>';const number=document.createElement('small');number.textContent=String(i+1).padStart(2,'0');art.append(number);
  const copy=document.createElement('span');copy.className='item-copy';const title=document.createElement('strong');title.textContent=item.name;const plus=document.createElement('span');plus.textContent='+';title.append(plus);const desc=document.createElement('small');desc.textContent=item.description;copy.append(title,desc);button.append(art,copy);
  button.onclick=()=>{$('bag').close();startPlacement(item.type);};$('inventory').append(button);
}
function bagCategory(category){for(const button of document.querySelectorAll('#inventory button'))button.hidden=button.dataset.category!==category;for(const button of document.querySelectorAll('#bag-tabs button'))button.setAttribute('aria-pressed',String(button.dataset.category===category));}
for(const button of document.querySelectorAll('#bag-tabs button'))button.onclick=()=>bagCategory(button.dataset.category);bagCategory('coaster');$('bag-count').textContent=ITEMS.length;
for(const [value,label]of TRACK_SHAPES){const option=document.createElement('option');option.value=value;option.textContent=label;$('track-shape').append(option);}
function changeObject(changed){if(pending){pending.object=changed;drawGhost();updateInspector();}else{editDraft=changed;clearTimeout(editTimer);editTimer=setTimeout(flushEdit,120);}}
$('track-shape').onchange=()=>{const object=current();if(object?.type==='track')changeObject({...object,shape:$('track-shape').value,h:$('track-shape').value==='loop'&&object.h<8?12:object.h});};
$('track-tunnel').onchange=()=>{const object=current();if(isTrack(object))changeObject({...object,tunnel:$('track-tunnel').checked});};
$('elevation-number').oninput=()=>{const object=current(),y=Number($('elevation-number').value);if(object&&Number.isFinite(y)&&y>=-60&&y<=80)changeObject({...object,y});};
$('track-extend').onclick=()=>{flushEdit();const object=objects.get(selected);if(!isTrack(object))return;const end=trackFrame(object,1);startPlacement('track',{...makeBuildObject('track',objectId()),...end.position,rotation:end.heading});};
$('bag-toggle').onclick=showBag;$('bag-close').onclick=()=>$('bag').close();$('bag').addEventListener('close',()=>keys.clear());
$('deselect').onclick=()=>{cancelPlacement();selected=null;updateInspector();};$('cancel-place').onclick=cancelPlacement;$('place-object').onclick=place;
for(const [name,key]of [['width','w'],['height','h'],['length','l']])for(const suffix of ['range','number'])$(name+'-'+suffix).addEventListener('input',event=>{
  const object=current(),value=Number(event.target.value);if(!object||!Number.isFinite(value)||value<.2||value>60)return;
  const changed={...object,[key]:value};if(object.type==='dig'&&key==='h')changed.y=-value;$(name+'-'+(suffix==='range'?'number':'range')).value=value;
  changeObject(changed);
});
$('rotate-object').onclick=()=>{flushEdit();const object=current();if(!object)return;const changed={...object,rotation:object.rotation+Math.PI/2};if(pending){pending.object=changed;drawGhost();updateInspector();}else edit({kind:'put',object:changed});};
$('move-object').onclick=()=>{flushEdit();const object=objects.get(selected);if(object)startPlacement(object.type,object,'move');};
$('copy-object').onclick=()=>{flushEdit();const object=objects.get(selected);if(object)startPlacement(object.type,{...object,x:object.x+3,z:object.z+3});};
$('delete-object').onclick=()=>{clearTimeout(editTimer);editDraft=null;if(selected&&edit({kind:'delete',objectId:selected})){selected=null;updateInspector();toast('已删除物品。');}};

function setPointer(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);floor.constant=pending&&pending.object.type!=='dig'?-(pending.object.y??0):0;return ray.ray.intersectPlane(floor,intersection);}
function updatePlacement(event){
  const point=setPointer(event);if(!point||!pending)return;previewPoint={x:THREE.MathUtils.clamp(point.x,-WORLD_LIMIT,WORLD_LIMIT),z:THREE.MathUtils.clamp(point.z,-WORLD_LIMIT,WORLD_LIMIT)};Object.assign(pending.object,previewPoint);
  if(isTrack(pending.object)||pending.object.type==='coaster'){
    const hits=ray.intersectObjects([...views.entries()].filter(([id])=>isTrack(objects.get(id))).map(([,view])=>view),true);let target={x:point.x,y:pending.object.y??0,z:point.z};if(hits.length)target=hits[0].point;
    if(pending.object.type==='coaster'){
      const anchor=nearestTrack(objects.values(),target,18);if(anchor){const frame=trackAtDistance(sampleTrack(anchor.object),anchor.along);Object.assign(pending.object,frame.position,{trackId:anchor.object.id,distance:anchor.along,rotation:frame.heading});}
    }else{const snapped=snapTrack({...pending.object,x:target.x,z:target.z,y:target.y},objects.values(),5);if(snapped){pending.object=snapped.object;$('placement-hint').textContent='已吸附到轨道末端';}}
  }
  transformGhost();updateInspector();
}
renderer.domElement.addEventListener('pointerdown',event=>{drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false};renderer.domElement.setPointerCapture(event.pointerId);});
renderer.domElement.addEventListener('pointermove',event=>{
  lastPointer=event;
  if(drag&&drag.id===event.pointerId){const dx=event.clientX-drag.lastX,dy=event.clientY-drag.lastY;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6)drag.moved=true;if(drag.moved){orbit-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.004,.25,1.25);}drag.lastX=event.clientX;drag.lastY=event.clientY;}
  else if(pending&&event.pointerType!=='touch')updatePlacement(event);
});
renderer.domElement.addEventListener('pointerup',event=>{
  if(!drag||drag.id!==event.pointerId)return;const moved=drag.moved;drag=null;if(moved)return;
  if(pending){updatePlacement(event);place();return;}
  setPointer(event);const hits=ray.intersectObjects([...views.values(),...(coaster?.terrain?coaster.terrain.children.filter(mesh=>mesh.visible):[])],true);if(hits.length){let target=hits[0].object;while(target&&!target.userData.objectId)target=target.parent;select(target?.userData.objectId??null);}else select(null);
});
renderer.domElement.addEventListener('pointercancel',()=>drag=null);renderer.domElement.addEventListener('contextmenu',event=>event.preventDefault());
renderer.domElement.addEventListener('wheel',event=>{event.preventDefault();zoom=THREE.MathUtils.clamp(zoom+event.deltaY*.025,9,65);},{passive:false});
function jump(){if(grounded&&!riding&&!coaster?.riding&&!$('bag').open&&!$('online').open){verticalSpeed=7.5;grounded=false;}}
function interact(){
  if(coaster?.riding){coaster.exit(true);return;}
  if(!near)return;
  if(near.type==='coaster'){coaster.board(near.id);return;}
  if(near.type==='slide'){riding={object:{...near},at:0};keys.clear();toast('坐稳，滑下去！');}
  if(near.type==='tv')edit({kind:'put',object:{...near,on:!near.on}});
}
$('jump').onclick=jump;$('interact').onclick=interact;$('home').onclick=()=>{if(coaster?.riding)coaster.exit(true);riding=null;verticalSpeed=0;player.root.position.set(0,supportHeight(objects.values(),0,17),17);toast('已回到平路起点。');};
for(const button of document.querySelectorAll('[data-key]')){button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.key);});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>keys.delete(button.dataset.key));}
window.addEventListener('keydown',event=>{
  if(loading?.active)return;
  if(event.target.closest?.('input,textarea,select')||$('online').open)return;
  if(event.code==='KeyB'&&!event.repeat){event.preventDefault();if($('bag').open)$('bag').close();else showBag();return;}
  if($('bag').open)return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();keys.add(event.code);
  if(!event.repeat){if(event.code==='Space')jump();if(event.code==='KeyE')interact();if(event.code==='KeyP'&&coaster?.riding)coaster.launch();if(event.code==='Escape'){cancelPlacement();selected=null;updateInspector();}if(event.code==='Enter'&&pending)place();}
});
window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>{keys.clear();drag=null;});document.addEventListener('visibilitychange',()=>{keys.clear();flushEdit();});
function readPose(){const ride=coaster?.ridePose(),skinId=playerSkins.equipped().id;if(ride)return {...ride,skinId};const p=player.root.position;return {x:p.x,y:p.y,z:p.z,heading,moving:keys.size>0||!!riding,skinId};}
function updatePlayer(dt){
  if(coaster?.riding)return false;
  if($('bag').open||$('online').open)return false;
  if(riding){riding.at+=dt;const t=Math.min(1,riding.at/2),p=slidePoint(riding.object,t);player.root.position.set(p.x,p.y,p.z);heading=riding.object.rotation+Math.PI;player.root.rotation.y=heading;if(t===1){riding=null;verticalSpeed=0;grounded=true;}return true;}
  const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  const moving=!!(forward||right),p=player.root.position;
  if(moving){const direction=new THREE.Vector3(right,0,-forward).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),orbit),x=THREE.MathUtils.clamp(p.x+direction.x*6*dt,-WORLD_LIMIT,WORLD_LIMIT),z=THREE.MathUtils.clamp(p.z+direction.z*6*dt,-WORLD_LIMIT,WORLD_LIMIT),support=supportHeight(objects.values(),x,z);
    const onStairs=[...objects.values()].some(object=>object.type==='stairs'&&Math.abs(localPoint(object,x,z).x)<object.w/2+.3&&Math.abs(localPoint(object,x,z).z)<object.l/2+.3);
    if(support<=p.y+(onStairs ? .9 : .3)){p.x=x;p.z=z;}heading=Math.atan2(-direction.x,-direction.z);player.root.rotation.y=heading;
  }
  const floorY=supportHeight(objects.values(),p.x,p.z);verticalSpeed-=19*dt;p.y+=verticalSpeed*dt;if(p.y<=floorY){p.y=floorY;verticalSpeed=0;grounded=true;}else grounded=false;
  return moving;
}
function updatePeers(dt){
  const members=online?.members??new Map();for(const [id,avatar]of peers)if(!members.has(id)){avatar.skin.dispose();disposeBuildView(avatar.root);peers.delete(id);}
  for(const member of members.values()){
    if(member.id===online.id)continue;const pose=cleanBuildPose(member.pose);let avatar=peers.get(member.id);if(!pose){if(avatar)avatar.root.visible=false;continue;}
    if(!avatar){avatar=makeBuilderAvatar(member.name,0x6d9d9e);avatar.skin=attachPlayerSkin(avatar.root,{skinId:'default',height:2.1,maxWidth:2.1,parts:avatar.root.children.filter(part=>!part.isSprite)});avatar.root.name='builder-peer-'+member.id;scene.add(avatar.root);peers.set(member.id,avatar);avatar.root.position.set(pose.x,pose.y,pose.z);}
    avatar.skin.setSkin(pose.skinId);avatar.skin.update(elapsed,{running:pose.moving&&!pose.ride});
    avatar.root.visible=online.online&&online.synced;const seat=pose.ride?coaster?.fleet.find(p=>p.car.id===pose.ride):null,target=seat?new THREE.Vector3(seat.position.x,seat.position.y,seat.position.z).addScaledVector(new THREE.Vector3(seat.up.x,seat.up.y,seat.up.z),seat.car.h*.4+.16):new THREE.Vector3(pose.x,pose.y,pose.z);if(avatar.root.position.distanceTo(target)>30||seat)avatar.root.position.copy(target);else avatar.root.position.lerp(target,1-Math.exp(-12*dt));
    avatar.root.scale.setScalar(pose.ride ? .72 : 1);if(pose.ride){avatar.root.quaternion.fromArray(pose.quaternion);}else{avatar.root.rotation.x=avatar.root.rotation.z=0;avatar.root.rotation.y+=Math.atan2(Math.sin(pose.heading-avatar.root.rotation.y),Math.cos(pose.heading-avatar.root.rotation.y))*Math.min(1,dt*12);}animateBuilder(avatar,pose.moving&&!pose.ride,dt);if(pose.ride)for(const leg of avatar.legs)leg.rotation.x=-1.2;
  }
}
function updateNear(){
  if(coaster?.riding){$('interact').disabled=false;$('interact').textContent='下车 E';return;}
  const p=player.root.position;near=null;let best=Infinity;
  const car=coaster?.closest(p,5);if(car){near=car.car;best=new THREE.Vector3(car.position.x,car.position.y,car.position.z).distanceTo(p);}
  for(const object of objects.values())if(['slide','tv'].includes(object.type)){const local=localPoint(object,p.x,p.z),distance=Math.hypot(Math.max(0,Math.abs(local.x)-object.w/2),Math.max(0,Math.abs(local.z)-object.l/2));if(distance<4&&distance<best){near=object;best=distance;}}
  $('interact').disabled=!near||!!riding;$('interact').textContent=near?(near.type==='coaster'?'乘坐过山车 E':near.type==='slide'?'滑滑梯 E':near.on?'关闭电视 E':'打开电视 E'):'互动 E';
}
coaster=createCoasterRuntime({scene,camera,player,objects,views,keys,edit,getOnline:()=>online,getSelected:current,onSelect:select,onDismount:value=>{heading=value;riding=null;verticalSpeed=0;grounded=true;},toast});
replaceScene(loadBuildScene(storage));
mapManager=setupBuildMaps({storage,readScene:savedScene,replaceScene,flushEdit:()=>{cancelPlacement();clearTimeout(saveTimer);},canEdit:()=>!online?.active||online.online&&online.synced,reset:()=>{coaster.exit(true);riding=null;selected=null;edit({kind:'reset'});player.root.position.set(0,0,17);},beforeExit:()=>{if(online?.active&&!online.synced)online.leave(true,false);},leave:()=>online?.leave(true,true),toast,onOpen:()=>keys.clear()});saveSolo();
online=setupBuildOnline({readPose,readScene,replaceScene,saveSolo,toast,onOpen:()=>{keys.clear();cancelPlacement();clearTimeout(saveTimer);if(!online?.active)saveSolo();}});
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.06,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;elapsed+=dt;
  if(loading?.active){loading.update(now,dt);coaster.update(dt);renderer.render(scene,camera);return;}
  const moving=updatePlayer(dt);animateBuilder(player,moving,dt);playerSkin.update(elapsed,{running:moving&&!coaster.riding,jump:!grounded});coaster.update(dt);if(coaster.riding){for(const leg of player.legs)leg.rotation.x=-1.2;for(const arm of player.arms)arm.rotation.x=-.7;}updatePeers(dt);updateNear();
  const p=player.root.position;if(!coaster.cameraUpdate(dt)){const distance=p.y<-1?7:zoom,height=p.y<-1?3:Math.sin(pitch)*zoom,desired=new THREE.Vector3(p.x+Math.sin(orbit)*distance*Math.cos(pitch),p.y+height,p.z+Math.cos(orbit)*distance*Math.cos(pitch));camera.position.lerp(desired,1-Math.exp(-8*dt));camera.up.set(0,1,0);camera.lookAt(p.x,p.y+1,p.z);}
  const selectedView=!pending&&selected?views.get(selected):ghost;outline.visible=!!selectedView;if(selectedView)outline.box.setFromObject(selectedView);
  $('coordinates').textContent=`X ${p.x.toFixed(0)} · Z ${p.z.toFixed(0)}`;$('toast').style.opacity=now>toastUntil?0:1;
  renderer.render(scene,camera);
}
camera.position.set(10,19,38);camera.lookAt(0,0,4);
if(new URL(location.href).searchParams.get('loading')==='1')loading=createBuildLoading({scene,camera,player,mapName:mapManager.save.name,onFinish:()=>{keys.clear();last=performance.now();toast('欢迎回来！你的建造都在，可以接着玩了。');}});
requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
toast('欢迎来到自由建造！点击背包或按 B，拿出物品放在平地上。');
