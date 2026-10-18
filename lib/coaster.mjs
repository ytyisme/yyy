export const TRACK_SHAPES=Object.freeze([
  ['straight','直轨'],['up','上坡'],['down','下坡'],['loop','360°回环'],
  ['left','左急转弯'],['right','右急转弯'],['upLeft','上坡＋左拐'],['downLeft','下坡＋左拐'],['upRight','上坡＋右拐'],['downRight','下坡＋右拐']
]);
export const isTrack=object=>!!object&&['track','station','exit'].includes(object.type);
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mul=(a,n)=>({x:a.x*n,y:a.y*n,z:a.z*n});
const length=a=>Math.hypot(a.x,a.y,a.z);
const normalize=a=>mul(a,1/(length(a)||1));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const rotate=(p,angle)=>({x:Math.cos(angle)*p.x+Math.sin(angle)*p.z,y:p.y,z:-Math.sin(angle)*p.x+Math.cos(angle)*p.z});
export function trackPoint(object,t){
  const shape=object.type==='track'?(object.shape||'straight'):'straight',smooth=t*t*(3-2*t),rise=shape.startsWith('down')||shape==='down'?-object.h:shape.startsWith('up')||shape==='up'?object.h:0;
  let p={x:0,y:rise*smooth,z:-object.l*t};
  if(/Left|Right|left|right/.test(shape)){
    const sign=/Right|right/.test(shape)?1:-1,r=object.l/(Math.PI/2),angle=t*Math.PI/2;
    p={x:sign*r*(1-Math.cos(angle)),y:rise*smooth,z:-r*Math.sin(angle)};
  }else if(shape==='loop'){
    // The small sideways advance separates the entry and exit of a complete loop.
    const angle=2*Math.PI*t;p={x:object.w*.65*smooth,y:object.h*.5*(1-Math.cos(angle)),z:-object.l*.5*Math.sin(angle)-object.l*.2*t};
  }
  return add(rotate(p,object.rotation),{x:object.x,y:object.y??0,z:object.z});
}
export function trackFrame(object,t){
  const p=trackPoint(object,t),a=trackPoint(object,Math.max(0,t-.0001)),b=trackPoint(object,Math.min(1,t+.0001)),forward=normalize(sub(b,a));
  let up={x:0,y:1,z:0};
  if(object.type==='track'&&object.shape==='loop'){
    const local=rotate(forward,-object.rotation);up=rotate(normalize({x:0,y:-local.z,z:local.y}),object.rotation);
  }
  const right=normalize(cross(forward,up));up=normalize(cross(right,forward));
  return {position:p,forward,right,up,heading:Math.atan2(-forward.x,-forward.z)};
}
const sampleCache=new Map();
export function sampleTrack(object){
  const key=JSON.stringify([object.id,object.type,object.shape,object.x,object.y,object.z,object.rotation,object.w,object.h,object.l]);
  if(sampleCache.has(key))return sampleCache.get(key);
  const count=object.shape==='loop'?160:64,points=[],distances=[0];
  for(let i=0;i<=count;i++){points.push(trackPoint(object,i/count));if(i)distances.push(distances[i-1]+length(sub(points[i],points[i-1])));}
  const result={object,points,distances,length:distances.at(-1),count};if(sampleCache.size>1500)sampleCache.clear();sampleCache.set(key,result);return result;
}
export function trackAtDistance(sample,distance){
  const d=clamp(distance,0,sample.length);let low=0,high=sample.count;
  while(low+1<high){const middle=(low+high)>>1;if(sample.distances[middle]<=d)low=middle;else high=middle;}
  const t=(low+(d-sample.distances[low])/(sample.distances[high]-sample.distances[low]||1))/sample.count;
  const frame=trackFrame(sample.object,t);
  if(distance<0||distance>sample.length)frame.position=add(frame.position,mul(frame.forward,distance-d));
  return frame;
}
export function snapTrack(object,values,maxDistance=5){
  if(!isTrack(object))return null;let best=null;
  for(const previous of values){if(!isTrack(previous)||previous.id===object.id)continue;const frame=trackFrame(previous,1),distance=length(sub(frame.position,{x:object.x,y:object.y??0,z:object.z}));
    if(distance<maxDistance&&(!best||distance<best.distance))best={distance,previous,object:{...object,x:frame.position.x,y:frame.position.y,z:frame.position.z,rotation:frame.heading}};
  }
  return best;
}
export function trackGraph(values){
  const tracks=Array.from(values).filter(isTrack),next=new Map(),neighbors=new Map(tracks.map(p=>[p.id,new Set()]));
  for(const a of tracks){const end=trackFrame(a,1);let best=null;
    for(const b of tracks){if(a.id===b.id)continue;const start=trackFrame(b,0),distance=length(sub(end.position,start.position));
      if(distance<.8&&dot(end.forward,start.forward)>.93&&(!best||distance<best.distance))best={object:b,distance};
    }
    if(best){next.set(a.id,best.object.id);neighbors.get(a.id).add(best.object.id);neighbors.get(best.object.id).add(a.id);}
  }
  return {tracks,next,neighbors};
}
export function connectedTracks(values,id){const graph=trackGraph(values),seen=new Set(),queue=[id];while(queue.length){const current=queue.shift();if(seen.has(current))continue;seen.add(current);for(const next of graph.neighbors.get(current)||[])queue.push(next);}return seen;}
export function trackRoute(values,startId){
  const graph=trackGraph(values),byId=new Map(graph.tracks.map(p=>[p.id,p])),visited=new Set(),segments=[];let id=startId,total=0;
  while(byId.has(id)&&!visited.has(id)){visited.add(id);const sample=sampleTrack(byId.get(id));segments.push({sample,start:total,end:total+sample.length});total+=sample.length;id=graph.next.get(id);}
  return {segments,length:total,closed:id===startId&&segments.length>0};
}
export function routeFrame(route,distance){
  if(!route.segments.length)return null;let d=distance;if(route.closed)d=((d%route.length)+route.length)%route.length;
  const segment=route.segments.find(s=>d<=s.end)||route.segments.at(-1);return {...trackAtDistance(segment.sample,d-segment.start),trackId:segment.sample.object.id};
}
export function nearestTrack(values,point,maxDistance=Infinity){let best=null;
  for(const object of values){if(!isTrack(object))continue;const sample=sampleTrack(object);
    for(let i=0;i<sample.count;i++){
      const a=sample.points[i],b=sample.points[i+1],line=sub(b,a),t=clamp(dot(sub(point,a),line)/(dot(line,line)||1),0,1),p=add(a,mul(line,t)),distance=length(sub(p,point));
      if(distance<maxDistance&&(!best||distance<best.distance))best={object,position:p,distance,along:sample.distances[i]+length(line)*t};
    }
  }return best;
}
export function attachCoaster(values,object){
  const all=Array.from(values),anchor=all.find(p=>p.id===object.trackId&&isTrack(p));if(!anchor)return null;
  const old=all.find(p=>p.id===object.id);if(old&&old.trackId===object.trackId)return object;
  const connected=connectedTracks(all,anchor.id),cars=all.filter(p=>p.type==='coaster'&&p.id!==object.id&&connected.has(p.trackId));
  const first=cars[0],trainId=first?(first.trainId||first.id):object.id,group=cars.filter(p=>(p.trainId||p.id)===trainId),slot=group.length?Math.max(...group.map(p=>p.slot||0))+1:0;
  if(slot>31)return null;
  const leader=group.find(p=>p.id===trainId)||group[0],route=trackRoute(all,leader?.trackId||anchor.id),needed=group.reduce((sum,p)=>sum+p.l+.35,0)+object.l;
  if(route.length<needed+.3)return null;
  const point=trackAtDistance(sampleTrack(anchor),object.distance||0).position;
  return {...object,x:point.x,y:point.y,z:point.z,trainId,slot,running:false,startedAt:0};
}
export function groupTrains(values){
  const groups=new Map();for(const object of values)if(object.type==='coaster'&&object.trackId){const id=object.trainId||object.id;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(object);}
  return [...groups.entries()].map(([id,cars])=>({id,cars:cars.sort((a,b)=>(a.slot||0)-(b.slot||0)||a.id.localeCompare(b.id)),leader:cars.find(p=>p.id===id)||cars[0]}));
}
export function trainMotion(train,route,now){
  const tail=train.cars.slice(1).reduce((sum,p)=>sum+p.l+.35,0),minimum=tail+train.leader.l*.5+.1,start=clamp(Math.max(minimum,train.leader.distance||0),0,Math.max(0,route.length-.1));
  if(!train.leader.running)return {distance:start,waiting:true,stop:null,ended:false};
  const speed=train.leader.speed||9,stops=route.segments.filter(s=>['station','exit'].includes(s.sample.object.type)).map(s=>({distance:(s.start+s.end)/2,object:s.sample.object}));
  const timeline=[];let clock=0,cursor=0;
  for(const stop of [...stops,{distance:route.length,object:null}]){
    const duration=(stop.distance-cursor)/speed;timeline.push({start:clock,end:clock+duration,from:cursor,to:stop.distance});clock+=duration;cursor=stop.distance;
    if(stop.object){const wait=stop.object.type==='exit'?6:5;timeline.push({start:clock,end:clock+wait,from:cursor,to:cursor,stop:stop.object});clock+=wait;}
  }
  let startClock=0;for(const item of timeline)if(start>=item.from&&start<=item.to&&item.to!==item.from){startClock=item.start+(start-item.from)/speed;break;}
  let t=startClock+Math.max(0,now-(train.leader.startedAt||now))/1000;
  if(route.closed&&clock>0)t%=clock;
  if(t>=clock)return {distance:route.length-.1,waiting:true,stop:stops.at(-1)?.object||null,ended:true};
  const item=timeline.find(p=>t>=p.start&&t<p.end)||timeline.at(-1);if(!item)return {distance:0,waiting:true,stop:null,ended:true};
  return {distance:item.from+(item.to-item.from)*clamp((t-item.start)/(item.end-item.start||1),0,1),waiting:!!item.stop,stop:item.stop||null,ended:false};
}
export function coasterFleet(values,now,routes=null){
  const all=Array.from(values),result=[];
  for(const train of groupTrains(all)){
    const route=routes?.get(train.leader.trackId)||trackRoute(all,train.leader.trackId);if(!route.length)continue;const motion=trainMotion(train,route,now);let offset=0;
    for(let i=0;i<train.cars.length;i++){const car=train.cars[i];if(i)offset+=(train.cars[i-1].l+car.l)/2+.35;const frame=routeFrame(route,motion.distance-offset);result.push({car,train,route,motion,...frame});}
  }return result;
}
export function digContains(object,x,z,margin=0){const dx=x-object.x,dz=z-object.z,c=Math.cos(object.rotation),s=Math.sin(object.rotation);return Math.abs(c*dx-s*dz)<object.w/2+margin&&Math.abs(s*dx+c*dz)<object.l/2+margin;}
export function groundHeight(values,x,z){let height=0;for(const object of values)if(object.type==='dig'&&digContains(object,x,z))height=Math.min(height,-object.h);return height;}
export function coasterDemo(makeObject,prefix='demo_coaster_'){
  const result=[],shapes=[['station',null,12,1],['track','up',14,6],['track','upRight',14,4],['track','loop',14,12],['track','downRight',14,4],['track','down',14,6],['station',null,12,1],['track','right',14,1],['track','down',12,6],['track','straight',14,1],['track','up',12,6],['track','right',14,1],['exit',null,10,1]];
  let anchor={x:-32,y:.8,z:38,rotation:0};
  for(let i=0;i<shapes.length;i++){
    const [type,shape,l,h]=shapes[i],object={...makeObject(type,prefix+'rail_'+i),...anchor,l,h};if(shape)object.shape=shape;if(i===9)object.tunnel=true;result.push(object);
    const end=trackFrame(object,1);anchor={...end.position,rotation:end.heading};
  }
  const underground=result.slice(8,11).flatMap(p=>sampleTrack(p).points),xs=underground.map(p=>p.x),zs=underground.map(p=>p.z),minX=Math.min(...xs)-5,maxX=Math.max(...xs)+5,minZ=Math.min(...zs)-5,maxZ=Math.max(...zs)+5;
  result.push({...makeObject('dig',prefix+'dig'),x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:Math.min(60,maxX-minX),l:Math.min(60,maxZ-minZ),h:9,y:-9});
  const middle=trackPoint(result[9],.5);result.push({...makeObject('tunnel',prefix+'tunnel'),x:middle.x,y:middle.y-.4,z:middle.z,rotation:result[9].rotation,w:7,h:5,l:13});
  result.push({...makeObject('stairs',prefix+'stairs'),x:(minX+maxX)/2,z:(minZ+maxZ)/2,y:-9,w:3,h:9,l:Math.max(4,Math.min(18,maxZ-minZ-1))});
  for(let i=0;i<3;i++)result.push({...makeObject('coaster',prefix+'car_'+i),trackId:result[0].id,distance:9-i*2.95});
  return result;
}
