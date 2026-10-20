import {createMcTouchInput,MC_KEYBOARD_CONTROLS} from './lib/mc-touch.mjs';

(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const frame=$('mc-frame'),stage=$('mc-stage'),status=$('mc-status'),help=$('mc-help');
  const source=frame.dataset.src;
  const clientOrigin=new URL(source,location.href).origin;
  const targetOrigin=clientOrigin==='null'?'*':clientOrigin;
  let started=false,waiting=null,ready=false,captured=false;
  let touchEnabled=!!window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  function send(packet){if(started)frame.contentWindow?.postMessage(packet,targetOrigin);}
  const touch=createMcTouchInput(input=>send({type:'mc-touch-input',input}),{setTimer:fn=>window.setTimeout(fn,380),clearTimer:id=>window.clearTimeout(id)});
  const keyButtons=[['mc-forward','KeyW'],['mc-back','KeyS'],['mc-left','KeyA'],['mc-right','KeyD'],['mc-jump','Space']];
  const heldKeyboard=new Set();
  function releaseTouch(){heldKeyboard.clear();touch.reset();for(const [id] of keyButtons)$(id).classList.remove('pressed');}
  // Keys focused in the iframe already reach the game natively. Forward keys
  // focused on our screen controls too, sharing ownership with held fingers.
  function keyboard(event,down){
    const code=MC_KEYBOARD_CONTROLS[event.code];if(!code)return;
    const owner=`keyboard:${event.code}`;
    if(!down){if(!heldKeyboard.delete(event.code))return;event.preventDefault();touch.release(owner);return;}
    if(!started||!ready||(!captured&&code!=='KeyE'&&code!=='Escape')||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||event.target?.isContentEditable||event.target?.closest?.('input,textarea,select'))return;
    event.preventDefault();
    if(heldKeyboard.has(event.code))return;
    heldKeyboard.add(event.code);touch.press(code,owner);
  }
  window.addEventListener('keydown',event=>keyboard(event,true));
  window.addEventListener('keyup',event=>keyboard(event,false));
  function updateTouch(){
    $('mc-touch-toggle').setAttribute('aria-pressed',String(touchEnabled));$('mc-touch-toggle').textContent=touchEnabled?'手机按键：开':'手机按键';
    const visible=started&&ready&&touchEnabled&&captured;
    $('mc-touch-controls').hidden=!visible;$('mc-touch-surface').hidden=!visible;$('mc-touch-tools').hidden=!(started&&ready&&touchEnabled);
  }
  function clearWait(){window.clearTimeout(waiting);waiting=null;}
  function load(){
    if(navigator.onLine===false){status.textContent='网络未连接，请联网后再进入 MCJS。';return;}
    clearWait();releaseTouch();started=true;ready=false;captured=false;help.hidden=true;
    $('mc-intro').hidden=true;frame.hidden=false;frame.src=source;
    $('mc-reload').disabled=false;$('mc-fullscreen').disabled=false;
    status.textContent='正在连接 MCJS · 首次启动需要下载游戏资源';
    waiting=window.setTimeout(()=>{help.hidden=false;},30000);
    updateTouch();
  }
  $('mc-start').addEventListener('click',load);
  $('mc-reload').addEventListener('click',load);
  $('mc-help-close').addEventListener('click',()=>{help.hidden=true;});
  frame.addEventListener('load',()=>{
    if(!started)return;clearWait();help.hidden=true;
    // The launcher document can load before the WASM game is ready.
    status.textContent='游戏网页已载入 · 等待游戏启动后，点击画面开始操作';
    send({type:'mc-touch-config',enabled:touchEnabled});
  });
  $('mc-touch-toggle').addEventListener('click',()=>{releaseTouch();touchEnabled=!touchEnabled;send({type:'mc-touch-config',enabled:touchEnabled});updateTouch();});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==clientOrigin)return;
    const data=event.data;
    if(data?.type==='mc-touch-bridge')send({type:'mc-touch-config',enabled:touchEnabled});
    else if(data?.type==='mc-touch-state'){
      ready=!!data.ready;const wasCaptured=captured;captured=!!data.captured;
      if(wasCaptured&&!captured)releaseTouch();updateTouch();
      if(ready)status.textContent=touchEnabled?'屏幕按键 / WASD / 方向键移动 · 空格跳跃 · 点按放置 · 长按拆除':'WASD / 方向键移动 · 空格跳跃 · 点击画面开始操作';
    }else if(data?.type==='mc-client-error'){clearWait();help.hidden=false;status.textContent='暂时无法启动客户端，请联网后重新加载。';}
  });
  for(const [id,code] of keyButtons){const button=$(id);
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);button.classList.add('pressed');touch.press(code,event.pointerId);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{event.preventDefault();button.classList.remove('pressed');touch.release(event.pointerId);});
    button.addEventListener('contextmenu',event=>event.preventDefault());
  }
  const surface=$('mc-touch-surface');
  surface.addEventListener('pointerdown',event=>{event.preventDefault();if(touch.start(event.pointerId,event.clientX,event.clientY))surface.setPointerCapture(event.pointerId);});
  surface.addEventListener('pointermove',event=>{event.preventDefault();touch.move(event.pointerId,event.clientX,event.clientY);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,event=>{event.preventDefault();touch.end(event.pointerId,type!=='pointerup');});
  surface.addEventListener('contextmenu',event=>event.preventDefault());
  for(const [id,code] of [['mc-inventory','KeyE'],['mc-menu','Escape']])$(id).addEventListener('click',()=>{touch.press(code,id);window.setTimeout(()=>touch.release(id),80);});
  frame.addEventListener('error',()=>{
    if(!started)return;clearWait();help.hidden=false;
    status.textContent='暂时无法载入游戏，可重新加载或打开原网页。';
  });
  $('mc-fullscreen').addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement||document.webkitFullscreenElement){
        const exit=document.exitFullscreen??document.webkitExitFullscreen;
        if(exit)await exit.call(document);
      }else{
        const enter=stage.requestFullscreen??stage.webkitRequestFullscreen;
        if(!enter){status.textContent='此浏览器暂不支持页面全屏，可以打开原网页继续游戏。';return;}
        await enter.call(stage);
      }
    }catch{status.textContent='全屏未开启，请再点一次全屏，或打开原网页。';}
  });
  function fullscreenChanged(){$('mc-fullscreen').textContent=document.fullscreenElement||document.webkitFullscreenElement?'退出全屏 ⛶':'全屏游戏 ⛶';}
  document.addEventListener('fullscreenchange',fullscreenChanged);
  document.addEventListener('webkitfullscreenchange',fullscreenChanged);
  window.addEventListener('offline',()=>{status.textContent='网络已断开 · 请先在游戏内保存世界，再联网继续。';});
  window.addEventListener('online',()=>{status.textContent=started?'网络已恢复 · 若游戏尚未载入，可点击重新加载。':'网络已连接 · 可以进入 MCJS。';});
  window.addEventListener('blur',releaseTouch);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseTouch();});
  window.addEventListener('pagehide',()=>{clearWait();releaseTouch();});
  updateTouch();
})();
