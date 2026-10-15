export const CITY_SPACING=600, CITY_RADIUS=190, HIGHWAY_HEIGHT=8;
export const STREET_LINES=[-176,-132,-88,-44,0,44,88,132,176];
const ramp=[{x:176,z:132,y:0},{x:204,z:132,y:0},{x:216,z:112,y:3},{x:222,z:94,y:8},{x:240,z:60,y:8},{x:240,z:0,y:8}];
export function cityOrigin(p){return {x:Math.round(p.x/600)*600,z:Math.round(p.z/600)*600};}
export function rampsAt(origin){return [ramp,ramp.map(p=>({x:p.z,z:p.x,y:p.y}))].map(points=>points.map(p=>({x:p.x+origin.x,z:p.z+origin.z,y:p.y})));}
export function nearestOnSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return {x:a.x+dx*t,z:a.z+dz*t,y:a.y+(b.y-a.y)*t,distance:Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)};}
export function roadAt(p){
 const o=cityOrigin(p),x=p.x-o.x,z=p.z-o.z;
 // Both routes continue through every tile, including the sea and river.
 if(Math.abs(x-240)<=10||Math.abs(z-240)<=10)return {type:'highway',height:8,limit:120};
 let nearest=null;for(const points of rampsAt(o))for(let i=1;i<points.length;i++){const q=nearestOnSegment(p,points[i-1],points[i]);if(q.distance<=8&&(!nearest||q.distance<nearest.distance))nearest=q;}
 if(nearest)return {type:'ramp',height:nearest.y,limit:40};
 return {type:'street',height:0,limit:60};
}
export function commuterRoute(origin,branch=0){
 const shift=branch%2?{x:0,z:600}:{x:600,z:0};
 const points=rampsAt(origin)[branch%2],next=rampsAt({x:origin.x+shift.x,z:origin.z+shift.z})[branch%2];
 const junction=branch%2?{x:origin.x-360,z:origin.z+240,y:8}:{x:origin.x+240,z:origin.z-360,y:8},end={x:junction.x+shift.x,z:junction.z+shift.z,y:8};
 const outbound=[{x:origin.x+176,z:origin.z+88,y:0},...points,junction,end,...[...next].reverse()];
 if(branch%2)outbound[0]={x:origin.x+88,z:origin.z+176,y:0};
 // A complete trip enters another city and returns through its ramp.
 outbound.push(branch%2?{x:origin.x+shift.x+88,z:origin.z+shift.z+176,y:0}:{x:origin.x+shift.x+176,z:origin.z+shift.z+88,y:0});
 return [...outbound,...outbound.slice(1,-1).reverse()];
}
export function advanceRoute(c,dt){
 let remaining=c.speed*dt;const points=c.route;c.moving=remaining>0;
 while(remaining>0){const target=points[c.routeIndex],p=c.g.position,dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz);
  if(distance<.001){c.routeIndex=(c.routeIndex+1)%points.length;continue;}
  const step=Math.min(distance,remaining),ratio=step/distance;p.x+=dx*ratio;p.z+=dz*ratio;p.y+=(target.y-p.y)*ratio;c.g.rotation.y=Math.atan2(-dx,-dz);remaining-=step;
  if(step>=distance)c.routeIndex=(c.routeIndex+1)%points.length;
 }
}

// Connected highways, followed by the destination's descending ramp.
export function highwayJourney(origin,destination){
 const start=rampsAt(origin)[0],finish=rampsAt(destination)[1];
 const points=[...start,{x:origin.x+240,z:destination.z+240,y:8},{x:destination.x+240,z:destination.z+240,y:8},finish.at(-1),...[...finish].reverse().slice(1)];
 return points.filter((p,i)=>!i||Math.hypot(p.x-points[i-1].x,p.z-points[i-1].z)>.01);
}
