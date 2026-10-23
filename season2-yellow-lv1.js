import {FindXiaoyanRound,HIDE_MS,SHUFFLE_MS,DIFFICULTIES} from './lib/find-xiaoyan.mjs';
import {createLavaWallet,newLavaRunId,LAVA_WALLET_PREFIX,LAVA_PURCHASE_PREFIX} from './lib/lava-wallet.mjs';
const $=id=>document.getElementById(id),field=$('field'),start=$('start'),buttons=[];
const wallet=createLavaWallet(),pendingRewards=new Map();
let runId='';
function refreshWallet(){
 $('wallet-balance').textContent=wallet.balance().toLocaleString('zh-CN');
 $('save-warning').hidden=pendingRewards.size===0;
 if(round?.reward){$('reward-note').hidden=false;$('reward-note').textContent=`+${round.reward} 岩浆币 · `+(pendingRewards.has(runId)?'等待保存':'已存入余额，可以去皮肤商场使用！');}
}
function saveReward(id,amount){pendingRewards.set(id,amount);const receipt=wallet.creditRun(id,amount);if(receipt.persisted)pendingRewards.delete(id);refreshWallet();}
function retryRewards(){for(const [id,amount]of [...pendingRewards])saveReward(id,amount);refreshWallet();}
let difficulty='easy',round=null,raf=0,lastTime=null,wins=0,lastPhase='',size={width:0,height:0};
const svg=(symbol,className)=>{const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('class',className);el.setAttribute('aria-hidden','true');const use=document.createElementNS(el.namespaceURI,'use');use.setAttribute('href','#'+symbol);el.append(use);return el;};
for(let id=0;id<9;id++){
 const slot=document.createElement('div');slot.className='ground-slot';const num=document.createElement('span');num.textContent=String(id+1).padStart(2,'0');slot.append(num);field.querySelector('.ground-slots').append(slot);
 const button=document.createElement('button');button.type='button';button.className='pile';button.disabled=true;button.setAttribute('aria-label',`第 ${id+1} 个位置的干草堆`);button.append(svg('little-yan','little-yan'),svg('hay-art','hay'));button.addEventListener('click',()=>choose(id));$('piles').append(button);buttons.push(button);
}
function draw(){
 const positions=round?.positions()??buttons.map((_,i)=>({x:i%3,y:Math.floor(i/3),slot:i}));
 buttons.forEach((b,id)=>{const p=positions[id];b.style.transform=`translate(${p.x*size.width/3}px,${p.y*size.height/3}px)`;
  b.disabled=round?.phase!=='guess';b.setAttribute('aria-label',`第 ${p.slot+1} 个位置的干草堆`);
  b.classList.toggle('peek',round?.phase==='hide'&&id===round.hiddenId);
  b.classList.toggle('burrow',round?.phase==='hide'&&round.elapsed>=900&&id===round.hiddenId);
 });
 if(!round)return;
 field.dataset.phase=round.phase;
 $('seconds').textContent=round.phase==='result'?'—':String(round.remaining);
 $('time-fill').style.transform=`scaleX(${Math.max(0,1-Math.max(0,round.elapsed-HIDE_MS)/SHUFFLE_MS)})`;
 if(lastPhase!==round.phase){
  lastPhase=round.phase;
  if(round.phase==='hide'){$('speed-label').textContent='秒 · '+DIFFICULTIES[round.difficulty].label;$('phase').textContent='01 · 看好小岩';$('message').textContent='我要钻进去啦，记住这堆干草哦！';$('hint').textContent='先看清它藏的位置，马上开始慢慢打乱。';}
  if(round.phase==='shuffle'){start.textContent='打乱中…';$('phase').textContent='02 · '+DIFFICULTIES[round.difficulty].label+'打乱';$('message').textContent='跟住那堆干草，小岩还在里面。';$('hint').textContent=`打乱共 10 秒，每 ${DIFFICULTIES[round.difficulty].seconds} 秒换一次；停下来以后再选。`;}
  if(round.phase==='guess'){$('phase').textContent='03 · 猜猜在哪';$('message').textContent='停！小岩在哪一堆里？';$('hint').textContent='点击一堆干草揭晓答案。也可以按数字键 1—9。';start.textContent='等你猜一猜';}
 }
}
function tick(now){raf=0;if(lastTime!==null)round.advance(now-lastTime);lastTime=now;draw();if(round.phase==='hide'||round.phase==='shuffle')raf=requestAnimationFrame(tick);}
function begin(){
 if(round&&round.phase!=='result')return;
 retryRewards();runId='find-'+newLavaRunId();$('reward-note').hidden=true;
 if(raf)cancelAnimationFrame(raf);round=new FindXiaoyanRound(Math.random,difficulty);$('difficulty').disabled=true;lastTime=null;lastPhase='';
 buttons.forEach(b=>b.classList.remove('reveal','correct','wrong'));start.disabled=true;start.textContent='小岩藏好中…';draw();raf=requestAnimationFrame(tick);
}
function choose(id){
 if(!round||round.phase!=='guess')return;
 const slot=round.order.indexOf(id),correct=round.guess(slot);if(correct===null)return;
 buttons[round.hiddenId].classList.add('reveal','correct');if(!correct)buttons[id].classList.add('wrong');else wins++;
 $('phase').textContent=correct?'找到啦！':'小岩探出头';$('message').textContent=correct?'嘿嘿，被你找到啦！':`嘿嘿，我在第 ${round.winningSlot+1} 堆这里呀！`;
 $('hint').textContent=correct?'眼力真好！再来一局，我换个地方藏。':'差一点！再试一次，慢慢跟住我藏的那一堆。';
 if(round.reward)saveReward(runId,round.reward);
 $('difficulty').disabled=false;
 $('record').textContent=`本次找到 ${wins} 次`;start.disabled=false;start.textContent='再玩一次 ↻';draw();
}
$('difficulty').addEventListener('change',event=>{if(!Object.hasOwn(DIFFICULTIES,event.target.value))return;difficulty=event.target.value;const mode=DIFFICULTIES[difficulty];$('prize').textContent=mode.reward;$('speed-label').textContent='秒 · '+mode.label;$('hint').textContent=`${mode.label}：每 ${mode.seconds} 秒换一次，猜对奖励 ${mode.reward} 岩浆币。点击${round?'再玩一次':'开始'}就用这个难度。`;});
$('retry-save').addEventListener('click',retryRewards);
addEventListener('focus',retryRewards);
addEventListener('storage',event=>{if(!event.key||event.key.startsWith(LAVA_WALLET_PREFIX)||event.key.startsWith(LAVA_PURCHASE_PREFIX))refreshWallet();});
start.addEventListener('click',begin);
addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||!/^[1-9]$/.test(event.key)||round?.phase!=='guess')return;event.preventDefault();choose(round.order[Number(event.key)-1]);});
document.addEventListener('visibilitychange',()=>{lastTime=null;if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else if(round&&(round.phase==='hide'||round.phase==='shuffle')&&!raf){raf=requestAnimationFrame(tick);}});
new ResizeObserver(()=>{const r=field.getBoundingClientRect();size={width:r.width,height:r.height};draw();}).observe(field);
draw();refreshWallet();
