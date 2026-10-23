import {VIDEO_CATALOG,VIDEO_CATEGORIES,readVideoLibrary,writeVideoLibrary,videoList,filterVideos,toggleVideoFavorite,rememberVideo,addVideoLink,videoPlayerUrl,videoPageUrl,formatVideoDuration,rememberRemoteVideo,attachCleanMedia,cleanMediaUrl} from './lib/video-library.mjs?v=4';

const $=id=>document.getElementById(id),grid=$('video-grid'),search=$('video-search'),dialog=$('video-player'),linkDialog=$('link-dialog'),player=$('room-video');
let storage;try{storage=window.localStorage;}catch{}
let library=readVideoLibrary(storage),collection='all',category='all',mode='videos',visible=[],current=null,currentPage=1,queue=[],toastTimer=null,playController=null,searchController=null,requestEpoch=0,creators=[],creatorPage=1,selectedCreator=null,workVideos=[],workPage=1,attachTarget=null;
const localSources=new Map(),featured=VIDEO_CATALOG.find(v=>v.id==='BV1Q64y1z7se');
const displayText=value=>String(value??'').replace(/bilibili|哔哩哔哩|抖音|快手|B站/gi,'').replace(/\s{2,}/g,' ').trim();
function element(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function toast(message){clearTimeout(toastTimer);$('video-toast').textContent=message;$('video-toast').hidden=false;toastTimer=setTimeout(()=>$('video-toast').hidden=true,2600);}
function save(){return writeVideoLibrary(storage,library);}
function categoryTitle(id){return VIDEO_CATEGORIES.find(c=>c.id===id)?.title??'视频';}
function cover(video){
  const box=element('span','video-cover original-cover');box.dataset.art=video.category;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 320 200');svg.setAttribute('aria-hidden','true');
  const art={science:'<circle cx="175" cy="100" r="60" fill="#79b8bb"/><path d="M113 75q65-65 122 25q-60-35-122-25" fill="#c5ddbe"/><ellipse cx="175" cy="100" rx="107" ry="22" fill="none" stroke="#eed1a6" stroke-width="7" transform="rotate(-24 175 100)"/><circle cx="61" cy="47" r="3" fill="#eed1a6"/><circle cx="267" cy="150" r="4" fill="#eed1a6"/>',music:'<path d="M127 66v76m0-63 78-20v68m-78-61 78-20" fill="none" stroke="#edb0c2" stroke-width="11" stroke-linecap="round"/><ellipse cx="110" cy="146" rx="23" ry="16" fill="#edb0c2" transform="rotate(-20 110 146)"/><ellipse cx="188" cy="130" rx="23" ry="16" fill="#edb0c2" transform="rotate(-20 188 130)"/><path d="M42 97v20m16-34v46m190-43v44m16-30v17" stroke="#8180a5" stroke-width="5" stroke-linecap="round"/>',gaming:'<path d="m78 87 80-39 82 39-80 41Z" fill="#a9c590"/><path d="m78 87 82 41v60l-82-43Z" fill="#54716e"/><path d="m160 128 80-41v58l-80 43Z" fill="#749a8c"/><path d="m91 81 69-31 68 31-69 35Z" fill="#d5dda8"/><path d="m105 109 19 9v21l-19-10m82-1 20-10v21l-20 10" fill="#aec2a1"/>',animation:'<path d="m104 76 3-42 39 30q25-6 43 1l31-31 7 47q18 52-17 80q-51 28-91-1-32-26-15-84" fill="#e4c595"/><ellipse cx="140" cy="111" rx="13" ry="18" fill="#35424e"/><ellipse cx="190" cy="111" rx="13" ry="18" fill="#35424e"/><circle cx="144" cy="106" r="4" fill="#fff5df"/><circle cx="194" cy="106" r="4" fill="#fff5df"/><path d="m158 136 8 7 8-7m-8 7v7" fill="none" stroke="#926c66" stroke-width="4"/>',custom:'<rect x="111" y="36" width="98" height="136" rx="16" fill="#7e899b"/><rect x="120" y="46" width="80" height="115" rx="9" fill="#303f52"/><path d="m149 80 29 19-29 19Z" fill="#edb0a1"/><circle cx="160" cy="150" r="3" fill="#a2b2c7"/>'};
  svg.innerHTML=art[video.category]??art.custom;box.append(svg,element('span','cover-category',categoryTitle(video.category)),element('span','cover-play','▶'),element('span','cover-duration',formatVideoDuration(video.duration)));return box;
}
function card(video){
  const row=element('article','video-card'),open=element('button','video-open');open.type='button';open.dataset.videoId=video.id;open.setAttribute('aria-label',`播放 ${displayText(video.title)||'视频'}`);open.append(cover(video),element('strong','video-title',displayText(video.title)||'我的视频'));open.addEventListener('click',()=>openVideo(video));
  const meta=element('div','video-meta'),author=element('button','video-author',displayText(video.author)||'创作者');author.type='button';author.setAttribute('aria-label',`查看创作者 ${displayText(video.author)}`);author.addEventListener('click',()=>{search.value=video.author;searchCreators();});meta.append(element('span','up-label','创作'),author);
  const favorite=element('button','video-favorite',library.favorites.includes(video.id)?'♥':'♡');favorite.type='button';favorite.dataset.favorite=video.id;favorite.setAttribute('aria-label',`收藏 ${displayText(video.title)}`);favorite.setAttribute('aria-pressed',String(library.favorites.includes(video.id)));favorite.addEventListener('click',()=>toggleFavorite(video.id,true));row.append(open,meta,favorite);return row;
}
function render(){
  visible=mode==='works'?workVideos:filterVideos({library,query:search.value,category,collection});
  const titles={all:'今天，想看点什么？',favorites:'喜欢的故事，留着慢慢看。',recent:'接着上次的好故事。'};$('library-title').textContent=titles[collection];
  if(mode!=='works')$('more-works').hidden=true;$('creator-section').hidden=mode!=='creators';$('creator-works-heading').hidden=mode!=='works';$('video-results-row').hidden=mode==='creators';grid.hidden=mode==='creators';
  $('video-count').textContent=`${visible.length} 部${mode==='works'?'公开作品':collection==='favorites'?'已收藏':collection==='recent'?'最近打开的':'片单视频'}${search.value.trim()&&mode==='videos'?` · 搜索「${displayText(search.value.trim())}」`:''}`;
  $('search-up-submit').disabled=!search.value.trim();
  for(const button of document.querySelectorAll('[data-collection]')){const active=button.dataset.collection===collection;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  for(const button of $('video-categories').children)button.setAttribute('aria-pressed',String(button.dataset.category===category));
  grid.replaceChildren(...visible.map(card));$('empty-state').hidden=mode==='creators'||visible.length>0;
  $('empty-up-search').hidden=!search.value.trim()||mode==='works';$('empty-up-search').textContent=`搜索创作者「${displayText(search.value.trim())}」`;
  const noFavorites=collection==='favorites'&&!library.favorites.length,noRecent=collection==='recent'&&!library.recent.length;
  $('empty-title').textContent=mode==='works'?'暂时没有可显示的作品':search.value.trim()?'查找这位创作者':noFavorites?'还没有收藏的视频':noRecent?'第一次放映，从这里开始。':'没有匹配的视频';
  $('empty-description').textContent=mode==='works'?'可返回作者列表选择其他创作者，或稍后重试。':search.value.trim()?'按回车或点击搜索，在这里查看创作者和作品。':noFavorites?'点一下视频旁的爱心，下次就能在这里找到它。':'从发现里挑选喜欢的视频。';
}
function toggleFavorite(id,fromGrid=false){library=toggleVideoFavorite(library,id);const saved=save();if(fromGrid){render();grid.querySelector(`[data-favorite="${id}"]`)?.focus({preventScroll:true});}updateFavorite();toast(`${library.favorites.includes(id)?'已加入收藏':'已取消收藏'}${saved?'':' · 本次打开有效'}`);}
function updateFavorite(){if(!current)return;const active=library.favorites.includes(current.id);$('player-favorite').textContent=active?'♥ 已收藏':'♡ 收藏';$('player-favorite').setAttribute('aria-pressed',String(active));}
function cancelSearch(){requestEpoch++;searchController?.abort();searchController=null;}
async function api(path,controller){
  const timer=setTimeout(()=>controller.abort(),22000);
  try{const response=await fetch(path,{signal:controller.signal,cache:'no-store'});const data=await response.json().catch(()=>({error:'搜索服务未连接，请使用游戏服务器打开页面。'}));if(!response.ok)throw new Error(data.error||'视频服务暂不可用');return data;}finally{clearTimeout(timer);}
}
function localCreators(query){
  const names=new Map();for(const video of videoList(library)){if(!video.author.toLocaleLowerCase().includes(query.toLocaleLowerCase()))continue;const old=names.get(video.author);if(old)old.videoCount++;else names.set(video.author,{id:video.creatorId??'local:'+video.author,name:video.author,description:'已收录的创作者',videoCount:1});}return [...names.values()];
}
function renderCreators(){
  $('creator-grid').replaceChildren(...creators.map(creator=>{const row=element('article','creator-card'),avatar=element('span','creator-avatar',Array.from(displayText(creator.name)||'创')[0]),info=element('div','creator-info');info.append(element('h4','',displayText(creator.name)||'创作者'),element('p','',displayText(creator.description)||'来看看这位创作者的故事。'),element('small','',`${creator.videoCount??0} 部作品`));const open=element('button','creator-open','查看作品 →');open.type='button';open.setAttribute('aria-label',`查看 ${displayText(creator.name)} 的作品`);open.addEventListener('click',()=>openCreator(creator));row.append(avatar,info,open);return row;}));
}
async function searchCreators(more=false){
  const query=search.value.trim();if(!query){resetFilters();search.focus();return;}
  cancelSearch();const epoch=requestEpoch;searchController=new AbortController();const controller=searchController;mode='creators';collection='all';category='all';if(!more){creators=[];creatorPage=1;}else creatorPage++;
  $('creator-results-title').textContent=`创作者 · ${displayText(query)}`;$('creator-status').textContent='正在查找创作者…';$('more-creators').hidden=true;render();renderCreators();
  try{const data=await api('/api/video/creators?'+new URLSearchParams({q:query,page:String(creatorPage)}),controller);if(epoch!==requestEpoch)return;const found=Array.isArray(data.creators)?data.creators.filter(c=>/^bili:[1-9][0-9]{0,18}$/.test(c.id)&&typeof c.name==='string'):[];for(const c of [...found,...(more?[]:localCreators(query))])if(!creators.some(row=>row.id===c.id||row.name===c.name))creators.push(c);$('creator-status').textContent=creators.length?`找到 ${creators.length} 位创作者，点「查看作品」继续。`:'暂时没有找到这位创作者，试试其他名字。';$('more-creators').hidden=!data.hasMore;renderCreators();}
  catch(error){if(epoch!==requestEpoch)return;if(more)creatorPage=Math.max(1,creatorPage-1);if(!more)creators=localCreators(query);$('creator-status').textContent=creators.length?'实时搜索暂不可用，先显示片单内的创作者。':controller.signal.aborted?'搜索超时，请重新搜索。':error.message;renderCreators();}
}
async function openCreator(creator){
  cancelSearch();selectedCreator=creator;mode='works';workPage=1;workVideos=videoList(library).filter(v=>v.author===creator.name||v.creatorId===creator.id);$('creator-works-title').textContent=`${displayText(creator.name)} · 作品`;$('creator-works-status').textContent=creator.uid?'正在读取公开作品…':'已收录的作品';render();if(creator.uid)await loadWorks(false);
}
async function loadWorks(more){
  cancelSearch();const epoch=requestEpoch,creator=selectedCreator;if(!creator?.uid)return;searchController=new AbortController();const controller=searchController;if(more)workPage++;
  try{const data=await api('/api/video/works?'+new URLSearchParams({uid:creator.uid,name:creator.name,page:String(workPage)}),controller);if(epoch!==requestEpoch||mode!=='works')return;for(const v of data.videos??[])if(/^BV1[0-9A-Za-z]{9}$/.test(v.id)&&!workVideos.some(old=>old.id===v.id))workVideos.push(v);$('creator-works-status').textContent=`已显示 ${workVideos.length} 部公开作品${data.hasMore?' · 可继续加载更多':''}`;$('more-works').hidden=!data.hasMore;render();}
  catch(error){if(epoch!==requestEpoch)return;if(more)workPage=Math.max(1,workPage-1);$('creator-works-status').textContent=workVideos.length?'暂时无法读取更多作品，先显示片单内已收录的作品。':controller.signal.aborted?'作品读取超时，请返回后重试。':error.message;render();}
}
function stopMedia(){playController?.abort();playController=null;player.pause();player.removeAttribute('src');player.load();}
function mediaMessage(title,message,attach=false){$('media-empty').hidden=false;$('media-empty-title').textContent=title;$('media-error').textContent=message;$('media-attach').hidden=!attach;}
function setParts(){const parts=current?.parts??[];$('part-picker').hidden=parts.length<2;$('video-part').replaceChildren(...parts.map((part,i)=>{const option=element('option','',`P${i+1} · ${displayText(part.title)}`);option.value=String(i+1);return option;}));$('video-part').value=String(currentPage);}
async function loadVideo(){
  stopMedia();if(!current)return;const video=current,page=currentPage;mediaMessage('正在准备视频','连接公开视频…');$('player-status').textContent='正在准备播放…';
  const source=library.sources[video.id]??localSources.get(video.id);
  if(source){player.src=source;$('media-empty').hidden=true;$('player-status').textContent='原片已准备好，点击播放。';return;}
  if(video.id.startsWith('local:')){mediaMessage('请选择本地原片','本地文件只在选择它的页面中有效，请重新添加原片。',true);$('player-status').textContent='等待添加原片';return;}
  playController=new AbortController();const controller=playController;
  try{const data=await api(videoPlayerUrl(video,page),controller);if(controller.signal.aborted||current!==video||currentPage!==page)return;if(!/^\/api\/video\/stream\/[A-Za-z0-9_-]{32}$/.test(data.src))throw new Error('没有收到可用的视频连接。');if(Array.isArray(data.parts)){current.parts=data.parts;setParts();}player.src=data.src;$('media-empty').hidden=true;$('player-status').textContent='视频已准备好，点击播放。';}
  catch(error){if(current!==video||playController!==controller)return;mediaMessage('需要可播放的原片',controller.signal.aborted?'视频连接超时，请重新加载。':error.message,true);$('player-status').textContent='可添加创作者提供的无水印原片继续播放。';}
}
function showVideo(video){
  library=rememberRemoteVideo(library,video);current={...video};currentPage=video.page??1;if(video.parts?.length&&currentPage>video.parts.length)currentPage=1;
  $('player-title').textContent=displayText(video.title)||'我的视频';$('player-author').textContent=`${displayText(video.author)||'创作者'} · ${categoryTitle(video.category)}`;setParts();library=rememberVideo(library,video.id);save();const index=queue.findIndex(v=>v.id===video.id);$('previous-video').disabled=index<=0;$('next-video').disabled=index<0||index>=queue.length-1;updateFavorite();if(!dialog.open)dialog.showModal();loadVideo();
}
function openVideo(video){queue=visible.some(v=>v.id===video.id)?[...visible]:videoList(library);showVideo(video);}
function closeVideo(){const id=current?.id;stopMedia();current=null;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});render();grid.querySelector(`[data-video-id="${id}"]`)?.focus({preventScroll:true});}
function resetFilters(){cancelSearch();mode='videos';collection='all';category='all';search.value='';$('more-works').hidden=true;render();}
function openLink(target=null){attachTarget=target;$('link-error').hidden=true;$('video-link').value=target?(videoPageUrl({id:target})??''):'';$('clean-media-url').value='';$('video-file').value='';linkDialog.showModal();$('video-link').focus();}
function switchVideo(step){const index=queue.findIndex(v=>v.id===current?.id),video=queue[index+step];if(video)showVideo(video);}
for(const item of VIDEO_CATEGORIES){const button=element('button','category');button.type='button';button.dataset.category=item.id;button.append(element('span','',item.mark),document.createTextNode(item.title));button.setAttribute('aria-pressed',String(item.id==='all'));button.addEventListener('click',()=>{cancelSearch();mode='videos';category=item.id;$('more-works').hidden=true;render();});$('video-categories').append(button);}
for(const button of document.querySelectorAll('[data-collection]'))button.addEventListener('click',()=>{resetFilters();collection=button.dataset.collection;render();});
const moreWorks=element('button','more-results','更多作品 ↓');moreWorks.id='more-works';moreWorks.type='button';moreWorks.hidden=true;grid.after(moreWorks);moreWorks.addEventListener('click',()=>loadWorks(true));
$('featured-duration').textContent=formatVideoDuration(featured.duration);$('featured-play').addEventListener('click',()=>openVideo(featured));
search.addEventListener('input',()=>{cancelSearch();if(mode==='creators'){$('creator-status').textContent='按回车搜索这个名字';creators=[];renderCreators();}else mode='videos';$('more-works').hidden=true;render();});
$('creator-search-form').addEventListener('submit',event=>{event.preventDefault();searchCreators();});$('empty-up-search').addEventListener('click',()=>searchCreators());$('more-creators').addEventListener('click',()=>searchCreators(true));$('close-creator-search').addEventListener('click',resetFilters);$('back-to-creators').addEventListener('click',()=>{cancelSearch();mode='creators';$('more-works').hidden=true;render();renderCreators();});$('reset-filters').addEventListener('click',resetFilters);
for(const id of ['add-video','more-add-video'])$(id).addEventListener('click',()=>openLink());for(const id of ['player-add-source','media-attach'])$(id).addEventListener('click',()=>openLink(current?.id));$('link-close').addEventListener('click',()=>linkDialog.close());
$('link-form').addEventListener('submit',event=>{
  event.preventDefault();const input=$('video-link').value.trim(),file=$('video-file').files[0],rawSource=$('clean-media-url').value.trim(),source=rawSource?cleanMediaUrl(rawSource):null;
  const fail=message=>{$('link-error').textContent=message;$('link-error').hidden=false;};if(rawSource&&!source){fail('请输入有效的 HTTPS MP4、WebM 原片网址。');return;}if(file&&!/\.(mp4|webm)$/i.test(file.name)){fail('请选择 MP4 或 WebM 视频文件。');return;}
  let video,result=input?addVideoLink(library,input):null;if(input&&!result){fail('请粘贴完整视频网址、BV号或av号。');return;}if(result){library=result.library;video=result.video;}else if(attachTarget){video=videoList(library).find(v=>v.id===attachTarget);}else if(file||source){video={id:'local:'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),page:1,title:file?.name??'我的原片',author:'我的片单',category:'custom',parts:[]};library=rememberRemoteVideo(library,video);}else{fail('请填写视频链接，或选择原片。');return;}
  if(!video){fail('请重新选择要添加原片的视频。');return;}if(file){const old=localSources.get(video.id);if(old)URL.revokeObjectURL(old);localSources.set(video.id,URL.createObjectURL(file));delete library.sources[video.id];}else if(source)library=attachCleanMedia(library,video.id,source);const saved=save();linkDialog.close();resetFilters();openVideo(video);if(!saved)toast('视频已加入 · 本次页面有效');
});
$('player-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',closeVideo);$('previous-video').addEventListener('click',()=>switchVideo(-1));$('next-video').addEventListener('click',()=>switchVideo(1));$('player-favorite').addEventListener('click',()=>{if(current)toggleFavorite(current.id);});$('player-retry').addEventListener('click',loadVideo);$('video-part').addEventListener('change',()=>{currentPage=Number($('video-part').value);loadVideo();});
player.addEventListener('loadedmetadata',()=>{if(current)$('player-status').textContent='准备好了，点击播放。';});player.addEventListener('playing',()=>{if(current)$('player-status').textContent='正在放映';});player.addEventListener('error',()=>{if(current&&player.getAttribute('src')){mediaMessage('暂时无法播放','播放连接可能已过期，或原片格式暂不支持。可以重新加载或添加原片。',true);$('player-status').textContent='等待重试';}});
$('player-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('player-screen').requestFullscreen)await $('player-screen').requestFullscreen();else if(player.webkitEnterFullscreen)player.webkitEnterFullscreen();}catch{$('player-status').textContent='可以使用视频内的全屏键。';}});
window.addEventListener('keydown',event=>{if(event.key==='/'&&!dialog.open&&!linkDialog.open&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target?.closest?.('input,textarea,select,[contenteditable="true"]')){event.preventDefault();search.focus();}});
window.addEventListener('offline',()=>toast('网络未连接 · 本地原片可以继续播放'));window.addEventListener('storage',()=>{library=readVideoLibrary(storage);render();updateFavorite();});window.addEventListener('pagehide',()=>{cancelSearch();stopMedia();clearTimeout(toastTimer);});window.addEventListener('pageshow',event=>{if(event.persisted&&current&&dialog.open)loadVideo();});
render();
