import * as THREE from './three.module.js';
import {BANK_RUN} from './bank-run.mjs';
import {makeSkinRunner} from './skin-visuals.mjs';
const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),cylinder=new THREE.CylinderGeometry(1,1,1,12),materials=new Map(),labels=new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.76}));return materials.get(color);}
function mesh(parent,geometry,color,x,y,z,sx,sy,sz){const item=new THREE.Mesh(geometry,material(color));item.position.set(x,y,z);item.scale.set(sx,sy,sz);item.castShadow=true;item.receiveShadow=true;parent.add(item);return item;}
function box(parent,x,y,z,w,h,d,color){return mesh(parent,cube,color,x,y,z,w,h,d);}
function ball(parent,x,y,z,w,h,d,color){return mesh(parent,sphere,color,x,y,z,w,h,d);}
function blocks(items){const group=new THREE.Group(),batches=new Map(),dummy=new THREE.Object3D();for(const item of items){const color=item[6],list=batches.get(color)||[];list.push(item);batches.set(color,list);}for(const [color,list]of batches){const batch=new THREE.InstancedMesh(cube,material(color),list.length);list.forEach(([x,y,z,w,h,d,,rotation=0],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,rotation);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});batch.castShadow=true;batch.receiveShadow=true;group.add(batch);}return group;}
function sign(text,width=2.4,color='#f8eedb',ink='#303d45'){
  const key=text+color+ink;let map=labels.get(key);
  if(!map){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(0,0,512,128,25);ctx.fill();ctx.font='800 55px system-ui, sans-serif';ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66,484);map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;labels.set(key,map);}
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map,depthWrite:false}));tag.scale.set(width,width/4,1);return tag;
}

export function makeBankRunner(color=0x53b8b5,{police=false,skinId='default'}={}){
  if(!police){const custom=makeSkinRunner(skinId);if(custom)return custom;}
  const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
  ball(rig,0,1.05,0,.29,.39,.21,color);box(rig,0,.78,0,.47,.19,.33,0x243746);
  const head=new THREE.Group();head.position.y=1.61;rig.add(head);
  ball(head,0,0,0,.235,.27,.215,0xe8b38e);ball(head,0,.1,.025,.238,.2,.21,0x342e32);
  ball(head,0,-.04,-.185,.19,.19,.055,0xe8b38e);
  const face=new THREE.Group();head.add(face);for(const side of [-1,1])ball(face,side*.075,.015,-.236,.025,.036,.013,0x182a32);
  const hood=new THREE.Group();head.add(hood);
  ball(hood,0,.015,0,.248,.29,.238,0x20232d);ball(hood,0,-.065,-.214,.205,.15,.05,0x141b25);
  for(const side of [-1,1]){ball(hood,side*.077,.055,-.229,.053,.035,.024,0xf9f3d9);ball(hood,side*.077,.055,-.249,.022,.026,.012,0x202b32);}
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.32,1.26,0);rig.add(arm);ball(arm,0,-.19,0,.095,.27,.1,color);ball(arm,0,-.42,-.04,.09,.1,.085,0x202b32);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.14,.72,0);rig.add(leg);box(leg,0,-.25,0,.16,.49,.19,0x263645);box(leg,0,-.61,-.07,.20,.16,.32,0xf1e6cd);box(leg,0,-.70,-.07,.21,.04,.33,0x273a42);legs.push(leg);
  }
  box(rig,0,1.02,.245,.35,.43,.15,police?0x273e5a:0x263847);box(rig,0,1.04,.33,.16,.13,.035,police?0xead39b:0xffbd79);
  if(police){hood.visible=false;ball(head,0,.24,0,.28,.09,.25,0x223d62);box(head,0,.21,-.21,.39,.035,.28,0x1c2e4c);box(rig,-.12,1.15,-.208,.09,.11,.025,0xffd46a);box(rig,0,.87,-.21,.46,.07,.055,0x101f32);}
  root.userData.animate=(time,{running=false,duck=false,jump=false,masked=true,lift=1}={})=>{
    const gait=running?Math.sin(time*15)*.75:Math.sin(time*2)*.025;
    rig.scale.y=duck?.48:1;rig.position.y=running&&!jump&&!duck?Math.abs(Math.sin(time*15))*.06:0;rig.rotation.x=duck?-.12:running?-.08:0;
    arms[0].rotation.x=jump?-.65:gait;arms[1].rotation.x=jump?-.65:-gait;legs[0].rotation.x=-gait;legs[1].rotation.x=gait;
    if(duck){legs[0].rotation.x=.65;legs[1].rotation.x=.45;arms[0].rotation.x=-.65;arms[1].rotation.x=-.65;}
    if(!police){hood.visible=masked;face.visible=!masked||lift<.8;hood.position.set(.28*(1-lift),-.8*(1-lift),-.1*(1-lift));hood.rotation.z=-.8*(1-lift);if(masked&&lift<1){arms[1].rotation.x=-2.3*lift;arms[1].rotation.z=-.35;}}
  };
  root.userData.animate(0,{masked:police});return root;
}

