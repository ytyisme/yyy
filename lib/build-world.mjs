import {TRACK_SHAPES,isTrack,groundHeight,trackPoint} from './coaster.mjs';
export const WORLD_LIMIT=120,MAX_OBJECTS=150;
export const ITEMS=Object.freeze([
  {type:'brick',name:'砖块',icon:'▰',color:'#bc7056',size:[3,1.5,2],description:'一块砖，也可以变成一面墙。'},
  {type:'slide',name:'滑梯',icon:'↘',color:'#e6b451',size:[3,4,8],description:'走近按 E，坐上滑梯滑下来。'},
  {type:'pool',name:'水池',icon:'≈',color:'#64b7c2',size:[8,1.2,6],description:'给平地放一片自己的水。'},
  {type:'beer',name:'啤酒',icon:'♧',color:'#758a52',size:[.7,1.8,.7],description:'绿色瓶身，金色瓶盖。'},
  {type:'tv',name:'电视',icon:'▣',color:'#52616c',size:[4,3,1.2],description:'走近按 E，可以打开或关闭。'},
  {type:'track',name:'过山车轨道',icon:'〰',color:'#aa7151',size:[2,6,12],description:'直轨、坡道、急弯、爬升转弯和360°回环。'},
  {type:'stairs',name:'台阶',icon:'▟',color:'#a5aa97',size:[4,3,7],description:'能走上去，也能放进地道连接地下。'},
  {type:'station',name:'轨道停车点',icon:'P',color:'#6c9586',size:[2,1,12],description:'轨道站台，列车在这里停5秒，可以上车。'},
  {type:'coaster',name:'过山车',icon:'▱',color:'#c88461',size:[1.6,1.2,2.6],description:'放到轨道上。第二节车会自动接在同一列车后。'},
  {type:'tunnel',name:'过山车隧道',icon:'∩',color:'#8b9a95',size:[7,6,12],description:'可以套住轨道，也能放到地下。'},
  {type:'exit',name:'下车点',icon:'↪',color:'#a7b48a',size:[2,1,10],description:'带轨道的下车站，乘客到达后自动下车。'},
  {type:'dig',name:'地道开挖',icon:'▥',color:'#a18b71',size:[10,8,18],description:'挖开真实地面。调整高度就是调整开挖深度。'}
]);
export const itemInfo=type=>ITEMS.find(item=>item.type===type);
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const canonicalAngle=value=>{const angle=Math.atan2(Math.sin(value),Math.cos(value));return Math.abs(Math.abs(angle)-Math.PI)<1e-8?Math.PI:(Math.round(angle*1e9)/1e9||0);};
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{4,64}$/.test(id);
export function cleanBuildObject(value){
  if(!value||!validId(value.id)||!itemInfo(value.type))return null;
  for(const key of ['w','h','l'])if(!finite(value[key],.2,60))return null;
  for(const key of ['x','z'])if(!finite(value[key],-WORLD_LIMIT,WORLD_LIMIT))return null;
  if(!Number.isFinite(value.rotation)||!finite(value.y??0,-60,80))return null;
  const object={id:value.id,type:value.type,x:value.x,y:value.type==='dig'?-value.h:(value.y??0),z:value.z,w:value.w,h:value.h,l:value.l,rotation:canonicalAngle(value.rotation),on:value.on!==false};
  if(isTrack(object)){
    const shape=value.shape??'straight';if(!TRACK_SHAPES.some(p=>p[0]===shape))return null;
    object.shape=object.type==='track'?shape:'straight';object.tunnel=!!value.tunnel;
    for(let i=0;i<=24;i++){const point=trackPoint(object,i/24);if(Math.abs(point.x)>WORLD_LIMIT||Math.abs(point.z)>WORLD_LIMIT||point.y< -60||point.y>150)return null;}
  }
  if(object.type==='coaster'){
    if(value.trackId&&!validId(value.trackId)||value.trainId&&!validId(value.trainId)||!Number.isInteger(value.slot??0)||(value.slot??0)<0||(value.slot??0)>31||!finite(value.distance??0,0,50000)||!finite(value.startedAt??0,0,9000000000000000)||!finite(value.speed??9,2,25))return null;
    Object.assign(object,{trackId:value.trackId||'',trainId:value.trainId||object.id,slot:value.slot??0,distance:value.distance??0,startedAt:value.startedAt??0,speed:value.speed??9,running:!!value.running});
  }
  return object;
}
export function makeBuildObject(type,id,x=0,z=0){const info=itemInfo(type);if(!info)throw new Error('未知物品');return cleanBuildObject({id,type,x,y:['track','station','exit'].includes(type)?.8:0,z,w:info.size[0],h:info.size[1],l:info.size[2],rotation:0,on:true});}
export function cleanBuildPose(value){
  if(!value||!finite(value.x,-WORLD_LIMIT,WORLD_LIMIT)||!finite(value.z,-WORLD_LIMIT,WORLD_LIMIT)||!finite(value.y,-60,200)||!Number.isFinite(value.heading))return null;
  const pose={x:value.x,y:value.y,z:value.z,heading:Math.atan2(Math.sin(value.heading),Math.cos(value.heading)),moving:!!value.moving};
  if(value.ride){if(!validId(value.ride)||!Array.isArray(value.quaternion)||value.quaternion.length!==4||value.quaternion.some(n=>!finite(n,-1.01,1.01)))return null;const norm=Math.hypot(...value.quaternion);if(norm<.9||norm>1.1)return null;pose.ride=value.ride;pose.quaternion=value.quaternion.map(n=>n/norm);}
  return pose;
}
export function cleanBuildScene(values){if(!Array.isArray(values)||values.length>MAX_OBJECTS)return null;const objects=values.map(cleanBuildObject);return objects.some(p=>!p)||new Set(objects.map(p=>p.id)).size!==objects.length?null:objects;}
export function starterScene(){return [makeBuildObject('brick','sample-brick',-10,5),makeBuildObject('slide','sample-slide',-13,-3),makeBuildObject('pool','sample-pool',12,-1),makeBuildObject('beer','sample-beer',10,10),makeBuildObject('tv','sample-tv',-12,10)];}
export function loadBuildScene(storage){try{return cleanBuildScene(JSON.parse(storage.getItem('lava-build-world-v1')))||starterScene();}catch{return starterScene();}}
export function saveBuildScene(storage,objects){try{const scene=cleanBuildScene(objects);if(!scene)return false;storage.setItem('lava-build-world-v1',JSON.stringify(scene));return true;}catch{return false;}}
export function localPoint(object,x,z){const dx=x-object.x,dz=z-object.z,c=Math.cos(object.rotation),s=Math.sin(object.rotation);return {x:c*dx-s*dz,z:s*dx+c*dz};}
export function supportHeight(objects,x,z){const all=Array.from(objects);let y=groundHeight(all,x,z);for(const object of all){const p=localPoint(object,x,z),base=object.y??0;if(object.type==='brick'&&Math.abs(p.x)<object.w/2+.25&&Math.abs(p.z)<object.l/2+.25)y=Math.max(y,base+object.h);if(object.type==='stairs'&&Math.abs(p.x)<object.w/2+.2&&Math.abs(p.z)<object.l/2+.2){const steps=Math.min(80,Math.ceil(object.h/.22)),t=Math.min(1,Math.max(0,.5-p.z/object.l));y=Math.max(y,base+Math.ceil(t*steps)/steps*object.h);}if(['station','exit'].includes(object.type)&&Math.abs(p.x)<object.w/2+1.5&&p.z<0&&p.z>-object.l)y=Math.max(y,base-.25);}return y;}
export function slidePoint(object,t){const localZ=(-.37+.77*t)*object.l,c=Math.cos(object.rotation),s=Math.sin(object.rotation);return {x:object.x+s*localZ,z:object.z+c*localZ,y:(object.y??0)+Math.max(0,object.h*(.95*(1-t)))};}
