import test from 'node:test';
import assert from 'node:assert/strict';
import {chinaCities} from '../lib/city-cities.mjs';
import {cityCoordinates,cityDistance,cityDistanceText,routeKey,validCityRoute,createCityRouting,highwayWindow} from '../lib/city-distance.mjs';
import {createCityMap,highwayTrip} from '../lib/city-map.mjs';
import {CITY_RADIUS_METRES,WALK_SPEED,cityMapScale} from '../lib/city-scale.mjs';
import {cleanCityPose} from '../lib/city-room.mjs';

const beijing=chinaCities[0],shanghai=chinaCities[2],guangzhou=chinaCities.find(c=>c.name==='广州市');
const road=(from,to)=>({kind:'road',key:routeKey(from,to),distance:Math.round(cityDistance(from,to)*1.2),duration:50000});

test('all 694 named cities have geographic centres, with a plausible Beijing–Shanghai distance',()=>{
 for(const city of chinaCities){const [lon,lat]=cityCoordinates(city);assert(lon>73&&lon<136,city.name);assert(lat>3&&lat<54,city.name);}
 assert(cityDistance(beijing,shanghai)>1060000&&cityDistance(beijing,shanghai)<1080000);
 assert.equal(cityDistance(beijing,beijing),0);assert.equal(cityCoordinates({...beijing,country:1}),null);
 assert.equal(cityDistanceText(1220340),'1,220.3 km');
});

test('a verified road length controls physical highway length, while mismatched or impossible metadata is rejected',()=>{
 const source=createCityMap(beijing),route={...road(beijing,shanghai),distance:1220340};
 const trip=highwayTrip(source,shanghai,route);assert.equal(trip.length,1220340);assert.equal(trip.distanceKind,'road');
 assert.equal(validCityRoute({...route,key:routeKey(shanghai,beijing)},beijing,shanghai),false);
 assert.equal(validCityRoute({...route,distance:2000},beijing,shanghai),false);
 assert.equal(validCityRoute({...route,key:null},{name:'missing'},shanghai),false);
});

test('routing deduplicates simultaneous queries, caches successful responses, and expires old distances',async()=>{
 let stamp=100000,calls=0,stored='{}';const storage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};
 const fetcher=async()=>{calls++;return {ok:true,json:async()=>({code:'Ok',routes:[{distance:1220340,duration:49300}]})};};
 const options={fetcher,now:()=>stamp,wait:async ms=>{stamp+=ms;},storage},routes=createCityRouting(options);
 const [a,b]=await Promise.all([routes.get(beijing,shanghai),routes.get(beijing,shanghai)]);
 assert.equal(calls,1);assert.equal(a,b);assert.equal(routes.peek(beijing,shanghai).distance,1220340);
 assert.equal((await createCityRouting(options).get(beijing,shanghai)).distance,1220340);assert.equal(calls,1);
 stamp+=8*86400000;assert.equal(routes.peek(beijing,shanghai),null);await routes.get(beijing,shanghai);assert.equal(calls,2);
});

test('different road requests are serialized at least one second apart and never invent a route on failure',async()=>{
 let stamp=0,fail=false;const starts=[];
 const routes=createCityRouting({storage:{getItem:()=>null,setItem(){}},now:()=>stamp,wait:async ms=>{stamp+=ms;},fetcher:async url=>{
  starts.push(stamp);if(fail)return {ok:false};const from=url.includes(routeKey(shanghai,guangzhou))?shanghai:beijing,to=url.includes(routeKey(beijing,shanghai))?shanghai:guangzhou;
  return {ok:true,json:async()=>({code:'Ok',routes:[road(from,to)]})};
 }});
 await Promise.all([routes.get(beijing,shanghai),routes.get(beijing,guangzhou)]);
 assert.equal(starts.length,2);assert(starts[1]-starts[0]>=1000);
 fail=true;await assert.rejects(routes.get(shanghai,guangzhou),/暂不可用/);assert.equal(routes.peek(shanghai,guangzhou),null);
 fail=false;await routes.get(shanghai,guangzhou);assert.equal(starts.length,4);
});

test('city spacing grows without enlarging building footprints, lane widths or floor heights',()=>{
 const map=createCityMap(beijing);assert.equal(CITY_RADIUS_METRES,1200);assert.equal(map.xs[4]-map.xs[3],176);
 assert.equal(map.xs[5]-map.xs[4],176);assert(map.roads.every(r=>r.width>=9&&r.width<=13));
 const office=map.buildings.find(b=>b.id==='office');assert.equal(office.w,22);assert.equal(office.d,20);assert.equal(office.height/office.floors,4);
 assert.equal(WALK_SPEED*3.6,5.04);assert.equal(cityMapScale(map)*2400,210);
});

test('long highways keep a fixed contiguous window around the physical metre position',()=>{
 for(const length of [1200,1220340,5000000])for(const z of [0,length/2,length-5]){
  const chunks=highwayWindow(z,length);assert.equal(chunks.length,13);assert(chunks.some(c=>c.visible&&z>=c.z&&z<=c.z+c.size));
  for(let i=1;i<chunks.length;i++)assert.equal(chunks[i].z-chunks[i-1].z,90);
 }
});

test('online highway positions remain valid beyond one thousand kilometres',()=>{
 const pose={country:0,city:0,zone:'highway',space:'0:2',label:'高速',mode:'drive',x:0,y:8,z:1211000,heading:0,vehicle:{plate:'城A·10004',color:0xe5ad52}};
 assert.equal(cleanCityPose(pose).z,1211000);assert.equal(cleanCityPose({...pose,z:20000001}),null);
 assert.equal(cleanCityPose({...pose,zone:'city'}),null);
});
