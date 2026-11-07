import {createTradeState,addPlayer,propose,accept,removePlayer} from './classroom-trade.mjs?v=35-20261104b';
import {noticeEating,catchEating} from './classroom-behavior.mjs?v=35-20261104b';
import {gesture} from './classroom-snacks.mjs?v=35-20261104b';
// The host owns the state. Guests send intentions and consume host snapshots.
export function createClassroomHost(hostId,send,now=Date.now,random=Math.random){
 const state=createTradeState(),seen=new Map(),last=new Map();let start=now(),revision=0,closed=false;
 const idPattern=/^[a-zA-Z0-9-]{4,48}$/;
 addPlayer(state,hostId,Math.floor(random()*20));last.set(hostId,now());
 function phase(){return Math.floor((now()-start)/180000)%2?'break':'class'}
 function updateLesson(){const cycle=Math.floor((now()-start)/360000);if(state.lesson?.cycle===cycle)return;const players=Object.keys(state.players);const chosen=random()<.5?players[Math.floor(random()*players.length)]:null;state.lesson={cycle,chosen,a:2+Math.floor(random()*8),b:1+Math.floor(random()*8),answered:false};revision++;}
 function publish(to){updateLesson();send({type:'snapshot',to,host:hostId,revision,start,state:structuredClone(state)});}
 function receive(m){if(closed||!m||!idPattern.test(m.id))return false;const actor=m.id;
  if(m.type==='join'){if(!state.players[actor]){const used=new Set(Object.values(state.players).map(p=>p.seat));const seats=Array.from({length:20},(_,i)=>i).filter(i=>!used.has(i));if(!seats.length||!addPlayer(state,actor,seats[Math.floor(random()*seats.length)])){send({type:'full',to:actor});return false}revision++}last.set(actor,now());publish(actor);publish();return true}
  if(!state.players[actor])return false;last.set(actor,now());
  if(m.type==='ping'){publish(actor);return true}if(m.type==='bye'){if(actor===hostId)return false;removePlayer(state,actor);last.delete(actor);revision++;publish();return true}
  if(m.type==='chat'){if(typeof m.text!=='string'||!m.text.trim()||m.text.length>80)return false;send({type:'chat',from:actor,text:m.text});return true}
  if(!idPattern.test(m.action||''))return false;const action=actor+':'+m.action;if(seen.has(action))return false;
  let changed=false;if(m.type==='snack'){if(['snack','tea','straw','candy'].includes(m.item)&&['tear','mouth','tea'].includes(m.target)){changed=Boolean(gesture(state.players[actor],m.item,m.target,80));if(changed&&phase()==='class'&&noticeEating(state.players[actor],now()-start,m.item,m.target))catchEating(state.players[actor]);}}
  else if(m.type==='offer')changed=propose(state,action,actor,m.to,m.give,m.want,phase());
  else if(m.type==='accept'&&typeof m.offer==='string')changed=accept(state,m.offer,actor,phase());
  else if(m.type==='answer'&&phase()==='class'&&state.lesson?.chosen===actor&&!state.lesson.answered&&Number.isInteger(m.points)&&Number.isInteger(m.strokes)&&m.points>0&&m.points<=10000&&m.strokes>0&&m.strokes<=100){state.lesson.answered=true;state.lesson.neat=m.points>=8&&m.strokes<=12;if(state.lesson.neat)state.players[actor].candy++;changed=true}
  else if(m.type==='position'&&phase()==='break'&&Number.isFinite(m.x)&&Number.isFinite(m.z)&&Math.abs(m.x)<=8&&Math.abs(m.z)<=7){state.players[actor].position={x:m.x,z:m.z};changed=true}
  if(changed){seen.set(action,true);revision++;publish()}return changed;
 }
 function tick(){if(closed)return;for(const [id,time] of last)if(id!==hostId&&now()-time>15000){removePlayer(state,id);last.delete(id);revision++}publish()}
 function close(){if(closed)return;closed=true;send({type:'closed',host:hostId})}
 return {state,receive,tick,close,phase};
}
