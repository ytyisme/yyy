(() => {
  'use strict';
  if(window.GAME_PHONE_SESSION)return;
  const key='lava-demo-phone-session',script=document.currentScript,root=new URL('../',script.src);
  let profile;
  try{profile=JSON.parse(localStorage.getItem(key));if(!profile||profile.expires<=Date.now()){localStorage.removeItem(key);return;}}catch{return;}
  if(typeof profile.displayName!=='string'||!/^玩家\d{4}$/.test(profile.displayName))return;
  try{localStorage.setItem('s2_player',profile.displayName);}catch{}
  const submit=document.getElementById('login-submit'),screen=document.getElementById('login-screen')||document.getElementById('s2-login');
  if(submit&&screen&&!screen.classList.contains('hidden')){document.getElementById('login-user').value=profile.displayName;document.getElementById('login-pass').value='demo';submit.click();}
  const logout=()=>{try{sessionStorage.removeItem('lava-agreement-version');}catch{}try{localStorage.removeItem(key);if(localStorage.getItem('s2_player')===profile.displayName)localStorage.removeItem('s2_player');}catch{}location.replace(new URL('phone-login/index.html',root));};
  const button=document.createElement('button');button.type='button';button.textContent='退出演示登录';button.style.cssText='position:fixed;right:14px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:9999;border:1px solid #b8cebe;border-radius:10px;padding:8px 12px;background:#fffaf0;color:#264f53;font:12px system-ui;cursor:pointer';button.addEventListener('click',logout);document.body.appendChild(button);
  document.getElementById('logout-btn')?.addEventListener('click',event=>{event.stopImmediatePropagation();logout();},true);
})();
