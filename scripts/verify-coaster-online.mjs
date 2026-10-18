import assert from 'node:assert/strict';
import {connectRoom,makePlayerId,makeRoomCode} from '../lib/chase-network.mjs';
import {createBuildRoom} from '../lib/build-room.mjs';
import {makeBuildObject} from '../lib/build-world.mjs';
import {coasterDemo,coasterFleet} from '../lib/coaster.mjs';
const code=makeRoomCode(Number(process.argv[2]||0)),ids=[makePlayerId(),makePlayerId(),makePlayerId()],clients=[],transports=[];
let stage='connect',timer,finished=false;
const deadline=setTimeout(()=>finish(new Error('Coaster internet verification timed out at '+stage)),45000);
function finish(error){if(finished)return;finished=true;clearTimeout(deadline);clearInterval(timer);for(const c of clients)c.leave();for(const t of transports)t.close();if(error){console.error(error);process.exitCode=1;}else console.log(JSON.stringify({internet:true,broker:code[0],players:3,trackShapes:true,tunnelsAndExcavation:true,autoCoupling:true,startAndStop:true,undergroundRider:true,invertedOrientation:true,lateJoin:true,hostMigration:true}));}
async function make(i){let transport;const room=createBuildRoom({id:ids[i],name:'过山车测试'+i,host:i===0,send:message=>transport?.send(message)});clients[i]=room;transport=await connectRoom({code,id:ids[i],scope:'build18',onMessage:message=>room.receive(message),onStatus:status=>room.setOnline(status==='online')});transports[i]=transport;}
try{
  await make(0);await make(1);
  timer=setInterval(()=>{try{
    const [host,guest,late]=clients;
    for(const [i,c]of clients.entries())if(!(['migration','stop'].includes(stage)&&i===0))c.tick(i===1&&['rider','joining','migration','stop'].includes(stage)?{x:-39,y:-4,z:48,heading:0,moving:true,ride:'network-car',quaternion:[1,0,0,0]}:{x:i*3,y:0,z:17,heading:0,moving:false});
    if(stage==='connect'&&host.state.online&&guest.state.joined&&guest.synced){assert(host.edit({kind:'batch',actions:coasterDemo(makeBuildObject).map(object=>({kind:'put',object}))}));stage='scene';}
    else if(stage==='scene'&&guest.objects.length===19){assert(guest.objects.some(p=>p.type==='dig'&&p.h===9));assert(guest.objects.some(p=>p.tunnel));assert(guest.edit({kind:'put',object:{...makeBuildObject('coaster','network-car'),trackId:'demo_coaster_rail_0',distance:3}}));stage='couple';}
    else if(stage==='couple'&&host.objects.some(p=>p.id==='network-car')){const car=host.objects.find(p=>p.id==='network-car');assert.equal(car.trainId,'demo_coaster_car_0');assert.equal(car.slot,3);const leader=guest.objects.find(p=>p.id==='demo_coaster_car_0');assert(guest.edit({kind:'put',object:{...leader,running:true,startedAt:guest.clockNow(),speed:12}}));stage='run';}
    else if(stage==='run'&&host.objects.find(p=>p.id==='demo_coaster_car_0')?.running)stage='rider';
    else if(stage==='rider'&&host.members.get(ids[1])?.pose.ride==='network-car'){assert.equal(host.members.get(ids[1]).pose.y,-4);assert.deepEqual(host.members.get(ids[1]).pose.quaternion,[1,0,0,0]);stage='joining';make(2).catch(finish);}
    else if(stage==='joining'&&late?.synced){assert.deepEqual(late.objects,host.objects);const a=coasterFleet(host.objects,host.clockNow())[0],b=coasterFleet(late.objects,late.clockNow())[0];assert(Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y,a.position.z-b.position.z)<3);host.leave();transports[0].close();stage='migration';}
    else if(stage==='migration'&&guest.isHost&&late.state.hostId===ids[1]){const leader=guest.objects.find(p=>p.id==='demo_coaster_car_0');assert(guest.edit({kind:'put',object:{...leader,running:false}}));stage='stop';}
    else if(stage==='stop'&&late.objects.find(p=>p.id==='demo_coaster_car_0')?.running===false)finish();
  }catch(error){finish(error);}},100);
}catch(error){finish(error);}
