import * as THREE from './three.module.js';
import {makeCoasterView} from './coaster-visuals.mjs';
const palette={brick:0xb86d53,slide:0xe7b64d,pool:0x74b5bc,beer:0x72894e,tv:0x40505b};
function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.72,...extra});}
function box(root,x,y,z,w,h,d,color,extra){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color,extra));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;}
function cylinder(root,x,y,z,r1,r2,h,color){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,20),material(color));mesh.position.set(x,y,z);mesh.castShadow=true;root.add(mesh);return mesh;}
function textTexture(text,bg,fg,width=512,height=192){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,width,height);c.fillStyle=fg;c.font='bold '+height*.38+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,width/2,height/2,width*.9);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
export function disposeBuildView(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.removeFromParent();root.traverse(child=>{if(child.geometry)geometries.add(child.geometry);for(const mat of Array.isArray(child.material)?child.material:[child.material])if(mat){materials.add(mat);if(mat.map)textures.add(mat.map);}});for(const g of geometries)g.dispose();for(const t of textures)t.dispose();for(const m of materials)m.dispose();}
export function makeBuildView(object){
  if(['track','stairs','station','coaster','tunnel','exit','dig'].includes(object.type))return makeCoasterView(object);
  const root=new THREE.Group();root.userData.objectId=object.id;root.name='build-object-'+object.id;
  if(object.type==='brick'){
    box(root,0,.5,0,1,1,1,palette.brick);
    for(const y of [.25,.5,.75])box(root,0,y,.503,1,.018,.006,0xe0b79e);
    for(let row=0;row<4;row++)for(const x of row%2?[-.5,0,.5]:[-.25,.25])box(root,x,(row+.5)/4,.506,.012,.23,.006,0xe0b79e);
    for(const z of [-.28,.28])box(root,.502,.5,z,.006,1,.015,0xd5aa90);
  }else if(object.type==='slide'){
    const points=[],vertices=[],indices=[];
    for(let i=0;i<=32;i++){const t=i/32,y=.045+.87*Math.pow(1-t,1.45),z=-.36+.78*t;points.push(new THREE.Vector3(0,y+.035,z));vertices.push(-.38,y,z,.38,y,z);if(i<32){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const chute=new THREE.Mesh(geometry,material(palette.slide,{side:THREE.DoubleSide,metalness:.12}));chute.castShadow=true;root.add(chute);
    for(const x of [-.42,.42]){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(x,p.y,p.z)));root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,32,.032,6,false),material(0xf5cc6b)));box(root,x,.45,-.38,.048,.9,.04,0x638a83);}
    for(let i=0;i<9;i++)box(root,0,.08+i*.1,-.45,.8,.025,.09,0x668e87);
    box(root,0,.9,-.415,.86,.04,.16,0xf0c15b);
  }else if(object.type==='pool'){
    box(root,0,.035,0,1,.07,1,0xabc6c3);
    for(const x of [-.48,.48])box(root,x,.5,0,.04,1,1,0xd7dfd2);
    for(const z of [-.48,.48])box(root,0,.5,z,1,1,.04,0xd7dfd2);
    const water=box(root,0,.78,0,.91,.025,.91,0x52b8c9,{transparent:true,opacity:.78,roughness:.18,metalness:.15});water.userData.water=true;
    for(let i=0;i<6;i++)box(root,-.35+i*.14,.799,0,.02,.004,.85,0xb9e4df,{transparent:true,opacity:.3});
  }else if(object.type==='beer'){
    cylinder(root,0,.35,0,.39,.42,.65,palette.beer);cylinder(root,0,.73,0,.16,.35,.19,palette.beer);cylinder(root,0,.88,0,.15,.15,.22,palette.beer);cylinder(root,0,.995,0,.18,.18,.05,0xd6b15d);
    cylinder(root,0,.36,0,.397,.397,.29,0xe9dbaf);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(.5,.21),new THREE.MeshBasicMaterial({map:textTexture('啤酒','#e9dbaf','#4d653b',256,128)}));label.position.set(0,.36,.402);root.add(label);
  }else if(object.type==='tv'){
    box(root,0,.08,0,.65,.07,.7,0x35424a);box(root,0,.24,0,.1,.32,.18,0x35424a);box(root,0,.62,0,1,.74,.54,palette.tv);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(.88,.59),new THREE.MeshBasicMaterial({map:textTexture('一起建造','#1d574f','#edda95'),color:object.on?0xffffff:0x162326}));screen.position.set(0,.63,.278);screen.userData.screen=true;root.add(screen);
    box(root,.4,.3,.29,.025,.025,.012,object.on?0xa7cd81:0x6b7774);
  }
  root.position.set(object.x,object.y??0,object.z);root.rotation.y=object.rotation;root.scale.set(object.w,object.h,object.l);return root;
}
export function makeBuilderAvatar(name,color=0xde9e56){
  const root=new THREE.Group(),legs=[],arms=[];
  box(root,0,1.05,0,.63,.76,.4,color);cylinder(root,0,1.73,0,.27,.27,.47,0xe8bd99);box(root,0,1.98,0,.58,.12,.53,0x344c48);
  for(const x of [-.18,.18])legs.push(box(root,x,.37,0,.23,.74,.26,0x46566a));
  for(const x of [-.44,.44])arms.push(box(root,x,1.05,0,.19,.74,.23,color));
  if(name){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:textTexture(name,'#254d49','#fff8df',512,96),transparent:true,depthTest:false}));sprite.scale.set(2.8,.52,1);sprite.position.y=2.65;root.add(sprite);}
  return {root,legs,arms,walk:0};
}
export function animateBuilder(avatar,moving,dt){avatar.walk+=dt*9;for(let i=0;i<2;i++){avatar.legs[i].rotation.x=moving?Math.sin(avatar.walk+i*Math.PI)*.5:0;avatar.arms[i].rotation.x=moving?-Math.sin(avatar.walk+i*Math.PI)*.4:0;}}
