import {STREET_LINES,roadAt} from './city-roads.mjs';
import {createIndependentWorld} from './city-map-world.mjs';
import {cityAtGrid,highwayNames} from './city-cities.mjs';
export const countries=[
 {name:'中国',cities:['北京市','上海市','广州市','深圳市'],sky:0xc6e0e8,ground:0xb6cd9c},
 {name:'日本',cities:['樱花城','海港城','山麓城','花见城'],sky:0xdde3ec,ground:0xc5d6ab},
 {name:'法国',cities:['塞纳城','蔚蓝城','葡萄城','白石城'],sky:0xc9dded,ground:0xbccc9c},
 {name:'美国',cities:['星港城','红岩城','湖畔城','金桥城'],sky:0xc4deef,ground:0xc3cba0},
 {name:'英国',cities:['雾桥城','玫瑰城','绿丘城','钟塔城'],sky:0xcbdce8,ground:0xaec19a},
 {name:'德国',cities:['林堡城','莱茵城','银杉城','风车城'],sky:0xcde3ed,ground:0xa9c795},
 {name:'意大利',cities:['晴光城','水巷城','橄榄城','石桥城'],sky:0xc4e2f5,ground:0xcbd2a0},
 {name:'西班牙',cities:['日耀城','蓝湾城','橙花城','红瓦城'],sky:0xb8dcf5,ground:0xd5d0a1},
 {name:'澳大利亚',cities:['珊瑚城','桉树城','海帆城','金砂城'],sky:0xb6dff6,ground:0xc5cf9d},
 {name:'加拿大',cities:['枫叶城','雪松城','蓝湖城','北星城'],sky:0xc5e4f2,ground:0xaac8a4},
 {name:'巴西',cities:['雨林城','彩羽城','阳光湾','绿洲城'],sky:0xbadfee,ground:0xa4ce92},
 {name:'埃及',cities:['尼罗城','金塔城','椰枣城','沙洲城'],sky:0xd1e6f4,ground:0xdcca98},
 {name:'新加坡',cities:['花园城','狮湾城','雨树城','星洲城'],sky:0xbfe3ed,ground:0xa7d19f},
 {name:'泰国',cities:['莲花城','金榕城','椰风城','兰花城'],sky:0xc2e5ef,ground:0xb4d19b},
 {name:'印度',cities:['茉莉城','宝石城','芒果城','孔雀城'],sky:0xc7e2f2,ground:0xcace9b},
 {name:'韩国',cities:['汉江城','银杏城','海云城','晨光城'],sky:0xc9e1ed,ground:0xb4ceab}
];
export function regionAt(x,z,country=0){const cx=Math.round(x/600),cz=Math.round(z/600),seed=Math.abs(cx*13+cz*7),entry=country===0?cityAtGrid(cx,cz):null;return {cx,cz,x:cx*600,z:cz*600,key:`${cx},${cz}`,name:entry?.name??countries[country].cities[seed%4]+(cx||cz?` ${cx},${cz}`:''),province:entry?.province??'',index:entry?.index,country:countries[country].name};}

const buildingNames={
 market:['青禾超市','丰盛超市','悦购超市','果园超市','乐家超市','万家超市','绿叶超市','惠民超市','新鲜超市','百味超市','嘉邻超市','优选超市','金穗超市','汇鲜超市','缤纷超市','福满超市'],
 store:['好邻便利店','橙子便利店','小熊便利店','晨光便利店','安心便利店','百合便利店','向日葵便利店','晴天便利店','暖心便利店','小鹿便利店','乐途便利店','晚风便利店','拾光便利店','蓝鲸便利店','绿芽便利店','星点便利店'],
 mall:['星愿百货','锦绣商店','彩虹商店','云朵百货','趣购商店','时光百货','木棉商店','新悦百货','春华商店','金桥百货','梧桐商店','乐活百货','花语商店','远山百货','星港商店','月湾百货'],
 school:['晨曦学校','明德学校','青松学校','星辰学校','育才学校','博文学校','知行学校','希望学校','春蕾学校','文华学校','启航学校','致远学校','桃李学校','新知学校','书香学校','未来学校']
};
export function buildingName(b,cx=0,cz=0,country=0){
 const names=buildingNames[b.id];if(!names)return b.name;
 // Pair signed city coordinates so names stay stable after a city is unloaded.
 const x=cx>=0?cx*2:-cx*2-1,z=cz>=0?cz*2:-cz*2-1;
 const index=((x+z)*(x+z+1)/2+z)*37+country*11;
 const name=names[index%names.length],branch=Math.floor(index/names.length)+1;
 return branch===1?name:`${name} · ${branch}${b.id==='school'?'校区':'店'}`;
}
export function nightStrength(minutes){const h=((minutes/60)%24+24)%24;return h>=19||h<5?1:h>=17?(h-17)/2:h<7?(7-h)/2:0;}
// Water occupies the edge of each city; bridges preserve both highway routes.
export function waterfrontAt(x,z){const r=regionAt(x,z),dx=x-r.x,dz=z-r.z;if(roadAt({x,z}).height>0)return 'bridge';if(dz < -220)return Math.abs(dx)<=8?'bridge':'sea';if(Math.abs(dx+145)<18)return STREET_LINES.some(n=>Math.abs(dz-n)<=8)?'bridge':'river';if(dz < -195)return 'beach';return null;}
export function createWorld(api){return createIndependentWorld({...api,countries,buildingName});}
