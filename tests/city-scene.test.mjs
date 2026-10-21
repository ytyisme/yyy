import {playerSkins} from '../lib/player-skins.mjs';
import {attachPlayerSkin} from '../lib/skin-visuals.mjs';
import {skinById} from '../lib/skin-shop.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as Three from '../lib/three.module.js';import * as rules from '../lib/city-rules.mjs';import * as worldRules from '../lib/city-world.mjs';import * as flightRules from '../lib/city-flight.mjs';import * as roads from '../lib/city-roads.mjs';import * as life from '../lib/city-life.mjs';import {createCityPhone} from '../lib/city-phone.mjs';import {createCitySound} from '../lib/city-sound.mjs';import * as cityNames from '../lib/city-cities.mjs';import {createHousing} from '../lib/city-housing.mjs';import * as garageRules from '../lib/city-garage.mjs';import {createCityPeerViews} from '../lib/city-peer-views.mjs';import {createCityRailGame} from '../lib/city-rail-game.mjs';
function cityHarness(skinOptions={}){
 class Element{constructor(){this.style={};this.dataset={};this.listeners={};this.children=[];this.open=false;this.classList={toggle(){},add(){},remove(){}};}addEventListener(k,f){this.listeners[k]=f;}append(...c){this.children.push(...c);}replaceChildren(){this.children=[];}getContext(){return {fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};}showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}setPointerCapture(){}setAttribute(){}focus(){}}
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 class Renderer{constructor(){this.shadowMap={};this.domElement=new Element();}setPixelRatio(){}setSize(){}render(){}}
 const context=vm.createContext({THREE:{...Three,WebGLRenderer:Renderer},playerSkins,attachPlayerSkin:(root,options)=>attachPlayerSkin(root,{...options,...skinOptions}),...rules,...worldRules,...flightRules,...roads,...life,...cityNames,...garageRules,createHousing,createCityPeerViews:options=>createCityPeerViews({...options,skinOptions,document:context.document}),setupCityOnline:options=>({id:'local-player',online:false,members:new Map(),isVehicleTaken:()=>false,...options}),createCityPhone:options=>createCityPhone({...options,document:context.document}),baseBuildings:rules.buildings,createCityRailGame,createCitySound,innerWidth:1024,innerHeight:768,devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},document:{getElementById:el,createElement:()=>new Element(),querySelectorAll:()=>[],addEventListener(){},hidden:false},window:{addEventListener(){}},console});
 const code=fs.readFileSync(new URL('../season2-lv15.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInContext(code+'\nglobalThis.harness={rail,updateTraffic,scene,cityOnline,cityPeerViews,cityPose,assembleCityPeer,wallet,housing,garageAccess,garageScene,updateGarage,garageServiceDialog,registerGarage,updateNear,interact,takeElevator,updateElevator,buyHome,startNavigation,updateNavigation,record,stopWork,phoneUI,bankDialog,surfaceHeight,traffic,enter,leave,toggleCar,perform,frame,addCrime,justice,requestTaxi,verifyTaxi,confirmTaxi,updateTaxi,validMove,world,updateCityTravel,sleepHotel,bookFlight,updateFlight,setFlightView,startLanding,updatePlayer,updateCarEffects,toggleSignal,eatInventory,updateEating,meal,moon,updateDayNight,player,city,inside,parked,keys,ledger,inventory,buildings,get state(){return {interior,driving,activity,time,dayMinutes,taxi,flight,hotelKey,health,interiorFloor,elevatorTrip,navigation};}};',context);
 return {h:context.harness,el};
}
test('3D scene builds and car entry/exit keeps the player outdoors',()=>{const {h}=cityHarness();assert(h.world.root.children.length>30);assert.equal(h.world.chunkCount,1);h.toggleCar();assert.equal(h.state.driving,true);h.toggleCar();assert.equal(h.state.driving,false);assert.equal(h.player.g.visible,true);});
test('an equipped city skin survives interiors and car trips without showing the original body or replacing NPCs',async()=>{
 const display={subscribe(listener){listener(skinById('makima'));return ()=>{};}},textureProvider=()=>({texture:new Three.Texture(),ready:Promise.resolve(true)});
 const {h}=cityHarness({display,textureProvider}),root=h.player.g,skin=root.children.find(child=>child.userData.imageSkin);await skin.userData.ready;
 assert.equal(root.userData.playerSkinId,'makima');assert.equal(h.player.body.visible,false);assert(root.children.filter(child=>child.geometry&&child!==h.meal).every(child=>!child.visible));
 h.world.root.traverse(child=>assert.notEqual(child.userData.imageSkin,true));assert.equal(skin.children[0].matrixAutoUpdate,true);
 h.enter(h.buildings.find(b=>b.id==='market'));assert.equal(root.parent,h.inside);assert.equal(skin.parent,root);assert.equal(skin.userData.portrait.visible,true);h.leave();
 root.position.copy(h.parked.find(car=>car.plate==='城A·10004').g.position);h.toggleCar();assert.equal(root.visible,false);h.toggleCar();assert.equal(root.visible,true);assert.equal(root.userData.playerSkinId,'makima');assert.equal(h.player.body.visible,false);
});
test('a city peer uses its transmitted skin, keeps its name, and never copies the local selection',async()=>{
 const display={subscribe(listener){listener(skinById('makima'));return ()=>{};}},textureProvider=()=>({texture:new Three.Texture(),ready:Promise.resolve(true)});
 const {h}=cityHarness({display,textureProvider});await h.player.g.children.find(child=>child.userData.imageSkin).userData.ready;
 h.cityOnline.online=true;const member={id:'skin-guest',name:'朋友',pose:{...h.cityPose(),skinId:'yellow-egg'}};h.cityOnline.members.set(member.id,member);
 h.cityPeerViews.update(h.cityOnline,h.cityPose(),h.parked,null,.016);
 const peer=h.scene.children.find(child=>child.name==='city-peer-skin-guest'),avatar=peer.children.find(child=>child.userData.cityDynamic),skin=avatar.children.find(child=>child.userData.imageSkin);
 await skin.userData.ready;assert.equal(avatar.userData.playerSkinId,'yellow-egg');assert.equal(h.player.g.userData.playerSkinId,'makima');assert(peer.children.some(child=>child.isSprite&&child.visible));
 member.pose.skinId='default';h.cityPeerViews.update(h.cityOnline,h.cityPose(),h.parked,null,.016);assert.equal(avatar.userData.playerSkinId,'default');assert(!avatar.children.some(child=>child.userData.imageSkin));assert.equal(h.player.g.userData.playerSkinId,'makima');
 h.cityOnline.members.delete(member.id);h.cityPeerViews.update(h.cityOnline,h.cityPose(),h.parked,null,.016);assert.equal(peer.parent,null);
});
test('every building has an accessible interior and shopping adds a real inventory item and receipt',()=>{const {h,el}=cityHarness();for(const b of h.buildings){h.enter(b);assert.equal(h.state.interior.id,b.id);assert.equal(h.inside.visible,true);assert(h.inside.children.length>12);h.leave();assert.equal(h.state.interior,null);}const b=h.buildings.find(b=>b.id==='market');h.enter(b);h.perform(b,'牛奶',12,'item');assert.equal(h.wallet.balance,Infinity);assert.equal(h.inventory[0],'牛奶');assert.equal(h.ledger[0].amount,-12);assert.equal(el('dialog').open,false);});
test('unlimited wallet keeps wages and paid lodging receipts while phone use does not pause work',()=>{const {h}=cityHarness();assert.equal(h.wallet.balance,Infinity);const b=h.buildings.find(b=>b.id==='office');h.enter(b);h.perform(b,'工作',0,'work');h.phoneUI.open();for(let i=1;i<=251;i++)h.frame(i*40);assert.equal(h.wallet.balance,Infinity);assert.equal(h.ledger.filter(r=>r.text.includes('工资')).length,2);h.phoneUI.close();h.stopWork();h.leave();const hotel=h.buildings.find(b=>b.id==='hotel');h.enter(hotel);h.perform(hotel,'住宿',588,'stay');h.sleepHotel();for(let i=252;i<400;i++)h.frame(i*40);assert.equal(h.state.activity,null);assert.equal(h.wallet.balance,Infinity);assert(h.ledger.some(r=>r.amount===-588));});
test('a registered player and car can travel through the ramp once the gate opens',()=>{const {h}=cityHarness();h.garageAccess.register('城A·10004');h.player.g.position.set(20,-5,66);h.updateGarage(2);for(const r of [.4,1.4]){for(let z=46;z<80;z+=.2){const from={x:20,z,y:rules.terrainHeight(20,z)},to={x:20,z:z+.2};assert(h.validMove(from,to,r));}}});

test('police custody cannot be escaped and charges exactly 200000 before releasing at the court door',()=>{const {h,el}=cityHarness();h.toggleCar();assert.equal(h.state.driving,true);h.addCrime(10000000);h.frame(40);assert.equal(h.justice.phase,'escort');assert.equal(h.state.driving,false);el('recover').onclick();assert.equal(h.justice.phase,'escort');h.toggleCar();assert.equal(h.state.driving,false);for(let i=2;i<72;i++)h.frame(i*40);assert.equal(h.state.interior.id,'court');assert.equal(h.justice.phase,'court');h.leave();assert.equal(h.state.interior.id,'court');for(let i=72;i<170;i++)h.frame(i*40);const court=h.buildings.find(b=>b.id==='court');assert.equal(h.state.interior,null);assert.equal(h.justice.phase,'free');assert.equal(h.justice.progress,0);assert.equal(h.player.g.position.x,court.door.x);assert.equal(h.player.g.position.z,court.door.z+2);assert.equal(h.ledger.filter(r=>r.amount===-200000).length,1);assert.equal(el('recover').disabled,false);});

test('phone booking matches the plate, requires 123456, and carries the player to the destination',()=>{const {h}=cityHarness();const destination=h.buildings.find(b=>b.id==='restaurant');h.requestTaxi(destination);assert.equal(h.state.taxi.car.plate,'城A·T1234');for(let i=1;i<1500&&h.state.taxi.phase==='arriving';i++)h.frame(i*40);assert.equal(h.state.taxi.phase,'waiting');h.player.g.position.copy(h.state.taxi.car.g.position);h.verifyTaxi();assert.equal(h.state.taxi.phase,'verify');assert.equal(h.player.g.visible,false);assert.equal(h.confirmTaxi('000000'),false);assert.equal(h.state.taxi.phase,'verify');assert.equal(h.confirmTaxi('123456'),true);assert.equal(h.state.taxi.phase,'riding');for(let i=1500;i<5000&&h.state.taxi;i++)h.frame(i*40);assert.equal(h.state.taxi,null);assert.equal(h.player.g.visible,true);assert.equal(h.player.g.position.x,destination.door.x);assert.equal(h.player.g.position.z,destination.door.z+2);assert.equal(h.ledger.filter(r=>r.text.includes('打车到')).length,1);});

test('hotel reception and bedroom are separated until a room is booked',()=>{const {h}=cityHarness();const hotel=h.buildings.find(b=>b.id==='hotel');h.wallet.change(588);h.enter(hotel);assert.equal(h.validMove({x:262,z:2.5},{x:263.5,z:2.5},.4),false);h.perform(hotel,'入住',588,'stay');assert.equal(h.state.activity,null);assert.equal(h.validMove({x:262,z:2.5},{x:263.5,z:2.5},.4),true);assert.equal(h.validMove({x:262,z:-4},{x:263.5,z:-4},.4),false);h.sleepHotel();assert.equal(h.state.activity.kind,'stay');});
test('the current city remains independent when moving outside its coordinates',()=>{const {h}=cityHarness();const key=h.world.region.key,root=h.world.root;assert.equal(h.validMove({x:0,z:299},{x:0,z:301},.4),false);h.world.ensure({x:60000,z:120000});assert.equal(h.world.region.key,key);assert.equal(h.world.root,root);assert.equal(h.world.chunkCount,1);assert(h.buildings.every(b=>Math.abs(b.x)<250&&Math.abs(b.z)<250));});

test('toll gate charges only once per passage and the tunnel has a real location',()=>{const {h}=cityHarness();h.wallet.change(200);h.world.updateTolls({x:182,z:132},true,20);assert.equal(h.ledger.filter(r=>r.text.includes('收费站')).length,1);h.world.updateTolls({x:190,z:132},true,21);assert.equal(h.ledger.filter(r=>r.text.includes('收费站')).length,1);assert.equal(h.world.blocked({x:191,z:132},{x:192,z:132},1),false);assert.equal(h.world.tunnelAt({x:-190,z:240}),true);});
test('flight leaves the terminal, takes off, permits cabin exploration, and lands only when requested',()=>{
 const {h,el}=cityHarness();const airport=h.buildings.find(b=>b.id==='airport'&&b.chunk===h.world.region.key);h.enter(airport);
 assert.equal(h.bookFlight(-1),false);assert.equal(h.bookFlight(99),false);assert.equal(h.bookFlight(1),true);
 assert.equal(h.state.flight.stage.id,'boarding');assert.equal(h.city.visible,false);assert.equal(h.startLanding(),false);
 h.updateFlight(5);assert.equal(h.state.flight.stage.id,'pushback');assert(h.state.flight.visual.aircraft.position.z>70);
 h.updateFlight(12);assert.equal(h.state.flight.stage.id,'takeoff');const takeoff=h.state.flight.visual.aircraft.position.clone();
 h.updateFlight(7);assert.equal(h.state.flight.stage.id,'climb');assert(h.state.flight.visual.aircraft.position.y>takeoff.y);
 h.updateFlight(3);assert.equal(h.state.flight.stage.id,'cruise');assert.equal(h.state.flight.view,'cabin');assert.equal(h.inside.visible,true);
 const z=h.player.g.position.z;h.keys.add('KeyW');h.updatePlayer(.5);h.keys.clear();assert(h.player.g.position.z<z);
 h.player.g.position.set(4,0,11.5);h.updatePlayer(0);assert(h.player.g.position.x<=4.4);assert.equal(el('flight-arrive').disabled,false);
 const cruise=h.state.flight.visual.aircraft.position.z;h.updateFlight(60);assert(h.state.flight.visual.aircraft.position.z<cruise-1000);assert(h.state.flight);assert.equal(h.world.country,0);h.setFlightView('exterior');assert.equal(h.inside.visible,false);
 assert.equal(h.startLanding(),true);assert.equal(h.startLanding(),false);const landing=h.state.flight.visual.aircraft.position.z;h.updateFlight(3);assert.equal(h.state.flight.stage.id,'landing');assert(h.state.flight.visual.aircraft.position.z<landing);h.updateFlight(5);assert.equal(h.state.flight.stage.id,'taxi-in');h.updateFlight(8);assert.equal(h.state.flight.stage.id,'docking');h.updateFlight(4);assert.equal(h.state.flight.stage.id,'disembark');h.updateFlight(2);
 assert.equal(h.state.flight,null);assert.equal(h.state.interior,null);assert.equal(h.world.region.country,'日本');assert.equal(h.player.g.position.x,h.buildings.find(b=>b.id==='airport').door.x);
 assert.equal(h.player.g.visible,true);assert.equal(el('flight-panel').hidden,true);assert.equal(h.ledger.filter(r=>r.text.includes('国际机票')).length,1);
});
test('eating consumes a backpack item and turn / brake lamps respond to input',()=>{const {h}=cityHarness();h.inventory.push('面包');h.eatInventory(0);assert.equal(h.inventory.length,0);h.updateEating();assert.equal(h.meal.visible,true);for(let i=1;i<100;i++)h.frame(i*40);assert.equal(h.meal.visible,false);h.toggleCar();h.toggleSignal('left');h.updateCarEffects();const own=h.parked.find(c=>c.g.position.distanceTo(h.player.g.position)<.1)||h.parked.find(c=>c.plate==='城A·10004');assert(own);h.keys.add('Space');h.updateCarEffects();assert(own.brakeLights.every(l=>l.material.emissive.getHex()===0xff3930));});

test('the driven car and plate survive unloading the departure city, with no leftover shops or vehicles',()=>{const {h}=cityHarness();h.toggleCar();const own=h.parked.find(c=>c.plate==='城A·10004'),oldRoot=h.world.root;assert(h.world.selectDestination(cityNames.chinaCities[2]));h.world.beginHighway();assert.equal(oldRoot.parent,null);assert.equal(h.world.mode,'highway');assert.equal(h.buildings.length,0);assert.equal(h.traffic.length,0);assert.equal(h.parked.length,1);assert.equal(h.parked[0],own);assert.equal(own.g.parent,h.city);const event=h.world.arrivalAt({x:0,z:h.world.trip.length,y:8},true);assert(event);assert.equal(h.world.region.name,'上海市');assert(h.parked.includes(own));assert.equal(own.plate,'城A·10004');assert(h.buildings.every(b=>b.chunk===h.world.region.key));});


function buttonIn(root,name){if(root.textContent===name&&root.onclick)return root;for(const child of root.children??[]){const found=buttonIn(child,name);if(found)return found;}return null;}
test('phone apps order delivery with game money and put the arriving meal in the backpack',()=>{const {h,el}=cityHarness();h.enter(h.buildings.find(b=>b.id==='office'));h.phoneUI.open();buttonIn(el('phone-content'),'🛵\n美团').onclick();buttonIn(el('phone-content'),'牛肉饭 · ¥38').onclick();assert.equal(h.wallet.balance,Infinity);assert.equal(h.phoneUI.order.name,'牛肉饭');for(let i=1;i<=376;i++)h.frame(i*40);assert.equal(h.phoneUI.order,null);assert(h.inventory.includes('牛肉饭'));assert.equal(h.ledger.filter(r=>r.text==='美团外卖 · 牛肉饭').length,1);});
test('hospital therapy charges real game funds and restores health',()=>{const {h}=cityHarness();h.record('车辆碰撞建筑',-800);assert.equal(h.state.health,80);const hospital=h.buildings.find(b=>b.id==='hospital');h.enter(hospital);h.perform(hospital,'治疗',100,'heal');assert.equal(h.state.health,100);assert.equal(h.wallet.balance,Infinity);assert.equal(h.ledger.filter(r=>r.text==='医院治疗').length,1);});
test('a car can traverse both highway ramps in either direction without abrupt height changes or earth clipping',()=>{const {h}=cityHarness();h.wallet.change(1000);for(const points of roads.rampsAt({x:0,z:0})){for(const route of [points,[...points].reverse()]){let previous=route[0];for(let i=1;i<route.length;i++)for(let step=1;step<=150;step++){const t=step/150,a=route[i-1],b=route[i],to={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};h.world.updateTolls(to,true,20);assert(h.validMove(previous,to,1.4));assert(Math.abs(h.surfaceHeight(to.x,to.z)-(a.y+(b.y-a.y)*t))<.1);previous=to;}}}assert.equal(h.surfaceHeight(-190,240),8);assert(h.validMove({x:-190,z:240},{x:-189,z:240},1.4));assert.equal(h.validMove({x:-190,z:240},{x:-190,z:252},1.4),false);});

// Reproduces entry at different usable lane offsets, not just the ramp centreline.
test('on and off ramps work across both lanes and open before a driver reaches the barrier',()=>{const {h}=cityHarness();for(const points of roads.rampsAt({x:0,z:0}))for(const sign of [-1,1]){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),nx=(b.z-a.z)/length,nz=-(b.x-a.x)/length;let previous=null;for(let j=0;j<=120;j++){const t=j/120,q={x:a.x+(b.x-a.x)*t+nx*3*sign,z:a.z+(b.z-a.z)*t+nz*3*sign};h.world.updateTolls(q,true,20);if(previous)assert(h.validMove(previous,q,1.4),JSON.stringify({i,q,previous}));previous=q;}}}});
test('elevator moves between actual heights and a purchased apartment persists with an NPC neighbour',()=>{const {h,el}=cityHarness();const b=h.buildings.find(b=>b.id==='residence'&&b.chunk===h.world.region.key);h.enter(b);assert(h.takeElevator(12));h.updateElevator(1);assert(h.player.g.position.y>0&&h.player.g.position.y<44);assert.equal(h.buyHome(),false);h.updateElevator(10);assert.equal(h.state.interiorFloor,12);assert.equal(h.player.g.position.y,44);assert(h.buyHome());assert(h.housing.owns(b,12,0));assert.equal(h.wallet.balance,Infinity);assert(h.ledger.some(r=>r.text.includes('购买房屋')));assert(h.inside.children.some(c=>c.position.y>44));assert(h.inside.children.some(c=>c.geometry?.parameters?.width===26&&c.geometry.parameters.height===.3&&Math.abs(c.position.y-43.85)<.001));h.leave();assert.equal(h.state.interiorFloor,12);h.leave();assert(h.state.elevatorTrip);h.updateElevator(10);assert.equal(h.state.interiorFloor,1);h.leave();assert.equal(h.state.interior,null);h.enter(b);h.takeElevator(12);h.updateElevator(10);assert(h.housing.owns(b,12,0));h.takeElevator(4);el('recover').onclick();assert.equal(h.state.interior,null);assert.equal(h.state.elevatorTrip,null);assert.equal(h.player.g.parent,h.city);assert.equal(h.player.g.position.x,8);});
test('national navigation keeps the source map until the highway exit, then loads and descends into the destination',()=>{const {h}=cityHarness();const dest=cityNames.chinaCities[28],source=h.world.region.name;assert(h.startNavigation(dest));let sawHighway=false,sawArrival=false;for(let i=0;i<6000&&h.state.navigation;i++){h.updateNavigation(.05);if(h.world.mode==='highway'){sawHighway=true;assert.equal(h.world.region.name,source);assert.equal(h.buildings.length,0);}if(h.world.region.name===dest.name){sawArrival=true;assert.equal(h.world.mode,'city');}}assert(sawHighway);assert(sawArrival);assert.equal(h.state.navigation,null);assert.equal(h.world.region.name,dest.name);assert.equal(h.player.g.position.y,0);assert.equal(h.parked.find(c=>c.plate==='城A·10004').g.parent,h.city);});