export function makeBankDog(){
  const root=new THREE.Group();ball(root,0,.58,.06,.23,.27,.49,0xa16c43);ball(root,0,.71,-.46,.21,.25,.22,0xb9804e);ball(root,0,.64,-.66,.13,.10,.18,0x392f2b);ball(root,0,.65,-.81,.075,.06,.04,0x202e32);
  for(const side of [-1,1]){const ear=mesh(root,new THREE.ConeGeometry(.10,.29,4),0x514032,side*.135,.99,-.43,1,1,1);ear.rotation.z=side*.2;ball(root,side*.13,.76,-.62,.025,.034,.02,0x192b31);}
  box(root,0,.59,-.28,.38,.08,.11,0x335f65);const legs=[];
  for(const x of [-.15,.15])for(const z of [-.25,.33]){const leg=new THREE.Group();leg.position.set(x,.55,z);box(leg,0,-.23,0,.09,.47,.11,0x8c5d3c);root.add(leg);legs.push(leg);}
  const tail=new THREE.Group();tail.position.set(0,.69,.48);root.add(tail);box(tail,0,.17,.1,.08,.42,.09,0x855c3e);tail.rotation.x=.65;
  root.userData.animate=(time,running=true)=>{legs.forEach((leg,i)=>{leg.rotation.x=running?Math.sin(time*18+(i%2)*Math.PI)*.7:0;});tail.rotation.z=Math.sin(time*10)*.35;};return root;
}

export function makeLeash(){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x3c4547}));line.frustumCulled=false;
  line.userData.update=(from,to)=>{const values=geometry.attributes.position.array;values.set([from.x,from.y,from.z,(from.x+to.x)/2,(from.y+to.y)/2-.18,(from.z+to.z)/2,to.x,to.y,to.z]);geometry.attributes.position.needsUpdate=true;};return line;
}

