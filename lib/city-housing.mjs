const residents=['小林','陈阿姨','王叔叔','晓雨','小周','阿杰','李老师','婷婷'];
export function createHousing(storage=globalThis.localStorage){
 let owned=new Set();try{const saved=JSON.parse(storage?.getItem('lava-city-homes-v1')??'[]');if(Array.isArray(saved))owned=new Set(saved.filter(x=>typeof x==='string'));}catch{}
 const key=(b,floor,country=0)=>`${country}|${b.cityId?b.cityId+'|':''}${b.x},${b.z}|${b.name}|${floor}A`;
 const legacyKey=(b,floor,country)=>b.legacyHome?`${country}|${b.legacyHome.x},${b.legacyHome.z}|${b.legacyHome.name}|${floor}A`:null;
 function save(){try{storage?.setItem('lava-city-homes-v1',JSON.stringify([...owned]));}catch{}}
 return {
  owns(b,floor,country=0){return owned.has(key(b,floor,country))||owned.has(legacyKey(b,floor,country))},
  buy(b,floor,country=0){if(b.id!=='residence'||!Number.isInteger(floor)||floor<2||floor>b.floors)return false;owned.add(key(b,floor,country));save();return true},
  resident(floor){return residents[(floor-1)%residents.length]},
  get count(){return owned.size}
 };
}