test('the short-video phone shows all supplied links and toggles saved and liked state',()=>{const {h,el}=cityHarness();h.phoneUI.open();buttonIn(el('phone-content'),'♪\n抖音').onclick();assert.equal(h.phoneUI.video.bvid,'BV1fTYP6fE8P');buttonIn(el('phone-content'),'♡\n点赞').onclick();buttonIn(el('phone-content'),'☆\n收藏').onclick();buttonIn(el('phone-content'),'+\n关注').onclick();assert.deepEqual(h.phoneUI.interactions.BV1fTYP6fE8P,{liked:true,saved:true,followed:true});for(let i=0;i<7;i++)buttonIn(el('phone-content'),'↓ 下一个').onclick();assert.equal(h.phoneUI.video.bvid,'BV1s28G6sEGH');buttonIn(el('phone-content'),'收藏').onclick();assert(buttonIn(el('phone-content'),'★\n已收藏'));});


test('garage service charges 30 once, blocks unregistered entry, and shows the driven plate',()=>{
 const {h,el}=cityHarness();h.toggleCar();
 h.player.g.position.set(20,-5,66);const own=h.parked.find(c=>c.plate==='城A·10004');own.g.position.copy(h.player.g.position);
 h.updateGarage(.1);assert.equal(h.garageAccess.progress,0);assert.equal(h.garageScene.screens.outside.lastText,'城A·10004请勿入内');
 assert.equal(h.validMove({x:20,z:67,y:-5.25},{x:20,z:70},1.4),false);
 assert(h.registerGarage());assert.equal(h.ledger[0].text,'车库入库权限 · 城A·10004');assert.equal(h.ledger[0].amount,-30);
 assert.equal(h.registerGarage(),false);assert.equal(h.ledger.filter(r=>r.amount===-30).length,1);
 h.updateGarage(2);assert.equal(h.garageAccess.progress,1);assert.equal(h.garageScene.screens.outside.lastText,'城A·10004欢迎光临');
 assert(h.validMove({x:20,z:69,y:-5.75},{x:20,z:70},1.4));
 assert(h.garageScene.panels.every(panel=>panel.rotation.x===Math.PI/2));
 own.g.position.set(20,-6,80);h.player.g.position.copy(own.g.position);h.updateGarage(.1);
 own.g.position.set(20,-6,76);h.player.g.position.copy(own.g.position);h.updateGarage(.1);
 assert.equal(h.garageScene.screens.inside.lastText,'城A·10004一路顺风');assert.equal(el('garage-message').textContent,'一路顺风');
});
test('garage service has an accessible interaction at its outdoor counter',()=>{
 const {h,el}=cityHarness();h.player.g.position.set(garageRules.GARAGE_SERVICE.door.x,0,garageRules.GARAGE_SERVICE.door.z);
 h.updateNear();assert.equal(el('interact').disabled,false);assert.match(el('prompt').textContent,/车库服务中心/);
 h.interact();assert.equal(el('dialog-title').textContent,'车库服务中心');assert(buttonIn(el('dialog-content'),'支付30元办理'));
 buttonIn(el('dialog-content'),'支付30元办理').onclick();assert.equal(el('dialog').open,false);assert(h.garageAccess.has('城A·10004'));
 const next=h.parked.find(c=>c.plate==='城A·10005');h.player.g.position.copy(next.g.position);h.toggleCar();
 assert.equal(h.garageAccess.has(next.plate),false);assert.equal(h.validMove({x:20,z:69,y:-5.75},{x:20,z:70},1.4),false);
});
test('driving into a locked garage stops without a building fine, then a permit allows entry and reverse exit',()=>{
 const {h}=cityHarness();h.toggleCar();const own=h.parked.find(c=>c.plate==='城A·10004');
 own.g.position.set(20,-3,58);h.player.g.position.copy(own.g.position);h.keys.add('KeyW');
 for(let i=1;i<=150;i++)h.frame(i*40);
 assert(own.g.position.z<70);assert.equal(h.garageAccess.progress,0);assert.equal(h.ledger.filter(r=>r.text.includes('碰撞建筑')).length,0,JSON.stringify({position:own.g.position,ledger:h.ledger}));
 h.registerGarage();for(let i=151;i<=230&&own.g.position.z<82;i++)h.frame(i*40);h.keys.clear();
 assert(own.g.position.z>78);assert.equal(h.garageScene.screens.outside.lastText,'城A·10004欢迎光临');
 h.keys.add('KeyS');for(let i=231;i<=420&&own.g.position.z>62;i++)h.frame(i*40);h.keys.clear();
 assert(own.g.position.z<70);assert.equal(h.garageScene.screens.inside.lastText,'城A·10004一路顺风');
});

