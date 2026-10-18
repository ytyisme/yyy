// Real independent WebSocket clients, using the same encrypted city protocol as browsers.
import assert from 'node:assert/strict';
import {connectRoom,makeRoomCode,makePlayerId} from '../lib/chase-network.mjs';
import {createCityRoom,sameCitySpace} from '../lib/city-room.mjs';
const code=makeRoomCode(Number(process.argv[2]||0)),ids=[makePlayerId(),makePlayerId()],clients=[],transports=[];
const base={country:0,city:0,zone:'city',space:'',label:'北京 · 街道',x:8,y:0,z:12,heading:0,moving:true,mode:'walk',vehicle:null};
let stage='walk',finished=false,timer;
const deadline=setTimeout(()=>finish(new Error('City internet verification timed out')),35000);
function finish(error){if(finished)return;finished=true;clearTimeout(deadline);clearInterval(timer);for(const c of clients)c.leave();for(const t of transports)t.close();if(error){console.error(error);process.exitCode=1;}else console.log(JSON.stringify({internet:true,players:2,broker:code[0],walking:true,driving:true,cityIsolation:true,leave:true}));}
try{
  for(let i=0;i<2;i++){
    let transport;const client=createCityRoom({id:ids[i],name:'联机验证'+(i+1),host:i===0,send:message=>transport?.send(message)});clients.push(client);
    transport=await connectRoom({code,id:ids[i],scope:'city15',onMessage:message=>client.receive(message),onStatus:status=>client.setOnline(status==='online')});transports.push(transport);
  }
  timer=setInterval(()=>{try{
    const [host,guest]=clients;
    host.tick(base);
    if(stage!=='leave')guest.tick(stage==='walk'?{...base,x:11}:stage==='drive'?{...base,x:30,mode:'drive',vehicle:{plate:'京A·12345',color:0x4488cc}}:{...base,city:1,label:'天津 · 街道'});
    const peer=host.members.get(ids[1]);
    if(stage==='walk'&&guest.state.joined&&peer?.pose.x===11){assert.equal(guest.members.get(ids[0]).pose.x,8);stage='drive';}
    else if(stage==='drive'&&peer?.pose.mode==='drive'){assert.equal(peer.pose.x,30);assert.equal(peer.pose.vehicle.plate,'京A·12345');assert.equal(peer.pose.vehicle.color,0x4488cc);stage='travel';}
    else if(stage==='travel'&&peer?.pose.city===1){assert(!sameCitySpace(base,peer.pose));stage='leave';guest.leave();transports[1].close();}
    else if(stage==='leave'&&!peer)finish();
  }catch(error){finish(error);}},100);
}catch(error){finish(error);}
