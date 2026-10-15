// Phone sessions must be checked online, including after logout or expiry.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('lava-game-app-'))await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  if(new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).catch(()=>event.request.mode==='navigate'?new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>请连接网络</title><body><h1>请连接网络后继续</h1><p>这个私人游戏需要在线验证登录状态。</p><a href="/phone-login/">返回登录</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}):Response.error()));
});