test('manual driving switches only at a highway portal and can turn back to its source city',()=>{
 const {h}=cityHarness();h.toggleCar();const own=h.parked.find(c=>c.plate==='城A·10004');h.world.selectDestination(cityNames.chinaCities[2]);
 own.g.position.set(240,8,-200);h.updateCityTravel();assert.equal(h.world.mode,'city');
 own.g.position.set(240,8,-282);h.updateCityTravel();assert.equal(h.world.mode,'highway');assert.equal(h.world.region.name,'北京市');assert.equal(h.state.navigation,null);
 own.g.position.set(0,8,h.world.trip.length-5);h.updateCityTravel();assert.equal(h.world.mode,'highway');
 own.g.position.set(0,8,-13);h.updateCityTravel();assert.equal(h.world.mode,'city');assert.equal(h.world.region.name,'北京市');
 own.g.position.set(240,8,-282);h.updateCityTravel();own.g.position.set(0,8,h.world.trip.length);h.updateCityTravel();assert.equal(h.world.region.name,'上海市');assert.equal(own.g.position.y,8);assert.equal(own.g.position.x,240);
});

test('recovering midway on a highway returns to the source map and keeps the car reachable',()=>{const {h,el}=cityHarness();h.toggleCar();const own=h.parked.find(c=>c.plate==='城A·10004');h.world.selectDestination(cityNames.chinaCities[2]);h.world.beginHighway();own.g.position.set(0,8,500);h.player.g.position.copy(own.g.position);el('recover').onclick();assert.equal(h.world.mode,'city');assert.equal(h.world.region.name,'北京市');assert.equal(h.world.destination.name,'上海市');assert.equal(h.state.driving,false);assert.equal(h.player.g.position.x,8);assert.equal(own.g.position.z,17);h.toggleCar();assert.equal(h.state.driving,true);});

