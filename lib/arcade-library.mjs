import {ARCADE_GAMES} from './arcade-catalog.mjs';

export const ARCADE_CATEGORIES=Object.freeze([
 {id:'all',title:'全部游戏',icon:'✦'},
 {id:'adventure',title:'冒险挑战',icon:'⚡'},
 {id:'racing',title:'赛车驾驶',icon:'🏁'},
 {id:'puzzle',title:'益智解谜',icon:'◈'},
 {id:'sports',title:'体育竞技',icon:'⚽'},
 {id:'casual',title:'休闲经营',icon:'☀'},
 {id:'multiplayer',title:'多人联机',icon:'♧'}
]);
const known=new Set(ARCADE_GAMES.map(game=>game.id));
const STORAGE_KEY='lava-arcade-library-v1';
function ids(value,max=ARCADE_GAMES.length){return [...new Set(Array.isArray(value)?value.filter(id=>typeof id==='string'&&known.has(id)):[])].slice(0,max);}
export function cleanLibrary(value){return {favorites:ids(value?.favorites),recent:ids(value?.recent,12)};}
export function readLibrary(storage){try{return cleanLibrary(JSON.parse(storage.getItem(STORAGE_KEY)));}catch{return cleanLibrary(null);}}
export function writeLibrary(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(cleanLibrary(state)));return true;}catch{return false;}}
export function toggleFavorite(state,id){const next=cleanLibrary(state);if(known.has(id))next.favorites=next.favorites.includes(id)?next.favorites.filter(item=>item!==id):[...next.favorites,id];return next;}
export function rememberGame(state,id){const next=cleanLibrary(state);if(known.has(id))next.recent=[id,...next.recent.filter(item=>item!==id)].slice(0,12);return next;}
export function filterGames({query='',category='all',collection='all',library={}}={}){
 const state=cleanLibrary(library),q=String(query).normalize('NFKC').trim().toLowerCase();
 let games=ARCADE_GAMES.filter(game=>(category==='all'||game.category===category)&&(!q||`${game.title} ${game.name} ${game.provider}`.normalize('NFKC').toLowerCase().includes(q))&&(collection!=='favorites'||state.favorites.includes(game.id))&&(collection!=='recent'||state.recent.includes(game.id)));
 if(collection==='recent')games.sort((a,b)=>state.recent.indexOf(a.id)-state.recent.indexOf(b.id));
 return games;
}
export function chooseGame(games,random=Math.random){if(!games.length)return null;return games[Math.min(games.length-1,Math.max(0,Math.floor(random()*games.length)))];}
