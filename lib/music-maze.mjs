import {MUSIC_BEAT_CHARTS} from './music-maze-beats.mjs';
export const MUSIC_MAZE_SONGS=Object.freeze([
  {id:'fireflies',title:'夜、萤火虫和你',subtitle:'夜色里的第一束光',file:'assets/concert/song-4.m4a',source:'https://www.bilibili.com/video/BV199HYehE7X/',bpm:103,color:'#d6f786',number:'01'},
  {id:'rice',title:'稻香',subtitle:'回到最初的美好',file:'assets/concert/song-1.m4a',source:'https://www.bilibili.com/video/BV17oHe6UENz/',bpm:82.01,color:'#f4cd7a',number:'02'},
  {id:'level',title:'Level!',subtitle:'心跳加速，继续向前',file:'assets/concert/song-9.m4a',source:'https://www.bilibili.com/video/BV1FuMgziERS/',bpm:150,color:'#b7a3ff',number:'03'},
]);
export const MAZE=Object.freeze({width:1120,height:740,radius:15,bounds:{x:60,y:60,w:1000,h:620},obstacles:[
  {x:245,y:60,w:115,h:205},{x:490,y:250,w:235,h:95},
  {x:835,y:425,w:110,h:255},{x:60,y:485,w:300,h:95},
  {x:520,y:530,w:115,h:150},
]});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function musicTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}

// Curated timing comes from spectral transients fitted to each recording's
// pulse. Vocal loudness changes cannot insert additional collisions.
export function musicBeatMap(id,duration){
  const chart=MUSIC_BEAT_CHARTS[id];
  if(!chart||!Number.isFinite(duration)||Math.abs(chart.duration-duration)>.25)throw new Error('歌曲与节拍数据不匹配，请刷新后重试。');
  return {duration,bpm:chart.bpm,beats:chart.beats.filter(time=>time<duration)};
}
export function audibleClock(currentTime,latency=0,timestamp=null,nowMs=0){
  if(timestamp?.contextTime>0&&timestamp.performanceTime>0){
    const age=(nowMs-timestamp.performanceTime)/1000,estimate=timestamp.contextTime+age;
    if(age>=0&&age<.25&&estimate<=currentTime+.01&&estimate>=currentTime-.5)return Math.min(currentTime,estimate);
  }
  return Math.max(0,currentTime-clamp(Number(latency)||0,0,.5));
}
export function previewBeats(duration=180,bpm=100){const beats=[];for(let t=60/bpm;t<duration;t+=60/bpm)beats.push(t);return beats;}

function nextCollision(point,velocity){
  const {bounds:b,radius:r}=MAZE,candidates=[];
  const add=(distance,nx,ny)=>{if(distance>1e-6&&Number.isFinite(distance))candidates.push({distance,nx,ny});};
  add(((velocity.x>0?b.x+b.w-r:b.x+r)-point.x)/velocity.x,velocity.x>0?-1:1,0);
  add(((velocity.y>0?b.y+b.h-r:b.y+r)-point.y)/velocity.y,0,velocity.y>0?-1:1);
  for(const box of MAZE.obstacles){
    const x1=box.x-r,x2=box.x+box.w+r,y1=box.y-r,y2=box.y+box.h+r;
    if(velocity.x){const x=velocity.x>0?x1:x2,t=(x-point.x)/velocity.x,y=point.y+t*velocity.y;if(y>=y1&&y<=y2)add(t,velocity.x>0?-1:1,0);}
    if(velocity.y){const y=velocity.y>0?y1:y2,t=(y-point.y)/velocity.y,x=point.x+t*velocity.x;if(x>=x1&&x<=x2)add(t,0,velocity.y>0?-1:1);}
  }
  const hit=candidates.sort((a,b)=>a.distance-b.distance)[0];
  const x=point.x+velocity.x*hit.distance,y=point.y+velocity.y*hit.distance;
  // Reflect both components on an exact corner rather than entering a wall.
  for(const other of candidates)if(Math.abs(other.distance-hit.distance)<1e-5){if(other.nx)hit.nx=other.nx;if(other.ny)hit.ny=other.ny;}
  return {x,y,nx:hit.nx,ny:hit.ny};
}
export function createMusicRoute(beats,duration,seed=0){
  const points=[{x:140+seed*12,y:138,time:0,nx:0,ny:0}],velocity={x:.804,y:.594};
  const times=beats.filter((t,i)=>Number.isFinite(t)&&t>0&&t<duration&&(i===0||t>beats[i-1]));
  const last=times.at(-1)??0,interval=times.length>1?last-times.at(-2):.6;
  // The song ending is not an extra beat: the final segment stops in flight.
  const tail=Math.max(duration+.001,last+interval);
  for(const time of [...times,tail]){
    const hit=nextCollision(points.at(-1),velocity);points.push({...hit,time});
    if(hit.nx)velocity.x*=-1;if(hit.ny)velocity.y*=-1;
  }
  return {points,duration};
}
export function musicRouteAt(route,seconds){
  const t=clamp(Number(seconds)||0,0,route.duration),points=route.points;let low=0,high=points.length-1;
  while(low<high){const middle=Math.ceil((low+high)/2);if(points[middle].time<=t)low=middle;else high=middle-1;}
  const a=points[low],b=points[Math.min(low+1,points.length-1)],f=b.time===a.time?0:(t-a.time)/(b.time-a.time);
  return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,index:low,impact:a,flash:low?Math.max(0,1-(t-a.time)/.22):0};
}
