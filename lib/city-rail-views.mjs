import {RAIL,trainAt,crossingAt,crossingForTrain,createRailStops} from './city-rail.mjs';
import {mapRoadAt} from './city-map.mjs';
import {batchCityChunk} from './city-batch.mjs';

export function createRailViews(api){
 const {THREE,box,sphere,sign,person}=api;
 function dynamic(group){group.userData.cityDynamic=true;return group;}
 function label(parent,text,x,y,z,w=12,bg='#163d58',fg='#ffffff',north=false){const s=sign(parent,text,x,y,z,w,bg,fg);s.scale.y=.45;if(north)s.rotation.y=Math.PI;return s;}
 function roof(parent,x,y,z,w,d){
  box(parent,x,y,z,w,.55,d,0x405d56);
  for(const side of [-1,1]){const slope=box(parent,x,y+1,z+side*d*.22,w-2,.45,d*.53,0x52665b);slope.rotation.x=side*.24;box(parent,x,y+.3,z+side*d*.52,w+3,.3,1.2,0x82664a);}
  for(const side of [-1,1]){const tip=box(parent,x+side*w*.49,y+.75,z,1.4,.45,d+2,0x82664a);tip.rotation.z=side*.22;}
 }
 function clock(parent,x,y,z){
  const face=new THREE.Mesh(new THREE.CircleGeometry(2.6,32),new THREE.MeshStandardMaterial({color:0x18344c,side:THREE.DoubleSide}));face.position.set(x,y,z);parent.add(face);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const tick=box(parent,x+Math.sin(a)*2.15,y+Math.cos(a)*2.15,z-.05,.18,.44,.1,0xf8eed5);tick.rotation.z=-a;}
  box(parent,x,y+.65,z-.12,.18,1.3,.1,0xfff2c8);const hand=box(parent,x+.7,y+.3,z-.13,1.5,.14,.1,0xfff2c8);hand.rotation.z=.4;
 }
 function train(parent){
  const g=dynamic(new THREE.Group());parent.add(g);g.name='high-speed-train';
  g.railDoors=[];
  for(let i=0;i<RAIL.cars;i++){
   const x=-10-i*RAIL.carLength;
   box(g,x-.95,2.05,0,14.1,2.9,3.5,0xf0f4f3);box(g,x+7.45,2.05,0,1.1,2.9,3.5,0xf0f4f3);box(g,x,.65,0,15,.55,2.7,0x586875);box(g,x,3.58,0,15.5,.3,3.2,0xe2e8e7);
   for(const side of [-1,1]){
    box(g,x-.95,1.55,side*1.77,14.1,.19,.06,0xc82836);box(g,x+7.45,1.55,side*1.77,1.1,.19,.06,0xc82836);
    for(let j=0;j<6;j++)box(g,x-6+j*2.1,2.65,side*1.78,1.65,.85,.05,0x214357);
    const door=dynamic(new THREE.Group());door.position.set(x+6.5,0,side*1.8);g.add(door);box(door,0,2.08,0,.76,2.3,.07,0xd4ddde);box(door,0,1.55,side*.04,.76,.19,.06,0xc82836);g.railDoors.push({g:door,x:x+6.5});label(g,String(i+1).padStart(2,'0'),x+6.5,3.25,side*1.85,.65);
    for(const end of [-5,5]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.25,10),new THREE.MeshStandardMaterial({color:0x303d46}));wheel.rotation.x=Math.PI/2;wheel.position.set(x+end,.43,side*1.2);g.add(wheel);}
   }
   if(i<RAIL.cars-1)box(g,x-8.8,1.8,0,1.4,2.1,2.7,0x41525c);
  }
  // A tapered mesh gives the cab its long, rounded high-speed nose.
  const vertices=[],indices=[],rings=[[-5,1.76,1.45,2.05],[-3.6,1.58,1.25,1.95],[-1.5,.95,.82,1.5],[.4,.12,.2,1.1]];
  for(const [x,w,h,y] of rings)for(let j=0;j<16;j++){const a=j/16*Math.PI*2;vertices.push(x,y+Math.sin(a)*h,Math.cos(a)*w);}
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<16;j++){const a=i*16+j,b=i*16+(j+1)%16;indices.push(a,b,a+16,b,b+16,a+16);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();g.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xf2f5f4,roughness:.35,side:THREE.DoubleSide})));
  const wind=sphere(g,-3.8,2.92,0,1,0x17364a);wind.scale.set(1.5,.38,1.35);
  for(const side of [-1,1]){const stripe=box(g,-3.7,1.65,side*1.45,2.2,.22,.12,0xc82836);stripe.rotation.y=side*.25;sphere(g,-1.75,1.38,side*.73,.16,0xfff6c2);}
  label(g,'CR · 复兴号',-22,2.1,1.83,5,'#eef3f3','#b32937');
  return g;
 }
 function setDoors(vehicle,progress){for(const door of vehicle.railDoors??[])door.g.position.x=door.x+progress*.95;}
 function track(parent,z,start=RAIL.trackStart,end=RAIL.trackEnd){
  box(parent,(start+end)/2,.02,z,end-start,.12,5.3,0x959a98,false);
  for(let x=start;x<end;x+=2.5)box(parent,x,.12,z,.42,.16,4.5,0x756d5f,false);
  for(const dz of [-.9,.9])box(parent,(start+end)/2,.27,z+dz,end-start,.14,.14,0xb5c0c3,false);
  for(let x=start+12;x<end;x+=42){for(const side of [-1,1])box(parent,x,4,z+side*3.2,.16,8,.16,0x87999e,false);box(parent,x,8,z,.18,.18,6.5,0x87999e,false);}
  box(parent,(start+end)/2,7.6,z,end-start,.035,.035,0x697d85,false);
 }
 function platform(parent,z=218,start=-54,end=74){
  box(parent,(start+end)/2,.28,z,end-start,.56,5.5,0xd2d8d5,false);
  box(parent,(start+end)/2,.58,z+2,end-start,.035,.38,0xf1c94f,false);
  for(let x=start+6;x<end;x+=16){box(parent,x,4,z,.35,7,.35,0xb9c8cd);for(const side of [-1,1]){const brace=box(parent,x,6.8,z+side*1.1,.16,2.6,.16,0x8dabb8);brace.rotation.x=side*.7;}}
  box(parent,(start+end)/2,7.9,z,end-start+4,.35,8,0x829fab);
  label(parent,'1 站台  ·  G101  ·  请站在黄色安全线内',-25,5.5,z,16);
 }
 function exterior(parent,profile){
  const g=new THREE.Group();parent.add(g);const station={id:'railwayStation',name:profile.name.replace(/市$/,'')+'站 · 高铁站',x:RAIL.x,z:RAIL.z,w:RAIL.width,d:RAIL.depth,height:36,floors:1,chunk:profile.key,role:'铁路工作人员',desc:'安检、购票、检票候车，再到站台乘坐高铁。',items:[],door:{x:10,z:187,y:0}};
  box(g,10,.05,185,136,.1,12,0xc3ccc6,false);
  box(g,10,7.5,204,108,15,22,0xc9c5af);box(g,10,15.4,204,110,.9,24,0x84765d);
  for(let x=-31;x<=51;x+=10){box(g,x,9.5,192.8,7.4,10,.15,0x426d80);for(const offset of [-2.4,0,2.4])box(g,x+offset,9.5,192.65,.17,10,.16,0x9daaa7);box(g,x,10,192.6,7.4,.2,.17,0x9daaa7);box(g,x+4.3,8,192.5,.8,14,1,0xe0dbc5);}
  for(const x of [-44,64]){
   box(g,x,13,202,12,26,17,0xd5cfb9);box(g,x,26.8,202,14,1.5,19,0x9b8e73);box(g,x,30.1,202,10,6,13,0xe7dfc9);clock(g,x,30,195.35);
   roof(g,x,33.5,202,16,19);roof(g,x,35.8,202,11,14);box(g,x,38,202,.7,2,.7,0xa36c43);
   for(const y of [6,13,21])box(g,x,y,193.4,3,4,.12,0x446d7d);
  }
  roof(g,10,16.8,204,102,24);
  label(g,station.name.replace(' · 高铁站',''),10,22.8,191.4,47,'#c9c5af','#af2830',true).scale.y=.5;
  label(g,'RAILWAY STATION',10,20.1,190.8,37,'#d4cfb9','#a32932',true).scale.y=.24;
  for(let x=-34;x<=54;x+=11){box(g,x,2.5,192.6,6,5,.18,0x3a6470);box(g,x,5.5,191,9,.3,3.5,0x627f80);label(g,x===10?'进站口 · 安检':'进站验票口',x,4.7,190.9,7,'#193e3e','#f4ddb2',true);}
  label(g,'高铁站  ↑  安检 → 购票 → 检票 → 候车 → 站台',10,3,181,31,'#214c59','#ffffff',true);
  platform(g);track(g,RAIL.trackZ);
  const crossings=profile.roads.filter(r=>r.axis==='NS'&&Math.abs(r.a.x-10)>RAIL.width/2+6&&mapRoadAt(profile,{x:r.a.x,z:RAIL.trackZ}).height<.1).map(r=>({x:r.a.x,width:r.width}));
  const signals=[];
  for(const c of crossings)for(const side of [-1,1]){
   const z=RAIL.trackZ+side*9,x=c.x+side*(c.width/2+1.2),signal=dynamic(new THREE.Group());signal.position.set(x,0,z);g.add(signal);
   box(signal,0,2,0,.18,4,.18,0xabb9b9);box(signal,0,3.4,0,2.6,.2,.2,0x829291);box(signal,0,2.7,0,.7,1,.6,0x788c8b);
   const lamps=[];
   for(const dx of [-1,1]){const disk=sphere(signal,dx,3.9,0,.57,0x243439);disk.scale.set(1,1,.27);const lamp=sphere(signal,dx,3.9,side*.18,.36,0x511e23);lamp.material=new THREE.MeshStandardMaterial({color:0x511e23,emissive:0x000000});lamp.material.userData.cityOwned=true;lamps.push(lamp);box(signal,dx,4.36,side*.3,1,.13,.8,0x243439);}
   label(signal,'铁路道口\n红灯停车',0,5.8,0,4.5,'#f1e5c9','#9d2932');
   const arm=dynamic(new THREE.Group());arm.position.set(c.x-c.width/2-.4,.9,z-side*1.5);g.add(arm);box(arm,c.width/2,.2,0,c.width+.8,.2,.24,0xe8e6d6);
   for(let dx=0;dx<c.width;dx+=1.4)box(arm,dx+.4,.2,-.02,.6,.24,.28,0xc6423b);arm.rotation.z=Math.PI/2;
   signals.push({crossing:c,lamps,arm,progress:0});
   box(g,c.x,.12,z-side*3,c.width,.04,.35,0xf2e8cb,false);
  }
  const vehicle=train(g);return {station,group:g,vehicle,crossings,signals,update(seconds,dt,manualPose=null){
   const pose=manualPose??trainAt(seconds);vehicle.position.set(pose.x,0,RAIL.trackZ);vehicle.visible=pose.visible;setDoors(vehicle,manualPose?.doorProgress??(pose.phase==='boarding'?1:0));
   for(const s of signals){const red=(manualPose?crossingForTrain(pose,s.crossing.x):crossingAt(seconds,s.crossing.x)).red;s.progress=THREE.MathUtils.clamp(s.progress+(red?dt:-dt)/1.5,0,1);s.arm.rotation.z=(1-s.progress)*Math.PI/2;
    s.lamps.forEach((lamp,i)=>{const on=red&&Math.floor(seconds*2)%2===i;lamp.material.color.setHex(on?0xff382f:0x511e23);lamp.material.emissive.setHex(on?0xe32118:0);});}
  }};
 }
 function clear(parent,player){player.removeFromParent();while(parent.children.length){const c=parent.children[0];c.removeFromParent();c.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}else if(o.material?.userData?.cityOwned)o.material.dispose();});}}
 function hall(parent,station){
  box(parent,0,-.15,0,62,.3,72,0xd9ded9,false);
  for(const side of [-1,1]){box(parent,side*31,5,0,.4,10,72,0xe0e3d9);for(let z=-30;z<32;z+=10){box(parent,side*30.75,5,z,.1,6,7,0x75a1b3);box(parent,side*27,5,z,.65,10,.65,0xb7c8c8);}}
  box(parent,0,5,-36,62,10,.4,0xc8d8d7);label(parent,station.name,0,7,-35.7,30);
  for(let x=-24;x<=24;x+=12){const beam=box(parent,x,10,0,.3,.3,72,0x8da7ad);beam.rotation.z=.05;}
  label(parent,'01 安检     02 购票     03 检票     04 候车',0,7,29,38);
  box(parent,0,1,18,9,2,3,0x2c5365);box(parent,0,1.6,18,5,.1,4.5,0x3b4145);box(parent,-2.8,2.5,18,.7,3,3,0xb7c7c6);box(parent,2.8,2.5,18,.7,3,3,0xb7c7c6);box(parent,0,4,18,6.3,.5,3,0xb7c7c6);box(parent,0,1.9,20,1.5,.65,1,0x9f7f57);
  person(parent,7,18,0x325977,'安检员');label(parent,'01 · 安检通道',0,5.6,18,13);
  for(let x=-22;x<=-10;x+=4){box(parent,x,1.3,1,2.4,2.6,1.5,0x648b9e);box(parent,x,1.9,1.85,1.6,.9,.1,0x20495e);box(parent,x,1.05,1.85,1,.2,.2,0xe4dfc4);}
  label(parent,'02 · 自助售票 / 购票 ¥128',-16,4,1,20);
  for(let x=-26;x<=26;x+=4){box(parent,x,1,-10,1.3,2,4,0x91acb6);box(parent,x,2.07,-9,1,.08,.7,0x25465c);if(x!==2)box(parent,x+1.8,1,-10,2.4,.25,.18,0xc57655);}
  label(parent,'03 · 检票闸机 → 候车区',0,5,-10,25);
  for(const x of [-22,-15,15,22])for(const z of [-19,-25,-31]){box(parent,x,.65,z,4,1.3,1.4,0x466d83);box(parent,x,1.4,z-.55,4,1,.25,0x466d83);for(const dx of [-1.4,1.4])box(parent,x+dx,.3,z,.12,.6,.5,0x9caeb3);}
  label(parent,'04 · 候车大厅    G101    1站台',0,5,-31,27);
  label(parent,'出口 ↓',22,3,34,9);
 }
 function stationPlatform(parent,destination){
  box(parent,0,-.2,0,154,.4,42,0xb2c3b0,false);platform(parent,0,-68,68);track(parent,8);
  label(parent,'G101  →  '+destination+'\n1站台 · 01车厢 · 请在黄线内候车',20,5,-2,12);
  const vehicle=train(parent);vehicle.position.set(56,0,8);return vehicle;
 }
 function cabin(parent,destination,passengers=12){
  box(parent,0,-.1,0,5.8,.2,34,0x84929a,false);box(parent,0,.015,0,1.25,.02,31,0xb4bbc0,false);
  for(const side of [-1,1]){
   box(parent,side*2.9,.6,0,.18,1.2,34,0xeee9da);box(parent,side*2.9,3.3,0,.18,.6,34,0xeee9da);
   for(let z=-12;z<=12;z+=3){
    const glass=box(parent,side*2.9,2.15,z,.06,1.3,2.4,0x75a8b9);glass.material=new THREE.MeshStandardMaterial({color:0x9ec6d5,transparent:true,opacity:.22,depthWrite:false});glass.material.userData.cityOwned=true;
    box(parent,side*2.9,2.1,z+1.35,.18,1.8,.3,0xeee9da);box(parent,side*2.74,1.35,z,.18,.12,2.4,0xcbd6d1);
   }
   for(const z of [-15,15])box(parent,side*2.9,2.1,z,.18,1.8,3.4,0xeee9da);
   box(parent,side*2,3.1,0,1.6,.12,30,0xc9d7d8);box(parent,side*1.2,3.33,0,.07,.46,30,0x839da9);
   for(let z=-11;z<=11;z+=2.5)for(let j=0;j<(side<0?3:2);j++){
    const x=side*(1+j*.58);box(parent,x,.62,z,.52,.28,1.05,0x355e7f);box(parent,x,1.25,z+.4,.53,1.2,.24,0x355e7f);box(parent,x,1.76,z+.24,.45,.3,.1,0xf2f0e4);box(parent,x,.25,z,.12,.5,.6,0x677c88);
   }
   for(const z of [-8,4]){box(parent,side*2.3,3.4,z,1,.45,1.3,side<0?0x9e7f64:0x525e73);}
  }
  box(parent,0,2,-17,5.8,4,.2,0xdcd9cc);box(parent,0,2,17,5.8,4,.2,0xdcd9cc);label(parent,'G101  →  '+destination+'\n01 车厢 · 二等座',0,2.9,-16.8,4.8);
  for(const z of [-16,16])box(parent,0,1.4,z,1.2,2.8,.16,0xb6c5c7);
  label(parent,'驾驶室 · 靠近按 E',0,2.25,-15.85,3.8,'#1e3c4a','#d9f6ec');
  // No opaque ceiling: the follow camera can see the interior while walking.
  for(const side of [-1,1])box(parent,side*.65,3.8,0,.14,.1,32,0xfff5ce);
  const riders=[];for(let i=0;i<10;i++){const p=person(parent,i%2?-1.5:1.5,-8.5+Math.floor(i/2)*5,[0x9a7c89,0x648b85,0x6f89a6][i%3],'旅客',-.25);for(const leg of p.legs)leg.rotation.x=-1.4;riders.push(p);}
  const scenery=dynamic(new THREE.Group());parent.add(scenery);
  for(let i=0;i<30;i++)for(const side of [-1,1]){box(scenery,side*(9+i%4*3),-.7,-180+i*12,8,1,10,i%3?0x95b68e:0xc3b987,false);if(i%3===0){box(scenery,side*12,1.2,-180+i*12,.4,3,.4,0x8c7755);sphere(scenery,side*12,3.7,-180+i*12,2,0x6a945f);}}
  scenery.setPassengers=count=>riders.forEach((p,i)=>p.g.visible=i<Math.ceil(count/4));scenery.setPassengers(passengers);
  return scenery;
 }
 function driver(parent,destination){
  const g=new THREE.Group();parent.add(g);g.name='high-speed-driver-cab';
  box(g,0,.05,3.5,4.6,.3,7,0x657b84);box(g,0,1,0,4.8,1.8,.28,0xd4dfdf);
  for(const side of [-1,1]){box(g,side*2.3,1.2,3.5,.22,2.4,7,0xd6e0df);box(g,side*2.3,3.2,3.5,.16,.3,7,0xc3d4d7);box(g,side*2.15,2.5,.5,.15,1.8,.15,0x365361);box(g,side*1.15,2.7,.05,.1,1.5,.12,0x365361);}
  box(g,0,3.6,1,4.5,.2,2.5,0xc2d3d6);box(g,0,3.5,.05,4.4,.14,.2,0x2d4855);
  box(g,0,1.3,1.2,4,1.1,1.7,0x344e5e);const desktop=box(g,0,1.92,1.1,4,.12,1.8,0x66818b);desktop.rotation.x=-.12;
  for(const [x,text] of [[-1.2,'列车速度'],[0,'前方轨道'],[1.2,'制动压力']]){box(g,x,2.1,.75,1.04,.65,.13,0x0d2533);label(g,text,x,2.15,.86,.95,'#102b3a','#81e6d4');}
  const lever=dynamic(new THREE.Group());lever.position.set(.95,1.98,1.8);g.add(lever);box(lever,0,.25,0,.12,.5,.12,0x253c47);box(lever,0,.52,0,.38,.14,.25,0xce7758);
  box(g,-1.3,2,1.8,.45,.08,.3,0xcf5045);label(g,'停车',-1.3,2.12,1.85,.7,'#8d3432','#fff1dd');
  box(g,0,.75,4.4,1.2,.5,1.2,0x29475c);box(g,0,1.35,4.9,1.2,1.4,.25,0x29475c);
  label(g,'G101  → '+destination,0,3.17,.15,3.3,'#263f4d','#e4f7ed');
  // Front windows remain open so the real track can be seen from the cab.
  return {g,lever,update(traction,braking){lever.rotation.x=(braking?-1:traction?1:0)*.45;}};
 }
 function drivingWorld(parent,destination,stops=createRailStops('始发站',destination)){
  const g=dynamic(new THREE.Group());g.name='rail-driving-route';parent.add(g);
  box(g,(RAIL.trackStart+RAIL.trackEnd)/2,-.3,RAIL.trackZ,RAIL.trackEnd-RAIL.trackStart+200,.5,180,0xa6c39c,false);track(g,RAIL.trackZ);
  const stations=[];
  for(const stop of stops){
   const root=new THREE.Group();root.name='rail-stop-'+stop.id;root.position.x=stop.distance;g.add(root);platform(root,218,-66,100);
   box(root,10,4,204,110,8,14,[0xcbd5d0,0xd9cbb5,0xb8ced5,0xc4cfb5][stop.index%4]);label(root,stop.name,10,6,212,24,'#d6ded8','#a63139');
   const marker=label(root,stop.name+'\n停车标',66,4,218,5,'#1c4b61','#fff6dd');marker.rotation.y=-Math.PI/2;box(root,66,.34,RAIL.trackZ,.18,.05,3.5,0xf5d35a,false);
   const waiting=[],queue=stop.id==='origin'||stop.id==='terminal'?0:4+stop.index%3;
   for(let i=0;i<queue;i++)waiting.push(person(root,-42+i*9,217,[0x927892,0x709a8a,0x6b8fab][i%3],'候车旅客',.56));
   stations.push({stop,root,waiting,queue});
  }
  const exchange=[];for(let i=0;i<24;i++){const p=person(g,0,0,[0xb18b68,0x71958f,0x8a83a4,0x6e8da9][i%4],'乘客');p.g.visible=false;exchange.push(p);}
  for(let x=-100;x<RAIL.trackEnd;x+=48)for(const side of [-1,1]){const z=RAIL.trackZ+side*(20+(Math.abs(x)%4)*4);box(g,x,1.5,z,.5,3,.5,0x8f795a);sphere(g,x,4,z,2.3,0x648c66);}
  box(g,176,.035,RAIL.trackZ,12,.05,80,0x65747b,false);
  const signals=[];
  for(const side of [-1,1]){
   const post=new THREE.Group();post.position.set(176+side*8,0,RAIL.trackZ+side*9);g.add(post);box(post,0,2,0,.18,4,.18,0x8ba2a7);box(post,0,3.8,0,2.6,1,.25,0x253c44);
   const lamps=[];for(const dx of [-.8,.8]){const lamp=sphere(post,dx,3.8,side*.2,.32,0x4d2428);lamp.material=new THREE.MeshStandardMaterial({color:0x4d2428,emissive:0});lamp.material.userData.cityOwned=true;lamps.push(lamp);}
   const arm=dynamic(new THREE.Group());arm.position.set(169.5,1,RAIL.trackZ+side*8);g.add(arm);box(arm,6,.1,0,12,.2,.2,0xf1ead7);for(let x=.4;x<12;x+=1.4)box(arm,x,.1,0,.6,.24,.25,0xc94640);
   signals.push({lamps,arm,progress:0});box(g,176,.09,RAIL.trackZ+side*10,12,.03,.4,0xfff4d8,false);
  }
  const vehicle=train(g);batchCityChunk(THREE,g);g.rotation.y=Math.PI/2;g.position.x=-RAIL.trackZ;
  return {g,vehicle,signals,stations,exchange,update(drive,showTrain,seconds=0,dt=0){const pose=drive.pose;vehicle.position.set(pose.x,0,pose.z);vehicle.visible=showTrain;g.position.z=pose.x;setDoors(vehicle,drive.doorProgress);
   const service=drive.service;
   for(const s of stations){const current=service?.stationId===s.stop.id,leaving=current?Math.min(service.board,Math.ceil(Math.max(0,service.elapsed-1-service.alight*.6)/.6)):drive.served.has(s.stop.id)?s.queue:0;s.waiting.forEach((p,i)=>p.g.visible=i>=leaving);}
   exchange.forEach((p,i)=>{
    p.g.visible=false;if(!service||drive.doorProgress<=0||i>=service.alight+service.board)return;
    const boarding=i>=service.alight,index=boarding?i-service.alight:i,start=1+(boarding?service.alight:0)*.6+index*.6,u=(service.elapsed-start)/.6;
    if(u<0||boarding&&u>=1)return;const t=THREE.MathUtils.clamp(u,0,1),doorX=pose.x-3.5-(i%4)*RAIL.carLength;
    p.g.visible=true;p.g.position.set(doorX+(boarding?0:Math.max(0,u-1)*1.5),boarding?.56+t*.4:.96-t*.4,boarding?217.4+t*5.9:223.3-t*5.9);p.g.rotation.y=boarding?Math.PI:0;
    for(let j=0;j<2;j++){p.legs[j].rotation.x=Math.sin(seconds*8+j*Math.PI)*.45;p.arms[j].rotation.x=-Math.sin(seconds*8+j*Math.PI)*.3;}
   });
   const red=crossingForTrain(pose,176).red;for(const s of signals){s.progress=THREE.MathUtils.clamp(s.progress+(red?dt:-dt)/1.5,0,1);s.arm.rotation.z=(1-s.progress)*Math.PI/2;s.lamps.forEach((lamp,i)=>{const on=red&&Math.floor(seconds*2)%2===i;lamp.material.color.setHex(on?0xff382f:0x4d2428);lamp.material.emissive.setHex(on?0xe32118:0);});}
  },dispose(){g.removeFromParent();g.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}else if(o.material?.userData?.cityOwned)o.material.dispose();});}};
 }
 return {exterior,clear,hall,stationPlatform,cabin,driver,drivingWorld,train,track,setDoors};
}
