// Two independent network clients: no BroadcastChannel or simulated transport.
import assert from 'node:assert/strict';
import {connectRoom,makeRoomCode} from '../lib/chase-network.mjs';
import {createChaseRoom} from '../lib/chase-room.mjs';
const code=makeRoomCode(Number(process.argv[2]||0)),transports=[],clients=[],starts=[];
let began=false,finished=false,pausedSent=false,leaving=false,timer;
const deadline=setTimeout(()=>finish(new Error('Internet room verification timed out')),35000);
function finish(error){if(finished)return;finished=true;clearTimeout(deadline);clearInterval(timer);for(const c of clients)c.leave();for(const t of transports)t.close();if(error){console.error(error.message);process.exitCode=1;}else console.log(JSON.stringify({internet:true,players:2,broker:code[0],startSkewMs:Math.abs(starts[0].time-starts[1].time),positionAndJump:true,pause:true,leave:true}));}
try{
  for(const [i,id] of ['verify-host-0001','verify-guest-0002'].entries()){
    let transport;const client=createChaseRoom({id,name:'测试防护员'+(i+1),host:i===0,send:msg=>transport?.send(msg),onStart:()=>starts.push({id,time:Date.now()})});clients.push(client);
    transport=await connectRoom({code,id,onMessage:msg=>client.receive(msg),onStatus:status=>client.setOnline(status==='online')});transports.push(transport);
  }
  timer=setInterval(()=>{try{const [host,guest]=clients;
    if(!began&&host.state.online&&guest.state.online&&guest.state.joined&&host.members.size===2){guest.ready();if(host.members.get('verify-guest-0002')?.ready){assert(host.begin());began=true;}}
    for(const [i,c] of clients.entries())if(!leaving||i===0)c.tick({distance:starts.length===2?100+i*10:0,x:i?2.1:0,jump:starts.length===2?1.2:0,elapsed:5,phase:starts.length===2?(pausedSent?'paused':'running'):'ready'});
    if(starts.length===2&&!pausedSent){const peer=host.members.get('verify-guest-0002');if(peer?.pose.distance===110&&peer.pose.jump===1.2){assert.equal(peer.pose.x,2.1);pausedSent=true;}}
    if(pausedSent&&!leaving&&host.members.get('verify-guest-0002')?.pose.phase==='paused'){guest.leave();transports[1].close();leaving=true;}
    if(leaving&&!host.members.has('verify-guest-0002')){assert(Math.abs(starts[0].time-starts[1].time)<600);finish();}
  }catch(error){finish(error);}},50);
}catch(error){finish(error);}
