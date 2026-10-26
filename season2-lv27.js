const $=id=>document.getElementById(id);let cash=10000000,tile=false,shelter=false;
function money(){ $('money').textContent=cash.toLocaleString('zh-CN'); }
function note(text){$('shop-note').textContent=text;}
$('shop').onclick=()=>{$('shop-panel').hidden=false};$('close-shop').onclick=()=>{$('shop-panel').hidden=true};
$('buy-tile').onclick=()=>{if(tile)return;if(cash<300000)return note('资金不足，无法购买强化地砖。');cash-=300000;tile=true;money();$('buy-tile').textContent='已购买 ✓';$('buy-tile').disabled=true;$('buy-shelter').disabled=false;note('强化地砖已铺设。现在可以购买避难所。');};
$('buy-shelter').onclick=()=>{if(!tile||shelter)return;if(cash<9300000)return note('资金不足，避难所需要 ¥9,300,000。');cash-=9300000;shelter=true;money();$('buy-shelter').textContent='已购买 ✓';$('buy-shelter').disabled=true;$('shelter').disabled=false;$('shelter').querySelector('small').textContent='点击进入';$('goal').textContent='避难所已建好！岩浆快来了，快进去。';note('避难所钥匙已交给你，点击城市里的避难所进入。');};
$('shelter').onclick=()=>{if(!shelter)return;$('shop-panel').hidden=true;$('city').classList.add('evacuating');$('lava').style.bottom='0';$('goal').textContent='岩浆正在吞没城市！';setTimeout(()=>{$('inside').hidden=false;requestAnimationFrame(()=>{$('lava-window').style.bottom='0';$('survive-text').textContent='窗外岩浆正在淹没城市……隔热系统稳定。'});setTimeout(()=>{$('inside').hidden=true;$('finish').hidden=false},10500)},1400)};
money();
