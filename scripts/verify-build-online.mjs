// Independent encrypted WebSocket clients exercise shared objects, not a local channel.
import assert from 'node:assert/strict';
import {connectRoom,makePlayerId,makeRoomCode} from '../lib/chase-network.mjs';
import {createBuildRoom} from '../lib/build-room.mjs';
import {makeBuildObject,ITEMS} from '../lib/build-world.mjs';
const code=makeRoomCode(Number(process.argv[2]||0)),clients=[],transports=[],ids=[makePlayerId(),makePlayerId(),makePlayerId()];
const initial=Array.from({length:45},(_,i)=>makeBuildObject(ITEMS[i%5].type,'initial-'+i,i%10*4,Math.floor(i/10)*4));
let stage='initial',timer,finished=false;
const deadline=setTimeout(()=>finish(new Error('Building internet verification timed out at '+stage+' '+JSON.stringify(clients.map((room,i)=>({index:i,id:ids[i],host:room.state.hostId,online:room.state.online,joined:room.state.joined,synced:room.synced,term:room.state.term,members:[...room.members.keys()]}))))),45000);
function finish(error){if(finished)return;finished=true;clearTimeout(deadline);clearInterval(timer);for(const room of clients)room.leave();for(const transport of transports)transport.close();if(error){console.error(error);process.exitCode=1;}else console.log(JSON.stringify({internet:true,players:3,broker:code[0],chunkedScene:true,place:true,resizeAndMove:true,television:true,delete:true,lateJoin:true,hostMigration:true}));}
async function make(i){
  let transport;const room=createBuildRoom({id:ids[i],name:'建造验证'+i,host:i===0,initial:i===0?initial:[],send:message=>transport?.send(message)});clients[i]=room;
  transport=await connectRoom({code,id:ids[i],scope:'build18',onMessage:message=>room.receive(message),onStatus:status=>room.setOnline(status==='online')});transports[i]=transport;
}
try{
  await make(0);await make(1);
  timer=setInterval(()=>{try{
    for(const [i,room]of clients.entries())if(stage!=='migration'&&stage!=='after-migration'||i!==0)room.tick({x:i*3,y:0,z:17,heading:0,moving:true});
    const [host,guest,late]=clients,guestObject=guest.objects.find(p=>p.id==='network-brick');
    if(stage==='initial'&&host.state.online&&guest.state.joined&&guest.synced){
      assert.deepEqual(guest.objects,initial);assert.equal(host.members.get(ids[1]).pose.x,3);
      assert(host.edit({kind:'put',object:makeBuildObject('brick','network-brick',0,3)}));stage='place';
    }else if(stage==='place'&&guestObject){assert(guest.edit({kind:'put',object:{...guestObject,x:20,z:12,w:18,h:4,l:25}}));stage='resize';}
    else if(stage==='resize'&&host.objects.find(p=>p.id==='network-brick')?.w===18){assert.equal(host.objects.find(p=>p.id==='network-brick').x,20);assert(guest.edit({kind:'put',object:{...guest.objects.find(p=>p.type==='tv'),on:false}}));stage='television';}
    else if(stage==='television'&&host.objects.find(p=>p.type==='tv')?.on===false){assert(host.edit({kind:'delete',objectId:'network-brick'}));stage='delete';}
    else if(stage==='delete'&&!guestObject){stage='late-joining';make(2).catch(finish);}
    else if(stage==='late-joining'&&late?.synced){assert.deepEqual(late.objects,host.objects);host.leave();transports[0].close();stage='migration';}
    else if(stage==='migration'&&guest.isHost&&late.state.hostId===ids[1]){assert(guest.edit({kind:'put',object:makeBuildObject('beer','migration-beer',5,5)}));stage='after-migration';}
    else if(stage==='after-migration'&&late.objects.some(p=>p.id==='migration-beer'))finish();
  }catch(error){finish(error);}},100);
}catch(error){finish(error);}
