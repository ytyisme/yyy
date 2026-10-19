import test from 'node:test';
import assert from 'node:assert/strict';
import {RAIL,trainAt,crossingAt,crossingForTrain,crossingBlocks,railJourney,cabinMove,railRideAt,createRailDrive,createRailStops,STATION_TOLERANCE} from '../lib/city-rail.mjs';
import {createCityMap,mapSurface,mapTerrain} from '../lib/city-map.mjs';
import {chinaCities} from '../lib/city-cities.mjs';

test('every visible car stays on the track and the whole train clears each red crossing',()=>{
 for(let seconds=0;seconds<180;seconds+=.1){const t=trainAt(seconds);assert.equal(t.z,224);assert.equal(t.y,0);if(t.visible){assert(t.tail>=RAIL.trackStart);assert(t.x+1<=RAIL.trackEnd);}if(t.phase==='boarding'){assert.equal(t.x,RAIL.head);assert.equal(t.velocity,0);}
  for(const x of [-178,-88,88,132,176])if(t.visible&&t.x>=x-3&&t.tail<=x+3)assert(crossingAt(seconds,x).red,JSON.stringify({seconds,x,t}));
 }
 assert.equal(trainAt(30).phase,'boarding');assert.equal(trainAt(85).visible,false);assert.equal(trainAt(91).x,trainAt(1).x);
});
test('a manually driven train accelerates, brakes and holds parking without leaving its rails',()=>{
 const d=createRailDrive();for(let i=0;i<100;i++)d.step(.1,{accelerate:true});const fast=d.velocity;assert(fast>20);assert(d.distance>100);
 for(let i=0;i<10;i++)d.step(.1,{brake:true});assert(d.velocity<fast);const beforeStop=d.distance;d.stop();for(let i=0;i<100;i++)d.step(.1);assert.equal(d.velocity,0);assert(d.distance>beforeStop);
 const parked=d.distance;for(let i=0;i<200;i++)d.step(.1);assert.equal(d.distance,parked);assert(d.parking);
 d.step(1,{accelerate:true});assert(d.velocity>0);assert(!d.parking);
 for(let i=0;i<1000;i++){d.step(.1,{accelerate:true,left:true,right:true});assert.equal(d.pose.y,0);assert.equal(d.pose.z,RAIL.trackZ);assert(d.velocity<=RAIL.maxDriveSpeed);assert(d.pose.tail>=RAIL.trackStart);assert(d.pose.x+1<=RAIL.trackEnd);}
 assert(d.arrived);assert.equal(d.distance,RAIL.tripLength);assert.equal(d.velocity,0);
});
test('a stopped manual train keeps a road crossing red until its entire tail has cleared',()=>{
 const d=createRailDrive({distance:110,velocity:0});d.stop();assert(crossingForTrain(d.pose,176).red);
 for(let i=0;i<100;i++)d.step(1);assert(crossingForTrain(d.pose,176).red);
 const crossings=[{x:176,width:12}];assert(crossingBlocks({x:176,z:210},{x:176,z:220},1.4,crossings,85,d.pose));
 for(let i=0;i<100;i++)d.step(.1,{accelerate:true});assert(!crossingForTrain(d.pose,176).red);
});
test('350 km/h is reachable, capped during sustained acceleration, and followed by a stop within the track',()=>{
 const d=createRailDrive();let peak=0,atLimit=0;
 for(let i=0;i<1500&&!d.arrived;i++){
  d.step(.1,{accelerate:true});const kmh=d.velocity*3.6;peak=Math.max(peak,kmh);if(Math.abs(kmh-350)<.000001)atLimit++;
  assert(kmh<=350+.000001);assert(d.pose.x+1<=RAIL.trackEnd);assert.equal(d.pose.z,RAIL.trackZ);
 }
 assert(Math.abs(peak-350)<.000001);assert(atLimit>=20,'driver can hold 350 for at least two seconds');assert(d.arrived);assert.equal(d.velocity,0);assert.equal(d.distance,RAIL.tripLength);
});
test('red crossing stops incoming traffic and allows a vehicle already between barriers to escape',()=>{
 const c=[{x:176,width:12}],t=65;assert(crossingAt(t,176).red);
 assert(crossingBlocks({x:176,z:210},{x:176,z:219},1.4,c,t));
 assert(!crossingBlocks({x:176,z:224},{x:176,z:235},1.4,c,t));
 assert(!crossingBlocks({x:176,z:210},{x:176,z:219},1.4,c,30));
 assert(!crossingBlocks({x:200,z:210},{x:200,z:219},1.4,c,t));
});
test('security, ticket, gate, waiting and stopped-train boarding must happen in order',()=>{
 const j=railJourney(),source=chinaCities[0],dest=chinaCities[2];
 assert(!j.buy(dest,source));assert(!j.check());assert(!j.platform());assert(!j.board(trainAt(30)));
 assert(j.security());assert(!j.buy(source,source));assert(j.buy(dest,source));assert(j.check());assert(j.platform());assert(!j.board(trainAt(5)));assert(j.board(trainAt(30)));
 assert(j.ticket.used);assert(!j.board(trainAt(30)));assert(!j.tick(41));assert(j.tick(1));assert.equal(j.phase,'arrived');assert(!j.check());
});
test('the carriage aisle is walkable and seats and walls block movement',()=>{
 assert(cabinMove({x:0,z:-12}));assert(cabinMove({x:2,z:14}));assert(!cabinMove({x:1.5,z:0}));assert(!cabinMove({x:3,z:14}));assert(!cabinMove({x:0,z:16}));
 assert.equal(railRideAt(0).velocity,0);assert.equal(railRideAt(42).velocity,0);let last=0;for(let t=0;t<=42;t+=.1){const ride=railRideAt(t);assert(ride.distance>=last);last=ride.distance;}
});
test('all city station aprons and the railway bed have a level continuous surface',()=>{
 for(const city of chinaCities){const map=createCityMap(city);assert.equal(mapSurface(map,10,187),0);assert.equal(mapSurface(map,10,204),0);
  for(const road of map.roads.filter(r=>r.axis==='NS')){const x=road.a.x;assert.equal(mapTerrain(map,x,224),0);for(let z=217;z<228;z+=.25)assert(Math.abs(mapTerrain(map,x,z+.25)-mapTerrain(map,x,z))<.5);}
 }
});


