export const CASTLE_LOBBY=Object.freeze({code:'1CASTLE2',scope:'season3-castle'});
export const CASTLE_HAZARDS=Object.freeze([
  {id:'golden-poop',name:'黄金巨猛（屎）',x:-8,z:1,radius:2.1,push:2.8},
  {id:'black-mamba-poop',name:'黑曼巴（屎）',x:11,z:-4,radius:1.8,push:2.4},
]);
export const GATE_Z=-11;
export const TOWER_X=0;
export const TOWER_Z=-18;
export function gateOpenAt(seconds){const phase=((Number(seconds)||0)%7+7)%7;return phase>=4.3&&phase<5.9;}
export function crossedClosedGate(previous,current,insideTower,seconds){return !insideTower&&previous.z>GATE_Z&&current.z<=GATE_Z&&!gateOpenAt(seconds);}
export function hitHazard(position){return CASTLE_HAZARDS.find(hazard=>Math.hypot(position.x-hazard.x,position.z-hazard.z)<hazard.radius)||null;}
export function pushAway(position,hazard){const dx=position.x-hazard.x,dz=position.z-hazard.z,distance=Math.hypot(dx,dz)||1;return {x:hazard.x+dx/distance*(hazard.radius+hazard.push),z:hazard.z+dz/distance*(hazard.radius+hazard.push)};}
export function towerComplete(progress){return Number(progress)>=1;}
