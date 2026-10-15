export const flightStages=[
 {id:'boarding',label:'登机 · 航站楼准备',duration:4,hint:'廊桥连接飞机，行李装载完毕。'},
 {id:'pushback',label:'离开航站楼',duration:5,hint:'廊桥收回，飞机正在推出停机位。'},
 {id:'taxi',label:'滑行前往跑道',duration:5,hint:'沿滑行道前往起飞位置。'},
 {id:'takeoff',label:'加速 · 抬头起飞',duration:7,hint:'发动机全速运转，飞机正在离开地面。'},
 {id:'climb',label:'爬升 · 穿过云层',duration:5,hint:'收起起落架，城市渐渐远去。'},
 {id:'cruise',label:'空中巡航',duration:Infinity,hint:'WASD / 方向键走动，拖动画面转头；靠近舷窗看蓝天白云。'}
];
export function flightStageAt(elapsed){let start=0;for(const stage of flightStages){if(elapsed<start+stage.duration)return {...stage,progress:Math.min(1,Math.max(0,(elapsed-start)/stage.duration))};start+=stage.duration;}return {...flightStages.at(-1),progress:0};}
export const arrivalStages=[
 {id:'landing',label:'进近 · 接地减速',duration:8,hint:'对准目的地跑道，主轮接地后刹车减速。'},
 {id:'taxi-in',label:'滑行 · 到达航站楼',duration:8,hint:'飞机离开跑道，沿滑行道转向到达航站楼。'},
 {id:'docking',label:'靠桥 · 到达航站楼',duration:4,hint:'发动机关闭，廊桥伸出并连接舱门。'},
 {id:'disembark',label:'下机 · 欢迎到达',duration:2,hint:'舱门已打开，旅客沿廊桥走向到达大厅。'}
];
export function arrivalStageAt(elapsed){let start=0;for(const stage of arrivalStages){if(elapsed<start+stage.duration)return {...stage,progress:Math.max(0,(elapsed-start)/stage.duration)};start+=stage.duration;}return null;}
function bezier(points,t){const a=1-t;return {x:a*a*a*points[0].x+3*a*a*t*points[1].x+3*a*t*t*points[2].x+t*t*t*points[3].x,z:a*a*a*points[0].z+3*a*a*t*points[1].z+3*a*t*t*points[2].z+t*t*t*points[3].z};}
export function arrivalTaxiPose(t,start){
 const base=start?.z??-282;
 const points=t<.5?[{x:0,z:-900},{x:0,z:-980},{x:120,z:-980},{x:120,z:-820}]:[{x:120,z:-820},{x:120,z:-680},{x:27,z:-650},{x:27,z:-710}];
 const q=t<.5?t*2:(t-.5)*2,p=bezier(points,q),a=bezier(points,Math.max(0,q-.001)),b=bezier(points,Math.min(1,q+.001));
 return {x:p.x,y:0,z:base+p.z,pitch:0,heading:Math.atan2(-(b.x-a.x),-(b.z-a.z))};
}
export function cloudAltitude(worldHeight,aircraftHeight,inCabin=false){return inCabin?worldHeight-aircraftHeight:worldHeight;}
export function cabinCanMove(to,r=.35){
 if(Math.abs(to.x)>4.4-r||Math.abs(to.z)>12.6-r)return false;
 for(const side of [-1,1])for(const z of [-10,-6,-2,2,6,10])if(Math.abs(to.x-side*2.55)<1.15+r&&Math.abs(to.z-z)<.8+r)return false;
 return true;
}

export function flightPose(elapsed,stage,landingStart=null){
 const t=stage.progress;let x=27,z=70,y=0,pitch=0;
 if(stage.id==='pushback'){x=27-9*t;z=70+18*t;}
 if(stage.id==='taxi'){x=18*(1-t);z=88-100*t;}
 if(stage.id==='takeoff'){x=0;z=-12-180*t*t;y=Math.max(0,t-.55)*70;pitch=Math.max(0,t-.35)*.25;}
 if(stage.id==='climb'){x=0;z=-192-90*t;y=31.5+65*t;pitch=.12;}
 if(stage.id==='cruise'){x=0;z=-282-Math.max(0,elapsed-26)*35;y=96.5+Math.sin(elapsed*.7)*.35;}
 if(stage.id==='landing'){x=0;z=(landingStart?.z??-282)-900*(1-(1-t)**2);y=(landingStart?.y??96.5)*Math.max(0,1-t/.72)**2;pitch=t<.65?-.04:t<.8?.07:0;}
 if(stage.id==='taxi-in')return arrivalTaxiPose(t,landingStart);
 if(stage.id==='docking'||stage.id==='disembark'){x=27;z=(landingStart?.z??-282)-710;}
 return {x,y,z,pitch,heading:0};
}