test('online citizens render only in the same city and remote cars release their local duplicate on departure',()=>{
 const {h}=cityHarness(),pose=h.cityPose(),peer={id:'city-friend',name:'朋友',pose:{...pose,x:pose.x+3}};
 h.cityOnline.online=true;h.cityOnline.members.set(peer.id,peer);h.frame(40);
 const root=h.scene.getObjectByName('city-peer-city-friend');assert(root.visible);assert.equal(root.position.x,pose.x+3);
 peer.pose={...peer.pose,city:pose.city+1};h.frame(80);assert(!root.visible);
 const vehicle=h.parked[0];peer.pose={...pose,mode:'drive',vehicle:{plate:vehicle.plate,color:vehicle.color}};h.frame(120);assert(root.visible);assert.equal(vehicle.g.visible,false);
 h.cityOnline.members.clear();h.frame(160);assert.equal(h.scene.getObjectByName(root.name),undefined);assert(vehicle.g.visible);
});
test('assembling joins another city and the room dialog pauses movement',()=>{
 const {h,el}=cityHarness(),pose=h.cityPose();assert(h.assembleCityPeer({...pose,city:1,x:8,z:12}));assert.equal(h.world.profile.index,1);assert.equal(h.cityPose().city,1);
 el('city-online-dialog').open=true;h.keys.add('KeyW');const before=h.player.g.position.clone();h.updatePlayer(.1);assert(h.player.g.position.equals(before));
});

