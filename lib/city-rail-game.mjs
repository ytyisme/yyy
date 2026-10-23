import {WALK_SPEED} from './city-scale.mjs';
import {RAIL,trainAt,crossingAt,crossingForTrain,railJourney,crossingBlocks,cabinMove,railRideAt,createRailDrive,createRailStops} from './city-rail.mjs';
import {createRailViews} from './city-rail-views.mjs';
import {chinaCities,findCities} from './city-cities.mjs';

export function createCityRailGame(api){
 const {THREE,scene,city,inside,player,camera,keys,$,toast,dialog,row,record,sound,document}=api,views=createRailViews(api);
 let exterior=null,journey=null,station=null,vehicle=null,scenery=null,autoWalk=null,seated=false,overview=false,lastBell=-1;
 let drive=null,inDriver=false,driverView='cab',driverCab=null,driveWorld=null;
 const cameraRay=new THREE.Raycaster(),cameraOrigin=new THREE.Vector3(),cameraDirection=new THREE.Vector3();
 const state=()=>api.state();
 const riding=()=>journey?.phase==='cabin';
 const active=()=>state().interior?.id==='railwayStation';
 const distance=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
 const points={security:{x:0,z:22},ticket:{x:-16,z:5},gate:{x:2,z:-6},platform:{x:0,z:-29},board:{x:7,z:1},driver:{x:0,z:-14},exit:{x:0,z:31}};
 function resetView(){const platform=['platform','arrived'].includes(journey?.phase);api.setMotion(0,platform?Math.PI:0);api.resetView();overview=false;keys.clear();camera.position.set(player.g.position.x,player.g.position.y+7,player.g.position.z+(platform?-10:10));}
 function refresh(kind){
  views.clear(inside,player.g);inside.visible=true;city.visible=false;
  if(kind==='hall')views.hall(inside,station);
  if(kind==='platform'){vehicle=views.stationPlatform(inside,journey.ticket?.destination.name??state().world.profile.name);}
  if(kind==='cabin')scenery=views.cabin(inside,journey.ticket.destination.name,drive?.passengers??12);
  if(kind==='driver')driverCab=views.driver(inside,journey.ticket.destination.name);
  inside.add(player.g);player.g.visible=true;player.g.position.set(0,0,kind==='hall'?31:kind==='cabin'?14:-1);
  scene.fog=new THREE.Fog(0xd1e0df,kind==='hall'?80:45,kind==='hall'?150:180);resetView();
 }
 function buildWorld(parent,profile){exterior=views.exterior(parent,profile);api.buildings.push(exterior.station);api.solids.push({x:10,z:204,w:128,d:22,minY:0,maxY:40});}
 function clearWorld(){exterior=null;overview=false;}
 function enter(b){
  const s=state();if(s.driving||s.flight||s.taxi||s.activity||s.justice.phase!=='free')return false;
  driveWorld?.dispose();driveWorld=null;drive=null;inDriver=false;driverCab=null;
  station=b;const ticket=journey?.ticket&&!journey.ticket.used&&journey.ticket.source.index===s.world.profile.index?journey.ticket:null;journey=railJourney();journey.ticket=ticket;
  api.setInterior(b);refresh('hall');$('exit').hidden=false;$('railway-panel').hidden=false;
  toast('进入高铁站：先走到安检通道，再购票、过闸机和候车。右侧按钮可以带你走到下一处。');updateUI();return true;
 }
 function leave(){
  if(!active())return false;
  if(riding()){toast('列车正在行驶，到站停稳后才能下车。');return false;}
  driveWorld?.dispose();driveWorld=null;inDriver=false;autoWalk=null;seated=false;keys.clear();api.setInterior(null);inside.visible=false;city.visible=true;city.add(player.g);player.g.visible=true;
  player.g.position.set(station.door.x,0,station.door.z-3);api.setMotion(0,0);scene.fog=new THREE.Fog(0xc6e0e8,140,330);$('exit').hidden=true;$('railway-panel').hidden=true;document.body?.classList.remove('in-railway');document.body?.classList.remove('in-rail-driver');$('minimap').hidden=false;resetView();toast('已出站，回到'+state().world.profile.name+'的站前广场。');return true;
 }
 function task(){
  if(!journey.secured&&journey.phase==='hall')return {key:'security',point:points.security,label:'通过安检',hint:'走到安检通道，把行李放上安检机。'};
  if(!journey.ticket&&journey.phase==='hall')return {key:'ticket',point:points.ticket,label:'购买高铁票',hint:'到左侧蓝色自助售票机选目的地。'};
  if(journey.phase==='hall')return {key:'gate',point:points.gate,label:'刷票过闸机',hint:'到检票闸机刷票，进入候车大厅。'};
  if(journey.phase==='waiting')return {key:'platform',point:points.platform,label:'前往 1 站台',hint:'在候车区等待，沿指示前往站台。'};
  if(journey.phase==='platform')return {key:'board',point:points.board,label:'上车 · 01 车厢',hint:'在黄色安全线内候车，列车停稳后上车。'};
  if(journey.phase==='arrived')return {key:'exit',label:'下车出站',hint:'列车已到站，前往站前广场。'};
  return {key:'seat',label:seated?'起身 · 走动':'坐到 01A 座位',hint:'可以沿中央过道走动、看窗外，或坐下休息。'};
 }
 function ticketMenu(){
  if(!active()||journey.phase!=='hall'||!journey.secured||distance(player.g.position,points.ticket)>5)return false;
  dialog('高铁售票 · 二等座',state().world.profile.name+' 出发 · G101 · ¥128 · 01车厢 01A。购票后去闸机检票。');
  const world=state().world,all=world.country===0?chinaCities:api.countries[world.country].cities.map((name,index)=>({name,index}));
  const input=document.createElement('input');input.className='city-search';input.placeholder='搜索目的地城市';input.setAttribute('aria-label','高铁目的地');$('dialog-content').append(input);
  const list=document.createElement('div');$('dialog-content').append(list);
  function results(){list.replaceChildren();const matches=(world.country===0?findCities(input.value??''):all.filter(c=>c.name.includes(input.value??''))).filter(c=>c.index!==world.profile.index).slice(0,18);
   for(const dest of matches){const item=document.createElement('div');item.className='item';const text=document.createElement('span');text.textContent=dest.name+' · ¥128';const button=document.createElement('button');button.textContent='购买车票';button.onclick=()=>buy(dest);item.append(text,button);list.append(item);}}
  input.oninput=results;results();return true;
 }
 function buy(destination){
  const s=state(),valid=s.world.country===0?chinaCities[destination?.index]?.name===destination?.name:api.countries[s.world.country].cities[destination?.index]===destination?.name;
  if(!active()||distance(player.g.position,points.ticket)>5||!valid||journey.ticket||!journey.buy(destination,s.world.profile))return false;
  record('高铁票 · '+s.world.profile.name+' → '+destination.name,-128);$('dialog').close();sound.play('toll');toast('购票成功：G101 → '+destination.name+'，到闸机刷票检票。');updateUI();return true;
 }
 function interact(){
  if(!active()||$('dialog').open||$('phone-dialog').open||$('city-online-dialog').open)return false;
  if(inDriver)return exitDriver();
  if(riding()&&!seated&&distance(player.g.position,points.driver)<3)return enterDriver();
  const t=task();if(t.point&&distance(player.g.position,t.point)>5)return false;
  if(t.key==='security'){journey.security();player.g.position.set(0,0,13);sound.play('toll');toast('安检通过！到左侧售票机购买车票。');}
  else if(t.key==='ticket')return ticketMenu();
  else if(t.key==='gate'){if(!journey.check())return false;player.g.position.set(2,0,-15);sound.play('toll');toast('检票通过！进入候车大厅，前方是 1 站台。');}
  else if(t.key==='platform'){if(!journey.platform())return false;autoWalk=null;refresh('platform');toast('已到 1 站台，请在黄线内等车。列车停稳后，走近 01 车厢上车。');}
  else if(t.key==='board'){if(!journey.board(trainAt(state().time))){toast('列车尚未停稳，请在安全线内等待下一班。');return false;}autoWalk=null;refresh('cabin');sound.play('flight');sound.speak('欢迎乘坐G一零一次列车，开往'+journey.ticket.destination.name+'，请注意安全。');toast('已上车！列车即将发车，可以在车厢过道里走动。');}
  else if(t.key==='exit')return leave();
  else if(t.key==='seat')return toggleSeat();
  updateUI();return true;
 }
 function next(){if(!active())return;const t=task();if(t.point&&distance(player.g.position,t.point)>4){autoWalk={...t.point};keys.clear();toast('沿指引走向'+t.label+'，WASD可接管。');return;}interact();}
 function toggleSeat(){if(!riding()||inDriver)return false;autoWalk=null;seated=!seated;if(seated){player.g.position.set(-1.5,0,11.5);api.setMotion(0,0);}else player.g.position.set(0,0,13);toast(seated?'已坐到01A座位，欣赏窗外风景。':'已起身，可以沿过道走动。');updateUI();return true;}
 function enterDriver(){
  if(!active()||!riding()||inDriver||distance(player.g.position,points.driver)>=3||$('dialog').open||$('phone-dialog').open||$('city-online-dialog').open)return false;
  const ride=railRideAt(journey.elapsed);drive??=createRailDrive({distance:ride.distance,velocity:ride.velocity,stops:createRailStops(state().world.profile.name,journey.ticket.destination.name)});
  inDriver=true;driverView='cab';seated=false;autoWalk=null;keys.clear();refresh('driver');player.g.position.set(0,0,4.4);player.g.visible=false;
  driveWorld??=views.drivingWorld(scene,journey.ticket.destination.name,drive.stops);driveWorld.g.visible=true;driveWorld.update(drive,false);
  camera.position.set(0,2.85,4.6);camera.lookAt(0,2,-25);toast('进入驾驶室！W 加速，S 刹车，空格停车。列车只能沿轨道前进。');updateUI();return true;
 }
 function goDriver(){
  if(inDriver)return exitDriver();if(!riding())return false;
  if(seated){seated=false;player.g.position.set(0,0,13);}
  if(distance(player.g.position,points.driver)>=3){autoWalk={...points.driver};keys.clear();toast('正在沿车厢过道前往驾驶室，靠近前门按 E 进入。');return true;}
  return enterDriver();
 }
 function exitDriver(){
  if(!inDriver)return false;if(drive.velocity>.05){toast('请先刹车或停车，列车停稳后再离开驾驶室。');return false;}
  drive.stop();inDriver=false;driverView='cab';keys.clear();driveWorld.g.visible=false;refresh('cabin');player.g.position.set(0,0,-14);api.setMotion(0,Math.PI);
  toast('已回到车厢，列车保持停车。再次进入驾驶室可以继续开车。');updateUI();return true;
 }
 function stopTrain(){if(!inDriver||!drive)return false;drive.stop();keys.delete('KeyW');keys.delete('ArrowUp');toast('停车制动已施加，正在减速至停车。');return true;}
 function toggleDoors(){
  if(!inDriver||!drive||$('dialog').open||$('phone-dialog').open||$('city-online-dialog').open)return false;
  if(drive.doorsOpen){if(!drive.closeDoors()){toast('乘客还在上下车，请等待上下客完成后关门。');return false;}toast('车门正在关闭，关好后可以加速前往下一站。');sound.play('toll');}
  else {if(!drive.openDoors()){toast(drive.velocity>.05?'请先停稳，再开门。':drive.doorProgress>0?'请等车门关好。':'请对准站台停车标，停车标前后18米内可以开门。');return false;}
   keys.clear();if(driverView==='cab')setDriverView();sound.speak('列车到达'+drive.service.name+'，请先下后上。');toast(drive.service.name+'开门，请等待乘客上下车。');}
  updateUI();return true;
 }
 function setDriverView(){if(!inDriver)return;driverView=driverView==='cab'?'exterior':'cab';inside.visible=driverView==='cab';driveWorld.update(drive,driverView==='exterior');api.resetView();updateUI();}
 function rideState(){return drive?{distance:drive.distance,velocity:drive.velocity,progress:drive.distance/RAIL.tripLength,label:drive.doorsOpen?(drive.service.complete?'上下客完成 · 请关门':'车门已开 · 乘客上下车'):drive.doorProgress>0?'车门关闭中':drive.parking?(drive.velocity>.05?'停车制动 · 正在减速':'已停车'):drive.velocity>.05?'手动驾驶 · 沿轨道前进':'停站 · 等待发车'}:railRideAt(journey.elapsed);}
 function validMove(from,to,r=.4){
  if(!active())return true;
  if(riding())return cabinMove(to);
  if(journey.phase==='platform'||journey.phase==='arrived')return Math.abs(to.x)<64-r&&to.z>-2.4+r&&to.z<2-r;
  if(Math.abs(to.x)>30-r||Math.abs(to.z)>35-r)return false;
  if(!journey.secured&&Math.min(from.z,to.z)<18&&Math.max(from.z,to.z)>=18)return false;
  if(!journey.checked&&Math.min(from.z,to.z)<-10&&Math.max(from.z,to.z)>=-10)return false;
  if(to.z<-16&&Math.abs(to.x)>12&&Math.abs(to.x)<25)return false;
  return true;
 }
 function move(dt){
  if(!active())return;const s=state();
  if($('dialog').open||$('phone-dialog').open||$('city-online-dialog').open)return;
  if(inDriver)return;
  const manual=['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k=>keys.has(k));
  if(manual){autoWalk=null;overview=false;}if(seated){api.animatePerson(player,false,dt);player.g.position.y=-.25;for(const leg of player.legs)leg.rotation.x=-1.4;return;}
  let heading=s.heading,f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),speed=f*WALK_SPEED;
  heading+=((keys.has('KeyA')||keys.has('ArrowLeft')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')?1:0))*dt*2.5;
  const p=player.g.position;
  if(autoWalk){const d=distance(p,autoWalk);if(d<.25){autoWalk=null;speed=0;}else{heading=Math.atan2(p.x-autoWalk.x,p.z-autoWalk.z);speed=Math.min(WALK_SPEED,d/Math.max(dt,.001));}}
  const to={x:p.x-Math.sin(heading)*speed*dt,z:p.z-Math.cos(heading)*speed*dt};
  if(validMove(p,to)){p.x=to.x;p.z=to.z;}else{autoWalk=null;speed=0;}
  p.y=0;player.g.rotation.y=heading;api.setMotion(speed,heading);api.animatePerson(player,Math.abs(speed)>.1,dt);
 }
 function arrive(){
  const destination=journey.ticket.destination;keys.clear();seated=false;inDriver=false;autoWalk=null;driveWorld?.dispose();driveWorld=null;player.g.removeFromParent();state().world.loadCity(destination);station=api.buildings.find(b=>b.id==='railwayStation');api.setInterior(station);refresh('platform');vehicle.position.x=56;vehicle.visible=true;
  sound.play('toll');sound.speak('列车到达'+destination.name+'站，请带好行李下车。');toast('已抵达'+destination.name+'！下车出站后，可以探索这座城市。');
 }
 function update(dt){
  const s=state();if(s.world.mode==='city')exterior?.update(s.time,dt,drive&&riding()?drive.pose:null);
  if(!active()){
   if(s.world.mode==='city'&&!s.interior&&!s.flight&&exterior?.crossings.some(c=>distance(player.g.position,{x:c.x,z:RAIL.trackZ})<24&&crossingAt(s.time,c.x).red)&&Math.floor(s.time*2)!==lastBell){lastBell=Math.floor(s.time*2);sound.play('crossing');}
   if(overview&&[...keys].length)overview=false;return;
  }
  if(riding()){
   if(drive){const blocked=$('dialog').open||$('phone-dialog').open||$('city-online-dialog').open;
    const controls=inDriver&&!blocked?{accelerate:keys.has('KeyW')||keys.has('ArrowUp'),brake:keys.has('KeyS')||keys.has('ArrowDown'),stop:keys.has('Space')}:{};
    drive.step(dt,controls);
    if(drive.finished){journey.phase='arrived';arrive();}else{driveWorld?.update(drive,inDriver&&driverView==='exterior',s.time,dt);driverCab?.update(drive.traction,drive.braking);if(!inDriver&&scenery){scenery.position.z=drive.distance%120;scenery.setPassengers(drive.passengers);}}
   }else if(journey.tick(dt)){arrive();}else if(scenery)scenery.position.z=(railRideAt(journey.elapsed).distance%120);
  }
  else if(journey.phase==='platform'&&vehicle){const pose=trainAt(s.time);vehicle.position.set(pose.x-10,0,8);vehicle.visible=pose.visible;views.setDoors(vehicle,pose.phase==='boarding'?1:0);}
  updateUI();
 }
 function updateUI(){
  if(!active())return;const t=task(),pose=trainAt(state().time),ride=rideState(),near=!t.point||distance(player.g.position,t.point)<5;
  document.body?.classList.add('in-railway');document.body?.classList.toggle('in-rail-driver',inDriver);$('railway-panel').hidden=false;$('railway-title').textContent=riding()?'G101 · '+journey.ticket.destination.name:station.name;
  $('railway-stage').textContent=riding()?ride.label:journey.phase==='arrived'?'已到站 · '+state().world.profile.name:t.label;
  $('railway-hint').textContent=t.hint;
  const approaches={security:'安检通道',ticket:'售票机',gate:'检票闸机',platform:'候车区',board:'车门'};
  $('railway-next').textContent=t.point&&!near?'前往'+approaches[t.key]:t.label;$('railway-next').disabled=false;
  if(journey.phase==='platform'){$('railway-hint').textContent=pose.phase==='boarding'?'列车已停稳，距发车 '+pose.seconds+' 秒 · 走近车门按 E 上车':'下一班距停稳约 '+pose.seconds+' 秒 · 请在黄色安全线内等候';$('railway-next').disabled=near&&pose.phase!=='boarding';}
  $('railway-ticket').textContent=journey.ticket?'G101 · '+journey.ticket.source.name+' → '+journey.ticket.destination.name+' · 01车 01A · '+(journey.ticket.used?'已乘车':'¥128'):'尚未购票 · 二等座 ¥128';
  $('railway-progress').value=riding()?ride.progress*100:journey.phase==='arrived'?100:journey.phase==='platform'?70:journey.phase==='waiting'?55:journey.ticket?40:journey.secured?20:0;
  for(const [id,done] of [['security',journey.secured],['ticket',!!journey.ticket],['gate',journey.checked],['wait',['platform','cabin','arrived'].includes(journey.phase)],['ride',journey.ticket?.used]])$('rail-step-'+id).classList.toggle('done',!!done);
  $('railway-view').hidden=!riding();$('railway-view').textContent=inDriver?(driverView==='cab'?'查看列车外景':'返回驾驶室视角'):seated?'起身走动':'坐到座位';$('exit').hidden=riding();$('minimap').hidden=true;
  $('railway-driver').hidden=!riding()||inDriver;$('railway-driver').textContent=distance(player.g.position,points.driver)<3?'进入驾驶室':'前往驾驶室';$('rail-driver-controls').hidden=!inDriver;
  if(riding()&&!inDriver&&!seated&&distance(player.g.position,points.driver)<3)$('railway-next').textContent='进入驾驶室';
  if(inDriver){$('railway-stage').textContent=ride.label;$('railway-next').textContent='离开驾驶室';$('railway-next').disabled=drive.velocity>.05;
   $('railway-hint').textContent='最高 '+Math.round(RAIL.maxDriveSpeed*3.6)+' km/h · W / ↑ 加速 · S / ↓ 刹车 · 空格停车 · O 开关车门。停站上下客后，关门继续。';
   $('rail-driver-speed').textContent=Math.round(drive.velocity*3.6)+' km/h';$('rail-driver-distance').textContent='距终点 '+Math.ceil(drive.remaining)+' m';
   $('rail-driver-state').textContent=drive.parking?(drive.velocity>.05?'停车制动':'驻车中'):drive.braking?'制动中':drive.traction?'牵引加速':drive.velocity>.05?'惰行':'待机';
   const next=drive.nextStation,docked=drive.station,service=drive.service,open=drive.doorsOpen,closing=drive.doorProgress>0&&!open;
   $('rail-next-stop').textContent=(docked&&drive.velocity<=.05?'本站：'+docked.name:'下一站：'+next.name);
   const ahead=(docked??next).distance-drive.distance;$('rail-stop-distance').textContent=(ahead>=0?'距停车标 ':'越过停车标 ')+Math.ceil(Math.abs(ahead))+' m';
   $('rail-route-stops').textContent=drive.stops.filter(s=>s.index>0).map(s=>(drive.served.has(s.id)?'✓ ':drive.distance>s.distance+18?'通过 ':'')+s.name).join(' → ');
   $('rail-driver-doors').textContent=open?(service.complete?'关门 · 继续前往下一站':'乘客上下车中…'):closing?'车门关闭中…':'开门 · 乘客上下车';
   $('rail-driver-doors').disabled=open?!service.complete:closing||!docked||drive.velocity>.05;$('rail-driver-accelerate').disabled=open||closing;
   $('rail-passengers').textContent='车内乘客 '+drive.passengers+' / '+drive.capacity+' 人';
   $('rail-service-state').textContent=service&&docked?.id===service.stationId?(service.complete?'上下客完成：':'正在上下客：')+'下车 '+service.alighted+'/'+service.alight+' 人 · 上车 '+service.boarded+'/'+service.board+' 人':docked&&drive.velocity<=.05?'停靠完成后，开门让乘客上下车；关门后发车。':'提前刹车，对准停车标停稳后开门。';
  }
 }
 function updateNear(){
  if(inDriver){$('interact').disabled=drive.velocity>.05;$('prompt').textContent='W 加速 · S 刹车 · 空格停车 · O 开关车门'+(drive.velocity<=.05?' · E 离开驾驶室':'');$('mode').textContent='驾驶高铁 · 固定轨道';$('location').textContent='G101 驾驶室 → '+journey.ticket.destination.name;$('coordinates').textContent='距终点 '+Math.ceil(drive.remaining)+' m';$('coordinates').hidden=false;$('speed').textContent=Math.round(drive.velocity*3.6)+' km/h';$('speed-limit').textContent='轨道限速 '+Math.round(RAIL.maxDriveSpeed*3.6)+' km/h';$('car-toggle').hidden=true;$('driving-controls').hidden=true;$('work-stop').hidden=true;return;}
  const t=task(),near=!t.point||distance(player.g.position,t.point)<5;
  const atDriver=riding()&&!seated&&distance(player.g.position,points.driver)<3;
  $('interact').disabled=!near||(t.key==='board'&&trainAt(state().time).phase!=='boarding');$('prompt').textContent=atDriver?'E · 进入驾驶室':(near?'E · '+t.label:t.hint);
  $('mode').textContent=riding()?'乘坐高铁 · '+(seated?'座位':'车厢漫步'):journey.phase==='platform'?'站台候车':'步行 · 高铁站';$('location').textContent=riding()?'G101 → '+journey.ticket.destination.name:station.name;
  $('coordinates').textContent=riding()?'01车厢 · 二等座':journey.phase==='platform'?'1 站台 · 黄色安全线内':'站内 · '+t.label;$('coordinates').hidden=false;$('speed').textContent=riding()?Math.round(rideState().velocity*3.6)+' km/h':'步行';$('speed-limit').textContent='中国铁路 · G101';$('car-toggle').hidden=true;$('driving-controls').hidden=true;$('work-stop').hidden=true;
 }
 function closeOverview(){overview=false;document.body?.classList.remove('railway-overview');camera.fov=52;camera.updateProjectionMatrix();$('minimap').hidden=false;}
 function updateOverview(){$('interact').disabled=false;$('car-toggle').hidden=true;$('prompt').textContent='车站全景 · E 返回探索 · 方向键走动';}
 function updateCamera(dt){
  document.body?.classList.toggle('railway-overview',overview);
  const fov=overview?Math.max(52,THREE.MathUtils.radToDeg(2*Math.atan(148/(252*camera.aspect)))):52;if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix();}
  if(overview&&!active()){camera.position.lerp(new THREE.Vector3(10,32,78),1-Math.exp(-4*dt));camera.lookAt(10,14,204);return true;}
  if(!active())return false;const s=state(),p=player.g.position,angle=s.heading+s.orbit,dist=riding()?5:journey.phase==='hall'||journey.phase==='waiting'?10:12;
  if(inDriver){
   if(driverView==='cab'){camera.position.set(0,2.85,4.6);camera.lookAt(Math.sin(THREE.MathUtils.clamp(s.orbit,-.7,.7))*28,2,-25);camera.rotateX(THREE.MathUtils.clamp(s.pitch,-.3,.5));}
   else {const a=s.orbit;camera.position.set(52*Math.cos(a),26,-22+52*Math.sin(a));camera.lookAt(0,2,30);}
   return true;
  }
  const target=new THREE.Vector3(p.x+Math.sin(angle)*dist,p.y+(riding()?3.2:7),p.z+Math.cos(angle)*dist);
  if(riding()){target.x=THREE.MathUtils.clamp(target.x,-2.6,2.6);target.z=THREE.MathUtils.clamp(target.z,-16.4,16.4);}else if(journey.phase==='hall'||journey.phase==='waiting'){target.x=THREE.MathUtils.clamp(target.x,-29,29);target.z=THREE.MathUtils.clamp(target.z,-34,45);}
  if(journey.phase==='hall'||journey.phase==='waiting'){
   cameraOrigin.set(p.x,p.y+1.5,p.z);cameraDirection.copy(target).sub(cameraOrigin);const length=cameraDirection.length();cameraDirection.normalize();cameraRay.set(cameraOrigin,cameraDirection);cameraRay.far=length;inside.updateMatrixWorld(true);
   const obstruction=cameraRay.intersectObjects(inside.children,true).find(hit=>{for(let o=hit.object;o;o=o.parent)if(o===player.g)return false;return true;});
   if(obstruction){target.copy(cameraOrigin).addScaledVector(cameraDirection,Math.max(.8,obstruction.distance-.4));camera.position.copy(target);}
  }
  camera.position.lerp(target,1-Math.exp(-7*dt));
  if(riding())camera.lookAt(p.x-Math.sin(angle)*4,p.y+1.7,p.z-Math.cos(angle)*4);else camera.lookAt(p.x,p.y+1.3,p.z);
  camera.rotateX(s.pitch);return true;
 }
 function menu(){
  const s=state();if(active()){updateUI();toast(task().hint);return;}
  if(s.flight||s.driving||s.taxi||s.activity||s.justice.phase!=='free'||s.interior||s.world.mode!=='city'){toast('请先回到城市街道，结束当前行程，再前往高铁站。');return;}
  dialog('高铁站 · '+s.world.profile.name,'城市南侧的大型车站：双钟楼、站前广场、候车大厅与站台。按顺序安检、购票、刷闸机，再等车上车。');
  row('前往站前广场','南187m · 车站正门 · 可以步行进入',()=>{if(!exterior)return;api.setInterior(null);keys.clear();player.g.position.set(10,0,181);api.setMotion(0,Math.PI);$('dialog').close();overview=false;toast('到达高铁站正门，向前走几步按 E 进站。');},'前往车站');
  row('双钟楼 · 车站全景','参考北京站的屋檐、钟楼与玻璃立面',()=>{keys.clear();player.g.position.set(10,0,181);api.setMotion(0,Math.PI);overview=true;$('dialog').close();},'查看外观');
  row('铁路平交道口','站台后方轨道与马路相交；双红灯闪烁、栏杆落下时请停车等候。',()=>{const c=exterior?.crossings.at(-1);if(!c)return;keys.clear();player.g.position.set(c.x,0,211);api.setMotion(0,Math.PI);api.resetView();overview=false;$('dialog').close();toast('到达铁路道口，双红灯闪烁时在栏杆前等候。');},'前往道口');
 }
 $('railway-toggle').onclick=menu;$('railway-next').onclick=()=>inDriver?exitDriver():next();$('railway-view').onclick=()=>{if(inDriver)setDriverView();else toggleSeat();};$('railway-driver').onclick=goDriver;$('rail-driver-stop').onclick=stopTrain;$('rail-driver-doors').onclick=toggleDoors;
 for(const [id,code] of [['rail-driver-accelerate','KeyW'],['rail-driver-brake','KeyS']]){const button=$(id);button.onpointerdown=e=>{if(!inDriver)return;e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(code);button.classList.add('active');};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{keys.delete(code);button.classList.remove('active');});}
 return {buildWorld,clearWorld,enter,leave,interact,move,validMove,update,updateNear,updateOverview,closeOverview,updateCamera,menu,next,buy,enterDriver,exitDriver,goDriver,stopTrain,toggleDoors,setDriverView,get drive(){return drive},get inDriver(){return inDriver},get driveWorld(){return driveWorld},get overview(){return overview},get active(){return active()},get riding(){return riding()},get journey(){return journey},get exterior(){return exterior},blocks:(from,to,r=1.4)=>state().world.mode==='city'&&crossingBlocks(from,to,r,exterior?.crossings??[],state().time,drive&&riding()?drive.pose:null)};
}
