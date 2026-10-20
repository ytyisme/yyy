import test from 'node:test';
import assert from 'node:assert/strict';
import {ARCADE_GAMES} from '../lib/arcade-catalog.mjs';
import {ARCADE_CATEGORIES,cleanLibrary,readLibrary,writeLibrary,toggleFavorite,rememberGame,filterGames,chooseGame} from '../lib/arcade-library.mjs';

test('curated games have unique IDs, HTTPS play links and valid providers and categories',()=>{
 assert(ARCADE_GAMES.length>=30);assert.equal(new Set(ARCADE_GAMES.map(game=>game.id)).size,ARCADE_GAMES.length);
 const categories=new Set(ARCADE_CATEGORIES.map(item=>item.id));
 for(const game of ARCADE_GAMES){assert(categories.has(game.category));assert.match(game.id,/^[a-z0-9-]+$/);assert.equal(new URL(game.url).protocol,'https:');assert(game.title&&game.controls&&game.provider);
  if(game.mode==='external'){assert.equal(new URL(game.url).hostname,'poki.com');assert.equal(new URL(game.image).hostname,'img.poki-cdn.com');}
  else{assert.equal(game.mode,'embed');assert(game.art);assert(!['poki.com','jakesgordon.com'].includes(new URL(game.url).hostname));}
 }
});
test('Chinese and English search, categories and collections compose without changing catalog order',()=>{
 assert.deepEqual(filterGames({query:'  SUBWAY  '}).map(g=>g.id),['subway-surfers']);assert.deepEqual(filterGames({query:'地铁'}).map(g=>g.id),['subway-surfers']);
 assert.deepEqual(filterGames({query:'２０４８'}).map(g=>g.id),['2048']);assert.equal(filterGames({query:'definitely missing'}).length,0);
 const racers=filterGames({category:'racing'});assert(racers.length>3);assert(racers.every(game=>game.category==='racing'));
 const library={favorites:['drive-mad','2048'],recent:['2048','drive-mad','subway-surfers']};
 assert.deepEqual(filterGames({library,collection:'favorites',category:'racing'}).map(g=>g.id),['drive-mad']);
 assert.deepEqual(filterGames({library,collection:'recent'}).map(g=>g.id),library.recent);
 assert.deepEqual(filterGames({library,collection:'favorites',query:'不存在'}),[]);
});
test('malformed storage cannot add unknown games, duplicate favorites or unbounded recent history',()=>{
 assert.deepEqual(cleanLibrary(null),{favorites:[],recent:[]});assert.deepEqual(cleanLibrary({favorites:['2048','javascript:alert(1)','2048',{},null],recent:'2048'}),{favorites:['2048'],recent:[]});
 const state=cleanLibrary({recent:ARCADE_GAMES.map(g=>g.id)});assert.equal(state.recent.length,12);
 assert.deepEqual(readLibrary({getItem:()=>'{oops'}),{favorites:[],recent:[]});assert.deepEqual(readLibrary({getItem(){throw Error();}}),{favorites:[],recent:[]});
});
test('favorites persist, toggle independently and leave the caller state intact',()=>{
 const initial={favorites:[],recent:['subway-surfers']},added=toggleFavorite(initial,'2048');assert.deepEqual(initial.favorites,[]);assert.deepEqual(added.favorites,['2048']);
 assert.deepEqual(toggleFavorite(added,'2048').favorites,[]);assert.deepEqual(toggleFavorite(added,'unknown'),added);
 const values=new Map(),storage={setItem:(key,value)=>values.set(key,value),getItem:key=>values.get(key)};
 assert(writeLibrary(storage,added));assert.deepEqual(readLibrary(storage),added);assert(!writeLibrary({setItem(){throw Error();}},added));
});
test('opening a game moves it to the front of the bounded recent list without losing favorites',()=>{
 let state={favorites:['2048'],recent:[]};for(const game of ARCADE_GAMES)state=rememberGame(state,game.id);assert.equal(state.recent.length,12);
 const id=state.recent[5];state=rememberGame(state,id);assert.equal(state.recent[0],id);assert.equal(state.recent.filter(value=>value===id).length,1);assert.deepEqual(state.favorites,['2048']);assert.deepEqual(rememberGame(state,'unknown'),state);
});
test('random choice uses only the visible games and handles an empty filter',()=>{
 const games=filterGames({category:'racing'});assert.equal(chooseGame([],()=>.5),null);assert.equal(chooseGame(games,()=>0),games[0]);assert.equal(chooseGame(games,()=>.99999),games.at(-1));
});
