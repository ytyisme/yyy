import {createIngotRain} from './lib/ingot-rain.mjs';
import {createLavaWallet,newLavaRunId,LAVA_WALLET_PREFIX,LAVA_PURCHASE_PREFIX} from './lib/lava-wallet.mjs';

const $=id=>document.getElementById(id),wallet=createLavaWallet(),views=new Map(),pendingRuns=new Map(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let runId='',lastPhase='',lastCount=-1,lastSecond=-1,frameId=0;
const game=createIngotRain({onCollect:({coin,collected})=>{saveRun(runId,collected);pop(coin);sound.coin();}}),s=game.state;
const sound=createSound();
function refreshBalance(){$('wallet-balance').textContent=wallet.balance().toLocaleString('zh-CN');}
function saveRun(id,collected){
  if(!id||!collected)return;pendingRuns.set(id,collected);const receipt=wallet.creditRun(id,collected);if(receipt.persisted)pendingRuns.delete(id);refreshSave();refreshBalance();
}
function retrySaves(){for(const [id,count]of [...pendingRuns])saveRun(id,count);refreshSave();}
function refreshSave(){
  $('save-warning').hidden=pendingRuns.size===0;
  $('result-saved').textContent=pendingRuns.size?'本局收获还没保存成功，请点击下方的「重试保存」。':'全部存入余额，可以去换喜欢的皮肤。';
}
function start(){
  retrySaves();if(['countdown','running'].includes(s.phase))return;
  runId='rain-'+newLavaRunId();views.forEach(view=>view.remove());views.clear();$('collect-effects').replaceChildren();$('rain-announcement').textContent='';lastCount=-1;lastSecond=-1;
  game.start(performance.now());sound.unlock();render();schedule();
}
function pop(coin){
  const effect=document.createElement('span');effect.className='coin-pop';effect.textContent='+1';effect.style.left=coin.x*100+'%';effect.style.top=coin.y*100+'%';$('collect-effects').append(effect);effect.addEventListener('animationend',()=>effect.remove(),{once:true});setTimeout(()=>effect.remove(),750);
}
function collect(id){if(game.collect(id,performance.now()))render();else{render();schedule();}}
function syncPhase(){
  if(s.phase===lastPhase)return;lastPhase=s.phase;document.body.dataset.phase=s.phase;
  $('rain-welcome').hidden=s.phase!=='ready';$('rain-countdown').hidden=s.phase!=='countdown';$('rain-result').hidden=s.phase!=='finished';
  $('rain-start').disabled=s.phase!=='ready';$('rain-retry').disabled=s.phase!=='finished';
  if(s.phase==='countdown')$('rain-tip').textContent='准备好手指，倒计时结束后开始收取';
  if(s.phase==='running'){$('rain-tip').textContent='点击空中的红色元宝 · 点中即存入余额';$('rain-announcement').textContent='岩浆币雨开始，30秒内点击下落的岩浆币。';}
  if(s.phase==='finished'){
    retrySaves();$('result-count').textContent=s.collected.toLocaleString('zh-CN');$('rain-tip').textContent='本局已结束 · 收到的岩浆币可以购买皮肤';$('rain-announcement').textContent=`30秒结束，你收取了${s.collected}枚岩浆币。`;sound.finish();
  }
}
function render(){
  syncPhase();const second=Math.ceil(s.remaining);
  if(second!==lastSecond){lastSecond=second;$('time-left').innerHTML=second+'<small>秒</small>';$('time-left').setAttribute('aria-label',`剩余${second}秒`);$('time-left').parentElement.classList.toggle('urgent',second<=5&&s.phase==='running');}
  if(s.collected!==lastCount){lastCount=s.collected;$('round-coins').textContent=s.collected.toLocaleString('zh-CN');}
  if(s.phase==='countdown'&&$('countdown-number').textContent!==String(s.countdown)){$('countdown-number').textContent=String(s.countdown);$('countdown-number').getAnimations?.().forEach(animation=>animation.cancel());if(!reducedMotion.matches)$('countdown-number').animate?.([{opacity:.4,transform:'scale(1.25)'},{opacity:1,transform:'scale(1)'}],{duration:700,easing:'ease-out'});}
  for(const [id,view]of views)if(!game.coins.has(id)){view.remove();views.delete(id);}
  for(const coin of game.coins.values()){
    let view=views.get(coin.id);
    if(!view){view=document.createElement('button');view.type='button';view.className='falling-ingot';view.setAttribute('aria-label','收取岩浆币');view.innerHTML='<svg aria-hidden="true" viewBox="0 0 64 48"><use href="#rain-ingot"/></svg>';
      view.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();collect(coin.id);});view.addEventListener('click',event=>{if(event.detail===0)collect(coin.id);});$('rain-sky').append(view);views.set(coin.id,view);
    }
    view.style.left=coin.x*100+'%';view.style.top=coin.y*100+'%';view.style.setProperty('--spin',coin.angle+'deg');view.tabIndex=coin.y>=0?0:-1;
  }
}
function schedule(){if(!frameId&&!document.hidden&&['countdown','running'].includes(s.phase))frameId=requestAnimationFrame(frame);}
function frame(now){frameId=0;game.advance(now);render();schedule();}
$('rain-start').onclick=start;$('rain-retry').onclick=start;$('retry-save').onclick=retrySaves;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){cancelAnimationFrame(frameId);frameId=0;retrySaves();sound.sleep();}
  else{game.advance(performance.now());render();refreshBalance();schedule();}
});
window.addEventListener('pageshow',()=>{game.advance(performance.now());render();refreshBalance();schedule();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);frameId=0;retrySaves();sound.sleep();});
window.addEventListener('storage',event=>{if(event.key===null||event.key?.startsWith(LAVA_WALLET_PREFIX)||event.key?.startsWith(LAVA_PURCHASE_PREFIX))refreshBalance();});
function createSound(){
  let context;
  const unlock=()=>{try{context??=new (window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});}catch{}};
  function tone(frequency,duration=.13,offset=0){if(!context||context.state!=='running')return;const start=context.currentTime+offset,osc=context.createOscillator(),gain=context.createGain();osc.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.025,start+.01);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  return {unlock,coin(){tone(930,.10);tone(1370,.11,.045);},finish(){tone(660,.14);tone(830,.15,.11);tone(1100,.23,.24);},sleep(){context?.suspend().catch(()=>{});}};
}
refreshBalance();render();
