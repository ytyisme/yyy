import {createChaseRoom,MAX_PLAYERS} from './chase-room.mjs';
import {cleanSkinId} from './skin-shop.mjs';
export {MAX_PLAYERS};
const zones=new Set(['city','interior','highway','flight']);
const modes=new Set(['walk','drive','passenger','flight']);
const text=(value,length)=>String(value??'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,length);
export function cleanCityPose(p) {
  if(!p||!Number.isInteger(p.country)||p.country<0||p.country>15||!Number.isInteger(p.city)||p.city<0||p.city>(p.country===0?693:3)||!zones.has(p.zone)||!modes.has(p.mode))return null;
  for(const field of ['x','y','z','heading'])if(!Number.isFinite(p[field]))return null;
  if(Math.abs(p.x)>1000000||Math.abs(p.z)>(p.zone==='highway'?20000000:1000000)||p.y< -100||p.y>100000)return null;
  let vehicle=null;
  if(['drive','passenger'].includes(p.mode)) {
    if(!p.vehicle||typeof p.vehicle.plate!=='string'||!text(p.vehicle.plate,24)||!Number.isInteger(p.vehicle.color)||p.vehicle.color<0||p.vehicle.color>0xffffff)return null;
    vehicle={plate:text(p.vehicle.plate,24),color:p.vehicle.color};
  }
  return {country:p.country,city:p.city,zone:p.zone,space:text(p.space,100),label:text(p.label,50),x:p.x,y:p.y,z:p.z,heading:Math.atan2(Math.sin(p.heading),Math.cos(p.heading)),moving:!!p.moving,mode:p.mode,vehicle,skinId:cleanSkinId(p.skinId)};
}
export function sameCitySpace(a,b) {
  return !!a&&!!b&&a.zone!=='flight'&&a.country===b.country&&a.city===b.city&&a.zone===b.zone&&a.space===b.space;
}
export function createCityRoom(options) {
  const room=createChaseRoom({...options,sanitizePose:cleanCityPose,peerTimeout:45000}),receive=room.receive;
  room.receive=message=>{
    if(message?.type==='ready'||(message?.type==='room'&&message.phase!=='lobby'))return;
    // Two surviving leaders can meet after a suspended tab reconnects. Select
    // the same leader on both clients, then use the usual admission handshake.
    if(message?.type==='room'&&message.hostId===message.id&&Array.isArray(message.members)&&message.members.length<=MAX_PLAYERS&&new Set(message.members.map(p=>p.id)).size===message.members.length&&message.members.some(p=>p.id===message.id)&&message.members.every(p=>typeof p.id==='string'&&/^[a-zA-Z0-9-]{4,48}$/.test(p.id)&&Number.isFinite(p.joinedAt))&&Number.isInteger(message.term)) {
      const state=room.state;
      if(state.hostId&&message.id!==state.hostId&&(message.term>state.term||(message.term===state.term&&message.id<state.hostId)))state.hostId='';
    }
    receive(message);
  };
  return room;
}