test('rail station enforces the whole walking flow and takes the passenger to the chosen independent city',()=>{
 const {h,el}=cityHarness(),station=h.buildings.find(b=>b.id==='railwayStation');h.enter(station);assert(h.rail.active);
 assert.equal(h.validMove({x:0,z:20},{x:0,z:17},.4),false);assert.equal(h.rail.buy(cityNames.chinaCities[2]),false);
 h.player.g.position.set(0,0,22);h.interact();assert(h.rail.journey.secured);
 assert.equal(h.validMove({x:2,z:-8},{x:2,z:-11},.4),false);h.player.g.position.set(-16,0,5);h.interact();assert.equal(el('dialog').open,true);assert(h.rail.buy(cityNames.chinaCities[2]));assert.equal(el('dialog').open,false);
 assert.equal(h.rail.buy(cityNames.chinaCities[3]),false);h.player.g.position.set(2,0,-6);h.interact();assert.equal(h.rail.journey.phase,'waiting');
 h.player.g.position.set(0,0,-29);h.interact();assert.equal(h.rail.journey.phase,'platform');h.player.g.position.set(7,0,1);h.interact();assert.equal(h.rail.journey.phase,'platform');
 for(let i=1;i<=650;i++)h.frame(i*40);h.interact();assert.equal(h.rail.journey.phase,'cabin');assert.equal(h.rail.leave(),false);el('recover').onclick();assert.equal(h.rail.journey.phase,'cabin');
 assert.equal(h.validMove({x:0,z:0},{x:1.5,z:0},.4),false);assert.equal(h.validMove({x:0,z:0},{x:0,z:-1},.4),true);
 h.interact(); // A seated passenger must stand up automatically on arrival.
 for(let i=651;i<=1720;i++)h.frame(i*40);assert.equal(h.rail.journey.phase,'arrived');assert.equal(h.world.profile.name,'上海市');assert.equal(h.rail.journey.ticket.used,true);
 const z=h.player.g.position.z;h.keys.add('KeyW');h.updatePlayer(.1);h.keys.clear();assert.notEqual(h.player.g.position.z,z);h.interact();assert.equal(h.state.interior,null);assert.equal(h.cityPose().city,2);assert.equal(h.player.g.parent,h.city);assert.equal(h.ledger.filter(r=>r.text.includes('高铁票')).length,1);
});
test('rail guidance walks the player to each real checkpoint and a city unload removes its train',()=>{
 const {h}=cityHarness();h.enter(h.buildings.find(b=>b.id==='railwayStation'));h.rail.next();for(let i=0;i<50;i++)h.rail.move(.1);assert(Math.abs(h.player.g.position.z-22)<.3);h.rail.next();assert(h.rail.journey.secured);
 h.rail.next();for(let i=0;i<50;i++)h.rail.move(.1);assert(Math.hypot(h.player.g.position.x+16,h.player.g.position.z-5)<.3);
 h.rail.leave();const old=h.rail.exterior.vehicle,root=h.world.root;assert(old.parent);h.world.beginHighway();assert.equal(h.rail.exterior,null);assert.equal(root.parent,null);
});
test('NPC traffic stops at the actual red rail barrier and resumes once the train has cleared',()=>{
 const {h}=cityHarness();for(let i=1;i<=65;i++)h.frame(i*1000);
 const c=h.traffic[0];c.g.position.set(176,0,210);c.route=[{x:176,y:0,z:210},{x:176,y:0,z:228}];c.routeIndex=1;
 h.updateTraffic(.5);assert.equal(c.g.position.z,210);assert.equal(c.moving,false);h.rail.update(2);
 const signal=h.rail.exterior.signals.find(s=>Math.abs(s.crossing.x-176)<.01);assert(signal);assert.equal(signal.progress,1);assert(signal.lamps.some(l=>l.material.emissive.getHex()!==0));
 for(let i=66;i<=85;i++)h.frame(i*1000);c.g.position.set(176,0,210);c.routeIndex=1;h.updateTraffic(.5);assert(c.g.position.z>210);
});