export function makeBankIntro(){
  const root=new THREE.Group();
  box(root,0,-.2,-6,52,.4,42,0xb1a79a);box(root,0,0,3,48,.04,8,0x525961);
  box(root,0,.12,-9,19,.24,7,0xd0c6ad);box(root,0,3.7,-12,18,7.2,5,0xe4d6bc);box(root,0,7.6,-11.8,19,.7,5.5,0xd4bb96);
  box(root,0,5.9,-9.3,18,.58,.7,0xd3bd9c);box(root,0,3.8,-9.45,5.6,3.8,.2,0x294f58);
  for(const x of [-6.5,-3.5,3.5,6.5]){mesh(root,cylinder,0xf4e7cf,x,3.1,-8.7,.36,5.4,.36);box(root,x,.5,-8.7,1,.28,.9,0xbba48a);box(root,x,5.7,-8.7,1,.28,.9,0xf4e7cf);}
  box(root,-1.05,1.9,-9.25,1.9,3.5,.11,0x163c47);box(root,1.05,1.9,-9.25,1.9,3.5,.11,0x163c47);for(const x of [-.24,.24])box(root,x,1.8,-9.1,.055,.58,.08,0xeed293);
  const title=sign('岩 浆 银 行',8,'#ebe0c6','#36545a');title.position.set(0,6.7,-8.8);title.material.depthTest=false;title.renderOrder=3;root.add(title);
  const alarm=ball(root,0,4.45,-9.0,.19,.19,.19,0xf34b3b);alarm.material=new THREE.MeshStandardMaterial({color:0xff3b38,emissive:0xff342a,emissiveIntensity:0});
  const lamp=new THREE.PointLight(0xff3c32,0,13);lamp.position.set(0,4,-7.5);root.add(lamp);
  for(const side of [-1,1]){box(root,side*16,4,-14,9,8,9,side<0?0xb57e6b:0x728c8e);for(let n=0;n<3;n++)for(let j=0;j<3;j++)box(root,side*16-2+n*2,1.7+j*2.2,-9.4,.85,1.2,.05,0xe9c68c);ball(root,side*10,1.5,-5,.8,1.2,.8,0x6c8370);box(root,side*10,.45,-5,.18,1.1,.18,0x826952);}
  const portal=new THREE.Mesh(new THREE.TorusGeometry(1.6,.13,8,48),new THREE.MeshBasicMaterial({color:0x95f4e9}));portal.position.set(0,1.65,2);portal.visible=false;root.add(portal);
  root.userData={alarm,lamp,portal};return root;
}

export function makeBankRoadTile(index){
  const list=[],add=(...item)=>list.push(item),length=24;
  add(0,-.12,-12,11,.22,length,0x454e58);for(const side of [-1,1]){
    add(side*6.4,.05,-12,1.7,.32,length,0xbcb8a5);add(side*5.45,.06,-12,.16,.12,length,0xf3ce74);
    const buildingColor=[0xb9826a,0x899c91,0xc6ae8d,0x6e8c94,0xcfaa88][(index+(side>0?2:0))%5],height=7+(index*7+(side>0?3:0))%9;
    add(side*11,height/2,-12,6,height,19,buildingColor);add(side*11,height+.12,-12,6.3,.3,19.3,0xc5b99f);
    for(let floor=0;floor<Math.floor(height/2.1);floor++)for(let window=0;window<5;window++)add(side*7.97,1.4+floor*2.1,-4-window*3.5,.05,1.1,1.25,(window+floor+index)%3===0?0xf2ce90:0x48616b);
    add(side*6.7,2.3,-7,.09,4.6,.09,0x566369);add(side*6.1,4.5,-7,1.3,.08,.13,0x566369);add(side*5.65,4.48,-7,.6,.07,.34,0xffe2a0);
    add(side*6.4,.5,-19,.23,1,.23,0x827255);add(side*6.4,1.75,-19,1.1,1.7,1.1,0x6e8974);
    add(side*6.4,.28,-18,1.25,.56,1.25,0xb9a88a);
  }
  for(const x of [-1.6,1.6])for(const z of [-3,-11,-19])add(x,.008,z,.10,.018,3.7,0xe3dcc4);
  if(index%4===0){for(const side of [-1,1])add(side*5.7,4.2,-22,.2,8.4,.25,0x58716c);add(0,8.3,-22,11.6,.23,.25,0x58716c);add(0,7.8,-22,4.2,1.3,.18,0x65837b);}
  return blocks(list);
}

