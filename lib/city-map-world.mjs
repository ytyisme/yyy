import {chinaCities} from './city-cities.mjs';
import {createCityMap,waterAt,mapTerrain,mapRoadAt,mapSurface,departureRoute,entryRoute,highwayTrip,crossingGarage,streetRoute,nearestStreet,cityRamps} from './city-map.mjs';
import {batchCityChunk} from './city-batch.mjs';
import {CITY_LAYOUT_SCALE as S,CITY_RADIUS_METRES as R,CITY_HIGHWAY_AXIS as H,CITY_PORTAL,CITY_CROSSINGS} from './city-scale.mjs';
import {cityDistanceText,highwayWindow} from './city-distance.mjs';
import {applyPlaceNames} from './city-places.mjs';

export function createIndependentWorld(api){
 const {THREE,city,box,sign,sphere,car,person,buildings,solids,people,traffic,parked,lights,record,countries,buildingName}=api;
 let country=0,profile=createCityMap(chinaCities[0]),root=null,mode='city',trip=null,destination=chinaCities[1],selectedRoute=null;
 const highwayChunks=[];let placesStatus='';
 const tolls=[],wheels=[],waterMeshes=[],destinationSigns=[];
 const region=()=>({...profile,country:countries[country].name});
 function ownMaterial(color){const m=new THREE.MeshStandardMaterial({color,roughness:.9});m.userData.cityOwned=true;return m;}
 function clear(){
  api.clearGarage?.();
  api.clearRail?.();
  highwayChunks.length=0;
  const keep=api.getVehicle?.();if(keep&&keep.g.parent!==city)city.attach(keep.g);
  if(root){root.removeFromParent();root.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}else if(o.material?.userData?.cityOwned)o.material.dispose();});}
  for(const list of [buildings,solids,people,traffic,parked,lights,tolls,wheels,waterMeshes,destinationSigns])list.length=0;
  if(keep)parked.push(keep);
  root=new THREE.Group();city.add(root);
 }
 function segment(parent,a,b,width=12,color=0x647279,marks=true){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.hypot(dx,dy,dz);if(length<.01)return;
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(dx,dy,dz).normalize());
  const mesh=box(parent,(a.x+b.x)/2,(a.y+b.y)/2-.12,(a.z+b.z)/2,width,.24,length,color,false);mesh.quaternion.copy(q);
  if(marks&&length>5){const mark=box(parent,(a.x+b.x)/2,(a.y+b.y)/2+.025,(a.z+b.z)/2,.14,.03,Math.min(5,length*.45),0xf3ead2,false);mark.quaternion.copy(q);}
 }
 function board(text,x,y,z,width=14){box(root,x,y/2,z,.22,y,.22,0x7c9396);return sign(root,text,x,y,z,width,'#245a51','#fff7de');}
 function groundMesh(){
  const positions=[],colors=[],palette=new THREE.Color(profile.ground);
  for(let outerX=-R;outerX<R;outerX+=40)for(let outerZ=-R;outerZ<R;outerZ+=40){
  const step=outerX>=-80&&outerX<=80&&outerZ>=-40&&outerZ<=120?10:40;
  for(let x=outerX;x<outerX+40;x+=step)for(let z=outerZ;z<outerZ+40;z+=step){
   const cx=x+step/2,cz=z+step/2;if(waterAt(profile,cx,cz)||((cx>=12&&cx<=28&&cz>=46&&cz<70)||(cx>=0&&cx<=48&&cz>=70&&cz<=100)))continue;
   for(const [dx,dz] of [[0,0],[0,step],[step,0],[step,0],[0,step],[step,step]]){
    const y=Math.max(0,mapTerrain(profile,x+dx,z+dz));positions.push(x+dx,y-.13,z+dz);
    const shade=1-Math.min(.18,y*.006);colors.push(palette.r*shade,palette.g*shade,palette.b*shade);
   }
  }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});material.userData.cityOwned=true;
  const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;root.add(mesh);
  for(let z=-R;z<R;z+=24){const x=profile.river.x+Math.sin((z+12)/(75*S)+profile.river.phase)*profile.river.bend;const m=box(root,x,.0,z+12,profile.river.width+3,.12,25,0x54aabb,false);waterMeshes.push(m);}
  const lake=new THREE.Mesh(new THREE.CircleGeometry(1,32),ownMaterial(0x428fab));lake.rotation.x=-Math.PI/2;lake.scale.set(profile.lake.rx,profile.lake.rz,1);lake.position.set(profile.lake.x,.02,profile.lake.z);root.add(lake);
  if(profile.coast){box(root,0,.0,(profile.coast.z-R)/2,R*2,.1,R+profile.coast.z,0x459ebc,false);box(root,0,.08,profile.coast.z+8,R*2,.15,16,0xe5d4a9,false);}
 }
 function streets(){
  for(const street of profile.roads){
   const length=Math.hypot(street.b.x-street.a.x,street.b.z-street.a.z),n=Math.ceil(length/10);
   for(let i=0;i<n;i++){
    const point=t=>{const x=street.a.x+(street.b.x-street.a.x)*t,z=street.a.z+(street.b.z-street.a.z)*t;return {x,z,y:mapSurface(profile,x,z)};};
   const a=point(i/n),b=point((i+1)/n);if(crossingGarage(a,b))continue;
   if((a.z+b.z)/2>191&&(a.z+b.z)/2<216&&Math.abs((a.x+b.x)/2-10)<65)continue;
   segment(root,a,b,street.width);
   }
  }
  // The entrance roads join the two highway ramps in every independent map.
  for(const [a,b] of [[{x:176*S,z:132*S,y:0},{x:176*S,z:176*S,y:0}],[{x:132*S,z:132*S,y:0},{x:132*S,z:176*S,y:0}]])segment(root,a,b,12);
  for(const x of CITY_CROSSINGS)for(const z of CITY_CROSSINGS)for(const side of [-1,1]){
   const g=new THREE.Group();g.position.set(x+side*7.5,0,z+side*7.5);root.add(g);
   box(g,0,2.2,0,.18,4.4,.18,0x607369);box(g,0,4.5,0,.6,1.5,.5,0x293a3b);
   const red=sphere(g,0,4.95,-.3,.17,0xff4437),green=sphere(g,0,4.05,-.3,.17,0x334c3b),countdown=sign(g,'10',0,5.95,-.31,1.7,'#203634','#6de6a5');
   lights.push({red,green,countdown,axis:side>0?'NS':'EW',lastText:''});
  }
 }
 function makeBuilding(b){
  b={...b,name:buildingName(b,profile.index,0,country),items:b.items.map(i=>[...i]),chunk:profile.key,region:profile.name};
  const y=mapTerrain(profile,b.x,b.z),w=b.w??22,d=b.d??20,front=b.front??1;
  box(root,b.x,y+b.height/2,b.z,w,b.height,d,b.color);solids.push({x:b.x,z:b.z,w,d,minY:y,maxY:y+b.height});
  if(b.style===1){box(root,b.x,y+b.height+.3,b.z,w+.8,.6,d+.8,b.roof);for(const dx of [-w*.32,w*.32])box(root,b.x+dx,y+b.height/2,b.z+d/2+.08,w*.22,b.height-3,.12,0x7295a8,false);}
  else if(b.style===2){box(root,b.x,y+b.height+.45,b.z,w+1,.9,d+1,b.roof);box(root,b.x,y+b.height+1.3,b.z,w*.65,1.5,d*.7,b.color);}
  else if(b.style===3){for(const dx of [-w*.38,w*.38])box(root,b.x+dx,y+b.height*.3,b.z,w*.23,b.height*.6,d+1,b.color);box(root,b.x,y+b.height+.5,b.z,w+1,1,d+1,b.roof);}
  else {const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.74,3,4),ownMaterial(b.roof));roof.rotation.y=Math.PI/4;roof.position.set(b.x,y+b.height+1.5,b.z);root.add(roof);}
  for(let h=4;h<b.height-2;h+=4.5)for(let dx=-w/2+4;dx<w/2-2;dx+=4.5)box(root,b.x+dx,y+h,b.z+d/2+.07,2.2,1.8,.1,0x7296a3,false);
  box(root,b.x,y+1.7,b.z+front*(d/2+.1),3.2,3.4,.17,0x355b63);box(root,b.x,y+3.7,b.z+front*(d/2+.7),6,.3,2,0xfff0d0);
  b.nameSign=sign(root,b.name,b.x,y+5.8,b.z+front*(d/2+.25),Math.min(16,w));b.nameSign.rotation.y=front<0?Math.PI:0;b.door={x:b.x,y:mapSurface(profile,b.x,b.z+front*(d/2+2)),z:b.z+front*(d/2+2)};buildings.push(b);
  const npc=person(root,b.door.x+5,b.door.z,0x77918d,b.role,b.door.y);npc.building=b;people.push(npc);
  if(b.id==='residence')for(const side of [-1,1]){const resident=person(root,b.door.x+side*8,b.door.z+1,side<0?0xb093ad:0x78a294,'小区住户',mapSurface(profile,b.door.x+side*8,b.door.z+1));resident.resident=true;resident.home=b.name;resident.homeSlot=b.placeSlot;people.push(resident);}
  if(b.id==='amusement'){
   const wheel=new THREE.Group();wheel.position.set(b.x+8,y+9,b.z-3);wheel.userData.cityDynamic=true;root.add(wheel);
   wheel.add(new THREE.Mesh(new THREE.TorusGeometry(8,.22,4,24),ownMaterial(0x799eae)));
   for(let i=0;i<8;i++){const a=i*Math.PI/4;box(wheel,Math.sin(a)*4,Math.cos(a)*4,0,.15,8,.15,0xe3aa67).rotation.z=-a;const cabin=box(wheel,Math.sin(a)*8,Math.cos(a)*8,0,2,1.8,1.5,[0xd6a786,0x96bdb4,0xc6abc2][i%3]);cabin.userData.cityDynamic=true;}
   wheels.push(wheel);
  }
 }
 function highwayExits(){
  for(const [a,b] of [[{x:H,y:8,z:-R},{x:H,y:8,z:R}],[{x:-R,y:8,z:H},{x:R,y:8,z:H}]]){
   for(let i=0;i<40;i++)segment(root,{x:a.x+(b.x-a.x)*i/40,y:8,z:a.z+(b.z-a.z)*i/40},{x:a.x+(b.x-a.x)*(i+1)/40,y:8,z:a.z+(b.z-a.z)*(i+1)/40},20,0x586975);
  }
  for(const [i,points] of cityRamps().entries()){
   for(let j=1;j<points.length;j++)segment(root,points[j-1],points[j],16,0x687778);
   const t=i?{x:132*S,z:192*S,axis:'NS'}:{x:192*S,z:132*S,axis:'EW'};
   box(root,t.x,5.8,t.z,i?17:5,.5,i?5:17,0x6e9988);board('收费站 · ¥60',t.x+(i?10:0),5,t.z+(i?0:10),13);
   const arm=box(root,t.x,1.35,t.z,i?11:.2,.16,i?.2:11,0xf3b568);arm.userData.cityDynamic=true;
   tolls.push({...t,arm,openUntil:0,last:-20,raised:0});
  }
  for(const [x,z] of [[H+14,-180*S],[-180*S,H+14],[H+14,265*S],[265*S,H+14]])destinationSigns.push(board('跨城高速\n前往 '+destination.name,x,18,z,22));
  for(const n of [-220,-100,120,275]){board('限速120',H+14,13,n*S,6);board('限速120',n*S,13,H+14,6);}
  box(root,-190*S,15.2,H,60,1,24,0x8d9787);
  for(const side of [-1,1]){box(root,-190*S,11.6,H+side*11.2,60,7.2,1.2,0x8d9787);solids.push({x:-190*S,z:H+side*11.2,w:60,d:1.2,minY:8,maxY:15.2});}
 }
 function greenery(){
  const p=profile.park,y=mapTerrain(profile,p.x,p.z);box(root,p.x,y+.1,p.z,27,.2,24,0x86aa80,false);box(root,p.x,y+.23,p.z,25,.15,3,0xd7cbb3,false);sign(root,profile.name+' · '+profile.terrainName,p.x,y+4,p.z+12,21,'#e9f0d3','#386653');
  for(let i=0;i<100;i++){
   const x=(-275+((profile.seed+i*157)%545))*S,z=(-270+((profile.seed+i*89)%535))*S;
   if(waterAt(profile,x,z)||mapRoadAt(profile,{x,z}).type!=='terrain'||buildings.some(b=>Math.abs(x-b.x)<b.w/2+5&&Math.abs(z-b.z)<b.d/2+5)||crossingGarage({x,z},{x,z}))continue;
   const y=mapTerrain(profile,x,z);box(root,x,y+1.4,z,.4,2.8,.4,0x937550);sphere(root,x,y+4,z,2+(i%3)*.3,0x628b63);
  }
 }
 function vehicles(){
  const prefix=10000+profile.index*100+country*100000;
  for(const [i,[x,z]] of [[5,91],[35,91],[41,91],[9,17],[-10,15]].entries()){
   const plate='城A·'+(prefix+i+1);if(parked.some(c=>c.plate===plate))continue;
   const c=car(root,x,z,[0x8896ae,0x8896ae,0x8896ae,0xe5ad52,0x8ab7b6][i],i>=3?Math.PI:0,false,plate);c.g.position.y=mapSurface(profile,x,z);c.chunk=profile.key;parked.push(c);
  }
  const routes=profile.roads.filter(r=>(r.axis==='NS'&&Math.abs(r.a.x)>70)||(r.axis==='EW'&&Math.abs(r.a.z)>110));
  for(let i=0;i<8;i++){
   const road=routes[i%routes.length],out=[];for(let j=0;j<=40;j++){const x=road.a.x+(road.b.x-road.a.x)*j/40,z=road.a.z+(road.b.z-road.a.z)*j/40;out.push({x,z,y:mapSurface(profile,x,z)});}
   const route=[...out,...out.slice(1,-1).reverse()];
   const c=car(root,route[0].x,route[0].z,[0xd77864,0x89bcb7,0xd7c67e,0xa5a1c6][i%4],Math.PI,true,'城N·'+profile.index+'-'+i);c.route=route;c.routeIndex=1;c.speed=8;c.chunk=profile.key;traffic.push(c);
  }
 }
 function load(entry){
  profile=createCityMap(entry,country);if(country!==0)profile.ground=countries[country].ground;mode='city';trip=null;selectedRoute=null;destination=country===0?chinaCities[(profile.index+1)%chinaCities.length]:{index:(profile.index+1)%4,name:countries[country].cities[(profile.index+1)%4]};
  if(api.places?.peek(profile))applyPlaceNames(profile.buildings,profile,api.places.peek(profile));
  clear();groundMesh();streets();profile.buildings.forEach(makeBuilding);highwayExits();greenery();vehicles();api.buildGarage?.(root,profile);api.buildRail?.(root,profile);
  placesStatus=country===0?`本市真实地名 ${buildings.filter(b=>b.realPlace).length}/${buildings.filter(b=>b.placeSlot).length}`:'当前为虚构城市';
  if(country===0&&api.places)refreshPlaces();
  batchCityChunk(THREE,root);api.freezeStatic?.(root);return region();
 }
 async function refreshPlaces(refresh=false){
  if(country!==0||mode!=='city'||!api.places)return false;
  const current=profile,view=root;
  placesStatus=api.places.peek(profile)?placesStatus:'正在查询本市真实地名…';
  try{
   const catalog=await api.places.get(current,{refresh});
   if(profile!==current||root!==view||mode!=='city')return false;
   applyPlaceNames(profile.buildings,profile,catalog);applyPlaceNames(buildings,profile,catalog);
   for(const b of buildings){
    if(!b.placeSlot)continue;
    const canvas=b.nameSign.material.map.image,c=canvas.getContext('2d');
    c.fillStyle='#fff9e6';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#305a4b';c.textAlign='center';c.textBaseline='middle';c.font='bold 44px sans-serif';
    c.fillText(b.name,canvas.width/2,canvas.height/2,canvas.width-20);b.nameSign.material.map.needsUpdate=true;
   }
   for(const p of people)if(p.homeSlot)p.home=buildings.find(b=>b.placeSlot===p.homeSlot)?.name??p.home;
   placesStatus=`本市真实地名 ${buildings.filter(b=>b.realPlace).length}/${buildings.filter(b=>b.placeSlot).length}`;
   api.onPlaceNames?.();return true;
  }catch(error){if(profile===current&&root===view)placesStatus='地点查询暂不可用 · 可重试';return false;}
 }
 function selectDestination(entry,route=null){
  if(mode!=='city'||!entry||entry.index===profile.index)return false;
  if(country===0&&(chinaCities[entry.index]?.name!==entry.name))return false;
  destination=entry;
  selectedRoute=route;
  for(const label of destinationSigns){const c=label.material.map.image.getContext('2d'),canvas=label.material.map.image;c.fillStyle='#245a51';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#fff7de';c.textAlign='center';c.textBaseline='middle';c.font='bold 30px sans-serif';c.fillText('跨城高速',canvas.width/2,canvas.height*.3);c.fillText('前往 '+entry.name,canvas.width/2,canvas.height*.73,canvas.width-20);label.material.map.needsUpdate=true;}
  return true;
 }
 function beginHighway(){
  if(mode!=='city')return null;trip=highwayTrip(profile,destination,selectedRoute);mode='highway';clear();
  for(let i=0;i<13;i++){
   const group=new THREE.Group();group.userData.cityDynamic=true;root.add(group);
   box(group,0,-.2,45,440,.4,90,profile.ground,false);box(group,0,7.88,45,20,.24,90,0x586975,false);
   for(const side of [-1,1]){box(group,side*10.2,8.7,45,.3,1.4,90,0xbac8c9,false);const hill=new THREE.Mesh(new THREE.ConeGeometry(25+i%5*9,18+i%4*8,10),ownMaterial(profile.ground));hill.position.set(side*(65+i%3*30),4,45);group.add(hill);}
   for(let z=8;z<90;z+=15)box(group,0,8.025,z,.14,.03,5,0xf3ead2,false);
   const label=sign(group,'',16,18,45,26,'#245a51','#fff7de');box(group,16,9,45,.22,18,.22,0x7c9396);batchCityChunk(THREE,group);highwayChunks.push({group,label,index:null});
  }
  updateHighwayChunks(0);
  board(destination.name+'出口\n前方切换城市地图',16,18,trip.length-100,25);
  batchCityChunk(THREE,root);api.freezeStatic?.(root);return {x:0,y:8,z:0,heading:Math.PI};
 }
 function updateHighwayChunks(z){if(mode!=='highway')return;for(const [i,part] of highwayWindow(z,trip.length).entries()){const chunk=highwayChunks[i];chunk.group.position.z=part.z;chunk.group.visible=part.visible;if(chunk.index===part.index)continue;chunk.index=part.index;const canvas=chunk.label.material.map.image,c=canvas.getContext('2d');c.fillStyle='#245a51';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#fff7de';c.textAlign='center';c.textBaseline='middle';c.font='bold 27px sans-serif';c.fillText(destination.name,canvas.width/2,canvas.height*.3,canvas.width-20);c.fillText('距出口 '+cityDistanceText(Math.max(0,trip.length-part.z-45)),canvas.width/2,canvas.height*.73,canvas.width-20);chunk.label.material.map.needsUpdate=true;}}
 function departureAt(p,driving){return mode==='city'&&driving&&p.y>6&&((Math.abs(p.x-H)<9&&Math.abs(p.z)>=CITY_PORTAL)||(Math.abs(p.z-H)<9&&Math.abs(p.x)>=CITY_PORTAL));}
 function arrivalAt(p,driving){
  if(mode!=='highway'||!driving)return null;
  if(p.z>=trip.length-1){const entry=trip.destination;load(entry);return {entry,pose:{x:H,y:8,z:0,heading:Math.PI},route:entryRoute()};}
  if(p.z<=-12){const entry=trip.source,selected=trip.destination,route=trip.roadRoute;load(entry);selectDestination(selected,route);return {entry,pose:{x:H,y:8,z:-270*S,heading:Math.PI},route:null};}
  return null;
 }
 function roadAt(p){return mode==='city'?mapRoadAt(profile,p):{type:'highway',height:Math.abs(p.x)<=10?8:0,limit:120};}
 function surfaceHeight(x,z){return mode==='city'?mapSurface(profile,x,z):Math.abs(x)<=10?8:0;}
 function blocked(from,to,r){
  if(mode==='highway')return Math.abs(to.x)>10-r||to.z<-20||to.z>trip.length+20;
  if(Math.abs(to.x)>R-r||Math.abs(to.z)>R-r)return true;
  if(r<1&&departureAt({...to,y:surfaceHeight(to.x,to.z)},true))return true;
  const road=roadAt(to),water=waterAt(profile,to.x,to.z);if(water&&road.type!=='street'&&road.type!=='highway'&&road.type!=='ramp')return true;
  return tolls.some(t=>!t.raised&&(t.axis==='EW'?Math.abs(to.x-t.x)<r+.3&&Math.abs(to.z-t.z)<8+r:Math.abs(to.z-t.z)<r+.3&&Math.abs(to.x-t.x)<8+r));
 }
 function updateTolls(p,driving,time){for(const t of tolls){const along=t.axis==='EW'?Math.abs(p.x-t.x):Math.abs(p.z-t.z),across=t.axis==='EW'?Math.abs(p.z-t.z):Math.abs(p.x-t.x);if(driving&&across<8&&along<22&&time-t.last>10&&record('高速收费站 · 通行费',-60)!==false){t.last=time;t.openUntil=time+10;}t.raised=time<t.openUntil?1:0;t.arm.position.y=1.35+t.raised*5;}}
 function updateWater(time){for(const wheel of wheels){wheel.rotation.z=time*.13;for(const c of wheel.children)if(c.userData.cityDynamic)c.rotation.z=-wheel.rotation.z;}}
 load(chinaCities[0]);
 return {ensure:p=>{if(mode==='highway')updateHighwayChunks(p?.z??0);return region();},loadCity:entry=>load(entry),fly(index){country=index;return load(country===0?chinaCities[0]:{index:0,name:countries[country].cities[0]});},roadAt,surfaceHeight,blocked,updateTolls,updateWater,selectDestination,departureAt,beginHighway,arrivalAt,departureRoute:p=>departureRoute(profile,p),tunnelAt:p=>mode==='city'&&p.x>-190*S-30&&p.x<-190*S+30&&Math.abs(p.z-H)<11,
  refreshPlaces,streetRoute:(from,to)=>streetRoute(profile,from,to),nearestStreet:p=>nearestStreet(profile,p),cancelHighway(){if(mode!=='highway')return false;const source=trip.source,selected=trip.destination,route=trip.roadRoute;load(source);selectDestination(selected,route);return true;},get placesStatus(){return placesStatus},get profile(){return profile},get region(){return region()},get country(){return country},get chunkCount(){return 1},get waveCount(){return waterMeshes.length},get mode(){return mode},get trip(){return trip},get destination(){return destination},get plannedRoute(){return selectedRoute},get highwayChunks(){return highwayChunks},get root(){return root}};
}
