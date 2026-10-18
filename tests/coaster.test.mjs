import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.js';
import {makeBuildObject,cleanBuildObject,cleanBuildPose,cleanBuildScene,supportHeight,saveBuildScene,loadBuildScene} from '../lib/build-world.mjs';
import {TRACK_SHAPES,trackPoint,trackFrame,sampleTrack,trackAtDistance,snapTrack,trackRoute,attachCoaster,coasterFleet,coasterDemo,groundHeight} from '../lib/coaster.mjs';
import {applyBuildAction,createBuildRoom} from '../lib/build-room.mjs';
import {createCoasterTerrain,subtractExcavation} from '../lib/coaster-terrain.mjs';
import {makeBuilderAvatar,makeBuildView,disposeBuildView} from '../lib/build-visuals.mjs';
import {createCoasterRuntime} from '../lib/coaster-runtime.mjs';
const close=(a,b)=>assert(Math.abs(a-b)<.02,`${a} != ${b}`);
test('all ten rail shapes start level, end continuously, and the loop really turns upside down',()=>{
  for(const [shape]of TRACK_SHAPES){const track={...makeBuildObject('track','track-one'),shape,y:3,h:8};const a=trackFrame(track,0),b=trackFrame(track,1);close(a.position.y,3);close(a.forward.y,0);close(b.forward.y,0);assert(sampleTrack(track).length>0);
    if(shape.startsWith('up'))close(b.position.y,11);else if(shape.startsWith('down'))close(b.position.y,-5);else close(b.position.y,3);
    if(/Right|right/.test(shape))assert(b.forward.x>.99);if(/Left|left/.test(shape))assert(b.forward.x<-.99);
  }
  const loop={...makeBuildObject('track','loop-one'),shape:'loop',h:12};assert(trackFrame(loop,.5).up.y<-.99);assert(trackFrame(loop,.25).forward.y>.9);close(trackPoint(loop,.5).y,12.8);
});
test('endpoint snapping joins a changing height and heading into one route',()=>{
  const a={...makeBuildObject('track','track-a'),shape:'upRight'},end=trackFrame(a,1),b={...makeBuildObject('track','track-b'),x:end.position.x+1,y:end.position.y,z:end.position.z+1};
  const snapped=snapTrack(b,[a]);assert(snapped);close(snapped.object.y,end.position.y);close(snapped.object.rotation,end.heading);
  assert.equal(trackRoute([a,snapped.object],a.id).segments.length,2);const invalid={...snapped.object,y:snapped.object.y+2};assert.equal(trackRoute([a,invalid],a.id).segments.length,1);
});
test('placing a second coaster joins the first with spaced carriages and batch failure is atomic',()=>{
  const track=makeBuildObject('station','station-a'),objects=new Map([[track.id,track]]);
  const first={...makeBuildObject('coaster','car-a'),trackId:track.id,distance:8},second={...makeBuildObject('coaster','car-b'),trackId:track.id,distance:8};
  assert(applyBuildAction(objects,{kind:'put',object:first}));assert(applyBuildAction(objects,{kind:'put',object:second}));assert.equal(objects.get('car-b').trainId,'car-a');assert.equal(objects.get('car-b').slot,1);
  const fleet=coasterFleet(objects.values(),1000);assert.equal(fleet.length,2);assert(Math.hypot(fleet[0].position.x-fleet[1].position.x,fleet[0].position.z-fleet[1].position.z)>2.8);
  const before=[...objects.values()];assert(!applyBuildAction(objects,{kind:'batch',actions:[{kind:'delete',objectId:'car-a'},{kind:'put',object:{...second,id:'bad-car',trackId:'missing'}}]}));assert.deepEqual([...objects.values()],before);
  assert.equal(attachCoaster(objects.values(),{...second,id:'floating-car',trackId:''}),null);
});
test('excavation removes the actual ground, overlapping cuts share the lower floor, and stairs reach the surface',()=>{
  const hole={...makeBuildObject('dig','dig-one'),w:12,l:12,h:8,y:-8},deep={...hole,id:'dig-two',x:4,h:12,y:-12};
  assert.equal(groundHeight([hole,deep],0,0),-12);assert.equal(groundHeight([hole],30,0),0);
  assert.equal(subtractExcavation([{x:-2,z:-2},{x:2,z:-2},{x:2,z:2},{x:-2,z:2}],hole).length,0);
  const terrain=createCoasterTerrain([hole,deep]);terrain.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(0,20,0),new THREE.Vector3(0,-1,0)),hits=ray.intersectObject(terrain,true);assert(hits.length);close(hits[0].point.y,-12);
  const stairs={...makeBuildObject('stairs','stairs-one'),y:-8,h:8,l:12};assert(supportHeight([hole,stairs],0,-5.9)>-.5);assert(supportHeight([hole,stairs],0,5.9)<-7.5);disposeBuildView(terrain);
});
test('old saves remain readable and underground rails, linked cars and rider orientation survive validation',()=>{
  const values=coasterDemo(makeBuildObject),objects=new Map();assert(applyBuildAction(objects,{kind:'batch',actions:values.map(object=>({kind:'put',object}))}));assert(cleanBuildScene([...objects.values()]));
  const storage={data:null,getItem(){return this.data;},setItem(k,v){this.data=v;}};assert(saveBuildScene(storage,[...objects.values()]));assert.deepEqual(loadBuildScene(storage),[...objects.values()]);
  storage.data=JSON.stringify([{id:'old-brick',type:'brick',x:1,z:2,w:2,h:2,l:2,rotation:0,on:true}]);assert.equal(loadBuildScene(storage)[0].y,0);
  assert(cleanBuildPose({x:0,y:-8,z:0,heading:0,moving:true,ride:'demo_car',quaternion:[1,0,0,0]}));assert.equal(cleanBuildPose({x:0,y:-8,z:0,heading:0,ride:'demo_car',quaternion:[0,0,0,0]}),null);
  assert.equal(cleanBuildObject({...values[1],shape:'invalid'}),null);
});
test('actual riding follows loops and underground tunnels, stops at stations, and exits automatically',()=>{
  const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{dataset:{},setAttribute(){}});return elements.get(id);};
  const previous=globalThis.document;globalThis.document={getElementById:element,activeElement:null};
  let time=100000,selected='',dismounted=false,runtime;const objects=new Map(),views=new Map(),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),player=makeBuilderAvatar(''),online={get now(){return time;},id:'local-test',members:new Map()};scene.add(player.root);
  const edit=action=>{if(!applyBuildAction(objects,action))return false;for(const [id,view]of views)if(!objects.has(id)){disposeBuildView(view);views.delete(id);}for(const object of objects.values())if(!views.has(object.id)){const view=makeBuildView(object);views.set(object.id,view);scene.add(view);}runtime?.sync();return true;};
  try{
    runtime=createCoasterRuntime({scene,camera,player,objects,views,keys:new Set(),edit,getOnline:()=>online,getSelected:()=>objects.get(selected),onSelect:id=>selected=id,onDismount:()=>dismounted=true,toast(){}});
    element('coaster-demo').onclick();assert.equal(objects.size,19);assert(runtime.board('demo_coaster_car_0'));runtime.launch();let inverted=false,underground=false,station=false;
    for(let i=0;i<2400&&runtime.riding;i++){time+=50;runtime.update(.05);runtime.cameraUpdate(.05);const pose=runtime.ridePose();if(!pose)break;assert(cleanBuildPose(pose));if(new THREE.Vector3(0,1,0).applyQuaternion(new THREE.Quaternion().fromArray(pose.quaternion)).y<-.8)inverted=true;if(pose.y< -2)underground=true;if(element('ride-status').textContent.startsWith('站台停车'))station=true;}
    assert(inverted);assert(underground);assert(station);assert(!runtime.riding);assert(dismounted);assert.equal(player.root.scale.x,1);assert.equal(camera.up.y,1);
  }finally{for(const view of views.values())disposeBuildView(view);if(runtime?.terrain)disposeBuildView(runtime.terrain);globalThis.document=previous;}
});
test('a guest creates connected cars and sends inverted underground rider poses through the room authority',()=>{
  let time=100000;const queue=[],rooms=[],host=createBuildRoom({id:'coaster-host',name:'host',host:true,now:()=>time,send:m=>queue.push(m)}),guest=createBuildRoom({id:'coaster-guest',name:'guest',now:()=>time,send:m=>queue.push(m)});rooms.push(host,guest);
  const flush=()=>{let n=0;while(queue.length){assert(++n<1000);const m=queue.shift();for(const r of rooms)if(r.state.online)r.receive(m);}},tick=()=>{time+=1600;for(const r of rooms)r.tick({x:0,y:0,z:0,heading:0});flush();};
  host.setOnline(true);guest.setOnline(true);flush();tick();assert(guest.synced);
  const values=coasterDemo(makeBuildObject);assert(guest.edit({kind:'batch',actions:values.map(object=>({kind:'put',object}))}));flush();assert.deepEqual(guest.objects,host.objects);assert.equal(host.objects.filter(p=>p.type==='coaster'&&p.trainId==='demo_coaster_car_0').length,3);
  time+=200;guest.tick({x:-30,y:-5,z:48,heading:0,moving:true,ride:'demo_coaster_car_1',quaternion:[1,0,0,0]});flush();assert.equal(host.members.get('coaster-guest').pose.ride,'demo_coaster_car_1');assert.equal(host.members.get('coaster-guest').pose.y,-5);
});
