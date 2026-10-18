(() => {
 'use strict';
 const gameRoot=new URL('.',document.currentScript.src);
 const managedServer=location.protocol==='http:'&&location.port==='8080';
 if(managedServer)import('./lib/server-gate.mjs').then(({installServerGate})=>installServerGate()).catch(()=>{
  const gate=document.createElement('section');gate.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#101816;color:white;display:grid;place-items:center;padding:24px;text-align:center;font:18px system-ui';
  gate.textContent='无法检查游戏服务器，请开启服务器后刷新页面。';
  for(const child of document.body.children)child.inert=true;
  document.body.append(gate);
 });
 let installPrompt=null;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 const status=text=>{const el=document.getElementById('app-status');if(el)el.textContent=text;};
 const dialog=document.createElement('dialog');dialog.className='game-app-dialog';dialog.setAttribute('aria-label','安装游戏');
 dialog.innerHTML='<button class="game-app-close" aria-label="关闭安装说明">关闭</button><h2>把游戏放到主屏幕</h2><div class="game-app-install-body"></div><p class="game-app-dialog-status">进度保存在当前设备，换设备时不会自动同步。</p>';
 document.body.append(dialog);dialog.querySelector('.game-app-close').onclick=()=>dialog.close();
 async function install(){
  if(standalone()){status('已在应用窗口中运行');return;}
  if(installPrompt){const pending=installPrompt;installPrompt=null;await pending.prompt();const result=await pending.userChoice;status(result.outcome==='accepted'?'已添加到你的应用':'可以随时再次安装');return;}
  const apple=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const body=dialog.querySelector('.game-app-install-body');
  body.innerHTML=apple?'<p>在 Safari 打开这个游戏地址：</p><ol><li>点浏览器的“分享”按钮。</li><li>选择“添加到主屏幕”。</li><li>如果看到“作为网页 App 打开”，保持开启，再点“添加”。</li></ol>':'<p>在 Chrome 或 Edge 打开这个地址，使用地址栏的安装图标，或菜单里的“安装应用 / 添加到主屏幕”。</p><p>Mac 的 Safari 也可以通过“文件 → 添加到程序坞”安装。</p>';
  if(!window.isSecureContext)body.insertAdjacentHTML('beforeend','<p>当前是局域网预览地址。完整安装和缓存功能请使用游戏的 HTTPS 在线地址。</p>');
  dialog.showModal();
 }
 document.querySelectorAll('[data-install-app]').forEach(b=>b.addEventListener('click',install));
 if(!document.querySelector('.app-home')){const tools=document.createElement('nav');tools.className='game-app-tools';tools.setAttribute('aria-label','游戏应用');for(const [file,title]of [['app.html','游戏主页'],['map-list.html','游戏列表'],['game-circle.html','游戏圈']]){const link=document.createElement('a');link.href=new URL(file,gameRoot);link.textContent=title;tools.append(link);}const button=document.createElement('button');button.type='button';button.dataset.installApp='';button.textContent='安装';button.onclick=install;tools.append(button);document.body.append(tools);}
 else if(!document.querySelector('.app-community-nav')){const nav=document.createElement('nav');nav.className='app-community-nav';for(const [file,title]of [['map-list.html','游戏列表'],['game-circle.html','游戏圈 ☻']]){const a=document.createElement('a');a.href=new URL(file,gameRoot);a.textContent=title;nav.append(a);}document.querySelector('.app-header')?.append(nav);}
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;status('已准备好，点击“安装游戏”添加应用');});
 window.addEventListener('appinstalled',()=>{installPrompt=null;status('安装完成，下次点主屏幕的游戏图标即可');});
 if(standalone())status('应用模式 · 选择关卡开始游戏');
 window.addEventListener('offline',()=>status(managedServer?'服务器未连接 · 请开启服务器后继续':'当前离线 · 已缓存的关卡可以继续打开，联机与影音需要网络'));
 window.addEventListener('online',()=>status(standalone()?'网络已连接 · 游戏应用模式':'网络已连接 · 可以安装到主屏幕'));
 if('serviceWorker' in navigator&&window.isSecureContext){
  window.addEventListener('load',async()=>{
   try{const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});let notified=false;
    if(managedServer){
     if(registration.waiting)registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
     navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
    }
    const offer=()=>{if(notified||!registration.waiting)return;notified=true;const bar=document.createElement('div');bar.className='game-app-update';bar.innerHTML='新版本已准备好<button>更新游戏</button>';bar.querySelector('button').onclick=()=>{registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'});navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});};document.body.append(bar);};
    offer();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',()=>{if(navigator.serviceWorker.controller)offer();}));
   }catch{status('游戏可以正常打开；此浏览器未启用离线缓存。');}
  });
 }
})();
