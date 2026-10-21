import {cleanSkinId} from './skin-shop.mjs';
export const MAX_PLAYERS=6;
const initialPose=previous=>({distance:0,x:0,jump:0,elapsed:0,phase:'ready',skinId:cleanSkinId(previous?.skinId)});
const PHASES=new Set(['ready','running','paused','won','caught']);
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{4,48}$/.test(id);
export function cleanName(name){return String(name||'玩家').replace(/[\u0000-\u001f]/g,'').trim().slice(0,12)||'玩家';}
export function cleanPose(p){if(!p||!PHASES.has(p.phase))return null;for(const k of ['distance','x','jump','elapsed'])if(!Number.isFinite(p[k]))return null;if(p.distance<0||p.distance>3000||Math.abs(p.x)>2.11||p.jump<0||p.jump>1.9||p.elapsed<0||p.elapsed>86400)return null;return {distance:p.distance,x:p.x,jump:p.jump,elapsed:p.elapsed,phase:p.phase,skinId:cleanSkinId(p.skinId)};}
export function createChaseRoom({id,name,host=false,send=()=>{},onChange=()=>{},onStart=()=>{},now=()=>Date.now(),sanitizePose=cleanPose,peerTimeout=10000}){
  if(!validId(id))throw new Error('Invalid player id');
  const members=new Map(),state={hostId:host?id:'',joined:host,phase:'lobby',roundId:'',startAt:0,roundPlayers:[],term:0,online:false,error:''};
  let startedRound='',seq=0,lastRoom=0,lastHello=0,lastPose=0;
  const self={id,name:cleanName(name),ready:host,joinedAt:now(),last:now(),seq:-1,pose:initialPose()};members.set(id,self);
  const isHost=()=>state.hostId===id;
  const emit=()=>onChange({state,members,isHost:isHost()});
  const post=message=>{send({...message,id});};
  function advertise(){if(!isHost()||!state.online)return;lastRoom=now();post({type:'room',hostId:id,term:state.term,phase:state.phase,roundId:state.roundId,startAt:state.startAt,roundPlayers:state.roundPlayers,members:Array.from(members.values(),p=>({id:p.id,name:p.name,ready:p.ready,joinedAt:p.joinedAt}))});}
  function elect(){const next=Array.from(members.values()).sort((a,b)=>a.joinedAt-b.joinedAt||a.id.localeCompare(b.id))[0];if(next){state.hostId=next.id;state.term++;advertise();}else state.hostId='';}
  function remove(peerId){if(peerId===id)return;members.delete(peerId);if(state.hostId===peerId)elect();advertise();emit();}
  function receive(msg){if(!msg||!validId(msg.id)||msg.id===id)return;const time=now();
    if(msg.type==='hello'){if(!isHost())return;let peer=members.get(msg.id);if(!peer){if(members.size>=MAX_PLAYERS){post({type:'denied',to:msg.id,reason:'房间已满（最多6人）'});return;}peer={id:msg.id,name:cleanName(msg.name),ready:false,joinedAt:time,last:time,seq:-1,pose:initialPose()};members.set(msg.id,peer);}peer.last=time;advertise();emit();return;}
    if(msg.type==='denied'&&msg.to===id&&!state.joined){state.error=String(msg.reason||'无法加入房间').slice(0,40);emit();return;}
    if(msg.type==='room'){
      if(msg.hostId!==msg.id||!Array.isArray(msg.members)||msg.members.length>MAX_PLAYERS||!['lobby','countdown','running'].includes(msg.phase)||!Number.isInteger(msg.term)||msg.term<state.term)return;
      if(state.hostId&&msg.id!==state.hostId&&!(msg.term>state.term&&members.has(msg.id)))return;
      const rows=msg.members.filter(p=>validId(p.id)&&Number.isFinite(p.joinedAt));if(rows.length!==msg.members.length||new Set(rows.map(p=>p.id)).size!==rows.length||!rows.some(p=>p.id===msg.id))return;
      if(!rows.some(p=>p.id===id)){state.joined=false;post({type:'hello',name:self.name});return;}
      const newRound=state.roundId!==msg.roundId;state.hostId=msg.id;state.term=msg.term;state.joined=true;state.phase=msg.phase;state.roundId=typeof msg.roundId==='string'?msg.roundId.slice(0,80):'';state.startAt=Number.isFinite(msg.startAt)?msg.startAt:0;state.roundPlayers=Array.isArray(msg.roundPlayers)?msg.roundPlayers.filter(validId):[];
      const roster=new Set(rows.map(p=>p.id));for(const peerId of members.keys())if(!roster.has(peerId))members.delete(peerId);
      for(const row of rows){const old=members.get(row.id);members.set(row.id,{...(old||{seq:-1,pose:initialPose()}),id:row.id,name:cleanName(row.name),ready:!!row.ready,joinedAt:row.joinedAt,last:row.id===msg.id?time:(old?.last||time)});if(newRound){members.get(row.id).seq=-1;members.get(row.id).pose=initialPose(old?.pose);}}
      state.error='';emit();return;
    }
    const peer=members.get(msg.id);if(!peer)return;peer.last=time;
    if(msg.type==='bye'){remove(msg.id);return;}
    if(msg.type==='ready'&&isHost()){peer.ready=!!msg.ready;advertise();emit();}
    if(msg.type==='pose'&&msg.roundId===state.roundId&&Number.isInteger(msg.seq)&&msg.seq>peer.seq){const pose=sanitizePose(msg.pose);if(!pose)return;peer.seq=msg.seq;peer.pose=pose;emit();}
  }
  function setOnline(value){state.online=value;emit();if(value){post({type:'hello',name:self.name});advertise();}}
  function ready(value=true){members.get(id).ready=!!value;post({type:'ready',ready:!!value});advertise();emit();}
  function begin(){if(!isHost()||!state.online||state.phase!=='lobby'||!state.joined||members.size<2||!Array.from(members.values()).every(p=>p.ready))return false;state.roundId=id+'-'+now();state.phase='countdown';state.startAt=now()+3500;state.roundPlayers=Array.from(members.keys());seq=0;for(const p of members.values()){p.seq=-1;p.pose=initialPose(p.pose);}advertise();emit();return true;}
  function tick(pose){const time=now(),me=members.get(id);me.last=time;
    if(!state.online)return;
    for(const p of Array.from(members.values()))if(p.id!==id&&time-p.last>peerTimeout)remove(p.id);
    if(!state.joined&&time-lastHello>1200){lastHello=time;post({type:'hello',name:self.name});}
    if(isHost()&&time-lastRoom>800)advertise();
    if(state.roundId!==startedRound&&state.startAt&&time>=state.startAt&&state.roundPlayers.includes(id)&&state.joined){startedRound=state.roundId;state.phase='running';onStart({roundId:state.roundId,lateSeconds:Math.max(0,(time-state.startAt)/1000)});emit();}
    const cleaned=sanitizePose(pose);if(cleaned&&time-lastPose>100&&state.joined){lastPose=time;me.pose=cleaned;post({type:'pose',roundId:state.roundId,seq:seq++,pose:cleaned});}
    if(isHost()&&state.phase==='running'&&state.roundPlayers.every(peerId=>!members.has(peerId)||['won','caught'].includes(members.get(peerId).pose.phase))){state.phase='lobby';for(const p of members.values())p.ready=p.id===id;advertise();emit();}
  }
  return {state,members,get isHost(){return isHost();},receive,setOnline,ready,begin,tick,leave(){post({type:'bye'});state.online=false;},advertise};
}
