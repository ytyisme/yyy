import {createChaseRoom,MAX_PLAYERS} from './chase-room.mjs';
import {cleanBuildObject,cleanBuildScene,cleanBuildPose,MAX_OBJECTS,starterScene} from './build-world.mjs';
import {attachCoaster} from './coaster.mjs';
export {MAX_PLAYERS};
const CHUNK=16;
export function applyBuildAction(objects,action){
  const trial=new Map(objects);
  function apply(value){
    if(!value)return false;
    if(value.kind==='reset'){trial.clear();for(const item of starterScene())trial.set(item.id,item);return {kind:'reset'};}
    if(value.kind==='batch'){
      if(!Array.isArray(value.actions)||!value.actions.length||value.actions.length>32||JSON.stringify(value).length>9000||value.actions.some(p=>p?.kind==='batch'))return false;
      const actions=[];for(const item of value.actions){const accepted=apply(item);if(!accepted)return false;actions.push(accepted);}return {kind:'batch',actions};
    }
    if(value.kind==='put'){
      let item=cleanBuildObject(value.object);if(!item||(!trial.has(item.id)&&trial.size>=MAX_OBJECTS))return false;
      if(item.type==='coaster'){item=attachCoaster(trial.values(),item);if(!item)return false;}
      trial.set(item.id,item);return {kind:'put',object:item};
    }
    if(value.kind!=='delete'||typeof value.objectId!=='string'||!trial.has(value.objectId))return false;
    trial.delete(value.objectId);return {kind:'delete',objectId:value.objectId};
  }
  const accepted=apply(action);if(!accepted)return false;objects.clear();for(const [id,item]of trial)objects.set(id,item);return accepted;
}
export function createBuildRoom({id,name,host=false,initial=[],send=()=>{},onChange=()=>{},onScene=()=>{},onError=()=>{},now=()=>Date.now()}){
  let objects=new Map((cleanBuildScene(initial)||[]).map(p=>[p.id,p])),revision=0,synced=host,epoch='',lastHead=0,lastPull=-Infinity,transfer=null,requestSeq=0,clockOffset=0,room;
  const seen=new Set();
  const post=message=>send({...message,id});
  const changed=()=>onScene([...objects.values()]);
  function leadership(){
    const next=room.state.term+':'+room.state.hostId;
    if(next!==epoch){epoch=next;transfer=null;synced=room.isHost;lastHead=0;lastPull=-Infinity;seen.clear();}
    onChange();
  }
  room=createChaseRoom({id,name,host,now,peerTimeout:45000,sanitizePose:cleanBuildPose,send,onChange:()=>{if(room)leadership();}});
  epoch=room.state.term+':'+room.state.hostId;
  const clockNow=()=>now()+clockOffset;
  function snapshot(to,askedAt){
    const all=[...objects.values()],total=Math.max(1,Math.ceil(all.length/CHUNK));
    for(let part=0;part<total;part++)post({type:'build-snapshot',to,epoch,revision,part,total,sentAt:clockNow(),askedAt,objects:all.slice(part*CHUNK,(part+1)*CHUNK)});
  }
  function apply(action){
    return applyBuildAction(objects,action);
  }
  function commit(action,requestId){
    const accepted=apply(action);if(!accepted)return false;
    revision++;changed();post({type:'build-commit',epoch,revision,action:accepted,requestId});return true;
  }
  function pull(){if(!room.state.online||!room.state.joined||room.isHost||now()-lastPull<1500)return;lastPull=now();post({type:'build-pull',to:room.state.hostId,askedAt:now()});}
  function receive(message){
    if(!message||message.id===id)return;
    if(!message.type?.startsWith('build-')){
      if(message.type==='ready'||message.type==='room'&&message.phase!=='lobby')return;
      // Converge on one authority after a background tab or a partition returns.
      if(message.type==='room'&&message.hostId===message.id&&Array.isArray(message.members)&&message.members.length<=MAX_PLAYERS&&new Set(message.members.map(p=>p.id)).size===message.members.length&&message.members.every(p=>typeof p.id==='string'&&/^[a-zA-Z0-9-]{4,48}$/.test(p.id)&&Number.isFinite(p.joinedAt))&&message.members.some(p=>p.id===message.id)&&Number.isInteger(message.term)){
        const state=room.state;if(state.hostId&&message.id!==state.hostId&&(message.term>state.term||message.term===state.term&&message.id<state.hostId))state.hostId='';
      }
      room.receive(message);return;
    }
    if(!room.state.joined||!room.members.has(message.id))return;
    if(message.type==='build-pull'&&room.isHost&&message.to===id){snapshot(message.id,message.askedAt);return;}
    if(message.type==='build-edit'&&room.isHost){
      if(typeof message.requestId!=='string'||message.requestId.length>100||seen.has(message.requestId))return;
      seen.add(message.requestId);if(seen.size>1024)seen.delete(seen.values().next().value);
      if(!commit(message.action,message.requestId))post({type:'build-denied',to:message.id,reason:'无法放置，请检查轨道、车厢长度或场景容量（最多150件）。'});return;
    }
    if(message.id!==room.state.hostId)return;
    if(Number.isFinite(message.sentAt)&&Math.abs(message.sentAt-now())<86400000){const rtt=Number.isFinite(message.askedAt)?Math.max(0,Math.min(10000,now()-message.askedAt)):0;clockOffset=message.sentAt+rtt/2-now();}
    if(message.type==='build-denied'&&message.to===id){onError(message.reason);return;}
    if(message.epoch!==epoch||!Number.isSafeInteger(message.revision)||message.revision<0)return;
    if(message.type==='build-head'){
      if(!synced||message.revision!==revision){synced=false;pull();onChange();}return;
    }
    if(message.type==='build-commit'){
      if(message.revision<=revision&&synced)return;
      if(!synced||message.revision!==revision+1){synced=false;pull();return;}
      if(!apply(message.action)){synced=false;pull();return;}revision=message.revision;changed();return;
    }
    if(message.type==='build-snapshot'&&message.to===id){
      if(message.revision<revision&&synced||!Number.isInteger(message.total)||message.total<1||message.total>Math.ceil(MAX_OBJECTS/CHUNK)||!Number.isInteger(message.part)||message.part<0||message.part>=message.total||!Array.isArray(message.objects)||message.objects.length>CHUNK)return;
      const part=cleanBuildScene(message.objects);if(!part)return;
      if(!transfer||transfer.revision!==message.revision||transfer.epoch!==epoch)transfer={revision:message.revision,epoch,total:message.total,parts:new Map(),at:now()};
      if(message.total!==transfer.total)return;transfer.parts.set(message.part,part);
      if(transfer.parts.size===transfer.total){
        const all=cleanBuildScene(Array.from({length:transfer.total},(_,i)=>transfer.parts.get(i)).flat());if(!all){transfer=null;return;}
        objects=new Map(all.map(p=>[p.id,p]));revision=transfer.revision;transfer=null;synced=true;changed();onChange();
      }
    }
  }
  return {state:room.state,members:room.members,clockNow,get isHost(){return room.isHost;},get synced(){return synced;},get objects(){return [...objects.values()];},get revision(){return revision;},receive,
    setOnline(value){room.setOnline(value);if(!value&&!room.isHost)synced=false;leadership();},
    tick(pose){room.tick(pose);if(!room.state.online||!room.state.joined)return;if(transfer&&now()-transfer.at>6000)transfer=null;if(room.isHost&&now()-lastHead>1500){lastHead=now();post({type:'build-head',epoch,revision,sentAt:clockNow()});}else if(!room.isHost&&!synced)pull();},
    edit(action){if(!room.state.online||!room.state.joined||!synced)return false;const requestId=id+'-'+(++requestSeq);if(room.isHost)return commit(action,requestId);post({type:'build-edit',requestId,action});return true;},
    leave(){room.leave();}
  };
}