export function createFlightScene({THREE,scene,inside,box,sphere,sign,destination}){
 const exterior=new THREE.Group();scene.add(exterior);
 const airport=new THREE.Group();exterior.add(airport);
 box(airport,0,-.25,-600,420,.5,2200,0x8ca888,false);
 box(airport,0,.01,-700,34,.08,1800,0x52646b,false);
 for(let z=-1570;z<180;z+=24){box(airport,0,.09,z,.55,.03,9,0xf4f0d4,false);for(const side of [-1,1])sphere(airport,side*15,.18,z,.18,0xffefb3);}
 const approachLights=[];for(let z=200;z<=400;z+=20)for(const x of [-7,0,7])approachLights.push(sphere(airport,x,.2,z,.22,0xffeed4));
 box(airport,36,.04,70,65,.08,40,0x91a3a9,false);
 box(airport,64,8,82,36,16,64,0xc4d7df);
 for(let z=55;z<112;z+=9)box(airport,45.9,7,z,.15,9,6,0x729fac,false);
 sign(airport,'国际航站楼 · T1',63,13,114.2,30,'#f2f5ee','#406d80');
 const bridge=new THREE.Group();bridge.position.set(45,3.2,70);airport.add(bridge);box(bridge,-8,0,0,16,3.2,3.5,0xc7d9dc);box(bridge,-8,.1,1.8,15,1.8,.08,0x8aaeba);
 const tug=box(airport,23,.65,56,3,1.3,4,0xe3be63);
 const beacon=sphere(airport,43,3,70,.4,0xe9ad67);
 const passengers=[];for(let i=0;i<6;i++){const p=new THREE.Group();box(p,0,.8,0,.5,.9,.4,[0x84acb3,0xd8a17e,0xb4a3bd][i%3]);sphere(p,0,1.55,0,.24,0xe9c3a5);airport.add(p);passengers.push(p);}
 // A round fuselage, swept wings, engines and retracting landing gear.
 const aircraft=new THREE.Group();exterior.add(aircraft);aircraft.position.set(27,0,70);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(2,2,23,20),new THREE.MeshStandardMaterial({color:0xf4f7f3,roughness:.45}));body.rotation.x=Math.PI/2;body.position.y=3;aircraft.add(body);
 const nose=sphere(aircraft,0,3,-11.5,2,0xf4f7f3);nose.scale.z=1.8;
 const tail=sphere(aircraft,0,3,11.5,2,0xf4f7f3);tail.scale.set(.8,.8,2);
 box(aircraft,0,2.9,0,30,.28,5,0xe3ebea);box(aircraft,0,3.1,11,11,.2,3,0xd9e6eb);
 box(aircraft,0,6.2,11,.3,5,3.7,0x367d9f);
 for(const side of [-1,1]){
  for(let z=-7;z<9;z+=2)box(aircraft,side*2,3.7,z,.08,.5,.8,0x396979,false);
  const engine=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,3,14),new THREE.MeshStandardMaterial({color:0xc7d9df,roughness:.4}));engine.rotation.x=Math.PI/2;engine.position.set(side*6,1.7,-1);aircraft.add(engine);
  box(aircraft,side*6,1.7,-2.55,1.3,1.3,.06,0x385764,false);
 }
 box(aircraft,0,3.9,-12.1,2.3,.7,.12,0x35616e,false);
 const gear=new THREE.Group();aircraft.add(gear);
 for(const x of [-1.2,1.2])for(const z of [-7,5]){box(gear,x,1,z,.15,2,.15,0x789093);sphere(gear,x,.45,z,.4,0x283c49);}
 const tyreSmoke=[];for(const side of [-1,1])for(let i=0;i<6;i++){const puff=sphere(exterior,0,0,0,.3+i*.12,0xd8e0dd);puff.material=new THREE.MeshBasicMaterial({color:0xd8e0dd,transparent:true,opacity:.6});puff.castShadow=false;tyreSmoke.push({mesh:puff,side,i});}
 const trails=[];for(const side of [-1,1])for(let i=0;i<10;i++){const puff=sphere(exterior,0,0,0,.55+i*.11,0xe9f4f8);puff.castShadow=false;trails.push({mesh:puff,side,i});}
 const clouds=[];function cloud(parent,x,y,z,size,index){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);for(let i=0;i<4;i++){const puff=sphere(g,(i-1.5)*size*.75,(i%2)*size*.25,Math.sin(i)*size*.35,size*(i===1?1:.75),0xffffff);puff.material=new THREE.MeshBasicMaterial({color:0xffffff});puff.castShadow=false;}clouds.push({g,x,y,z,index});}
 for(let i=0;i<18;i++)cloud(exterior,(i%2?1:-1)*(28+i%5*15),55+i%4*15,-160+i*22,5+i%3,i);

 const cabin=new THREE.Group(),scenery=new THREE.Group();inside.add(cabin,scenery);
 box(cabin,0,-.15,0,9.6,.3,28,0xb0c4cf);box(cabin,0,.015,0,2,.04,27,0x476b83,false);
 box(cabin,0,3.65,0,9.6,.22,28,0xf1f4ec);
 for(const side of [-1,1]){
  box(cabin,side*4.8,.6,0,.22,1.2,28,0xe9efe9);
  box(cabin,side*4.8,3.15,0,.22,.9,28,0xe9efe9);
  box(cabin,side*3.8,3.25,0,1.6,.65,26,0xd9e4e1);
  for(let z=-13.8;z<14;z+=4){box(cabin,side*4.8,1.95,z,.25,1.5,1.8,0xe9efe9);}
  for(const z of [-10,-6,-2,2,6,10]){
   for(const x of [side*1.95,side*3.1]){
    box(cabin,x,.65,z,1,.45,1.25,0x6393b0);box(cabin,x,1.35,z+.65,1,1.75,.22,0x4d7c9a);
    box(cabin,x,2.12,z+.62,.75,.32,.25,0xe2eae8);
   }
   box(cabin,side*2.55,.35,z,2.3,.5,1.3,0x708993);
   box(cabin,side*4.68,1.95,z+1.5,.08,1.48,.08,0xa3bec9);
  }
  box(scenery,side*10,-1,0,15,.2,6,0xdcebf1,false);
 }
 box(cabin,0,1.8,-14,9.6,3.6,.2,0xe0e9e4);box(cabin,0,1.8,14,9.6,3.6,.2,0xe0e9e4);
 sign(cabin,'飞往 '+destination+' · 蓝天航空',0,2.7,-13.85,7,'#eef6f5','#42748e');
 sign(cabin,'过道可走动 · 靠窗看风景',0,2.7,13.85,7,'#eef6f5','#42748e');
 // The cabin walls have actual openings; scenery sits beyond the windows.
 const terminalView=new THREE.Group();scenery.add(terminalView);
 const windowTerminal=box(terminalView,32,7,12,16,14,50,0xc4d7df);
 for(let z=-5;z<34;z+=7)box(terminalView,23.9,5,z,.12,6,4,0x729fac,false);
 const windowGround=box(scenery,0,-2,0,240,.2,440,0x8ca888,false);
 const windowRunway=box(scenery,0,-1.87,0,24,.05,440,0x596d76,false);
 const windowLines=[];for(let z=-190;z<220;z+=18)windowLines.push(box(scenery,0,-1.8,z,.5,.03,8,0xf7f3df,false));
 for(let i=0;i<16;i++)cloud(scenery,(i%2?1:-1)*(15+i%4*7),-4+i%5*3,-100+i*15,3+i%3,i+18);
 for(const side of [-1,1]){cloud(scenery,side*26,3,8,5,34);clouds.at(-1).nearWindow=true;}
 const ocean=box(scenery,0,-45,0,360,.2,440,0x4cadd0,false);
 let altitude=0,velocity=0,landingStart=null;
 function update(elapsed,stage,dt){
  const t=stage.progress;
  if(stage.id==='landing'&&!landingStart){landingStart=aircraft.position.clone();airport.position.z=landingStart.z-780;}
  const {x,y,z,pitch,heading=0}=flightPose(elapsed,stage,landingStart);
  aircraft.position.set(x,y,z);aircraft.rotation.set(pitch,heading,0);
  // The destination runway comes into view ahead, while the origin falls behind.
  airport.visible=stage.id!=='cruise';
  bridge.scale.x=stage.id==='boarding'||stage.id==='disembark'?1:stage.id==='pushback'?1-t*.9:stage.id==='docking'?.1+.9*t:.1;
  tug.position.set(x,.65,z-airport.position.z-14);tug.visible=['boarding','pushback'].includes(stage.id);
  beacon.visible=['boarding','pushback','docking','disembark'].includes(stage.id);beacon.scale.setScalar(.75+Math.sin(elapsed*9)*.25);
  for(const [i,p] of passengers.entries()){p.visible=['boarding','disembark'].includes(stage.id);const progress=(t+i/6)%1;p.position.set(stage.id==='boarding'?45-progress*18:27+progress*18,3.3,70+(i%2?-.6:.6));}
  gear.scale.y=stage.id==='climb'?1-t:stage.id==='cruise'?0:1;
  for(const p of tyreSmoke){p.mesh.visible=stage.id==='landing'&&t>=.72&&t<.94;p.mesh.position.set(x+p.side*(1.2+p.i*.35),.65+p.i*.2,z+5+p.i*2);p.mesh.scale.setScalar(1+p.i*.2);p.mesh.material.opacity=Math.max(0,(.94-t)*3);}
  altitude=Math.round(y*120);velocity=stage.id==='takeoff'?Math.round(90+t*210):stage.id==='climb'?Math.round(300+t*380):stage.id==='cruise'?860:stage.id==='landing'?Math.round(300*(1-t)):stage.id==='taxi'||stage.id==='taxi-in'?35:stage.id==='pushback'?12:0;
  for(const p of trails){p.mesh.visible=['takeoff','climb','cruise'].includes(stage.id);p.mesh.position.set(x+p.side*6,y+1.7,z+5+p.i*3);p.mesh.scale.setScalar(.6+Math.sin(elapsed*8-p.i)*.15+p.i*.08);}
  for(const c of clouds){const cabinCloud=c.g.parent===scenery,worldY=cabinCloud?94+c.y:c.y;c.g.visible=['takeoff','climb','cruise','landing'].includes(stage.id);c.g.position.y=cloudAltitude(worldY,y,cabinCloud);c.g.position.z=cabinCloud?((c.z-z*.3+c.index*17+200)%200+200)%200-100:z+((c.z-z+c.index*17+400)%400+400)%400-200;}
  terminalView.position.set(27-x, -y,70+airport.position.z-z);terminalView.rotation.y=-heading;terminalView.visible=['boarding','pushback','taxi','takeoff','taxi-in','docking','disembark'].includes(stage.id);
  const onGround=['boarding','pushback','taxi','takeoff','landing','taxi-in','docking','disembark'].includes(stage.id);
  windowGround.visible=onGround;windowRunway.visible=onGround;for(const line of windowLines){line.visible=onGround;line.position.y=-1.8-y;line.position.z=((line.position.z+velocity/3.6*dt+220)%440)-220;}
  windowGround.position.y=-2-y;windowRunway.position.y=-1.87-y;ocean.visible=!onGround;
  return {altitude,velocity};
 }
 function updateCamera(camera,view,p,heading,orbit,pitch,stage,dt){
  if(view==='cabin'){
   camera.position.set(p.x,1.85,p.z);camera.lookAt(p.x-Math.sin(heading+orbit)*5,1.85,p.z-Math.cos(heading+orbit)*5);camera.rotateX(pitch);
   if(stage.id==='takeoff'){camera.position.x+=Math.sin(stage.progress*160)*.025;camera.position.y+=Math.sin(stage.progress*200)*.025;}
  }else{
   const pos=aircraft.position,angle=orbit-.8;
   const target=new THREE.Vector3(pos.x+Math.sin(angle)*48,pos.y+20,pos.z+Math.cos(angle)*48);
   camera.position.lerp(target,1-Math.exp(-4*dt));camera.lookAt(pos.x,pos.y+3,pos.z);camera.rotateX(pitch*.4);
  }
 }
 function dispose(){exterior.removeFromParent();cabin.removeFromParent();scenery.removeFromParent();for(const group of [exterior,cabin,scenery])group.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}else if(o.material&&!apiMaterial(o.material))o.material.dispose();});}
 // Cached materials belong to the main city renderer and must survive this flight.
 function apiMaterial(m){return !m.map&&m.roughness===.75;}
 return {exterior,cabin,scenery,aircraft,update,updateCamera,dispose};
}
