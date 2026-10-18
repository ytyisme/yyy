import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,MAX_OBJECTS,makeBuildObject,cleanBuildObject,cleanBuildPose,cleanBuildScene,starterScene,loadBuildScene,saveBuildScene,supportHeight,slidePoint} from '../lib/build-world.mjs';
import {createBuildRoom} from '../lib/build-room.mjs';
import {createRoomCipher} from '../lib/room-crypto.mjs';
const pose={x:0,y:0,z:17,heading:0,moving:false};
function bus(){
  let time=100000;const queue=[],rooms=[];
  function make(id,host=false,initial=starterScene()){const room=createBuildRoom({id,name:id,host,initial,now:()=>time,send:m=>queue.push(m)});rooms.push(room);return room;}
  function flush(){let count=0;while(queue.length){assert(++count<2000,'message loop');const message=queue.shift();for(const room of rooms)if(room.state.online)room.receive(message);}}
  function tick(ms=1600){time+=ms;for(const room of rooms)if(room.state.online)room.tick(pose);flush();}
  return {make,flush,tick,queue};
}
test('all five backpack objects support independent dimensions, rotation and persistent storage',()=>{
  assert.deepEqual(ITEMS.slice(0,5).map(p=>p.name),['砖块','滑梯','水池','啤酒','电视']);
  const scene=ITEMS.slice(0,5).map((item,i)=>({...makeBuildObject(item.type,'item-'+i,i,0),w:40,h:.2,l:60,rotation:Math.PI*3}));
  assert.equal(cleanBuildScene(scene).length,5);assert(Math.abs(Math.abs(cleanBuildScene(scene)[0].rotation)-Math.PI)<.00001);
  const storage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
  assert(saveBuildScene(storage,scene));assert.deepEqual(loadBuildScene(storage),cleanBuildScene(scene));storage.value='broken';assert.deepEqual(loadBuildScene(storage),starterScene());
  for(const bad of [{w:0},{l:61},{h:Infinity},{x:121},{rotation:NaN},{type:'unknown'},{id:'<script>'}])assert.equal(cleanBuildObject({...scene[0],...bad}),null);
  assert.equal(cleanBuildScene([scene[0],scene[0]]),null);assert.equal(cleanBuildPose({...pose,x:NaN}),null);
});
test('rotated blocks provide a solid top and the slide descends toward its exit',()=>{
  const brick={...makeBuildObject('brick','block-a',2,3),w:8,l:2,h:3,rotation:Math.PI/2};
  assert.equal(supportHeight([brick],2,6),3);assert.equal(supportHeight([brick],5,3),0);
  const slide=makeBuildObject('slide','slide-a');const top=slidePoint(slide,0),bottom=slidePoint(slide,1);assert(top.y>bottom.y);assert(bottom.z>top.z);assert.equal(bottom.y,0);
});
test('late joiners receive the entire chunked world and all players can place, resize, move and delete objects',()=>{
  const b=bus(),initial=Array.from({length:80},(_,i)=>makeBuildObject(ITEMS[i%5].type,'object-'+i,i,0));
  const host=b.make('build-host',true,initial),guest=b.make('build-guest');host.setOnline(true);guest.setOnline(true);b.flush();b.tick();
  assert(guest.synced);assert.deepEqual(guest.objects,host.objects);assert.equal(guest.objects.length,80);
  let object=makeBuildObject('pool','new-pool',10,12);assert(guest.edit({kind:'put',object}));b.flush();assert.deepEqual(host.objects.find(p=>p.id===object.id),object);
  object={...object,w:33,h:2,l:21,x:-14,z:6};assert(host.edit({kind:'put',object}));b.flush();assert.deepEqual(guest.objects.find(p=>p.id===object.id),object);
  assert(guest.edit({kind:'delete',objectId:object.id}));b.flush();assert(!host.objects.some(p=>p.id===object.id));assert.deepEqual(guest.objects,host.objects);
  const late=b.make('build-late');late.setOnline(true);b.flush();b.tick();assert(late.synced);assert.deepEqual(late.objects,host.objects);
});
test('only the host commits edits, repeated requests apply once, and a missed commit is repaired by a snapshot',()=>{
  const b=bus(),host=b.make('build-host',true),guest=b.make('build-guest');host.setOnline(true);guest.setOnline(true);b.flush();b.tick();
  const object=makeBuildObject('tv','test-tv',0,3),request={id:'build-guest',type:'build-edit',requestId:'build-guest-10',action:{kind:'put',object}};
  host.receive(request);host.receive(request);b.flush();assert.equal(host.revision,1);assert.equal(guest.revision,1);
  guest.receive({id:'build-unknown',type:'build-commit',epoch:'0:build-host',revision:2,action:{kind:'delete',objectId:object.id}});assert(guest.objects.some(p=>p.id===object.id));
  host.edit({kind:'put',object:{...object,w:10}});b.queue.length=0;
  host.edit({kind:'put',object:{...object,w:12}});b.flush();assert(!guest.synced);b.tick();assert(guest.synced);assert.equal(guest.objects.find(p=>p.id===object.id).w,12);
  host.leave();b.flush();assert(guest.isHost);assert(guest.synced);assert(guest.edit({kind:'delete',objectId:object.id}));assert(!guest.objects.some(p=>p.id===object.id));
});
test('a full world rejects new objects while existing objects can still change',()=>{
  const b=bus(),host=b.make('build-host',true,Array.from({length:MAX_OBJECTS},(_,i)=>makeBuildObject('brick','brick-'+i,0,0)));host.setOnline(true);
  assert(!host.edit({kind:'put',object:makeBuildObject('beer','extra-beer')}));assert(host.edit({kind:'put',object:{...host.objects[0],l:50}}));assert.equal(host.objects.length,MAX_OBJECTS);
});
test('building rooms use a separate encrypted scope, including on LAN HTTP pages',async()=>{
  const settings={code:'1ABCDEFG',id:'build-test',scope:'build18'},secure=await createRoomCipher(settings),lan=await createRoomCipher({...settings,subtle:null,native:null}),city=await createRoomCipher({...settings,scope:'city15'});
  const sealed=await lan.seal({type:'build-edit',action:{kind:'put',object:starterScene()[0]}});assert.equal((await secure.open(sealed)).type,'build-edit');assert.equal(await city.open(sealed),null);assert.notEqual(secure.topic,city.topic);
});
