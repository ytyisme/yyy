// Shared track coordinates: every train car and every crossing uses this line.
export const RAIL = Object.freeze({x:10,z:204,width:128,depth:34,trackZ:224,trackStart:-1500,trackEnd:4500,head:66,carLength:18,cars:4,cycle:90,tripLength:4200,maxDriveSpeed:350/3.6});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const STATION_TOLERANCE=18;
export function createRailStops(source='始发站',destination='终点站'){
 const name=text=>String(text).replace(/市$/,'').replace(/站$/,'')+'站';
 return [{id:'origin',name:name(source),distance:0,index:0},{id:'qinghe',name:'青禾站',distance:1050,index:1},{id:'lakeside',name:'湖畔站',distance:2100,index:2},{id:'newtown',name:'新城站',distance:3150,index:3},{id:'terminal',name:name(destination),distance:RAIL.tripLength,index:4}];
}
export function trainAt(seconds){
 const t=((seconds%RAIL.cycle)+RAIL.cycle)%RAIL.cycle;
 let x,velocity,phase;
 if(t<24){const u=t/24;x=-330+396*(2*u-u*u);velocity=33*(1-u);phase='arriving';}
 else if(t<52){x=RAIL.head;velocity=0;phase='boarding';}
 else if(t<80){const u=(t-52)/28;x=RAIL.head+364*u*u;velocity=26*u;phase='departing';}
 else {x=430;velocity=0;phase='away';}
 return {x,z:RAIL.trackZ,y:0,velocity,phase,visible:phase!=='away',tail:x-RAIL.cars*RAIL.carLength-7,seconds:phase==='boarding'?Math.ceil(52-t):Math.ceil((t<24?24:114)-t)};
}
export function crossingAt(seconds,x){
 const train=trainAt(seconds),soon=trainAt(seconds+3);
 const occupies=t=>t.visible&&t.x>=x-65&&t.tail<=x+12;
 return {red:occupies(train)||occupies(soon),train};
}
export function crossingForTrain(train,x){
 const head=train.x+Math.max(0,train.velocity)*3;
 return {red:train.visible&&head>=x-65&&train.tail<=x+12,train};
}
export function crossingBlocks(from,to,r,crossings,seconds,train=null){
 return crossings.some(c=>{
  if(!(train?crossingForTrain(train,c.x):crossingAt(seconds,c.x)).red)return false;
  if(Math.abs(to.x-c.x)>c.width/2+r)return false;
  // Let someone already on the crossing clear it in either direction.
  if(Math.abs(from.z-RAIL.trackZ)<7+r)return false;
  return Math.min(from.z,to.z)<RAIL.trackZ+7+r&&Math.max(from.z,to.z)>RAIL.trackZ-7-r;
 });
}
// Driving has one degree of freedom: distance along the fixed rail line.
export function createRailDrive({distance=0,velocity=0,stops=createRailStops()}={}){
 const drive={distance:clamp(Number.isFinite(distance)?distance:0,0,RAIL.tripLength),velocity:clamp(Number.isFinite(velocity)?velocity:0,0,RAIL.maxDriveSpeed),parking:false,traction:0,braking:0,
  stops:stops.map(s=>({...s})),served:new Set(['origin']),passengers:12,capacity:40,totalBoarded:0,totalAlighted:0,doorsOpen:false,doorProgress:0,service:null,
  stop(){this.parking=true;this.traction=0;},
  get station(){return this.stops.find(s=>Math.abs(s.distance-this.distance)<=STATION_TOLERANCE)??null;},
  get nextStation(){return this.stops.find(s=>s.index>0&&!this.served.has(s.id)&&s.distance>=this.distance-STATION_TOLERANCE)??this.stops.at(-1);},
  openDoors(){
   const station=this.station;if(this.velocity>.05||!station||this.doorsOpen||this.doorProgress>0)return false;
   this.stop();this.velocity=0;this.doorsOpen=true;
   const done=this.served.has(station.id),alight=done?0:station.id==='terminal'?this.passengers:Math.min(this.passengers,2+station.index%3),board=done||station.id==='terminal'?0:Math.min(4+station.index%3,this.capacity-this.passengers+alight);
   this.service={stationId:station.id,name:station.name,elapsed:0,duration:1+(alight+board)*.6,before:this.passengers,alight,board,alighted:0,boarded:0,complete:false};return true;
  },
  closeDoors(){if(!this.doorsOpen||!this.service?.complete)return false;this.doorsOpen=false;return true;},
  exchange(dt){
   const s=this.service;if(!s||s.complete)return;s.elapsed+=dt;
   const complete=s.elapsed+1e-8>=s.duration,off=complete?s.alight:Math.min(s.alight,Math.floor(Math.max(0,s.elapsed-1)/.6)),on=complete?s.board:Math.min(s.board,Math.floor(Math.max(0,s.elapsed-1-s.alight*.6)/.6));
   this.totalAlighted+=off-s.alighted;this.totalBoarded+=on-s.boarded;s.alighted=off;s.boarded=on;this.passengers=s.before-off+on;
   if(complete){s.complete=true;this.served.add(s.stationId);}
  },
  step(dt,{accelerate=false,brake=false,stop=false}={}){
   let stepTime=clamp(Number.isFinite(dt)?dt:0,0,10);
   if(this.doorsOpen){this.doorProgress=clamp(this.doorProgress+stepTime/.7);this.exchange(stepTime);this.stop();this.velocity=0;this.braking=1;return this.arrived;}
   if(this.doorProgress>0){const closing=Math.min(stepTime,this.doorProgress*.7);this.doorProgress=Math.max(0,this.doorProgress-closing/.7);if(this.doorProgress<1e-8)this.doorProgress=0;stepTime-=closing;this.stop();this.velocity=0;if(stepTime<=1e-9){this.braking=1;return this.arrived;}}
   if(stop)this.stop();if(accelerate&&!brake&&!stop)this.parking=false;
   let remaining=stepTime;
   this.traction=accelerate&&!brake&&!this.parking?1:0;this.braking=this.parking?1:brake?.7:0;
   while(remaining>1e-9){const tick=Math.min(.025,remaining);remaining-=tick;
    const left=RAIL.tripLength-this.distance;if(left<=.001){this.distance=RAIL.tripLength;this.velocity=0;this.parking=true;this.traction=0;break;}
    const before=this.velocity,acceleration=this.parking?-9:brake?-6:this.traction?2.8:-.12;
    let next=clamp(before+acceleration*tick,0,RAIL.maxDriveSpeed);
    const safeSpeed=Math.sqrt(2*5.5*Math.max(0,left-.02));if(next>safeSpeed){next=safeSpeed;this.braking=Math.max(this.braking,.7);this.traction=0;}
    this.distance=Math.min(RAIL.tripLength,this.distance+(before+next)*.5*tick);this.velocity=next;
    if(RAIL.tripLength-this.distance<.03&&next<.6){this.distance=RAIL.tripLength;this.velocity=0;this.parking=true;this.traction=0;}
   }
   return this.arrived;
  },
  get arrived(){return this.distance>=RAIL.tripLength-.001&&this.velocity<.01;},
  get finished(){return this.arrived&&this.served.has('terminal')&&!this.doorsOpen&&this.doorProgress===0;},
  get remaining(){return Math.max(0,RAIL.tripLength-this.distance);},
  get pose(){const x=RAIL.head+this.distance;return {x,y:0,z:RAIL.trackZ,velocity:this.velocity,doorProgress:this.doorProgress,tail:x-RAIL.cars*RAIL.carLength-7,visible:true,phase:this.velocity>.05?'driving':'stopped'};}
 };
 return drive;
}
export function railJourney(){
 return {secured:false,ticket:null,checked:false,phase:'hall',elapsed:0,
  security(){if(this.phase!=='hall')return false;this.secured=true;return true;},
  buy(destination,source){if(!this.secured||this.phase!=='hall'||!destination||!Number.isInteger(destination.index)||destination.index<0||typeof destination.name!=='string'||destination.index===source.index)return false;this.ticket={destination:{index:destination.index,name:destination.name,province:destination.province??''},source:{index:source.index,name:source.name},fare:128,used:false};this.checked=false;return true;},
  check(){if(!this.secured||!this.ticket||this.ticket.used||this.phase!=='hall')return false;this.checked=true;this.phase='waiting';return true;},
  platform(){if(!this.checked||this.phase!=='waiting')return false;this.phase='platform';return true;},
  board(train){if(this.phase!=='platform'||!this.ticket||this.ticket.used||train.phase!=='boarding')return false;this.ticket.used=true;this.phase='cabin';this.elapsed=0;return true;},
  tick(dt){if(this.phase!=='cabin')return false;this.elapsed+=Math.max(0,dt);if(this.elapsed>=42){this.phase='arrived';return true;}return false;}
 };
}
export function cabinMove(to){
 if(Math.abs(to.x)>2.5||Math.abs(to.z)>15)return false;
 // Seats have real collision; the middle aisle and both vestibules stay open.
 return Math.abs(to.x)<.65||Math.abs(to.z)>12.4;
}
export function railRideAt(seconds){
 const t=clamp(seconds,0,42),distance=t<6?0:t<14?1.5*(t-6)**2:t<34?96+(t-14)*24:576+24*(t-34)-1.5*(t-34)**2;
 return {distance,velocity:t<6?0:t<14?3*(t-6):t<34?24:Math.max(0,24-3*(t-34)),label:t<6?'车门关闭 · 即将发车':t<14?'驶离站台':t<34?'列车运行中':'减速进站',progress:clamp(t/42)};
}
