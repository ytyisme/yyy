import {VIDEO_CATALOG} from './video-catalog.mjs';

export {VIDEO_CATALOG};
export const VIDEO_STORAGE_KEY='lava.video-room.v1';
export const VIDEO_CATEGORIES=Object.freeze([
  {id:'all',title:'全部推荐',mark:'✦'},
  {id:'animation',title:'动画',mark:'◈'},
  {id:'science',title:'科普',mark:'◎'},
  {id:'music',title:'音乐',mark:'♫'},
  {id:'gaming',title:'游戏',mark:'✚'},
]);

export function normalizeVideoId(value){
  if(typeof value!=='string')return null;
  if(/^bv1[0-9a-z]{9}$/i.test(value))return 'BV'+value.slice(2);
  if(/^av[1-9]\d{0,17}$/i.test(value))return 'av'+value.slice(2);
  if(/^dy:\d{15,22}$/.test(value)||/^ks:[a-zA-Z0-9_-]{8,40}$/.test(value)||/^local:[a-zA-Z0-9_-]{8,40}$/.test(value))return value;
  return null;
}
const pageNumber=value=>/^\d+$/.test(String(value))&&Number(value)>=1&&Number(value)<=1000?Number(value):1;

// Accept canonical identifiers and full video URLs from the supported sources.
// User input never becomes an arbitrary server-side proxy target.
export function parseVideoLink(input){
  if(typeof input!=='string'||input.length>2000)return null;
  const text=input.trim(),direct=normalizeVideoId(text);
  if(direct)return {id:direct,page:1};
  const candidate=text.match(/https?:\/\/[^\s<>"，。！？【】（）]+/i)?.[0];
  if(!candidate)return null;
  try{
    const url=new URL(candidate);
    if(url.username||url.password||url.port)return null;
    if(['www.douyin.com','douyin.com','jingxuan.douyin.com'].includes(url.hostname)){
      const match=url.pathname.match(/^\/(?:m\/)?video\/(\d{15,22})\/?$/);
      return match?{id:'dy:'+match[1],page:1}:null;
    }
    if(['www.kuaishou.com','kuaishou.com'].includes(url.hostname)){
      const match=url.pathname.match(/^\/short-video\/([a-zA-Z0-9_-]{8,40})\/?$/);
      return match?{id:'ks:'+match[1],page:1}:null;
    }
    if(!['www.bilibili.com','bilibili.com','m.bilibili.com'].includes(url.hostname))return null;
    const match=url.pathname.match(/^\/video\/(BV1[0-9a-z]{9}|av[1-9]\d{0,17})\/?$/i);
    const id=normalizeVideoId(match?.[1]);
    return id?{id,page:pageNumber(url.searchParams.get('p')??1)}:null;
  }catch{return null;}
}
export function videoPageUrl(video,page=video?.page??1){
  const id=normalizeVideoId(video?.id);if(!id)return null;
  if(id.startsWith('local:'))return null;
  if(id.startsWith('dy:'))return 'https://www.douyin.com/video/'+id.slice(3);
  if(id.startsWith('ks:'))return 'https://www.kuaishou.com/short-video/'+id.slice(3);
  const url=new URL(`https://www.bilibili.com/video/${id}/`);
  if(pageNumber(page)>1)url.searchParams.set('p',String(pageNumber(page)));
  return url.href;
}
export function videoPlayerUrl(video,page=video?.page??1){
  const id=normalizeVideoId(video?.id);if(!id)return null;
  return '/api/video/play?'+new URLSearchParams({id,page:String(pageNumber(page))});
}
export function cleanMediaUrl(value){
  if(typeof value!=='string'||value.length>4000)return null;
  if(/^\/?assets\/[a-zA-Z0-9_./%-]+\.(?:mp4|webm)$/i.test(value)&&!value.includes('..'))return value;
  try{
    const url=new URL(value),host=url.hostname;
    if(url.protocol!=='https:'||url.username||url.password||url.port||host==='localhost'||host.endsWith('.local')||!host.includes('.')||/^[\d.]+$/.test(host)||host.includes(':'))return null;
    return /\.(mp4|webm)$/i.test(url.pathname)?url.href:null;
  }catch{return null;}
}
function uniqueIds(values,limit){
  return [...new Set((Array.isArray(values)?values:[]).map(normalizeVideoId).filter(Boolean))].slice(0,limit);
}
export function normalizeVideoLibrary(value){
  const source=value&&typeof value==='object'?value:{};
  const custom=[];
  for(const entry of Array.isArray(source.custom)?source.custom:[]){
    const id=normalizeVideoId(entry?.id);
    if(id&&!custom.some(v=>v.id===id)&&!VIDEO_CATALOG.some(v=>v.id===id)){
      const row={id,page:pageNumber(entry.page)};
      for(const key of ['title','author','creatorId'])if(typeof entry[key]==='string'&&entry[key].trim())row[key]=entry[key].slice(0,key==='title'?200:100);
      if(Array.isArray(entry.parts))row.parts=entry.parts.slice(0,100).map(p=>({title:String(p?.title??'视频').slice(0,200),duration:Math.max(0,Number(p?.duration)||0)}));
      custom.push(row);
    }
    if(custom.length===30)break;
  }
  const valid=new Set([...VIDEO_CATALOG,...custom].map(v=>v.id));
  const sources={};
  for(const [id,url] of Object.entries(source.sources&&typeof source.sources==='object'?source.sources:{}))if(valid.has(id)&&cleanMediaUrl(url))sources[id]=cleanMediaUrl(url);
  return {custom,sources,favorites:uniqueIds(source.favorites,100).filter(id=>valid.has(id)),recent:uniqueIds(source.recent,60).filter(id=>valid.has(id))};
}
export function readVideoLibrary(storage){
  try{return normalizeVideoLibrary(JSON.parse(storage?.getItem(VIDEO_STORAGE_KEY)??'null'));}catch{return normalizeVideoLibrary(null);}
}
export function writeVideoLibrary(storage,library){
  try{if(!storage)return false;storage.setItem(VIDEO_STORAGE_KEY,JSON.stringify(normalizeVideoLibrary(library)));return true;}catch{return false;}
}
export function videoList(library){
  const state=normalizeVideoLibrary(library);
  const categories=VIDEO_CATEGORIES.slice(1).map(c=>VIDEO_CATALOG.filter(v=>v.category===c.id));
  const mixed=Array.from({length:Math.max(...categories.map(v=>v.length))},(_,i)=>categories.map(v=>v[i]).filter(Boolean)).flat();
  return [...state.custom.map(v=>({title:'我的视频',author:'我的片单',category:'custom',parts:[],duration:0,...v})),...mixed].map(v=>({...v,mediaUrl:state.sources[v.id]??null}));
}
export function filterVideos({library,query='',category='all',collection='all'}={}){
  const state=normalizeVideoLibrary(library),all=videoList(state),words=String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const ids=collection==='favorites'?state.favorites:collection==='recent'?state.recent:null;
  const rows=ids?ids.map(id=>all.find(v=>v.id===id)).filter(Boolean):all;
  return rows.filter(video=>(category==='all'||video.category===category)&&words.every(word=>`${video.title} ${video.author} ${video.id} ${VIDEO_CATEGORIES.find(c=>c.id===video.category)?.title??'我的链接'}`.toLocaleLowerCase().includes(word)));
}
export function toggleVideoFavorite(library,id){
  const state=normalizeVideoLibrary(library);
  if(!videoList(state).some(v=>v.id===id))return state;
  state.favorites=state.favorites.includes(id)?state.favorites.filter(v=>v!==id):[id,...state.favorites].slice(0,100);
  return state;
}
export function rememberVideo(library,id){
  const state=normalizeVideoLibrary(library);
  if(videoList(state).some(v=>v.id===id))state.recent=[id,...state.recent.filter(v=>v!==id)].slice(0,60);
  return state;
}
export function addVideoLink(library,input){
  const parsed=parseVideoLink(input);if(!parsed)return null;
  const state=normalizeVideoLibrary(library),known=videoList(state).find(v=>v.id===parsed.id);
  if(!known||known.category==='custom')state.custom=[parsed,...state.custom.filter(v=>v.id!==parsed.id)].slice(0,30);
  return {library:normalizeVideoLibrary(state),video:{...(known??videoList(state).find(v=>v.id===parsed.id)),page:parsed.page}};
}
export function rememberRemoteVideo(library,video){
  const state=normalizeVideoLibrary(library),id=normalizeVideoId(video?.id);if(!id)return state;
  if(!VIDEO_CATALOG.some(v=>v.id===id))state.custom=[{...video,id,page:pageNumber(video.page??1)},...state.custom.filter(v=>v.id!==id)].slice(0,30);
  return normalizeVideoLibrary(state);
}
export function attachCleanMedia(library,id,url){
  const state=normalizeVideoLibrary(library),media=cleanMediaUrl(url);
  if(media&&videoList(state).some(v=>v.id===id))state.sources[id]=media;
  return state;
}
export function formatVideoDuration(seconds){
  if(!Number.isFinite(seconds)||seconds<=0)return '视频';
  const value=Math.floor(seconds),minutes=Math.floor(value/60),rest=String(value%60).padStart(2,'0');
  return minutes>=60?`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}:${rest}`:`${minutes}:${rest}`;
}
