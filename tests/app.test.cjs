const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function worker(origin='https://game.example/'){
 const events={},storage=new Map();let network=async()=>{throw new Error('offline');};
 const key=request=>typeof request==='string'?request:request.url||request.href;
 const caches={async open(name){if(!storage.has(name))storage.set(name,new Map());const rows=storage.get(name);return {async put(request,response){rows.set(key(request),response);},async match(request,options){const url=new URL(key(request));for(const [stored,response]of rows)if(options?.ignoreSearch?new URL(stored).pathname===url.pathname:stored===url.href)return response.clone();}};},async keys(){return [...storage.keys()];},async delete(name){return storage.delete(name);}};
 const self={location:new URL(origin+'sw.js'),GAME_APP_VERSION:'test',GAME_APP_ASSETS:['./app.html','./offline.html','./game.js'],addEventListener(name,fn){events[name]=fn;},clients:{async claim(){}},skipWaiting(){}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,URL,Response,Set,caches,importScripts(){},fetch:(...args)=>network(...args)});
 return {storage,caches,events,self,setNetwork(fn){network=fn;},async fetch(url,extra={}){let result;events.fetch({request:{url:origin+url,method:'GET',headers:{has:()=>false},...extra},respondWith(p){result=p;}});return result?await result:undefined;}};
}
function response(url,status=200,text='game'){const r=new Response(text,{status});Object.defineProperty(r,'url',{value:url});return r;}
test('offline navigation serves a cached game while media, remote files, and account paths bypass the worker',async()=>{
 const w=worker(),cache=await w.caches.open('lava-game-app-test');await cache.put('https://game.example/app.html',response('https://game.example/app.html',200,'home'));await cache.put('https://game.example/offline.html',response('https://game.example/offline.html',200,'offline'));
 assert.equal(await (await w.fetch('app.html?v=3',{mode:'navigate'})).text(),'home');assert.equal(await (await w.fetch('',{mode:'navigate'})).text(),'offline');
 assert.equal(await w.fetch('account.html'),undefined);assert.equal(await w.fetch('song.m4a'),undefined);assert.equal(await w.fetch('game.js',{headers:{has:()=>true}}),undefined);assert.equal(await w.fetch('game.js',{url:'https://other.example/game.js'}),undefined);
});
test('a login failure never replaces an offline game or gets mistaken for cached login access',async()=>{
 const w=worker(),cache=await w.caches.open('lava-game-app-test');await cache.put('https://game.example/app.html',response('https://game.example/app.html',200,'home'));
 w.setNetwork(async()=>response('https://game.example/app.html',401,'login required'));assert.equal((await w.fetch('app.html')).status,401);assert.equal(await (await cache.match('https://game.example/app.html')).text(),'home');
 w.setNetwork(async()=>{const r=response('https://auth.example/sign-in',200,'sign in');Object.defineProperty(r,'redirected',{value:true});return r;});await w.fetch('app.html');assert.equal(await (await cache.match('https://game.example/app.html')).text(),'home');
});
test('app updates only clean this game’s old caches',async()=>{
 const w=worker();await w.caches.open('lava-game-app-old');await w.caches.open('other-project');await w.caches.open('lava-game-app-test');let pending;w.events.activate({waitUntil(p){pending=p;}});await pending;assert.deepEqual(await w.caches.keys(),['other-project','lava-game-app-test']);
});
test('controlled 8080 navigation cannot use a cached game when the server is off',async()=>{
 for(const origin of ['http://127.0.0.1:8080/','http://192.168.31.96:8080/']){
  const w=worker(origin),cache=await w.caches.open('lava-game-app-test');await cache.put(origin+'app.html',response(origin+'app.html',200,'cached playable game'));
  const closed=await w.fetch('app.html',{mode:'navigate'});assert.equal(closed.status,503);const body=await closed.text();assert.match(body,/服务器已关闭/);assert.ok(body.includes(origin.replace(':8080',':8081')));assert.ok(!body.includes('cached playable game'));
  assert.equal(await w.fetch('version.json?live=2'),undefined);
  w.setNetwork(async request=>response(request.url,200,'online game'));assert.equal(await (await w.fetch('app.html',{mode:'navigate'})).text(),'online game');
 }
});
