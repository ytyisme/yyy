import {connectRoom} from './chase-network.mjs?v=35-20261104b';
import {createClassroomHost} from './classroom-room.mjs?v=35-20261104b';
export async function connectClassroom({code,id,isHost,onState=()=>{},onChat=()=>{},onStatus=()=>{},connect=connectRoom,now=Date.now}){
 let link,online=false,closed=false,hostId=isHost?id:'',lastHost=now(),host;
 const transmit=m=>link?.send(m);const receive=m=>{if(closed||!m)return;if(host){host.receive(m);return}if(m.type==='snapshot'&&m.host===m.id&&(!hostId||hostId===m.id)&&(!m.to||m.to===id)){hostId=m.id;lastHost=now();onState(m.state,m.start,m.revision)}else if(m.type==='chat'&&m.id===hostId)onChat(m.from,m.text);else if(m.type==='closed'&&m.id===hostId)close('房主已离开');};
 if(isHost)host=createClassroomHost(id,m=>{if(m.type==='snapshot'&&(!m.to||m.to===id))onState(m.state,m.start,m.revision);if(m.type==='chat')onChat(m.from,m.text);transmit(m)},now);
 link=await connect({code,id,scope:'classroom35',onMessage:receive,onStatus:s=>{online=s==='online';onStatus(s);if(online&&!isHost&&link)transmit({type:'join'})}});
 if(link.online&&!isHost)transmit({type:'join'});if(isHost)host.tick();
 const timer=setInterval(()=>{if(!online||closed)return;if(host)host.tick();else if(hostId&&now()-lastHost>15000)close('房主连接中断');else transmit({type:hostId?'ping':'join'})},3000);
 function action(m){if(!online||closed)return false;if(host)return host.receive({...m,id});transmit(m);return true}
 function close(reason='已退出'){if(closed)return;if(online){if(host)host.close();else transmit({type:'bye'})}closed=true;clearInterval(timer);link.close();onStatus(reason)}
 return {action,close};
}
