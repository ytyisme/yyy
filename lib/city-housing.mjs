const residents=['小林','陈阿姨','王叔叔','晓雨','小周','阿杰','李老师','婷婷'];
export function createHousing(storage=globalThis.localStorage){
 let owned=new Set();try{const saved=JSON.parse(storage?.getItem('lava-city-homes-v1')??'[]');if(Array.isArray(saved))owned=new Set(saved.filter(x=>typeof x==='string'));}catch{}
 const oldKey=(b,floor,country=0,x=b.x,z=b.z,name=b.name)=>`${country}|${b.cityId?b.cityId+'|':''}${x},${z}|${name}|${floor}A`;
 const key=(b,floor,country=0)=>b.placeSlot&&b.cityId?`${country}|${b.cityId}|${b.placeSlot}|${floor}A`:oldKey(b,floor,country);
 const legacyKey=(b,floor,country)=>b.legacyHome?`${country}|${b.legacyHome.x},${b.legacyHome.z}|${b.legacyHome.name}|${floor}A`:null;
 function save(){try{storage?.setItem('lava-city-homes-v1',JSON.stringify([...owned]));}catch{}}
 return {
  owns(b,floor,country=0){return owned.has(key(b,floor,country))||owned.has(legacyKey(b,floor,country))||owned.has(oldKey(b,floor,country))||!!b.previousAddress&&[1,4].some(scale=>owned.has(oldKey(b,floor,country,b.previousAddress.x/scale,b.previousAddress.z/scale,b.originalName)))||!!b.originalName&&(owned.has(oldKey(b,floor,country,b.x,b.z,b.originalName))||owned.has(oldKey(b,floor,country,b.x/4,b.z/4,b.originalName)))},
  buy(b,floor,country=0){if(b.id!=='residence'||!Number.isInteger(floor)||floor<2||floor>b.floors)return false;owned.add(key(b,floor,country));save();return true},
  resident(floor){return residents[(floor-1)%residents.length]},
  get count(){return owned.size}
 };
}
