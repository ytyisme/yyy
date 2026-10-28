import {yellowLevels} from './lib/season2-yellow-levels.mjs?v=28';
import {tickleLines,safeLevelHref} from './lib/xiaoyan.mjs';
import {XiaoyanChat} from './lib/xiaoyan-chat.mjs';
const ai=new XiaoyanChat();
const $=id=>document.getElementById(id),clock=window.Season2Clock;
const home=$('yellow-home'),roamer=$('xiaoyan-roamer'),pet=$('xiaoyan-pet'),caption=$('xiaoyan-caption'),chat=$('xiaoyan-dialog'),launcher=$('xiaoyan-launcher');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let active=false,sleeping=false,frameId=0,lastFrame=0,until=0,reactionUntil=0,tickleCount=0,lastPetTap=-Infinity,reactionPose='wave',scrollingUntil=0,target=null,x=0,y=0,lastPerch=null,opener=null;
const greeting='你好！我是你的AI助手小岩，游戏里的问题或生活上的问题可以问我，随叫随到哦！';
const grid=$('yellow-level-grid');
const levelCards=Array.from({length:Math.max(3,yellowLevels.length)},(_,i)=>yellowLevels[i]??{title:'待开放',description:'你的新关卡，会在这里见面。'});
for(const [i,item] of levelCards.entries()){
 const href=safeLevelHref(item.href),card=document.createElement(href?'a':'button');card.className='sun-level';
 if(href)card.href=href;else{card.type='button';card.setAttribute('aria-disabled','true');card.addEventListener('click',()=>{$('yellow-level-note').textContent='这一格留给你做的新关卡。小岩先帮你看着～';});}
 const number=document.createElement('span');number.className='sun-number';number.textContent=String(i+1).padStart(2,'0');
 const arrow=document.createElement('span');arrow.className='sun-arrow';arrow.textContent=href?'↗':'✧';arrow.setAttribute('aria-hidden','true');
 const title=document.createElement('strong');title.textContent=item.title;const desc=document.createElement('small');desc.textContent=item.description??'';card.append(number,arrow,title,desc);grid.append(card);
}
if(yellowLevels.length){$('yellow-count').textContent=yellowLevels.length+' 个专属关卡';$('yellow-level-note').textContent='只属于黄色时光的冒险。';}
function blocked(){return !active||document.hidden||!$('s2-login').classList.contains('hidden')||chat.open;}
function choosePerch(now){
 const candidates=[...home.querySelectorAll('.sun-level,[data-xiaoyan-perch]')].filter(el=>{const r=el.getBoundingClientRect();return r.top>=95&&r.top<innerHeight-85&&r.width>76;});
 if(!candidates.length){target={x:Math.max(12,innerWidth-110)+scrollX,y:Math.max(110,innerHeight-210)+scrollY,sit:true};}
 else{
  const choices=candidates.length>1?candidates.filter(el=>el!==lastPerch):candidates;
  const el=choices[Math.floor(Math.random()*choices.length)],r=el.getBoundingClientRect();lastPerch=el;
  target={x:Math.max(12,Math.min(innerWidth-88,r.left+Math.max(0,r.width-76)*(.15+Math.random()*.7)))+scrollX,y:r.top+scrollY-74,sit:el.hasAttribute('data-xiaoyan-perch')};
 }
 until=now+(target.sit?6500:4500);
}
function place(){roamer.style.transform=`translate(${x}px,${y}px)`;}
function restOnSecondLevel(){
 const bed=grid.children[1]??grid.firstElementChild;
 if(!bed){roamer.hidden=true;return;}
 const r=bed.getBoundingClientRect();
 x=r.left+scrollX+(r.width-110)/2;y=r.top+scrollY-76;
 roamer.dataset.pose='sleep';caption.hidden=true;roamer.hidden=false;place();
}
function frame(now){
 frameId=0;
 if(blocked()){roamer.hidden=true;lastFrame=0;return;}
 roamer.hidden=false;
 const dt=Math.min(.05,(now-(lastFrame||now))/1000);lastFrame=now;
 // Scrolling moves the document, not the pet's document-space position.
 if(now<scrollingUntil){
  until=Math.max(until,scrollingUntil+1500);
  if(now>=reactionUntil){caption.hidden=true;roamer.dataset.pose=target?.sit?'sit':'idle';}
  frameId=requestAnimationFrame(frame);return;
 }
 if(!target||now>until&&now>reactionUntil)choosePerch(now);
 if(now<reactionUntil){roamer.dataset.pose=reactionPose;}
 else{
  caption.hidden=true;
  const dx=target.x-x,dy=target.y-y,distance=Math.hypot(dx,dy),step=65*dt;
  if(motion.matches||distance<=step){x=target.x;y=target.y;roamer.dataset.pose=target.sit?'sit':'idle';}
  else{x+=dx/distance*step;y+=dy/distance*step;roamer.dataset.pose='walk';until=Math.max(until,now+2500);}
 }
 place();frameId=requestAnimationFrame(frame);
}
function startMotion(){
 if(blocked()){roamer.hidden=true;if(frameId)cancelAnimationFrame(frameId);frameId=0;return;}
 if(sleeping){if(frameId)cancelAnimationFrame(frameId);frameId=0;lastFrame=0;restOnSecondLevel();return;}
 if(!target){choosePerch(performance.now());x=target.x;y=target.y;place();}
 if(!frameId)frameId=requestAnimationFrame(frame);
}
function positionCaption(){
 const width=caption.offsetWidth,height=caption.offsetHeight;
 const left=Math.max(scrollX+12,Math.min(scrollX+innerWidth-width-12,x+38-width/2));
 let top=y-scrollY-height-10;
 if(top<12)top=y-scrollY+92;
 top=Math.max(12,Math.min(innerHeight-height-12,top));
 caption.style.left=`${left-x}px`;caption.style.top=`${top+scrollY-y}px`;
}
pet.addEventListener('click',()=>{
 if(blocked())return;
 if(sleeping){openChat({currentTarget:pet});return;}
 const now=performance.now(),tickling=now-lastPetTap<900;lastPetTap=now;
 reactionPose=tickling?'tickle':'wave';
 caption.textContent=tickling?tickleLines[tickleCount++%tickleLines.length]:greeting;
 caption.classList.toggle('xy-greeting',!tickling);caption.hidden=false;
 reactionUntil=now+(tickling?2600:10000);until=reactionUntil+2500;roamer.dataset.pose=reactionPose;
 positionCaption();
});
pet.addEventListener('focus',()=>{if(!sleeping){until=performance.now()+10000;target={x,y,sit:true};}});
function addMessage(text,me=false,source=''){
 const item=document.createElement('p');item.className='xy-message'+(me?' me':'');item.textContent=text;
 if(source){const foot=document.createElement('small');foot.className='xy-source';foot.textContent=source;item.append(foot);}
 const log=$('xiaoyan-log');log.append(item);while(log.children.length>50)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;return item;
}
function openChat(event){
 if(!active||!$('s2-login').classList.contains('hidden'))return;
 opener=event?.currentTarget??launcher;
 if(!chat.open)chat.showModal();startMotion();$('xiaoyan-input').focus();
 refreshStatus();
}
function closeChat(){chat.close();}
launcher.addEventListener('click',openChat);document.querySelectorAll('[data-open-xiaoyan]').forEach(b=>b.addEventListener('click',openChat));
$('xiaoyan-close').addEventListener('click',closeChat);
chat.addEventListener('close',()=>{if(active)opener?.focus();startMotion();});
const welcome='你好呀，我是小岩！✨\n想聊游戏、讲个故事，或者分享今天的心情，都可以来找我。我们可以接着前面的话继续聊～';
addMessage(welcome);
let busy=false,verified=false,failedQuestion='';
async function refreshStatus(){
 if(busy||verified)return;
 try{const state=await ai.status();if(state.provider==='ollama')$('xiaoyan-privacy').textContent='本地 AI 在运行游戏服务器的电脑上生成回答，不需要密钥。聊天在当前页面保留，刷新即清空；AI 也可能说错哦。';if(!busy&&!verified)$('xiaoyan-mode').textContent=state.provider==='ollama'?(state.ready?'本地 AI 已就绪 · 不需要密钥':'本地 AI 尚未启动或模型未下载'):state.configured?'AI 已配置 · 可以开始聊天':'AI 尚未接通 · 等待管理员配置';}
 catch{if(!busy&&!verified)$('xiaoyan-mode').textContent='暂时无法连接聊天服务';}
}
async function ask(question,retry=false){
 const text=String(question).trim().slice(0,2000);if(!text||busy)return;
 busy=true;const send=$('xiaoyan-form').querySelector('button');send.disabled=true;$('xiaoyan-new').disabled=true;
 $('xiaoyan-retry').hidden=true;document.querySelectorAll('[data-ask]').forEach(b=>b.disabled=true);
 if(!retry)addMessage(text,true);$('xiaoyan-input').value='';
 const pending=addMessage('小岩正在想怎么回答你…');pending.classList.add('xy-pending');
 $('xiaoyan-mode').textContent='正在等待 AI 回答…';
 try{
  const answer=await ai.ask(text);pending.remove();addMessage(answer.reply,false,answer.truncated?'回答较长，可以让小岩继续':'');
  verified=true;failedQuestion='';$('xiaoyan-mode').textContent=answer.provider==='ollama'?'本地 AI 已连接 · 可以连续聊天':'AI 已连接 · 记得最近 5 轮对话';
 }catch(error){
  pending.remove();const notice=addMessage(error.message);notice.classList.add('xy-error');
  failedQuestion=text;verified=false;$('xiaoyan-retry').hidden=false;
  $('xiaoyan-mode').textContent=error.code==='ai_not_configured'?'AI 尚未接通 · 等待管理员配置':'未收到回答 · 可以重试';
 }finally{
  busy=false;send.disabled=false;$('xiaoyan-new').disabled=false;document.querySelectorAll('[data-ask]').forEach(b=>b.disabled=false);
  if(chat.open)$('xiaoyan-input').focus();
 }
}
$('xiaoyan-new').addEventListener('click',()=>{
 if(busy)return;ai.clear();failedQuestion='';$('xiaoyan-log').replaceChildren();addMessage(welcome);$('xiaoyan-retry').hidden=true;$('xiaoyan-input').value='';$('xiaoyan-input').focus();refreshStatus();
});
$('xiaoyan-retry').addEventListener('click',()=>ask(failedQuestion,true));
$('xiaoyan-form').addEventListener('submit',e=>{e.preventDefault();ask($('xiaoyan-input').value);});
document.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.ask)));
$('yellow-logout').addEventListener('click',()=>$('logout-btn').click());
function update(){
 const state=clock.state();const changed=active!==state.active;active=state.active;
 if(sleeping!==state.sleeping){
  sleeping=state.sleeping;target=null;reactionUntil=0;lastPetTap=-Infinity;caption.hidden=true;
  grid.dataset.xiaoyanSleep=String(sleeping);
  roamer.dataset.pose=sleeping?'sleep':'idle';
  pet.setAttribute('aria-label',sleeping?'小岩睡着了，点击仍可聊天':'和小岩打招呼');
  pet.title=sleeping?'小岩盖着被子睡觉啦，仍然可以问问题哦！':'点我打招呼，连续戳我会痒哦！';
 }
 document.documentElement.dataset.s2Theme=active?'yellow':'blue';home.hidden=!active;
 const loginVisible=!$('s2-login').classList.contains('hidden');launcher.hidden=!active||loginVisible;
 if(!active){roamer.hidden=true;if(chat.open)chat.close();caption.hidden=true;reactionUntil=0;lastPetTap=-Infinity;}
 if(active){const seconds=Math.ceil(state.remaining/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60);$('yellow-clock').textContent=`营业中 · ${h}小时${String(m).padStart(2,'0')}分后换回蓝色`;}
 if(changed){target=null;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',active?'#fff7d5':'#061228');}
 startMotion();
}
function reposition(){target=null;until=0;lastFrame=0;if(sleeping){startMotion();return;}if(!blocked()){choosePerch(performance.now());x=target.x;y=target.y;place();if(!caption.hidden)positionCaption();startMotion();}}
addEventListener('resize',reposition);
addEventListener('scroll',()=>{scrollingUntil=performance.now()+180;},{passive:true});
document.addEventListener('visibilitychange',update);addEventListener('focus',update);addEventListener('pageshow',update);
new MutationObserver(update).observe($('s2-login'),{attributes:true,attributeFilter:['class']});
motion.addEventListener('change',reposition);update();setInterval(update,1000);
