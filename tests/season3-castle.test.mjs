import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CASTLE_HAZARDS,CASTLE_LOBBY,GATE_Z,TOWER_X,TOWER_Z,crossedClosedGate,gateOpenAt,hitHazard,pushAway,towerComplete} from '../lib/bouncy-castle.mjs';
import {createRoomCipher} from '../lib/room-crypto.mjs';

const root=new URL('../',import.meta.url),page=fs.readFileSync(new URL('season3-lv2.html',root),'utf8'),script=fs.readFileSync(new URL('season3-lv2.js',root),'utf8'),home=fs.readFileSync(new URL('season3.html',root),'utf8');

test('third-season level 2 is an accessible 3D public-lobby castle level',()=>{
  assert.match(home,/href="season3-lv2\.html"/);
  assert.match(page,/lib\/vendor\/three\.min\.js/);assert.match(page,/type="module" src="season3-lv2\.js/);assert.match(page,/id="castle"/);
  assert.doesNotMatch(page,/<audio\b/i);assert.doesNotMatch(page,/<iframe\b/i);assert.doesNotMatch(page,/房间码|创建房间|加入房间/);
  assert.match(script,/scope:CASTLE_LOBBY\.scope/);assert.match(script,/connectRoom/);assert.match(script,/攀爬架|滑梯|蹦床|平衡木|海绵池/);assert.match(script,/三个小孩/);
  assert.deepEqual(CASTLE_LOBBY,{code:'1CASTLE2',scope:'season3-castle'});assert.equal(CASTLE_HAZARDS.length,2);assert.equal(TOWER_X,0);assert.equal(TOWER_Z,-18);
});

test('castle rules keep hazards, guard timing, pushback, and manual tower completion deterministic',()=>{
  assert.equal(hitHazard({x:CASTLE_HAZARDS[0].x,z:CASTLE_HAZARDS[0].z}).id,'golden-poop');
  const pushed=pushAway({x:CASTLE_HAZARDS[0].x+.1,z:CASTLE_HAZARDS[0].z},CASTLE_HAZARDS[0]);assert(Math.hypot(pushed.x-CASTLE_HAZARDS[0].x,pushed.z-CASTLE_HAZARDS[0].z)>CASTLE_HAZARDS[0].radius);
  assert.equal(crossedClosedGate({z:GATE_Z+.2},{z:GATE_Z-.2},false,1),true);assert.equal(crossedClosedGate({z:GATE_Z+.2},{z:GATE_Z-.2},true,1),false);
  assert.equal(gateOpenAt(5),true);assert.equal(gateOpenAt(2),false);assert.equal(towerComplete(.99),false);assert.equal(towerComplete(1),true);
});

test('castle lobby uses its own encrypted public channel',async()=>{
  const a=await createRoomCipher({code:CASTLE_LOBBY.code,id:'castle-a',scope:CASTLE_LOBBY.scope});
  const b=await createRoomCipher({code:CASTLE_LOBBY.code,id:'castle-b',scope:CASTLE_LOBBY.scope});
  assert.equal(a.topic,b.topic);
  assert.deepEqual(await b.open(await a.seal({type:'state',x:2,y:1,z:4,mode:'free'})),{type:'state',x:2,y:1,z:4,mode:'free',id:'castle-a'});
});
