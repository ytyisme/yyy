// 玻璃缸里的球体堆叠。身份只跟着鸭子走，洗罐和倒入都不会增删。

export const TANK=Object.freeze({
  innerRadius:2.85,
  rim:3.55,
  floor:0,
  gravity:-22,
  duckRadius:0.4
});

export function createBodies(ducks,random=Math.random,{reduced=false}={}){
  const gap=TANK.duckRadius*2.16;
  const slots=ducks.map((_,index)=>index);
  for(let i=slots.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    const swap=slots[i];slots[i]=slots[j];slots[j]=swap;
  }
  return ducks.map((duck,index)=>{
    const base={
      id:duck.id,color:duck.color,kind:duck.kind,vx:(random()-0.5)*0.25,vy:0,vz:(random()-0.5)*0.25,
      yaw:random()*Math.PI*2,spin:(random()-0.5)*0.8,radius:TANK.duckRadius
    };
    const perLayer=reduced?12:18;
    const slotIndex=slots[index];
    const layer=Math.floor(slotIndex/perLayer);
    const slot=slotIndex%perLayer;
    const ring=slot<1?0:slot<7?1:2;
    const ringIndex=ring===0?0:ring===1?slot-1:slot-7;
    const ringCount=ring===0?1:ring===1?6:perLayer-7;
    const angle=(ringCount<=1?0:ringIndex/ringCount*Math.PI*2)+layer*0.45;
    return {...base,x:Math.cos(angle)*ring*gap*0.98,y:(reduced?1.2:4.8)+layer*gap,z:Math.sin(angle)*ring*gap*0.98};
  });
}

export function tossBodies(bodies,random=Math.random){
  for(const body of bodies){
    body.vy=8.2+random()*4.8;
    body.vx+=(random()-0.5)*4.2;
    body.vz+=(random()-0.5)*4.2;
    body.spin=(random()-0.5)*9;
    body.y+=0.15;
  }
  return bodies;
}

export function stepBodies(bodies,dt){
  const steps=4;
  const h=Math.min(Math.max(dt,0),0.05)/steps;
  for(let step=0;step<steps;step++){
    for(const body of bodies){
      body.vy+=TANK.gravity*h;
      const drag=Math.exp(-0.55*h);
      body.vx*=drag;body.vy*=drag;body.vz*=drag;body.spin*=drag;
      body.x+=body.vx*h;body.y+=body.vy*h;body.z+=body.vz*h;
      body.yaw+=body.spin*h;
      const speed=Math.hypot(body.vx,body.vy,body.vz);
      if(speed>12){const scale=12/speed;body.vx*=scale;body.vy*=scale;body.vz*=scale;}
      const dist=Math.hypot(body.x,body.z)||0.0001;
      if(body.y>=TANK.rim&&dist>TANK.innerRadius*0.8){
        body.vx-=body.x/dist*16*h;body.vz-=body.z/dist*16*h;
      }
    }
    collide(bodies);
    for(const body of bodies){
      constrain(body);
      const speed2=body.vx*body.vx+body.vy*body.vy+body.vz*body.vz;
      if(body.supported&&speed2<0.64){body.vx=0;body.vy=0;body.vz=0;body.spin*=0.6;}
      body.supported=false;
    }
  }
  return bodies;
}

function constrain(body){
  if(body.y<body.radius){
    body.y=body.radius;
    if(body.vy<0)body.vy*=-0.12;
    body.vx*=0.8;body.vz*=0.8;body.spin*=0.82;
    if(Math.abs(body.vy)<0.45)body.vy=0;
  }
  const dist=Math.hypot(body.x,body.z);
  if(dist>TANK.innerRadius&&body.y<TANK.rim+body.radius){
    const nx=body.x/dist,nz=body.z/dist;
    body.x=nx*TANK.innerRadius;body.z=nz*TANK.innerRadius;
    const outward=body.vx*nx+body.vz*nz;
    if(outward>0){body.vx-=outward*nx;body.vz-=outward*nz;}
  }
}

function collide(bodies){
  const cell=TANK.duckRadius*2;
  const bins=new Map();
  for(let i=0;i<bodies.length;i++){
    const body=bodies[i];
    const key=`${Math.floor(body.x/cell)},${Math.floor(body.y/cell)},${Math.floor(body.z/cell)}`;
    const list=bins.get(key);
    if(list)list.push(i);else bins.set(key,[i]);
  }
  for(let i=0;i<bodies.length;i++){
    const a=bodies[i];
    const ix=Math.floor(a.x/cell),iy=Math.floor(a.y/cell),iz=Math.floor(a.z/cell);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
      const list=bins.get(`${ix+dx},${iy+dy},${iz+dz}`);
      if(!list)continue;
      for(const j of list)if(j>i)separate(a,bodies[j]);
    }
  }
}

function separate(a,b){
  let dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  let dist2=dx*dx+dy*dy+dz*dz;
  const min=a.radius+b.radius;
  const slop=0.012;
  if(dist2>=(min-slop)*(min-slop))return;
  if(dist2<1e-8){b.x+=0.02;b.z+=0.01;dx=b.x-a.x;dy=b.y-a.y;dz=b.z-a.z;dist2=dx*dx+dy*dy+dz*dz;}
  const dist=Math.sqrt(dist2);
  const nx=dx/dist,ny=dy/dist,nz=dz/dist;
  const overlap=(min-slop-dist)*0.55;
  a.x-=nx*overlap;a.y-=ny*overlap;a.z-=nz*overlap;
  b.x+=nx*overlap;b.y+=ny*overlap;b.z+=nz*overlap;
  if(ny>0.5)b.supported=true;
  if(ny<-0.5)a.supported=true;
  const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny+(b.vz-a.vz)*nz;
  if(rel<0){
    const impulse=rel*(Math.abs(rel)<1.2?0.5:0.42);
    a.vx+=impulse*nx;a.vy+=impulse*ny;a.vz+=impulse*nz;
    b.vx-=impulse*nx;b.vy-=impulse*ny;b.vz-=impulse*nz;
  }
}

export function isSettled(bodies){
  if(!bodies.length)return true;
  let energy=0,highest=0;
  for(const body of bodies){
    energy+=body.vx*body.vx+body.vy*body.vy+body.vz*body.vz;
    if(body.y>highest)highest=body.y;
  }
  return energy<bodies.length*0.05&&highest<TANK.rim+0.15;
}

export function rayPick(bodies,origin,direction){
  let best=null,bestT=Infinity;
  for(const body of bodies){
    const ox=origin.x-body.x,oy=origin.y-body.y,oz=origin.z-body.z;
    const toward=ox*direction.x+oy*direction.y+oz*direction.z;
    const closest=ox*ox+oy*oy+oz*oz-body.radius*body.radius;
    const disc=toward*toward-closest;
    if(disc<0)continue;
    const t=-toward-Math.sqrt(disc);
    if(t>0.001&&t<bestT){bestT=t;best=body;}
  }
  return best;
}

export function contained(bodies){
  return bodies.every(body=>Number.isFinite(body.x)&&Number.isFinite(body.y)&&body.y>=body.radius-0.02&&Math.hypot(body.x,body.z)<=TANK.innerRadius+0.08);
}
