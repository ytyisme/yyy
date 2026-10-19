import {chinaCities} from './city-cities.mjs';
import {buildings as services,terrainHeight} from './city-rules.mjs';
import {rampsAt,nearestOnSegment} from './city-roads.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function hash(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const styles=[{name:'砖石街区',wall:0xb89378,roof:0x795c50},{name:'现代天际线',wall:0x99bbc8,roof:0x49647a},{name:'江南街巷',wall:0xe8dfc9,roof:0x455b5c},{name:'山城街区',wall:0xc3a88f,roof:0x5d7270},{name:'海港城区',wall:0xb6cbd1,roof:0x5b8092},{name:'高原小城',wall:0xd7b998,roof:0x8b654e}];
const names=['梧桐','青禾','星河','晴空','云杉','河畔','锦绣','松风','东城','海棠'];
const legacyHomes=[[-110,-110,'河畔花园',24],[110,110,'晴空小区',24],[154,-154,'海景公馆',21],[-66,-110,'青禾家园',18],[-66,154,'梧桐小区',18],[66,110,'星河社区',18],[154,110,'东城花园',21],[-110,154,'河畔新苑',24],[66,-154,'晨曦社区',18]];
export function createCityMap(entry=chinaCities[0],country=0){
 const index=entry.index??0,seed=hash(country+'|'+entry.province+'|'+entry.name),r=random(seed);
 const mountainous=/重庆|四川|贵州|云南|西藏|青海|甘肃|新疆|山西/.test(entry.province??entry.name);
 const coastal=/上海|天津|大连|青岛|烟台|威海|厦门|深圳|珠海|汕头|海口|三亚|舟山|宁波|北海|防城港/.test(entry.name);
 const arid=/新疆|宁夏|甘肃|内蒙古/.test(entry.province??'');
 const style=styles[mountainous?3:coastal?4:arid?5:Math.floor(r()*3)];
 const xs=[-178-r()*9,-132+(r()-.5)*14,-88+(r()-.5)*12,-44,0,44,88+(r()-.5)*14,132+(r()-.5)*12,176];
 const zs=[-176+(r()-.5)*16,-132+(r()-.5)*14,-88+(r()-.5)*12,-44,0,44,132,178+(r()-.5)*12];
 const roads=[];const width=9+r()*3,streetKind=index%4;
 for(const [i,x] of xs.entries())roads.push({a:{x,z:-250},b:{x,z:250},width,name:names[(index+i)%names.length]+'大道',axis:'NS'});
 for(const [i,z] of zs.entries())roads.push({a:{x:-250,z},b:{x:250,z},width:width+(i%2),name:names[(index+i+3)%names.length]+'路',axis:'EW'});
 // The garage interrupts two streets; a street to its east connects the bypass.
 const hills=Array.from({length:mountainous?5:3},()=>({x:-235+r()*130,z:-230+r()*440,radius:75+r()*65,height:(mountainous?12:2)+r()*(mountainous?16:5)}));
 const river={x:-152+r()*24,width:15+r()*13,bend:5+r()*17,phase:r()*6};
 const lake={x:85+r()*50,z:-205+r()*28,rx:18+r()*18,rz:12+r()*14};
 const coast=coastal?{z:-230+r()*12}:null;
 const extraRoads=[];
 if(streetKind===1){
  const radius=152+r()*18;
  for(let i=0;i<36;i++){const a=i/36*Math.PI*2,b=(i+1)/36*Math.PI*2;extraRoads.push({a:{x:Math.cos(a)*radius,z:Math.sin(a)*radius},b:{x:Math.cos(b)*radius,z:Math.sin(b)*radius},width:11,name:'环城大道',axis:'curve'});}
  for(let i=roads.length-1;i>=0;i--)if((roads[i].axis==='NS'&&Math.abs(roads[i].a.x)>70&&Math.abs(roads[i].a.x)<145&&roads[i].a.x>0))roads.splice(i,1);
 }else if(streetKind===2){
  extraRoads.push({a:{x:-225,z:-205},b:{x:215,z:-65},width:13,name:'城市景观大道',axis:'diagonal'});
 }else if(streetKind===3){
  for(let z=-225;z<225;z+=25){const point=z=>({x:river.x+Math.sin(z/75+river.phase)*river.bend+river.width/2+25,z});extraRoads.push({a:point(z),b:point(z+25),width:9,name:'滨河路',axis:'curve'});}
 }
 roads.push(...extraRoads);
 const plots=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;
  if((x>-16&&x<60&&z>35&&z<115)||Math.hypot(x,z)<15||x<-125||z<-185)continue;
  const plot={x,z,w:Math.min(27,xs[i+1]-xs[i]-17),d:Math.min(25,zs[j+1]-zs[j]-17)};
  if(waterAt({river,lake,coast},x,z))continue;
  if(extraRoads.some(road=>{const q=nearestOnSegment(plot,{...road.a,y:0},{...road.b,y:0}),length=Math.hypot(road.b.x-road.a.x,road.b.z-road.a.z),nx=(road.b.z-road.a.z)/length,nz=(road.a.x-road.b.x)/length;return q.distance<road.width/2+Math.abs(nx)*plot.w/2+Math.abs(nz)*plot.d/2+1;}))continue;
  plots.push(plot);
 }
 for(let i=plots.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[plots[i],plots[j]]=[plots[j],plots[i]];}
 const layout=[];
 services.forEach((b,i)=>{
  const plot=index===0&&country===0?{x:b.x,z:b.z,w:22,d:20}:plots.pop();
  const floors=b.id==='office'?20+Math.floor(r()*12):b.id==='hotel'?16+Math.floor(r()*10):b.floors?Math.max(8,b.floors+Math.floor(r()*5)):null;
  layout.push({...b,...plot,height:floors?floors*4:Math.max(6,b.height*(.75+r()*.7)),floors:floors??b.floors,style:Math.floor(r()*4),roof:style.roof,color:style.wall,cityId:country+':'+index});
 });
 for(let i=plots.length-1;i>=0;i--)if(layout.some(b=>Math.abs(b.x-plots[i].x)<(b.w+plots[i].w)/2+3&&Math.abs(b.z-plots[i].z)<(b.d+plots[i].d)/2+3))plots.splice(i,1);
 for(let i=0;i<9;i++){
  const plot=plots.pop(),legacy=index===0&&country===0?legacyHomes[i]:null,floors=Math.max(18+Math.floor(r()*15),legacy?.[3]??0);
  layout.push({...plot,id:'residence',name:entry.name+names[(index+i)%names.length]+'小区',height:floors*4,floors,legacyHome:legacy?{x:legacy[0],z:legacy[1],name:legacy[2]}:null,style:Math.floor(r()*4),roof:style.roof,color:style.wall,cityId:country+':'+index,role:'物业管家',desc:'乘电梯到楼上看房、购买自己的家；邻居已经入住。',items:[['查看房源与邻居',0,'housing']]});
 }
 layout.push({...plots.pop(),id:'airport',name:entry.name+'机场',height:12+r()*5,style:1,roof:style.roof,color:0xb5c8d5,cityId:country+':'+index,role:'机场地勤',desc:'在柜台选择国际航班，登机后前往另一国家。',items:[['选择国际机票',3800,'flights']]});
 layout.push({...plots.pop(),id:'shopping',name:entry.name+'购物中心',height:40,floors:10,style:2,roof:style.roof,color:0xcab1c4,cityId:country+':'+index,role:'商场导购',desc:'购物中心有十层，乘电梯选择楼层。',items:[['游戏机',2999,'item'],['家居沙发',1999,'item'],['购物中心午餐',58,'food']]});
 layout.push({...plots.pop(),id:'amusement',name:entry.name+'游乐园',height:8,style:0,roof:style.roof,color:0xe6bd89,cityId:country+':'+index,role:'乐园工作人员',desc:'欢迎体验旋转摩天轮。',items:[['乘坐摩天轮',80,'wheel']]});
 const park=plots.pop();
 return {index,name:entry.name,province:entry.province??'',country,seed,key:'city-'+country+'-'+index,x:0,z:0,cx:0,cz:0,xs,zs,roads,hills,river,lake,coast,buildings:layout,park,style,streetKind,streetName:['棋盘街区','环城路网','斜向大道','滨河街区'][streetKind],ground:arid?0xc9bd94:mountainous?0x99b19b:coastal?0xb5cfb2:0xb6cd9c,terrainName:coastal?'海湾、河道与丘陵':mountainous?'山谷、坡地与河道':arid?'旱地、河谷与台地':'河道、湖泊与缓丘'};
}
export function waterAt(map,x,z){
 if(map.coast&&z<map.coast.z)return 'sea';
 if(Math.pow((x-map.lake.x)/map.lake.rx,2)+Math.pow((z-map.lake.z)/map.lake.rz,2)<1)return 'lake';
 const center=map.river.x+Math.sin(z/75+map.river.phase)*map.river.bend;
 return Math.abs(x-center)<map.river.width/2?'river':null;
}
export function mapTerrain(map,x,z){
 if(x>=-8&&x<=58&&z>=40&&z<=110)return terrainHeight(x,z);
 const central=clamp((Math.hypot(x,z)-82)/55,0,1);
 let h=0;for(const hill of map.hills)h+=hill.height*Math.exp(-((x-hill.x)**2+(z-hill.z)**2)/(2*hill.radius**2));
 const river=map.river.x+Math.sin(z/75+map.river.phase)*map.river.bend;
 const shore=clamp((Math.abs(x-river)-map.river.width/2)/32,0,1);
 const highway=clamp(Math.min(Math.abs(x-240),Math.abs(z-240))/38,0,1);
 const rampClear=clamp((Math.hypot(x-196,z-132)-48)/32,0,1);
 // Reserve a level station apron and a continuous ground-level railway bed.
 const railClear=clamp((Math.abs(z-224)-7)/18,0,1);
 const stationClear=clamp(Math.max((Math.abs(x-10)-67)/12,(183-z)/12,(z-229)/12),0,1);
 return h*central*shore*highway*rampClear*railClear*stationClear;
}
export function mapRoadAt(map,p){
 const {x,z}=p;
 if(Math.abs(x-240)<=10||Math.abs(z-240)<=10)return {type:'highway',height:8,limit:120};
 let nearest=null;
 for(const points of rampsAt({x:0,z:0}))for(let i=1;i<points.length;i++){
  const q=nearestOnSegment(p,points[i-1],points[i]);if(q.distance<=8&&(!nearest||q.distance<nearest.distance))nearest=q;
 }
 if(nearest)return {type:'ramp',height:nearest.y,limit:40};
 let road=null,distance=Infinity;
 for(const street of map.roads){const q=nearestOnSegment(p,{...street.a,y:0},{...street.b,y:0});if(q.distance<distance){distance=q.distance;road=street;}}
 const bridge=distance<road.width/2+1&&!!waterAt(map,x,z);
 const height=mapTerrain(map,x,z);
 return {type:distance<road.width/2+1?'street':'terrain',height:bridge?.8:height,limit:distance<road.width/2+1?60:30,road};
}
export function mapSurface(map,x,z){
 return mapRoadAt(map,{x,z}).height;
}
export function crossingGarage(a,b){
 return Math.min(a.x,b.x)<56&&Math.max(a.x,b.x)>-5&&Math.min(a.z,b.z)<110&&Math.max(a.z,b.z)>46;
}
export function nearestStreet(map,p){
 let best=null;
 for(const road of map.roads){const q=nearestOnSegment(p,{...road.a,y:0},{...road.b,y:0});if(crossingGarage(q,q))continue;if(!best||q.distance<best.distance)best={...q,road,axis:road.axis};}
 return best;
}
export function streetRoute(map,from,to){
 const start=nearestStreet(map,from),end=nearestStreet(map,to);if(!start||!end)return [];
 const nodes=[],edges=[],byPoint=new Map(),points=map.roads.map(road=>[road.a,road.b]);
 const add=p=>{const key=p.x.toFixed(3)+','+p.z.toFixed(3);if(!byPoint.has(key)){byPoint.set(key,nodes.length);nodes.push({x:p.x,z:p.z,y:mapSurface(map,p.x,p.z)});edges.push([]);}return byPoint.get(key);};
 const startRoad=map.roads.indexOf(start.road),endRoad=map.roads.indexOf(end.road);points[startRoad].push(start);points[endRoad].push(end);
 for(let i=0;i<map.roads.length;i++)for(let j=i+1;j<map.roads.length;j++){
  const a=map.roads[i].a,b=map.roads[i].b,c=map.roads[j].a,d=map.roads[j].b,dx=b.x-a.x,dz=b.z-a.z,ex=d.x-c.x,ez=d.z-c.z,den=dx*ez-dz*ex;
  if(Math.abs(den)<.000001)continue;
  const t=((c.x-a.x)*ez-(c.z-a.z)*ex)/den,u=((c.x-a.x)*dz-(c.z-a.z)*dx)/den;
  if(t<-.000001||t>1.000001||u<-.000001||u>1.000001)continue;
  const q={x:a.x+dx*t,z:a.z+dz*t};points[i].push(q);points[j].push(q);
 }
 for(let i=0;i<points.length;i++){
  const a=map.roads[i].a,b=map.roads[i].b,dx=b.x-a.x,dz=b.z-a.z;
  points[i].sort((p,q)=>((p.x-a.x)*dx+(p.z-a.z)*dz)-((q.x-a.x)*dx+(q.z-a.z)*dz));
  for(let j=1;j<points[i].length;j++){const p=points[i][j-1],q=points[i][j];if(crossingGarage(p,q))continue;const left=add(p),right=add(q),distance=Math.hypot(p.x-q.x,p.z-q.z);if(left!==right){edges[left].push([right,distance]);edges[right].push([left,distance]);}}
 }
 const source=add(start),target=add(end),costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),done=new Set();costs[source]=0;
 for(let step=0;step<nodes.length;step++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||costs[j]<costs[i]))i=j;if(i<0||!Number.isFinite(costs[i])||i===target)break;done.add(i);for(const [j,d] of edges[i])if(costs[i]+d<costs[j]){costs[j]=costs[i]+d;previous[j]=i;}}
 if(!Number.isFinite(costs[target]))return [];
 const path=[];let node=target;while(node>=0){path.unshift(nodes[node]);node=previous[node];}
 return [{x:from.x,z:from.z,y:mapSurface(map,from.x,from.z)},...path,{x:to.x,z:to.z,y:mapSurface(map,to.x,to.z)}].filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.z-a[i-1].z)>.01);
}
export function departureRoute(map,p){
 const ramp=rampsAt({x:0,z:0})[0];
 return [...streetRoute(map,p,ramp[0]),...ramp.slice(1),{x:240,z:-282,y:8}];
}
export function highwayTrip(from,destination){
 const length=1200+((from.seed^hash(destination.name))>>>0)%1200;
 const points=[{x:0,z:0,y:8},{x:0,z:length,y:8}];
 return {from:from.index,destination,length,points,source:from};
}
export function entryRoute(){return [...rampsAt({x:0,z:0})[0]].reverse();}