test('the route names its origin, three intermediate stops and destination in order',()=>{
 const stops=createRailStops('北京市','上海市');assert.deepEqual(stops.map(s=>s.name),['北京站','青禾站','湖畔站','新城站','上海站']);assert.deepEqual(stops.map(s=>s.distance),[0,1050,2100,3150,4200]);
 const d=createRailDrive({stops});assert.equal(d.nextStation.id,'qinghe');d.distance=1070;assert.equal(d.nextStation.id,'lakeside');assert(!d.station);
});
test('doors require a stopped train aligned to a station, with traction locked during exchange and closing',()=>{
 const d=createRailDrive({distance:1050,velocity:1});assert(!d.openDoors());d.velocity=0;d.distance=1050+STATION_TOLERANCE+.1;assert(!d.openDoors());d.distance=1050+STATION_TOLERANCE;assert(d.openDoors());assert(!d.closeDoors());
 const position=d.distance;d.step(2,{accelerate:true});assert.equal(d.distance,position);assert.equal(d.velocity,0);assert.equal(d.doorProgress,1);assert.equal(d.service.alighted,1);assert.equal(d.service.boarded,0);assert.equal(d.passengers,11);
 d.step(10,{accelerate:true});assert(d.service.complete);assert.equal(d.passengers,14);assert.equal(d.totalAlighted,3);assert.equal(d.totalBoarded,5);assert(d.closeDoors());
 d.step(.3,{accelerate:true});assert.equal(d.distance,position);assert.equal(d.velocity,0);assert(d.doorProgress>0);d.step(.4);assert.equal(d.doorProgress,0);d.step(1,{accelerate:true});assert(d.distance>position);assert(d.velocity>0);
});
test('passengers exchange at multiple stops without duplicate boarding, then all leave at the terminal',()=>{
 const d=createRailDrive();let previous=d.distance;
 for(const stop of d.stops.slice(1)){
  // Approach each stop using the real traction and parking dynamics, then inch up to its marker.
  let ticks=0;while(d.distance<stop.distance-1&&ticks++<8000){const left=stop.distance-d.distance;if(d.velocity*d.velocity/18>=left-2)d.stop();d.step(.05,{accelerate:!d.parking||d.velocity<.05});assert(d.distance>=previous);previous=d.distance;}
  d.stop();for(let i=0;i<300&&d.velocity>.001;i++)d.step(.05);assert(Math.abs(d.distance-stop.distance)<=STATION_TOLERANCE,JSON.stringify({stop,distance:d.distance}));assert(d.openDoors());
  while(!d.service.complete)d.step(.1,{accelerate:true});assert(d.served.has(stop.id));assert(d.passengers<=d.capacity);assert.equal(d.passengers,12+d.totalBoarded-d.totalAlighted);
  assert(d.closeDoors());d.step(.7);const count=d.passengers;assert(d.openDoors());d.step(1);assert.equal(d.passengers,count);assert.equal(d.service.board,0);assert.equal(d.service.alight,0);assert(d.closeDoors());d.step(.7);
 }
 assert.equal(d.passengers,0);assert.equal(d.totalBoarded,15);assert.equal(d.totalAlighted,27);assert(!d.doorsOpen);assert.equal(d.doorProgress,0);
 // The terminal has a protective stop at the end of the track.
 for(let i=0;i<100&&!d.arrived;i++)d.step(.1,{accelerate:true});assert(d.finished);
});
test('terminal arrival waits for passenger alighting and closed doors',()=>{
 const d=createRailDrive({distance:RAIL.tripLength});assert(d.arrived);assert(!d.finished);assert(d.openDoors());d.step(2);assert(!d.finished);assert(!d.closeDoors());d.step(10);assert.equal(d.passengers,0);assert(!d.finished);assert(d.closeDoors());assert(!d.finished);d.step(.7);assert(d.finished);
});
