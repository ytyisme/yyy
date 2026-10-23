import test from 'node:test';
import assert from 'node:assert/strict';
import {chinaCities} from '../lib/city-cities.mjs';
import {createHousing} from '../lib/city-housing.mjs';
import {createCityMap,mapSurface,waterAt,mapTerrain,departureRoute,highwayTrip,entryRoute,mapRoadAt} from '../lib/city-map.mjs';

test('all 694 cities have deterministic, distinct street, building and terrain layouts',()=>{
 const streets=new Set(),buildings=new Set(),terrain=new Set();
 for(const city of chinaCities){
  const map=createCityMap(city),again=createCityMap(city);
  assert.deepEqual(map,again);assert.equal(map.name,city.name);
  streets.add(JSON.stringify([map.xs,map.zs,map.roads.map(r=>r.width)]));
  buildings.add(JSON.stringify(map.buildings.map(b=>[b.x,b.z,b.w,b.d,b.height,b.style])));
  terrain.add(JSON.stringify([map.hills,map.river,map.lake,map.coast]));
  assert(map.buildings.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)&&b.w>10&&b.d>10));
  for(const id of ['office','hotel','hospital','bank','school','airport','residence'])assert(map.buildings.some(b=>b.id===id),city.name+' '+id);
  const route=departureRoute(map,{x:9,z:17});assert(route.length>8);assert.equal(route[0].x,9);assert.equal(route.at(-1).y,8);assert.equal(route.at(-1).z,-1128);
  assert.equal(mapSurface(map,20,58),-3);assert.equal(mapSurface(map,20,85),-6);
 }
 assert.equal(streets.size,694);assert.equal(buildings.size,694);assert.equal(terrain.size,694);
 assert.equal(new Set(chinaCities.slice(0,4).map(city=>createCityMap(city).streetName)).size,4);
});
test('street navigation and both highway ramps have a continuous driveable surface',()=>{
 for(const city of [chinaCities[0],chinaCities[2],chinaCities[3],chinaCities[77],chinaCities[693]]){
  const map=createCityMap(city),route=departureRoute(map,{x:9,z:17});
  for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i],length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(length);let previous=mapSurface(map,a.x,a.z);
   for(let j=1;j<=n;j++){const t=j/n,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},height=mapSurface(map,p.x,p.z);assert(Math.abs(height-previous)<.55,city.name+' '+JSON.stringify({p,height,previous}));previous=height;}
  }
 }
});
test('mountains and waterfronts are part of the actual surface, with roads bridging water',()=>{
 const map=createCityMap(chinaCities.find(c=>c.name==='重庆市'));
 assert(map.hills.some(h=>mapTerrain(map,h.x,h.z)>3));
 let bridge=false;for(let z=-920;z<920;z+=16)for(let x=-760;x<-360;x+=8)if(waterAt(map,x,z)&&mapRoadAt(map,{x,z}).type==='street'){assert(mapSurface(map,x,z)>=.8);bridge=true;}
 assert(bridge);
});
test('a highway trip retains its source and ends at a destination entrance ramp',()=>{
 const source=createCityMap(chinaCities[0]),trip=highwayTrip(source,chinaCities[2]),arrival=entryRoute();
 assert.equal(trip.source.name,'北京市');assert.equal(trip.destination.name,'上海市');assert(trip.length>1060000&&trip.length<1080000);assert.equal(trip.distanceKind,'geographic');
 assert.equal(trip.points[0].y,8);assert.equal(trip.points.at(-1).z,trip.length);assert.equal(arrival[0].y,8);assert.equal(arrival.at(-1).y,0);
});
test('existing apartments remain owned after the original city layout changes',()=>{
 const housing=createHousing({getItem:()=>JSON.stringify(['0|110,110|晴空小区|24A']),setItem(){}}),map=createCityMap(chinaCities[0]);
 const home=map.buildings.find(b=>b.legacyHome?.name==='晴空小区');assert(home.floors>=24);assert(housing.owns(home,24,0));
 assert.equal(housing.owns(home,24,1),false);assert.equal(housing.owns(createCityMap(chinaCities[2]).buildings.find(b=>b.id==='residence'),24,0),false);
});
