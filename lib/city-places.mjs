import {cityCoordinates} from './city-distance.mjs';
import {CITY_PLACE_SNAPSHOTS} from './city-place-snapshots.mjs';

export const PLACE_TYPES={residence:'住宅小区',market:'超市',store:'便利店',mall:'百货商店',shopping:'购物中心'};
export const PLACE_ENDPOINT='https://overpass.private.coffee/api/interpreter';
const STORAGE_KEY='lava-city-place-names-v1',TTL=90*86400000;
export const placeCityKey=city=>city.province+'|'+city.name;
const cleanName=value=>typeof value==='string'?value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,80):'';
export function placeQuery(city){
 const coords=cityCoordinates(city);if(!coords)throw new Error('该城市暂无真实地点数据。');
 const name=JSON.stringify(city.name),[lon,lat]=coords;
 // The geographic containment check disambiguates names shared by cities.
 return `[out:json][timeout:25];is_in(${lat},${lon})->.a;area.a[boundary=administrative][name=${name}]->.city;.city out tags;`+
  'nwr(area.city)[landuse=residential][name];out tags 40;'+
  ['supermarket','convenience','department_store','mall'].map(type=>`nwr(area.city)[shop=${type}][name];out tags 12;`).join('');
}
export function parsePlaces(data,city,saved=Date.now()){
 if(data?.remark||!Array.isArray(data?.elements))throw new Error('地点数据暂未完整返回，请稍后重试。');
 const boundary=data.elements.find(e=>e.type==='area'&&e.tags?.boundary==='administrative'&&e.tags.name===city.name);
 if(!boundary)throw new Error('暂未匹配到当前城市的地图范围。');
 const lists=Object.fromEntries(Object.keys(PLACE_TYPES).map(type=>[type,[]])),seen=new Set();
 const shops={supermarket:'market',convenience:'store',department_store:'mall',mall:'shopping'};
 for(const e of data.elements){
  if(!['node','way','relation'].includes(e.type)||!Number.isSafeInteger(e.id)||e.id<=0)continue;
  const tags=e.tags??{},kind=shops[tags.shop]??(tags.landuse==='residential'?'residence':null),name=cleanName(tags['name:zh']||tags.name);
  if(!kind||!name||seen.has(kind+'|'+name))continue;
  seen.add(kind+'|'+name);lists[kind].push({name,url:`https://www.openstreetmap.org/${e.type}/${e.id}`});
 }
 return {city:placeCityKey(city),saved,source:'OpenStreetMap',lists};
}
export function snapshotPlaces(city){return city.country!==0&&city.country!==undefined?null:CITY_PLACE_SNAPSHOTS[placeCityKey(city)]??null;}
export function applyPlaceNames(buildings,city,catalog=snapshotPlaces(city)){
 if(city.country!==0&&city.country!==undefined)return;
 const counts={};
 for(const b of buildings){
  if(!PLACE_TYPES[b.id])continue;
  const index=counts[b.id]??0;counts[b.id]=index+1;
  b.placeSlot??=b.id+'-'+index;b.originalName??=b.name;
  const place=b.localPlace??(catalog?.city===placeCityKey(city)?catalog.lists[b.id]?.[index]:null);
  b.name=place?.name??`${PLACE_TYPES[b.id]}${index+1}（名称未收录）`;b.realPlace=place??null;
 }
}
function validCatalog(value,city){
 return value?.city===placeCityKey(city)&&Number.isFinite(value.saved)&&Object.keys(PLACE_TYPES).every(type=>Array.isArray(value.lists?.[type])&&value.lists[type].length<=80&&value.lists[type].every(p=>cleanName(p.name)===p.name&&/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(p.url)));
}
export function createCityPlaces(options={}){
 const fetcher=options.fetcher??globalThis.fetch,now=options.now??Date.now,wait=options.wait??(ms=>new Promise(r=>setTimeout(r,ms)));
 let storage;try{storage=options.storage??globalThis.localStorage;}catch{}
 const cache=new Map(),pending=new Map();let queue=Promise.resolve(),next=0;
 try{for(const [key,value] of Object.entries(JSON.parse(storage?.getItem(STORAGE_KEY)??'{}')))cache.set(key,value);}catch{}
 function peek(city){const value=cache.get(placeCityKey(city));return validCatalog(value,city)&&now()-value.saved<TTL?value:snapshotPlaces(city);}
 async function get(city,{refresh=false}={}){
  const known=peek(city);if(known&&!refresh)return known;const key=placeCityKey(city);if(pending.has(key))return pending.get(key);
  const task=queue.catch(()=>{}).then(async()=>{
   await wait(Math.max(0,next-now()));next=now()+2000;
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);
   try{
    const response=await fetcher(PLACE_ENDPOINT+'?data='+encodeURIComponent(placeQuery(city)),{signal:controller.signal});
    if(!response.ok)throw new Error('真实地点查询暂不可用，请稍后重试。');
    const catalog=parsePlaces(await response.json(),city,now());cache.set(key,catalog);
    while(cache.size>80)cache.delete(cache.keys().next().value);
    try{storage?.setItem(STORAGE_KEY,JSON.stringify(Object.fromEntries(cache)));}catch{}
    return catalog;
   }catch(error){if(error.name==='AbortError')throw new Error('地点查询超时，已保留现有名称。');throw error;}finally{clearTimeout(timer);}
  });
  pending.set(key,task);queue=task;try{return await task;}finally{pending.delete(key);}
 }
 return {peek,get};
}