function boardRailForDriving(h){
 h.enter(h.buildings.find(b=>b.id==='railwayStation'));h.player.g.position.set(0,0,22);h.interact();h.player.g.position.set(-16,0,5);h.rail.buy(cityNames.chinaCities[2]);h.player.g.position.set(2,0,-6);h.interact();h.player.g.position.set(0,0,-29);h.interact();h.player.g.position.set(7,0,1);
 for(let i=1;i<=650;i++)h.frame(i*40);h.interact();assert.equal(h.rail.journey.phase,'cabin');
}
test('the driver cab controls a real rail-only train and stops instead of completing on the passenger timer',()=>{
 const {h,el}=cityHarness();boardRailForDriving(h);assert.equal(h.rail.enterDriver(),false);h.rail.goDriver();for(let i=0;i<70;i++)h.rail.move(.1);assert(h.player.g.position.z<-13);assert(h.rail.enterDriver());assert(h.rail.inDriver);assert.equal(h.player.g.visible,false);assert(h.inside.getObjectByName('high-speed-driver-cab'));
 h.keys.add('KeyW');for(let i=0;i<60;i++)h.rail.update(.1);h.keys.clear();assert(h.rail.drive.velocity>10);assert.equal(h.rail.exitDriver(),false);const z=h.player.g.position.z;
 h.keys.add('KeyA');h.keys.add('KeyD');h.rail.move(1);h.keys.clear();assert.equal(h.player.g.position.z,z);assert.equal(h.rail.drive.pose.z,224);
 el('rail-driver-brake').onpointerdown({preventDefault(){},pointerId:1});const speed=h.rail.drive.velocity;h.rail.update(1);el('rail-driver-brake').listeners.pointerup();assert(h.rail.drive.velocity<speed);
 h.rail.stopTrain();for(let i=0;i<60;i++)h.rail.update(.1);assert.equal(h.rail.drive.velocity,0);const parked=h.rail.drive.distance;for(let i=0;i<500;i++)h.rail.update(.1);assert.equal(h.rail.drive.distance,parked);assert.equal(h.rail.journey.phase,'cabin');
 h.rail.setDriverView();assert.equal(h.inside.visible,false);assert(h.rail.driveWorld.vehicle.visible);h.rail.setDriverView();assert(h.inside.visible);
 assert(h.rail.exitDriver());assert(!h.rail.inDriver);assert(h.player.g.visible);for(let i=0;i<500;i++)h.rail.update(.1);assert.equal(h.rail.drive.distance,parked);
 assert(h.rail.enterDriver());h.keys.add('KeyW');for(let i=0;i<1400&&h.rail.journey.phase==='cabin';i++)h.rail.update(.1);h.keys.clear();assert(h.rail.drive.arrived);assert.equal(h.rail.journey.phase,'cabin');assert(h.rail.toggleDoors());for(let i=0;i<150&&!h.rail.drive.service.complete;i++)h.rail.update(.1);assert(h.rail.toggleDoors());h.rail.update(1);assert.equal(h.rail.journey.phase,'arrived');assert.equal(h.world.profile.name,'上海市');assert(!h.rail.inDriver);assert.equal(h.rail.driveWorld,null);assert(h.player.g.visible);
});

