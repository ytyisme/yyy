import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCityPose,sameCitySpace,createCityRoom} from '../lib/city-room.mjs';
import {createRoomCipher} from '../lib/room-crypto.mjs';

const pose={country:0,city:0,zone:'city',space:'',label:'北京 · 街道',x:8,y:0,z:12,heading:Math.PI,moving:true,mode:'walk',vehicle:null};
function setup(){
  let time=100000;const queue=[],rooms=[];
  const make=(id,host=false)=>{const room=createCityRoom({id,name:id,host,now:()=>time,send:message=>queue.push(message)});rooms.push(room);return room;};
  const flush=()=>{let count=0;while(queue.length){assert(++count<1000);const message=queue.shift();for(const room of rooms)if(room.state.online)room.receive(message);}};
  const tick=()=>{time+=150;for(const room of rooms)if(room.state.online)room.tick(pose);flush();};
  return {make,flush,tick};
}
test('city poses validate vehicles and keep countries, cities and interior floors separate',()=>{
  const clean=cleanCityPose(pose);assert(sameCitySpace(clean,clean));
  for(const changed of [{country:1},{city:1},{zone:'interior',space:'hotel:2'},{zone:'highway',space:'0:1'},{zone:'flight'}])assert(!sameCitySpace(clean,{...clean,...changed}));
  const interior={...clean,zone:'interior',space:'hotel:2'};assert(sameCitySpace(interior,interior));assert(!sameCitySpace(interior,{...interior,space:'hotel:3'}));
  const driving={...pose,mode:'drive',vehicle:{plate:'京A·12345',color:0xffaa33}};assert.deepEqual(cleanCityPose(driving).vehicle,driving.vehicle);
  for(const change of [{x:Infinity},{y:NaN},{city:694},{country:16},{country:1,city:4},{mode:'drive'},{mode:'drive',vehicle:{plate:'',color:1}},{mode:'drive',vehicle:{plate:'test',color:-1}}])assert.equal(cleanCityPose({...pose,...change}),null);
});
test('city room syncs walking and driving, ignores stale packets, and transfers host on departure',()=>{
  const bus=setup(),host=bus.make('city-host',true),guest=bus.make('city-guest');host.setOnline(true);guest.setOnline(true);bus.flush();bus.tick();
  assert(guest.state.joined);assert.equal(host.members.size,2);assert.deepEqual(host.members.get('city-guest').pose,pose);
  const vehicle={...pose,x:20,z:40,mode:'drive',vehicle:{plate:'京A·12345',color:0x4499cc}};
  host.receive({type:'pose',id:'city-guest',roundId:'',seq:20,pose:vehicle});assert.deepEqual(host.members.get('city-guest').pose,vehicle);
  host.receive({type:'pose',id:'city-guest',roundId:'',seq:19,pose});assert.equal(host.members.get('city-guest').pose.x,20);
  guest.receive({type:'room',id:'city-host',hostId:'city-host',term:99,phase:'running',members:[]});assert.equal(guest.state.phase,'lobby');
  host.leave();bus.flush();assert.equal(guest.state.hostId,'city-guest');assert.equal(guest.members.size,1);assert(guest.state.joined);
});
test('LAN HTTP cipher interoperates with WebCrypto and rejects a different room, level or altered payload',async()=>{
  const settings={code:'1ABCDEFG',id:'test-player'};
  const secure=await createRoomCipher({...settings,scope:'city15'}),lan=await createRoomCipher({...settings,scope:'city15',subtle:null,native:null});
  assert.equal(secure.topic,lan.topic);
  const message={type:'pose',pose};
  assert.deepEqual(await lan.open(await secure.seal(message)),{...message,id:settings.id});
  const sealed=await lan.seal(message);assert.deepEqual(await secure.open(sealed),{...message,id:settings.id});
  const wrongRoom=await createRoomCipher({...settings,code:'1ABCDEGH',scope:'city15'}),otherLevel=await createRoomCipher(settings);
  assert.notEqual(secure.topic,wrongRoom.topic);assert.notEqual(secure.topic,otherLevel.topic);
  assert.equal(await wrongRoom.open(sealed),null);assert.equal(await otherLevel.open(sealed),null);
  const bytes=Uint8Array.from(atob(sealed),c=>c.charCodeAt(0));bytes[15]^=1;
  assert.equal(await secure.open(btoa(String.fromCharCode(...bytes))),null);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('yyy-level16-topic-v2:'+settings.code));
  assert.equal(otherLevel.topic,'yyy/level16/v2/'+Buffer.from(hash).toString('hex'));
});

test('separated city leaders merge through admission when a suspended browser returns',()=>{
 const bus=setup(),first=bus.make('city-host-a',true),second=bus.make('city-host-b',true);
 first.setOnline(true);second.setOnline(true);bus.flush();bus.tick();
 assert.equal(first.members.size,2);assert.equal(second.members.size,2);assert.equal(first.state.hostId,second.state.hostId);assert(first.state.joined&&second.state.joined);
});
