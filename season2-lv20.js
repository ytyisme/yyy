import {ARCADE_CATEGORIES,readLibrary,writeLibrary,toggleFavorite,rememberGame,filterGames,chooseGame} from './lib/arcade-library.mjs';

const $=id=>document.getElementById(id);
const grid=$('game-grid'),search=$('game-search'),dialog=$('game-player'),frame=$('online-game');
let storage;try{storage=window.localStorage;}catch{}
let library=readLibrary(storage),category='all',collection='all',visible=[],current=null,waitTimer=null,toastTimer=null;
const categoryName=id=>ARCADE_CATEGORIES.find(item=>item.id===id)?.title??'';
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function toast(text){clearTimeout(toastTimer);$('arcade-toast').textContent=text;$('arcade-toast').hidden=false;toastTimer=setTimeout(()=>$('arcade-toast').hidden=true,2200);}
function recordGame(game){library=rememberGame(library,game.id);writeLibrary(storage,library);}

// Small original cover illustrations for games whose authors don't publish a
// catalog thumbnail. Poki covers are requested directly from its official CDN.
function art(game){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 200 200');svg.setAttribute('aria-hidden','true');
 let shapes='';
 if(game.art==='numbers'){
  const values=[2,4,8,16,8,16,32,64,32,64,128,256,128,256,512,2048],colors=['#eee4da','#ede0c8','#f2b179','#f59563','#f67c5f','#edcf72'];
  shapes='<rect width="200" height="200" fill="#bba995"/>';
  values.forEach((n,i)=>{const x=12+(i%4)*46,y=12+Math.floor(i/4)*46;shapes+=`<rect x="${x}" y="${y}" width="40" height="40" rx="5" fill="${colors[Math.min(5,Math.floor(Math.log2(n)/2))]}"/><text x="${x+20}" y="${y+26}" text-anchor="middle" font-size="${n>999?12:17}" font-family="Arial,sans-serif" font-weight="bold" fill="${n<8?'#756552':'#fff'}">${n}</text>`;});
 }else if(game.art==='bird')shapes='<rect width="200" height="200" fill="#83d0d8"/><path d="M0 150h200v50H0" fill="#b9d776"/><path d="M0 171h200v29H0" fill="#e5d3a1"/><path d="M150 0h27v55h-27zM146 48h35v15h-35zM150 133h27v38h-27zM146 125h35v15h-35z" fill="#7ca833" stroke="#46733e" stroke-width="3"/><path d="M13 35h54v10H13M40 24h22v11" stroke="#eefbfa" stroke-width="12"/><ellipse cx="82" cy="96" rx="25" ry="21" fill="#ffd764" stroke="#a76a26" stroke-width="3"/><ellipse cx="66" cy="102" rx="15" ry="8" fill="#ffbc43"/><circle cx="93" cy="88" r="10" fill="#fff"/><circle cx="97" cy="88" r="4" fill="#263e46"/><path d="M103 99h17v9h-21" fill="#ed7548" stroke="#a9542c" stroke-width="2"/>';
 else if(game.art==='tetris'){
  shapes='<rect width="200" height="200" fill="#bdcda5"/><rect x="29" y="14" width="142" height="172" rx="17" fill="#dce6bd"/><rect x="44" y="28" width="112" height="118" rx="5" fill="#344e4b"/>';
  const blocks=[[0,5,'#ef8e59'],[1,5,'#ef8e59'],[2,5,'#ef8e59'],[0,4,'#ef8e59'],[3,5,'#85c1bc'],[4,5,'#85c1bc'],[5,5,'#85c1bc'],[5,4,'#85c1bc'],[2,1,'#c2a2de'],[3,1,'#c2a2de'],[3,2,'#c2a2de'],[4,2,'#c2a2de']];
  for(const [x,y,c] of blocks)shapes+=`<rect x="${48+x*17}" y="${35+y*17}" width="15" height="15" rx="1" fill="${c}"/>`;
  shapes+='<path d="M60 158h14v21H60zM55 163h24v11H55z" fill="#6c8c6c"/><circle cx="127" cy="164" r="9" fill="#dfaa69"/><circle cx="147" cy="176" r="6" fill="#94b58e"/>';
 }else if(game.art==='binary'||game.art==='dots'){
  shapes=`<rect width="200" height="200" fill="${game.art==='dots'?'#203f61':'#2c4862'}"/>`;
  const values=[0,1,1,1,0,1,0,0,1];values.forEach((n,i)=>{const x=27+i%3*51,y=27+Math.floor(i/3)*51;shapes+=game.art==='binary'?`<rect x="${x}" y="${y}" width="44" height="44" rx="8" fill="${n?'#48b6cd':'#f1696a'}"/>`:`<circle cx="${x+22}" cy="${y+22}" r="21" fill="${n?'#43b7d1':'#ef6a77'}"/>${n?`<text x="${x+22}" y="${y+29}" font-family="Arial" font-size="20" text-anchor="middle" fill="white">${i+1}</text>`:''}`;});
 }else shapes='<rect width="200" height="200" fill="#26305d"/><path d="M90 64 5 200h190L110 64" fill="#454c81"/><path d="m92 64-66 136m82-136 66 136" stroke="#7cd6e4" stroke-width="4"/><path d="m100 75 0 16m0 13v24m0 21v45" stroke="#b6addd" stroke-width="3"/><path d="m98 115-27 41 29-8 29 8-27-41" fill="#f0eaf5" stroke="#b6b2d0" stroke-width="2"/><path d="m88 141 12-17 12 17" fill="#80d7df"/><path d="m95 155 5 23 6-23" fill="#f7a0bd"/><path d="M0 55h35V20h13v58h24V42h17M134 64V28h18v48h20V13h18v49h10" fill="none" stroke="#657cb0" stroke-width="9"/>';
 svg.innerHTML=shapes;return svg;
}
function cover(game){
 const container=element('div','card-art');container.style.setProperty('--cover',game.color);
 if(game.art)container.append(art(game));
 else{
  container.append(element('span','cover-fallback',game.icon));
  const img=element('img');img.src=game.image;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>img.remove(),{once:true});container.append(img);
 }
 return container;
}
function card(game,featured){
 const item=element('article',`game-card${featured?' featured':''}`);
 const open=element(game.mode==='external'?'a':'button','game-open');open.setAttribute('aria-label',`${game.title} · ${game.mode==='external'?'去 Poki 玩':'在关卡内玩'}`);
 if(game.mode==='external'){open.href=game.url;open.target='_blank';open.rel='noopener noreferrer';open.addEventListener('click',()=>recordGame(game));}
 else{open.type='button';open.addEventListener('click',()=>openPlayer(game));}
 open.append(cover(game));
 const label=element('span','card-label');label.append(element('strong','',game.title),element('small','',`${game.mode==='external'?'Poki ↗':'关卡内玩'} · ${categoryName(game.category)}`));
 if(featured){const play=element('span','feature-play');play.append(element('span','','▶'),document.createTextNode('开始冒险 ↗'));label.append(play);open.append(element('span','card-tag','本期精选 · 跑酷'));
 }else if(game.mode==='embed')open.append(element('span','card-tag','直接玩'));
 open.append(label);item.append(open);
 const favorite=element('button','game-favorite',library.favorites.includes(game.id)?'♥':'♡');favorite.type='button';favorite.dataset.favorite=game.id;favorite.setAttribute('aria-label',`收藏 ${game.title}`);favorite.setAttribute('aria-pressed',String(library.favorites.includes(game.id)));favorite.title=library.favorites.includes(game.id)?'取消收藏':'收藏游戏';
 favorite.addEventListener('click',()=>{library=toggleFavorite(library,game.id);const saved=writeLibrary(storage,library),added=library.favorites.includes(game.id);render();const focus=grid.querySelector(`[data-favorite="${game.id}"]`)??document.querySelector(`[data-collection="${collection}"]`);focus?.focus({preventScroll:true});toast(`${added?'已收藏':'已取消收藏'}${saved?'':' · 本次打开有效'}`);});
 item.append(favorite);return item;
}
function render(){
 visible=filterGames({query:search.value,category,collection,library});
 const titles={all:['今天，玩点什么？','从一场跑酷到一局解谜，快乐随时开始。'],favorites:['喜欢的，都在这里。','点亮游戏卡片上的爱心，留住下次的快乐。'],recent:['继续上次的快乐。','最近打开的游戏，随时回来接着玩。']};
 const title=titles[collection][0];$('view-title').replaceChildren(document.createTextNode(title.slice(0,-1)),element('span','',title.slice(-1)));$('view-description').textContent=titles[collection][1];
 $('game-count').textContent=`${visible.length} 款${collection==='favorites'?'已收藏':collection==='recent'?'最近打开的':''}游戏${search.value.trim()?` · 搜索「${search.value.trim()}」`:''}`;
 for(const button of document.querySelectorAll('[data-collection]')){const active=button.dataset.collection===collection;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
 for(const button of $('game-categories').children)button.setAttribute('aria-pressed',String(button.dataset.category===category));
 grid.replaceChildren(...visible.map((game,index)=>card(game,index===0&&collection==='all'&&category==='all'&&!search.value.trim())));
 $('empty-state').hidden=!!visible.length;$('random-game').disabled=!visible.length;
 const noFavorites=collection==='favorites'&&!library.favorites.length,noRecent=collection==='recent'&&!library.recent.length;
 $('empty-title').textContent=noFavorites?'这里还没有收藏':noRecent?'还没有打开过游戏':'没有找到这款游戏';
 $('empty-description').textContent=noFavorites?'看到喜欢的游戏，就点一下卡片上的爱心。':noRecent?'从大厅挑一款游戏，开始第一次冒险吧。':'试试其他名字，或者换一个分类。';
}
function clearWait(){clearTimeout(waitTimer);waitTimer=null;}
function loadFrame(){
 if(!current||current.mode!=='embed')return;clearWait();
 if(navigator.onLine===false){$('player-status').textContent='网络未连接，请联网后点击重新加载。';frame.src='about:blank';return;}
 frame.hidden=false;frame.src=current.url;$('player-status').textContent='正在连接游戏原站 · 首次加载可能需要一点时间';
 waitTimer=setTimeout(()=>$('player-status').textContent='还没出现游戏？可以重新加载，或点击“打开原网页”继续。',20000);
}
function openPlayer(game){
 current=game;$('player-title').textContent=game.title;$('player-controls').textContent=game.controls;$('player-original').href=game.url;$('external-play').href=game.url;
 const embedded=game.mode==='embed';$('external-game').hidden=embedded;frame.hidden=!embedded;$('player-retry').hidden=!embedded;$('player-fullscreen').hidden=!embedded;
 if(!dialog.open)dialog.showModal();
 if(embedded){recordGame(game);loadFrame();}
 else{$('external-cover').replaceChildren(cover(game));$('external-title').textContent=game.title;$('player-status').textContent='在新标签页打开，游戏大厅会留在这里。';}
}
function closePlayer(){clearWait();frame.src='about:blank';frame.hidden=true;current=null;if(document.fullscreenElement===dialog)document.exitFullscreen?.().catch(()=>{});render();}
for(const info of ARCADE_CATEGORIES){const button=element('button','category',`${info.icon}  ${info.title}`);button.type='button';button.dataset.category=info.id;button.setAttribute('aria-pressed',String(info.id==='all'));button.addEventListener('click',()=>{category=info.id;render();});$('game-categories').append(button);}
for(const button of document.querySelectorAll('[data-collection]'))button.addEventListener('click',()=>{collection=button.dataset.collection;category='all';search.value='';render();});
search.addEventListener('input',render);
$('reset-filters').addEventListener('click',()=>{collection='all';category='all';search.value='';render();});
$('random-game').addEventListener('click',()=>{const game=chooseGame(visible);if(game)openPlayer(game);});
$('player-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',closePlayer);
$('player-retry').addEventListener('click',loadFrame);
frame.addEventListener('load',()=>{if(current?.mode!=='embed'||frame.getAttribute('src')==='about:blank')return;clearWait();$('player-status').textContent='游戏网页已载入 · 点击画面操作；若未显示，可打开原网页。';});
frame.addEventListener('error',()=>{if(current?.mode!=='embed')return;clearWait();$('player-status').textContent='暂时无法连接游戏，请重试，或打开原网页。';});
for(const id of ['player-original','external-play'])$(id).addEventListener('click',()=>{if(current)recordGame(current);});
$('player-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(dialog.requestFullscreen)await dialog.requestFullscreen();else $('player-status').textContent='此浏览器不支持页面全屏，可以打开原网页继续。';}catch{$('player-status').textContent='全屏未开启，可以继续在当前窗口玩。';}});
document.addEventListener('fullscreenchange',()=>$('player-fullscreen').textContent=document.fullscreenElement?'退出全屏 ⛶':'全屏 ⛶');
window.addEventListener('keydown',event=>{if(event.key==='/'&&!dialog.open&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target?.closest?.('input,textarea,select,[contenteditable="true"]')){event.preventDefault();search.focus();}});
window.addEventListener('offline',()=>{if(current)$('player-status').textContent='网络已断开 · 已载入的游戏可以继续尝试，重新加载需要联网。';toast('网络未连接 · 在线游戏需要联网');});
window.addEventListener('online',()=>{if(current)$('player-status').textContent='网络已恢复 · 如游戏没有画面，可以重新加载。';});
window.addEventListener('pagehide',()=>{clearWait();clearTimeout(toastTimer);frame.src='about:blank';});
render();
