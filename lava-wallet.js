import {createLavaWallet,LAVA_WALLET_PREFIX,LAVA_PURCHASE_PREFIX} from './lib/lava-wallet.mjs';
const wallet=createLavaWallet();
const ingot='<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M4 10Q12 29 32 21Q52 29 60 10Q65 40 32 44Q-1 40 4 10Z" fill="#d93b2f"/><path d="M4 10Q12 29 32 21Q52 29 60 10L53 30Q32 46 11 30Z" fill="#f0643f"/><ellipse cx="32" cy="22" rx="14" ry="11" fill="#f44432"/><path d="M23 17Q32 8 41 17" fill="none" stroke="#ffc779" stroke-width="3" stroke-linecap="round"/></svg>';
for(const host of document.querySelectorAll('[data-lava-wallet]')){
  const link=document.createElement('a');link.className='lava-wallet';link.href='season2-lv21.html';link.innerHTML=ingot+'<span><small>岩浆元宝</small><strong data-lava-balance>0</strong></span>';host.append(link);
  const shop=document.createElement('a');shop.className='lava-shop-link';shop.href='skin-shop.html';shop.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m8 4-6 4 3 5 3-2v10h8V11l3 2 3-5-6-4q-4 4-8 0Z"/></svg> 皮肤商场 <span aria-hidden="true">↗</span>';host.append(shop);
}
function refresh(){const count=wallet.balance();for(const el of document.querySelectorAll('[data-lava-balance]')){el.textContent=count.toLocaleString('zh-CN');el.closest('a')?.setAttribute('aria-label',`岩浆元宝 ${count} 个，进入第21关收集`);}}
window.addEventListener('pageshow',refresh);window.addEventListener('storage',event=>{if(event.key===null||event.key?.startsWith(LAVA_WALLET_PREFIX)||event.key?.startsWith(LAVA_PURCHASE_PREFIX))refresh();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});refresh();
