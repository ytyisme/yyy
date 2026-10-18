import * as THREE from './three.module.js';
import {isTrack,trackFrame,sampleTrack} from './coaster.mjs';
const v=p=>new THREE.Vector3(p.x,p.y,p.z);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.65,...extra});
function box(root,x,y,z,w,h,d,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;}
function beam(root,a,b,radius,color){const direction=v(b).sub(v(a)),mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),6),mat(color));mesh.position.copy(v(a).add(v(b)).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());mesh.castShadow=true;root.add(mesh);return mesh;}
function tube(root,points,radius,color){const curve=new THREE.CatmullRomCurve3(points.map(v)),mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,points.length*2,radius,7,false),mat(color,{metalness:.3}));mesh.castShadow=true;root.add(mesh);return mesh;}
function tunnelShell(root,frames,width,height,color=0x8e9c98){
  const vertices=[],indices=[],sides=14;
  for(let i=0;i<frames.length;i++){const f=frames[i];for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI,side=Math.cos(angle)*width/2,up=Math.sin(angle)*height;vertices.push(f.position.x+f.right.x*side+f.up.x*up,f.position.y+f.right.y*side+f.up.y*up,f.position.z+f.right.z*side+f.up.z*up);}if(i)for(let j=0;j<sides;j++){const n=(i-1)*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,mat(color,{side:THREE.DoubleSide}));mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  for(let i=0;i<frames.length;i+=Math.max(1,Math.floor(frames.length/5))){const f=frames[i],points=[];for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI;points.push({x:f.position.x+f.right.x*Math.cos(angle)*width/2+f.up.x*Math.sin(angle)*height,y:f.position.y+f.right.y*Math.cos(angle)*width/2+f.up.y*Math.sin(angle)*height,z:f.position.z+f.right.z*Math.cos(angle)*width/2+f.up.z*Math.sin(angle)*height});}tube(root,points,.09,0xb5b9a6);}
}
export function frameQuaternion(frame){return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v(frame.right),v(frame.up),v(frame.forward).negate()));}
export function makeCoasterView(object){
  const root=new THREE.Group();root.userData.objectId=object.id;root.name='build-object-'+object.id;
  if(isTrack(object)){
    const sample=sampleTrack(object),count=object.shape==='loop'?100:40,frames=Array.from({length:count+1},(_,i)=>trackFrame(object,i/count));
    for(const side of [-1,1])tube(root,frames.map(f=>({x:f.position.x+f.right.x*object.w*.5*side,y:f.position.y+f.right.y*object.w*.5*side,z:f.position.z+f.right.z*object.w*.5*side})),.09,0xb65f43);
    const ties=Math.min(100,Math.max(3,Math.ceil(sample.length/.9)));
    for(let i=0;i<=ties;i++){const f=trackFrame(object,i/ties),tie=box(root,0,0,0,object.w+.55,.13,.23,0x9d8866);tie.position.copy(v(f.position).addScaledVector(v(f.up),-.14));tie.quaternion.copy(frameQuaternion(f));}
    for(let i=0;i<=count;i+=8){const p=frames[i].position;if(p.y>.7)beam(root,{x:p.x,y:0,z:p.z},{x:p.x,y:p.y-.2,z:p.z},.12,0x778c86);}
    if(['station','exit'].includes(object.type)){
      const platform=new THREE.Group();platform.position.set(object.x,object.y??0,object.z);platform.rotation.y=object.rotation;root.add(platform);
      for(const side of [-1,1]){box(platform,side*(object.w/2+.75),-.4,-object.l/2,1.3,.3,object.l,object.type==='station'?0xb8c6ae:0xcabd99);box(platform,side*(object.w/2+1.3),.15,-object.l/2,.08,1.1,object.l,0x748e80);}
      const sign=box(platform,-(object.w/2+1.35),2,-1,2.2,.8,.15,object.type==='station'?0x456e60:0x927754);sign.userData.stationSign=true;
      box(platform,-(object.w/2+1.35),.7,-1,.12,2,.12,0x59766b);
    }
    if(object.tunnel)tunnelShell(root,frames,object.w+4,4.2);
  }else if(object.type==='coaster'){
    box(root,0,.38,0,object.w,.5,object.l,0xb96946);box(root,0,.75,object.l*.3,object.w,.75,.25,0xcc8c59);box(root,0,.53,-object.l*.12,object.w*.8,.16,object.l*.48,0x597d79);
    for(const side of [-1,1]){box(root,side*object.w*.46,.7,0,.12,.55,object.l*.9,0xd49467);for(const z of [-object.l*.33,object.l*.33]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.15,12),mat(0x3d4e50));wheel.rotation.z=Math.PI/2;wheel.position.set(side*object.w*.53,.12,z);root.add(wheel);}}
    box(root,0,.92,-object.l*.15,object.w*.9,.08,.1,0x384b4c);box(root,0,.22,object.l*.53,.18,.14,.4,0x435553);
    root.position.set(object.x,object.y??0,object.z);root.rotation.y=object.rotation;
  }else if(object.type==='stairs'){
    const count=Math.min(80,Math.max(2,Math.ceil(object.h/.22)));
    for(let i=0;i<count;i++){const height=(i+1)/count*object.h;box(root,0,height/2,object.l/2-(i+.5)/count*object.l,object.w,height,object.l/count+.01,i%2?0xc3c6b5:0xb9c0ad);}
    for(const x of [-object.w/2,object.w/2])beam(root,{x,y:1,z:object.l/2},{x,y:object.h+1,z:-object.l/2},.045,0x6c877c);
    root.position.set(object.x,object.y??0,object.z);root.rotation.y=object.rotation;
  }else if(object.type==='tunnel'){
    const frames=[0,.25,.5,.75,1].map(t=>({position:{x:0,y:0,z:(.5-t)*object.l},right:{x:1,y:0,z:0},up:{x:0,y:1,z:0}}));tunnelShell(root,frames,object.w,object.h);root.position.set(object.x,object.y??0,object.z);root.rotation.y=object.rotation;
  }else if(object.type==='dig'){
    const geometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(object.w,object.h,object.l)),outline=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xc6a674,transparent:true,opacity:.45}));outline.position.y=-object.h/2;root.add(outline);root.position.set(object.x,0,object.z);root.rotation.y=object.rotation;
  }
  return root;
}