function car(color){
  const root=new THREE.Group();root.add(blocks([[0,.49,0,2,.62,4,color],[0,1.10,.15,1.72,.6,2.12,color],[0,1.12,-.94,1.55,.40,.08,0x264953],[0,1.13,1.24,1.52,.37,.06,0x264953],[-.88,1.13,.1,.025,.38,1.5,0x365c65],[.88,1.13,.1,.025,.38,1.5,0x365c65],[0,.3,-2,1.9,.14,.08,0xe6d9b9],[0,.3,2,1.9,.12,.08,0x253b44],[-.69,.62,-2.02,.38,.18,.04,0xffdf94],[.69,.62,-2.02,.38,.18,.04,0xffdf94],[-.7,.6,2.02,.33,.15,.04,0xd84940],[.7,.6,2.02,.33,.15,.04,0xd84940]]));
  for(const side of [-1,1])for(const z of [-1.22,1.22]){const wheel=mesh(root,cylinder,0x26323b,side*1,.29,z,.29,.18,.29);wheel.rotation.z=Math.PI/2;}
  return root;
}
export function makeBankObstacle(obstacle){
  const root=new THREE.Group();
  if(obstacle.kind==='duck'){
    const list=[];for(const x of [-1.08,1.08]){list.push([x,1.12,-.4,.14,2.24,.16,0x46515a],[x,.07,-.4,.65,.14,.8,0x46515a]);}
    list.push([0,1.5,-.4,2.4,.68,.23,0xeb8350]);for(let x=-1;x<=1;x+=.4)list.push([x,1.5,-.26,.18,.6,.025,0xfff0c7,-.36]);root.add(blocks(list));
    const hint=sign('↓ 蹲下通过',2.2,'#ffdb9b');hint.position.set(0,2.75,-.4);root.add(hint);root.userData.hint=hint;
  }else{
    const count=obstacle.kind==='row'?4:1;
    for(let i=0;i<count;i++){const item=car([0xd3aa6c,0x739b9d,0xc97866,0xc5c6ac][(i+(obstacle.lane+1))%4]);item.position.z=-2-i*4.4;root.add(item);}
    if(count>1)box(root,0,1.38,-obstacle.length/2,1.55,.06,obstacle.length,0x84958b);
    const hint=sign(count>1?'↗ 跳上车顶':'↑ 跳过单车',2.4,count>1?'#c7e8ca':'#ffe0ae');hint.position.set(0,2.6,-2);root.add(hint);root.userData.hint=hint;
  }
  return root;
}

export function makeIngotGeometry(){
  const shape=new THREE.Shape();shape.moveTo(-.6,.2);shape.quadraticCurveTo(-.57,-.31,0,-.33);shape.quadraticCurveTo(.57,-.31,.6,.2);shape.quadraticCurveTo(.28,-.04,0,.04);shape.quadraticCurveTo(-.28,-.04,-.6,.2);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.04,curveSegments:8});geometry.translate(0,0,-.14);return geometry;
}
export function makeBankCoinField(){
  const root=new THREE.Group(),ingotMaterial=new THREE.MeshStandardMaterial({color:0xf44832,emissive:0x8e160b,emissiveIntensity:.28,metalness:.35,roughness:.35});
  const ingots=new THREE.InstancedMesh(makeIngotGeometry(),ingotMaterial,180),centers=new THREE.InstancedMesh(sphere,ingotMaterial,180),dummy=new THREE.Object3D();root.add(ingots,centers);ingots.frustumCulled=false;centers.frustumCulled=false;
  root.userData.update=(coins,state)=>{let n=0;for(const coin of coins){if(n>=180||coin.picked||coin.distance-state.distance< -6||coin.distance-state.distance>175)continue;const rotation=state.elapsed*1.8+coin.distance*.09;dummy.position.set(coin.lane*BANK_RUN.laneWidth,coin.height+Math.sin(state.elapsed*3+coin.distance)*.08,state.distance-coin.distance);dummy.rotation.set(0,rotation,0);dummy.scale.setScalar(.75);dummy.updateMatrix();ingots.setMatrixAt(n,dummy.matrix);dummy.position.y+=.02;dummy.scale.set(.235,.18,.19);dummy.updateMatrix();centers.setMatrixAt(n,dummy.matrix);n++;}ingots.count=centers.count=n;ingots.instanceMatrix.needsUpdate=true;centers.instanceMatrix.needsUpdate=true;};return root;
}
export function disposeBankView(root){root.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});}
