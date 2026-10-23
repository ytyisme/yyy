import test from 'node:test';
import assert from 'node:assert/strict';
import {chinaCities} from '../lib/city-cities.mjs';
import {createCityMap} from '../lib/city-map.mjs';
import {buildingName} from '../lib/city-world.mjs';
import {createHousing} from '../lib/city-housing.mjs';
import {applyPlaceNames,parsePlaces,createCityPlaces,placeQuery,snapshotPlaces} from '../lib/city-places.mjs';
const beijing=chinaCities[0],shanghai=chinaCities[2];
const fixture=city=>({elements:[{type:'area',id:3600000001,tags:{name:city.name,boundary:'administrative'}},{type:'way',id:10,tags:{name:'地图住宅甲',landuse:'residential'}},{type:'node',id:11,tags:{name:'地图超市甲',shop:'supermarket'}},{type:'way',id:12,tags:{name:'地图超市甲',shop:'supermarket'}}]});

test('Beijing residences and retail signs use verified city-specific names without generated branch suffixes',()=>{
 const map=createCityMap(beijing),homes=map.buildings.filter(b=>b.id==='residence');
 assert.equal(homes.length,9);assert.equal(new Set(homes.map(b=>b.name)).size,9);assert(homes.some(b=>b.name==='远洋山水'));
 for(const b of map.buildings.filter(b=>b.placeSlot)){assert(b.realPlace?.url.startsWith('https://'));assert.equal(buildingName(b,map.index,0,0),b.name);}
 assert.equal(map.buildings.find(b=>b.id==='market').name,'物美超市（新街口店）');
 assert.equal(map.buildings.find(b=>b.id==='store').name,'便利蜂（瑞海二区店）');
 assert.equal(map.buildings.find(b=>b.id==='mall').name,'北京市百货大楼');
 assert.equal(map.buildings.find(b=>b.id==='shopping').name,'北京apm');
});
test('an unknown city never borrows Beijing names and a source must match the queried boundary',()=>{
 const map=createCityMap(shanghai);assert(map.buildings.filter(b=>b.placeSlot).every(b=>b.name.includes('名称未收录')));
 applyPlaceNames(map.buildings,map,snapshotPlaces(beijing));assert(map.buildings.filter(b=>b.placeSlot).every(b=>!b.realPlace));
 assert.throws(()=>parsePlaces(fixture(beijing),shanghai),/城市/);
 assert.throws(()=>parsePlaces({...fixture(shanghai),remark:'timeout'},shanghai),/完整/);
 const parsed=parsePlaces(fixture(shanghai),shanghai);assert.equal(parsed.lists.market.length,1);applyPlaceNames(map.buildings,map,parsed);
 assert.equal(map.buildings.find(b=>b.id==='market').name,'地图超市甲');assert.equal(map.buildings.filter(b=>b.realPlace).length,2);
 assert(placeQuery(shanghai).includes('is_in('));assert(placeQuery(shanghai).includes('[name="上海市"]'));
});
test('owned homes survive real-name changes, old city-scale saves and reloads',()=>{
 const map=createCityMap(beijing),home=map.buildings.find(b=>b.id==='residence');
 for(const factor of [1,4]){
  let saved=JSON.stringify([`0|${home.cityId}|${home.x/factor},${home.z/factor}|${home.originalName}|12A`]);
  const storage={getItem:()=>saved,setItem:(k,v)=>{saved=v;}},h=createHousing(storage);assert(h.owns(home,12));assert(!h.owns(home,12,1));
  assert(h.buy(home,13));const renamed={...home,name:'更新后的真实名称'};assert(createHousing(storage).owns(renamed,13));
  assert(!createHousing(storage).owns({...renamed,cityId:'0:2'},13));
 }
});
test('real-name requests are cached and deduplicated, with explicit refresh and no invented data on failure',async()=>{
 let calls=0,stored='{}',stamp=1000,fail=false;
 const options={storage:{getItem:()=>stored,setItem:(k,v)=>{stored=v;}},now:()=>stamp,wait:async ms=>{stamp+=ms;},fetcher:async()=>{calls++;if(fail)throw new Error('offline');return {ok:true,json:async()=>fixture(shanghai)};}};
 const service=createCityPlaces(options);await service.get(beijing);assert.equal(calls,0);
 const [a,b]=await Promise.all([service.get(shanghai),service.get(shanghai)]);assert.equal(calls,1);assert.equal(a,b);
 await createCityPlaces(options).get(shanghai);assert.equal(calls,1);
 await service.get(shanghai,{refresh:true});assert.equal(calls,2);
 fail=true;await assert.rejects(service.get(shanghai,{refresh:true}),/offline/);assert.equal(service.peek(shanghai).lists.market[0].name,'地图超市甲');
});

test('Shijiazhuang has fixed neighbouring homes across one street, even after a cached name refresh',()=>{
 const entry=chinaCities.find(c=>c.name==='石家庄市'),map=createCityMap(entry);
 const a=map.buildings.find(b=>b.name==='国瑞园小区'),b=map.buildings.find(b=>b.name==='义堂小区');
 assert(a&&b);assert.equal(a.x,b.x);assert(a.z<b.z);assert.equal(a.front,1);assert.equal(b.front,-1);
 const street=map.roads.find(r=>r.axis==='EW'&&r.a.z>a.z&&r.a.z<b.z);assert(street);
 assert(a.z+a.d/2<street.a.z-street.width/2);assert(b.z-b.d/2>street.a.z+street.width/2);
 for(const home of [a,b]){
  assert(!map.buildings.some(other=>other!==home&&Math.abs(home.x-other.x)<(home.w+other.w)/2&&Math.abs(home.z-other.z)<(home.d+other.d)/2));
  const legacy=JSON.stringify([`0|${home.cityId}|${home.previousAddress.x},${home.previousAddress.z}|${home.originalName}|12A`]);
  assert(createHousing({getItem:()=>legacy}).owns(home,12));
 }
 applyPlaceNames(map.buildings,map,parsePlaces(fixture(entry),entry));
 assert.equal(a.name,'国瑞园小区');assert.equal(b.name,'义堂小区');assert.equal(a.oppositeName,b.name);
 assert(!createCityMap(shanghai).buildings.some(b=>b.localPlace));
});
