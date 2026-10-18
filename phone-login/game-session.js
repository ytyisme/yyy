(() => {
  if(!window.GAME_PHONE_SESSION)return;
  try{localStorage.setItem('s2_player',window.GAME_PHONE_SESSION.displayName);}catch{}
  async function logout(){try{const result=await fetch('/api/phone/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',credentials:'same-origin'});if(!result.ok)throw new Error();try{sessionStorage.removeItem('lava-agreement-version');localStorage.removeItem('s2_player');}catch{}location.replace('/phone-login/');}catch{button.textContent='退出失败，请重试';button.disabled=false;}}
  const button=document.createElement('button');button.textContent='退出手机登录';button.type='button';button.id='phone-session-logout';
  button.style.cssText='position:fixed;right:14px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:9999;border:1px solid #b8cebe;border-radius:10px;padding:8px 12px;background:#fffaf0;color:#264f53;font:12px system-ui;cursor:pointer';
  button.addEventListener('click',()=>{button.disabled=true;logout();});document.body.appendChild(button);
  const oldLogout=document.getElementById('logout-btn');if(oldLogout)oldLogout.addEventListener('click',event=>{event.stopImmediatePropagation();logout();},true);
  // The server already verified identity. Skip the older in-game demo login.
  if(location.pathname==='/index.html')document.getElementById('login-submit')?.click();
  window.addEventListener('pageshow',async()=>{try{const session=await fetch('/api/phone/session',{cache:'no-store',credentials:'same-origin'}).then(r=>r.json());if(!session.authenticated)location.replace('/phone-login/');}catch{location.replace('/phone-login/');}});
})();