test('intermediate stations show actual opening doors and passengers, and the driver can resume to the next stop',()=>{
 const {h,el}=cityHarness();boardRailForDriving(h);h.rail.goDriver();for(let i=0;i<70;i++)h.rail.move(.1);assert(h.rail.enterDriver());
 const world=h.rail.driveWorld,d=h.rail.drive;assert.equal(world.stations.length,5);for(const id of ['origin','qinghe','lakeside','newtown','terminal'])assert(world.g.getObjectByName('rail-stop-'+id));
 d.distance=1050;d.velocity=0;d.stop();h.rail.update(.1);assert.equal(el('rail-next-stop').textContent,'本站：青禾站');assert.equal(el('rail-driver-doors').disabled,false);assert(h.rail.toggleDoors());assert.equal(h.inside.visible,false);
 assert.equal(h.rail.toggleDoors(),false);h.rail.update(1.3);assert(world.exchange.some(p=>p.g.visible));assert(world.vehicle.railDoors.every(door=>door.g.position.x>door.x));assert.equal(el('rail-driver-accelerate').disabled,true);
 for(let i=0;i<80&&!d.service.complete;i++)h.rail.update(.1);assert.equal(d.passengers,14);assert.equal(world.stations[1].waiting.filter(p=>p.g.visible).length,0);assert.equal(el('rail-passengers').textContent,'车内乘客 14 / 40 人');assert.equal(h.rail.journey.phase,'cabin');assert.equal(h.world.profile.name,'北京市');
 el('rail-driver-doors').onclick();h.rail.update(.7);assert(world.vehicle.railDoors.every(door=>Math.abs(door.g.position.x-door.x)<.000001));assert.equal(el('rail-driver-accelerate').disabled,false);
 h.keys.add('KeyW');for(let i=0;i<60;i++)h.rail.update(.1);h.keys.clear();assert(d.distance>1068);assert(d.velocity>0);assert.equal(el('rail-next-stop').textContent,'下一站：湖畔站');assert(el('rail-route-stops').textContent.startsWith('✓ 青禾站'));assert.equal(h.rail.toggleDoors(),false);
});
