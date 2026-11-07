import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRoomCipher} from '../lib/room-crypto.mjs';
globalThis.crypto ??= webcrypto;
test('画板大厅与房间使用隔离且可用的加密通信',async()=>{
  const a=await createRoomCipher({code:'1ABC234D',id:'player-a',scope:'drawing30-directory'});
  const b=await createRoomCipher({code:'1ABC234D',id:'player-b',scope:'drawing30-directory'});
  const room=await createRoomCipher({code:'1ABC234D',id:'player-b',scope:'drawing30-room'});
  const message=await a.seal({type:'drawing-ad'});
  assert.deepEqual(await b.open(message),{type:'drawing-ad',id:'player-a'});
  assert.notEqual(a.topic,room.topic);
  assert.equal(await room.open(message),null);
});
