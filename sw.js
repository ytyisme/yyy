importScripts('./precache-assets.js');
const CACHE_PREFIX='lava-game-app-';
const CACHE=CACHE_PREFIX+self.GAME_APP_VERSION;
const controlledServer=self.location.protocol==='http:'&&self.location.port==='8080';
const allowedPaths=new Set(self.GAME_APP_ASSETS.map(asset=>new URL(asset,self.location).pathname));
function cacheable(response,url){return response.ok&&response.status===200&&!response.redirected&&new URL(response.url).origin===self.location.origin&&new URL(response.url).pathname===url.pathname;}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const asset of self.GAME_APP_ASSETS){const url=new URL(asset,self.location);const response=await fetch(url,{cache:'reload'});if(!cacheable(response,url))throw new Error('Asset unavailable');await cache.put(url,response);}if(controlledServer)await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(CACHE_PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('Range')||url.pathname.endsWith('/sw.js')||url.pathname.endsWith('/lan.json')||url.pathname.endsWith('/version.json'))return;
 if(controlledServer&&request.mode==='navigate'){
  const control=new URL('./',self.location);control.port='8081';
  event.respondWith(fetch(request).catch(()=>new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>服务器已关闭</title><body style="margin:0;background:#101816;color:#eef4ef;min-height:100vh;display:grid;place-items:center;text-align:center;font:16px system-ui"><main style="padding:24px"><h1>服务器已关闭</h1><p style="color:#a6b8ac;line-height:1.8">请登录服务器开关网站，开启后再进入游戏。</p><a href="${control.href}" style="display:inline-block;padding:14px 22px;margin-top:12px;border-radius:12px;background:#c5efcc;color:#183923;text-decoration:none">打开服务器开关</a></main></body></html>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
  return;
 }
 // Do not cache account screens, redirects, remote requests, or large media.
 if(!allowedPaths.has(url.pathname)&&url.pathname!==new URL('./',self.location).pathname)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request);if(cacheable(response,url))await cache.put(request,response.clone());return response;}catch{const stored=await cache.match(request,{ignoreSearch:true});if(stored)return stored;if(request.mode==='navigate')return await cache.match(new URL('offline.html',self.location))||Response.error();return Response.error();}})());
});
