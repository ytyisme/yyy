import * as THREE from './three.module.js';
import {groundHeight} from './coaster.mjs';
const rect=(x,z,w,l)=>[{x:x-w/2,z:z-l/2},{x:x+w/2,z:z-l/2},{x:x+w/2,z:z+l/2},{x:x-w/2,z:z+l/2}];
function clip(polygon,distance,inside=true){
  const result=[];if(!polygon.length)return result;
  for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a)*(inside?1:-1),db=distance(b)*(inside?1:-1),aIn=da>=-1e-8,bIn=db>=-1e-8;
    if(aIn)result.push(a);if(aIn!==bIn){const t=da/(da-db);result.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}
  return result;
}
export function subtractExcavation(polygon,hole){
  const c=Math.cos(hole.rotation),s=Math.sin(hole.rotation),x=p=>c*(p.x-hole.x)-s*(p.z-hole.z),z=p=>s*(p.x-hole.x)+c*(p.z-hole.z),edges=[p=>x(p)+hole.w/2,p=>hole.w/2-x(p),p=>z(p)+hole.l/2,p=>hole.l/2-z(p)],pieces=[];
  let remaining=polygon;
  for(const edge of edges){const outside=clip(remaining,edge,false);if(outside.length>=3)pieces.push(outside);remaining=clip(remaining,edge);if(remaining.length<3)break;}
  return pieces;
}
export function excavatePolygons(polygons,holes){let result=polygons;for(const hole of holes)result=result.flatMap(p=>subtractExcavation(p,hole));return result;}
function corners(hole){return rect(0,0,hole.w,hole.l).map(p=>({x:hole.x+Math.cos(hole.rotation)*p.x+Math.sin(hole.rotation)*p.z,z:hole.z-Math.sin(hole.rotation)*p.x+Math.cos(hole.rotation)*p.z}));}
function segmentInterval(a,b,hole){
  const c=Math.cos(hole.rotation),s=Math.sin(hole.rotation),point=p=>({x:c*(p.x-hole.x)-s*(p.z-hole.z),z:s*(p.x-hole.x)+c*(p.z-hole.z)}),p=point(a),q=point(b);let low=0,high=1;
  for(const [key,size]of [['x',hole.w],['z',hole.l]]){const d=q[key]-p[key];if(Math.abs(d)<1e-8){if(Math.abs(p[key])>size/2)return null;continue;}let u=(-size/2-p[key])/d,v=(size/2-p[key])/d;if(u>v)[u,v]=[v,u];low=Math.max(low,u);high=Math.min(high,v);if(low>=high)return null;}return [low,high];
}
export function createCoasterTerrain(values){
  const all=Array.from(values),holes=all.filter(p=>p.type==='dig'),root=new THREE.Group();root.name='build-terrain';
  function surface(polygons,y,color,surfaceTop=true,objectId=null){
    const vertices=[];for(const p of polygons)for(let i=1;i<p.length-1;i++)for(const v of [p[0],p[i+1],p[i]])vertices.push(v.x,y,v.z);
    if(!vertices.length)return;const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide}));mesh.receiveShadow=true;mesh.userData.surfaceTop=surfaceTop;if(objectId)mesh.userData.objectId=objectId;root.add(mesh);
  }
  const top=(poly,y,color)=>surface(excavatePolygons([poly],holes),y,color);
  top(rect(0,0,300,300),-.03,0xc5d0b4);top(rect(0,0,16,280),0,0xa6b1a9);
  for(const x of [-8.5,8.5])top(rect(x,0,1,280),.01,0xeee8cf);
  for(let z=-130;z<=130;z+=8)top(rect(0,z,.14,3.2),.015,0xf5eed7);
  for(let n=-140;n<=140;n+=5){top(rect(n,0,.025,280),-.024,0xb0bfa3);top(rect(0,n,280,.025),-.024,0xb0bfa3);}
  for(const hole of holes){
    surface(excavatePolygons([corners(hole)],holes.filter(p=>p.id!==hole.id&&p.h>hole.h)), -hole.h,0x9e9179,false,hole.id);
    const points=corners(hole),others=holes.filter(p=>p.id!==hole.id),vertices=[];
    for(let edge=0;edge<4;edge++){
      const a=points[edge],b=points[(edge+1)%4],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len,breaks=[0,1];
      for(const other of others){const interval=segmentInterval(a,b,other);if(interval)breaks.push(...interval);}
      breaks.sort((a,b)=>a-b);
      for(let i=0;i<breaks.length-1;i++){const u=breaks[i],v=breaks[i+1];if(v-u<.00001)continue;const mid=(u+v)/2,topY=groundHeight(others,a.x+dx*mid+nx*.03,a.z+dz*mid+nz*.03);if(topY<=-hole.h)continue;
        const x1=a.x+dx*u,z1=a.z+dz*u,x2=a.x+dx*v,z2=a.z+dz*v;
        vertices.push(x1,topY,z1,x2,-hole.h,z2,x2,topY,z2,x1,topY,z1,x1,-hole.h,z1,x2,-hole.h,z2);
      }
    }
    if(vertices.length){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const wall=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x9b886d,roughness:1,side:THREE.DoubleSide}));wall.receiveShadow=true;wall.userData.objectId=hole.id;root.add(wall);}
  }
  return root;
}
export function setTerrainXray(root,enabled){for(const mesh of root.children)if(mesh.userData.surfaceTop)mesh.visible=!enabled;}
