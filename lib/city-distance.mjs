import {CITY_COORDINATES} from './city-coordinates.mjs';
export const ROUTING_PROVIDER='https://routing.openstreetmap.de/routed-car/route/v1/driving/';
const TTL=7*86400000,KEY='lava-city-road-routes-v1';
export function cityCoordinates(city){if(!city||(Number.isInteger(city.country)&&city.country!==0))return null;return CITY_COORDINATES[city.province+'|'+city.name]??null;}
export function cityDistance(from,to){
  const a=cityCoordinates(from),b=cityCoordinates(to);if(!a||!b)return null;
  const rad=Math.PI/180,lat1=a[1]*rad,lat2=b[1]*rad,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;
  const s=Math.sin(dlat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(s),Math.sqrt(Math.max(0,1-s)));
}
export function cityDistanceText(metres){return metres>=1000?(metres/1000).toLocaleString('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1})+' km':Math.max(0,Math.ceil(metres))+' m';}
export function cityTravelTime(seconds){const minutes=Math.max(1,Math.ceil(seconds/60));return minutes>=60?`${Math.floor(minutes/60)}小时${minutes%60}分钟`:`${minutes}分钟`;}
export function routeKey(from,to){const a=cityCoordinates(from),b=cityCoordinates(to);return a&&b?a.join(',')+';'+b.join(','):null;}
export function validCityRoute(route,from,to){const line=cityDistance(from,to);return line!==null&&!!route&&route.kind==='road'&&route.key===routeKey(from,to)&&Number.isFinite(route.distance)&&route.distance>0&&route.distance<20000000&&route.distance>=Math.max(0,line-10000)&&Number.isFinite(route.duration)&&route.duration>0&&route.duration<2000000;}

export function createCityRouting(options={}){
  const fetcher=options.fetcher??globalThis.fetch,now=options.now??Date.now,wait=options.wait??(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
  let storage;try{storage=options.storage??globalThis.localStorage;}catch{}
  const cache=new Map(),pending=new Map();let queue=Promise.resolve(),nextRequest=0;
  try{for(const [key,value] of Object.entries(JSON.parse(storage?.getItem(KEY)??'{}')))if(now()-value.saved<TTL)cache.set(key,value);}catch{}
  function peek(from,to){const route=cache.get(routeKey(from,to));return validCityRoute(route,from,to)&&now()-route.saved<TTL?route:null;}
  function save(){while(cache.size>80)cache.delete(cache.keys().next().value);try{storage?.setItem(KEY,JSON.stringify(Object.fromEntries(cache)));}catch{}}
  async function get(from,to){
    const key=routeKey(from,to);if(!key||cityDistance(from,to)<1)throw new Error('当前城市无需跨城行驶。');
    const known=peek(from,to);if(known)return known;if(pending.has(key))return pending.get(key);
    const task=queue.catch(()=>{}).then(async()=>{
      await wait(Math.max(0,nextRequest-now()));nextRequest=now()+1050;
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),22000);
      try{
        const response=await fetcher(ROUTING_PROVIDER+key+'?overview=false&steps=false&radiuses=5000;5000',{signal:controller.signal});
        if(!response.ok)throw new Error('公路里程服务暂不可用，请稍后重试。');const data=await response.json();
        if(data.code!=='Ok'||!data.routes?.[0])throw new Error('暂未找到这两座城市之间可通行的公路路线。');
        const route={kind:'road',key,distance:Math.round(data.routes[0].distance),duration:Math.round(data.routes[0].duration),saved:now(),provider:'OSM / FOSSGIS OSRM'};
        if(!validCityRoute(route,from,to))throw new Error('返回的公路里程无效，请重试。');cache.set(key,route);save();return route;
      }catch(error){if(error.name==='AbortError')throw new Error('公路里程查询超时，请检查网络后重试。');throw error;}finally{clearTimeout(timer);}
    });
    pending.set(key,task);queue=task;try{return await task;}finally{pending.delete(key);}
  }
  return {peek,get};
}

// Fixed number of chunks: a five-thousand-kilometre trip costs the same as a
// short drive. Coordinates remain physical metres; this is not time scaling.
export function highwayWindow(position,length,size=90,count=13){
  const total=Math.ceil((length+80)/size),start=Math.max(-1,Math.floor(Math.max(0,position)/size)-4);
  return Array.from({length:count},(_,i)=>{const chunk=start+i;return {index:chunk,z:chunk*size,size,visible:chunk<total};});
}
