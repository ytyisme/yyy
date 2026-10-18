import * as THREE from './three.module.js';
import {coasterFleet,groupTrains,trackRoute,coasterDemo,TRACK_SHAPES} from './coaster.mjs';
import {makeBuildObject,supportHeight,WORLD_LIMIT} from './build-world.mjs';
import {frameQuaternion} from './coaster-visuals.mjs';
import {createCoasterTerrain,setTerrainXray} from './coaster-terrain.mjs';
import {disposeBuildView} from './build-visuals.mjs';
const vector=p=>new THREE.Vector3(p.x,p.y,p.z);
export function createCoasterRuntime({scene,camera,player,objects,views,keys,edit,getOnline,getSelected,onSelect,onDismount,toast}){
  const $=id=>document.getElementById(id);let terrain=null,digSignature='',routes=new Map(),fleet=[],fleetAt=-Infinity,rideId='',xray=false,demoPending=false;
  const now=()=>getOnline()?.now??Date.now();
  function sync(){
    const signature=JSON.stringify([...objects.values()].filter(p=>p.type==='dig'));
    if(!terrain||signature!==digSignature){if(terrain)disposeBuildView(terrain);terrain=createCoasterTerrain(objects.values());scene.add(terrain);digSignature=signature;setTerrainXray(terrain,xray);}
    routes=new Map(groupTrains(objects.values()).map(train=>[train.leader.trackId,trackRoute(objects.values(),train.leader.trackId)]));fleetAt=-Infinity;
  }
  function getFleet(){const time=now();if(Math.abs(time-fleetAt)>15){fleet=coasterFleet(objects.values(),time,routes);fleetAt=time;}return fleet;}
  function item(id){return getFleet().find(p=>p.car.id===id);}
  function available(id){const online=getOnline();return ![...(online?.members.values()||[])].some(p=>p.id!==online.id&&p.pose?.ride===id);}
  function ridePose(){
    if(!rideId)return null;const current=item(rideId);if(!current)return null;const position=vector(current.position).addScaledVector(vector(current.up),current.car.h*.4+.16),quaternion=frameQuaternion(current);
    return {x:position.x,y:position.y,z:position.z,heading:current.heading,moving:!current.motion.waiting,ride:rideId,quaternion:quaternion.toArray()};
  }
  function exit(stop=true){
    if(!rideId)return;const current=item(rideId);rideId='';keys.clear();player.root.scale.setScalar(1);camera.up.set(0,1,0);$('ride-bar').hidden=true;
    if(current){if(stop&&current.train.leader.running)edit({kind:'put',object:{...current.train.leader,running:false,distance:Math.max(0,current.motion.distance)}});
      const target=current.motion.stop?.type==='exit'?{...current.motion.stop,x:current.motion.stop.x,z:current.motion.stop.z}:{x:current.position.x,z:current.position.z,rotation:current.heading,w:current.car.w};
      const side=(target.w??2)/2+2.1,x=THREE.MathUtils.clamp(target.x+Math.cos(target.rotation||0)*side,-WORLD_LIMIT,WORLD_LIMIT),z=THREE.MathUtils.clamp(target.z-Math.sin(target.rotation||0)*side,-WORLD_LIMIT,WORLD_LIMIT),y=supportHeight(objects.values(),x,z);
      player.root.position.set(x,y,z);player.root.quaternion.identity();player.root.rotation.y=current.heading;onDismount(current.heading);
    }else{player.root.quaternion.identity();onDismount(0);}
    toast(stop?'已停车并下车。':'到达下车点，已自动下车。');
  }
  function board(id){
    const current=item(id);if(!current){toast('先把过山车放到相连的轨道上。');return false;}if(!available(id)){toast('这节车已经有人乘坐，请选择另一节。');return false;}
    rideId=id;keys.clear();player.root.scale.setScalar(.72);$('ride-bar').hidden=false;toast('已上车。点击“发车”启动，按 E 或点击“下车”离开。');return true;
  }
  function launch(id=rideId){
    const current=item(id);if(!current)return;
    const leader=current.train.leader,stopping=leader.running&&!current.motion.ended;
    edit({kind:'put',object:{...leader,running:!stopping,distance:stopping?Math.max(0,current.motion.distance):current.motion.ended?0:leader.distance,startedAt:now()}});fleetAt=-Infinity;
    toast(stopping?'列车已停车。':'列车发车，站台停靠后会继续前行。');
  }
  function inspector(){
    const object=getSelected();if(object?.type!=='coaster')return;const current=item(object.id);
    $('train-detail').textContent=current?`已连接 ${current.train.cars.length} 节车厢 · ${current.route.segments.length} 段轨道${current.route.closed?' · 闭合循环':''}`:'放到轨道上后，车厢会自动接在同一路线上。';
    $('train-board').disabled=$('train-run').disabled=!current;
    $('train-run').textContent=current?.motion.ended?'回站重新发车':current?.train.leader.running?'停车':'启动列车';
    if(document.activeElement!==$('train-speed'))$('train-speed').value=current?.train.leader.speed||object.speed||9;
  }
  function update(dt){
    if(demoPending&&objects.has('demo_coaster_car_0')){demoPending=false;focusDemo();}
    for(const entry of getFleet()){const view=views.get(entry.car.id);if(view){view.position.copy(vector(entry.position));view.quaternion.copy(frameQuaternion(entry));}}
    if(rideId){const entry=item(rideId),pose=ridePose();
      if(!entry||!pose){exit(false);return;}
      const online=getOnline(),conflict=[...(online?.members.values()||[])].some(p=>p.id!==online.id&&p.id<online.id&&p.pose?.ride===rideId);
      if(conflict){exit(true);toast('这节车的座位已被朋友占用。');return;}
      if(entry.motion.waiting&&entry.motion.stop?.type==='exit'){exit(false);return;}
      player.root.position.set(pose.x,pose.y,pose.z);player.root.quaternion.fromArray(pose.quaternion);
      const label=entry.motion.ended?'到达终点':entry.motion.waiting?'站台停车':TRACK_SHAPES.find(p=>p[0]===objects.get(entry.trackId)?.shape)?.[1]||'列车运行';
      $('ride-status').textContent=`${label} · ${entry.train.cars.length}节${pose.y<0?' · 地下 '+pose.y.toFixed(1)+'m':''}`;$('ride-status').dataset.track=entry.trackId;$('ride-status').dataset.height=pose.y.toFixed(2);
      $('ride-launch').textContent=entry.motion.ended?'重新发车':entry.train.leader.running?'停车':'发车';
    }
    inspector();
  }
  function cameraUpdate(dt){
    if(!rideId)return false;const current=item(rideId);if(!current)return false;const up=vector(current.up),target=vector(current.position).addScaledVector(up,current.car.h+.6),desired=target.clone().addScaledVector(vector(current.forward),-7).addScaledVector(up,2.4);
    camera.position.lerp(desired,1-Math.exp(-9*dt));camera.up.copy(up);camera.lookAt(target);return true;
  }
  function closest(position,range=5){return getFleet().map(entry=>({entry,distance:vector(entry.position).distanceTo(position)})).filter(p=>p.distance<range).sort((a,b)=>a.distance-b.distance)[0]?.entry||null;}
  function focusDemo(){
    const id='demo_coaster_car_0';
    const station=objects.get('demo_coaster_rail_0');if(station){if(rideId)exit(true);player.root.position.set(station.x+5,0,station.z-4);onDismount(0);onSelect(id);toast('示范线路已准备好：三节车厢、回环、站台和地下隧道。点击“乘坐这节车”体验。');}
  }
  function demo(){
    if(!objects.has('demo_coaster_car_0')){const values=coasterDemo(makeBuildObject);if(!edit({kind:'batch',actions:values.map(object=>({kind:'put',object}))})){toast('场景已满或联机尚未同步，暂时无法添加示范线路。');return;}if(!objects.has('demo_coaster_car_0')){demoPending=true;toast('正在把示范线路同步到房间…');return;}}
    focusDemo();
  }
  $('train-board').onclick=()=>board(getSelected()?.id);$('train-run').onclick=()=>launch(getSelected()?.id);
  $('train-speed').onchange=()=>{const current=item(getSelected()?.id),speed=Number($('train-speed').value);if(!current||!Number.isFinite(speed)||speed<2||speed>25)return;edit({kind:'put',object:{...current.train.leader,distance:Math.max(0,current.motion.distance),startedAt:now(),speed}});};
  $('ride-launch').onclick=()=>launch();$('ride-exit').onclick=()=>exit(true);$('coaster-demo').onclick=demo;
  $('terrain-toggle').onclick=()=>{xray=!xray;if(terrain)setTerrainXray(terrain,xray);$('terrain-toggle').setAttribute('aria-pressed',String(xray));$('terrain-toggle').textContent=xray?'返回地面视图':'地下视图';toast(xray?'已隐藏地表，方便铺设地下轨道。地道开挖会真正切开地面。':'已恢复地面显示。');};
  return {sync,update,cameraUpdate,ridePose,board,exit,launch,closest,inspector,get riding(){return !!rideId;},get rideId(){return rideId;},get terrain(){return terrain;},get fleet(){return getFleet();}};
}
