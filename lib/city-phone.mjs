export const shortVideos=[{"bvid": "BV1fTYP6fE8P", "title": "分享视频 1", "creator": "我的收藏频道"}, {"bvid": "BV1TmpA67E4E", "title": "分享视频 2", "creator": "我的收藏频道"}, {"bvid": "BV1J9EB6xEAB", "title": "分享视频 3", "creator": "我的收藏频道"}, {"bvid": "BV11thH6HERB", "title": "分享视频 4", "creator": "我的收藏频道"}, {"bvid": "BV1h6a76DEs5", "title": "分享视频 5", "creator": "我的收藏频道"}, {"bvid": "BV1BpaS6pEWv", "title": "分享视频 6", "creator": "我的收藏频道"}, {"bvid": "BV1aBaP61Ewg", "title": "分享视频 7", "creator": "我的收藏频道"}, {"bvid": "BV1s28G6sEGH", "title": "分享视频 8", "creator": "我的收藏频道"}];
const videoLibrary=[...shortVideos,{bvid:'forest',title:'森林奇遇',creator:'游戏影音库',src:'assets/cinema/forest-outro.mp4'}];
// All phone services use the city game's money, characters and media.
export function createCityPhone({getState,spend,record,toast,taxi,bank,tracks=[],document:doc=globalThis.document}){
 const $=id=>doc.getElementById(id);let app='home',song=0,order=null,videoIndex=0,currentVideo=null,videoQuery='',favoritesOnly=false,homeDetail=null,walletDetail=null,lastOrderSecond=-1;
 let interactions={};try{interactions=JSON.parse(globalThis.localStorage?.getItem('lava-city-videos-v1')??'{}')??{};}catch{}
 function saveVideos(){try{globalThis.localStorage?.setItem('lava-city-videos-v1',JSON.stringify(interactions));}catch{}}
 const feed=[{name:'城市小助手',text:'无限钱包已经开启！新区的小区可以买房，电梯可以去楼上。'},{name:'小林',text:'694座中国城市已经通高速，世界导航可以搜索城市，或沿路牌自己开。'},{name:'医生',text:'仁心医院已开门，欢迎来咨询或治疗。'}];
 const audio=typeof Audio==='undefined'?null:new Audio();if(audio){audio.preload='none';audio.onended=()=>playSong((song+1)%tracks.length);}
 function node(tag,text,className){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
 function button(text,action,parent=$('phone-content'),className='phone-button'){const b=node('button',text,className);b.onclick=action;parent.append(b);return b;}
 function card(title,detail){const n=node('article',undefined,'phone-card');n.append(node('strong',title),node('p',detail));$('phone-content').append(n);return n;}
 function money(){return getState().balance===Infinity?'¥∞':'¥'+getState().balance.toLocaleString();}
 function render(next=app){app=next;homeDetail=null;walletDetail=null;$('phone-content').classList.remove('short-video-content');$('phone-content').replaceChildren();$('phone-title').textContent={home:'我的手机',social:'社交',music:'音乐',alipay:'支付宝',meituan:'美团',douyin:'抖音'}[app];$('phone-dialog').classList.toggle('short-video-phone',app==='douyin');$('phone-back').hidden=app==='home';$('phone-balance').textContent=money();
  if(app==='home'){
   const status=card('城市生活',getState().region+' · 钱包 '+money());status.classList.add('phone-hero');homeDetail=status.children[1];
   const grid=node('div',undefined,'phone-app-grid');$('phone-content').append(grid);
   for(const [id,icon,name] of [['social','💬','社交'],['music','🎵','音乐'],['alipay','支','支付宝'],['meituan','🛵','美团'],['douyin','♪','抖音'],['taxi','🚕','打车']]){const b=button(icon+'\n'+name,()=>{if(id==='taxi'){close();taxi();}else render(id);},grid,'phone-app '+id);b.setAttribute('aria-label',name);}
   card('城市提示','无限钱包已开启。小区里可以选楼层买房；写字楼仍每5秒发50元工资。');return;
  }
  if(app==='social'){
   const input=node('input');input.placeholder='分享你的城市生活';input.maxLength=160;input.setAttribute('aria-label','社交动态');$('phone-content').append(input);
   button('发布动态',()=>{const text=input.value.trim();if(!text)return;feed.unshift({name:'我',text});if(feed.length>30)feed.pop();render();});
   for(const post of feed){const c=card(post.name,post.text);const like=button(post.liked?'♥ 已点赞':'♡ 点赞',()=>{post.liked=!post.liked;like.textContent=post.liked?'♥ 已点赞':'♡ 点赞';},c);}
   const c=card('联系人 · 小林','在线 · 你可以请他推荐城市或工作。');button('聊一聊',()=>{feed.unshift({name:'小林回复你',text:'按世界导航搜索中国694座城市，高速有收费站、匝道和分岔。新区有公园、小区、商场和游乐园。'});render();},c);return;
  }
  if(app==='music'){
   card(audio&&!audio.paused?'正在播放 · '+tracks[song]?.title:'城市播放器','关掉手机后音乐也会继续。');
   button('暂停音乐',()=>{audio?.pause();render();});
   tracks.forEach((track,i)=>button((i===song&&audio&&!audio.paused?'▶ ':'')+track.title,()=>playSong(i)));return;
  }
  if(app==='alipay'){
   const s=getState();walletDetail=card('钱包余额',money()+' · 银行存款 ¥'+s.deposits.toLocaleString()).children[1];card('收付款','这里的金额只属于本局游戏。工资、购物、出行和罚款都会记入账单。');
   button('银行存取款',()=>{close();bank();});
   button('给小林发 ¥10 红包',()=>{if(!spend('社交红包 · 小林',10))return;feed.unshift({name:'小林',text:'谢谢你的10元红包！一起去海边玩吧。'});render();});
   for(const r of s.ledger.slice(0,15))card(r.text,(r.amount>=0?'+':'−')+'¥'+Math.abs(r.amount).toLocaleString());return;
  }
  if(app==='meituan'){
   if(order){lastOrderSecond=Math.max(0,Math.ceil(order.arrive-getState().time));card('订单 · '+order.name,'骑手正在送来，剩余 '+lastOrderSecond+' 秒。送到后放入背包。');return;}
   card('附近外卖','可在街区或建筑内收餐，预计15秒送达。');
   for(const [name,price] of [['牛肉饭',38],['面包套餐',16],['鲜榨果汁',18]])button(name+' · ¥'+price,()=>{if(order)return;if(!spend('美团外卖 · '+name,price))return;order={name,arrive:getState().time+15};render();});return;
  }
  if(app==='douyin'){renderShortVideos();}

 }
 function renderShortVideos(){
  const root=$('phone-content');root.classList.add('short-video-content');
  const nav=node('div',undefined,'video-tabs');root.append(nav);
  button('推荐',()=>{favoritesOnly=false;videoQuery='';render('douyin');},nav,'video-tab');button('收藏',()=>{favoritesOnly=true;render('douyin');},nav,'video-tab');
  const search=node('input');search.placeholder='搜索视频或BV号';search.value=videoQuery;search.setAttribute('aria-label','搜索短视频');root.append(search);
  const all=videoLibrary.filter(v=>(!favoritesOnly||interactions[v.bvid]?.saved)&&(v.title+v.bvid).includes(videoQuery));
  search.onchange=()=>{videoQuery=search.value.trim();videoIndex=0;render('douyin');};
  if(!all.length){card('暂无视频',favoritesOnly?'点击视频右侧的收藏按钮，把喜欢的视频放到这里。':'换一个关键词，或清空搜索查看全部8个视频。');return;}
  videoIndex=(videoIndex+all.length)%all.length;const clip=all[videoIndex],url=clip.src??'https://www.bilibili.com/video/'+clip.bvid+'/',state=interactions[clip.bvid]??={};
  currentVideo=clip;const frame=node('section',undefined,'video-stage');root.append(frame);const iframe=node(clip.src?'video':'iframe');if(clip.src){iframe.src=clip.src;iframe.controls=true;iframe.playsInline=true;iframe.loop=true;iframe.preload='metadata';}else iframe.src='https://player.bilibili.com/player.html?bvid='+clip.bvid+'&page=1&autoplay=0&high_quality=1';iframe.title=clip.title+' · '+clip.bvid;iframe.allow='fullscreen';iframe.referrerPolicy='strict-origin-when-cross-origin';frame.append(iframe);
  const caption=node('div',undefined,'video-caption');caption.append(node('strong','@'+clip.creator),node('p',clip.title+' · '+clip.bvid));frame.append(caption);
  const rail=node('div',undefined,'video-action-rail');frame.append(rail);
  function toggle(field,on,off){const b=button(state[field]?on:off,()=>{state[field]=!state[field];b.textContent=state[field]?on:off;b.setAttribute('aria-pressed',String(!!state[field]));saveVideos();},rail,'video-action');b.setAttribute('aria-pressed',String(!!state[field]));return b;}
  toggle('followed','✓\n已关注','+\n关注');toggle('liked','♥\n已点赞','♡\n点赞');toggle('saved','★\n已收藏','☆\n收藏');
  button('↗\n转发',()=>{const c=card('转发这个视频',url);button('转发到游戏社交',()=>{feed.unshift({name:'我',text:'分享视频：'+clip.bvid+' '+url});render('social');toast('已转发到游戏里的社交动态。');},c);button('复制视频链接',async()=>{try{if(!globalThis.navigator?.clipboard?.writeText){toast('请复制下方显示的视频链接。');return;}await globalThis.navigator.clipboard.writeText(url);toast('视频链接已复制。');}catch{toast('可以复制下方显示的视频链接。');}},c);},rail,'video-action');
  button('⌕\n搜同款',()=>{const c=card('发现同款视频','浏览你分享的同一组视频，或到哔哩哔哩搜索来源。');for(const [i,v] of videoLibrary.entries())button(v.title+' · '+v.bvid,()=>{favoritesOnly=false;videoQuery='';videoIndex=i;render('douyin');},c);const link=node('a','在哔哩哔哩搜索');link.href='https://search.bilibili.com/all?keyword='+encodeURIComponent(clip.src?clip.title:clip.bvid);link.target='_blank';link.rel='noopener noreferrer';c.append(link);},rail,'video-action');
  const controls=node('div',undefined,'video-paging');root.append(controls);button('↑ 上一个',()=>{videoIndex--;render('douyin');},controls);controls.append(node('span',(videoIndex+1)+' / '+all.length));button('↓ 下一个',()=>{videoIndex++;render('douyin');},controls);
  const source=node('a','原视频播放 ↗');source.href=url;source.target='_blank';source.rel='noopener noreferrer';source.className='video-source';root.append(source);
  root.append(node('p',clip.src?'原有游戏影音库片段，直接在手机里播放。':'来自你分享的哔哩哔哩链接；播放受来源网站支持情况影响。','video-note'));
 }
 function playSong(i){if(!audio||!tracks[i])return;song=i;audio.src=tracks[i].file;audio.play().then(()=>render('music')).catch(()=>toast('音乐加载失败，请再次点歌曲播放。'));}
 function open(){if(getState().locked)return;render('home');$('phone-dialog').showModal();}
 function close(){$('phone-content').querySelector?.('video')?.pause();$('phone-content').querySelector?.('iframe')?.remove();$('phone-dialog').close();}
 function tick(){const s=getState();if(order&&s.time>=order.arrive){const name=order.name;s.inventory.push(name);order=null;record('外卖已送达 · '+name,0);if($('phone-dialog').open&&app==='meituan')render();}if($('phone-dialog').open){$('phone-balance').textContent=money();if(homeDetail)homeDetail.textContent=s.region+' · 钱包 '+money();if(walletDetail)walletDetail.textContent=money()+' · 银行存款 ¥'+s.deposits.toLocaleString();if(order&&app==='meituan'&&Math.ceil(order.arrive-s.time)!==lastOrderSecond)render();}}
 $('phone-close').onclick=close;$('phone-back').onclick=()=>render('home');$('phone-dialog').addEventListener('close',()=>{$('phone-content').querySelector?.('video')?.pause();$('phone-content').querySelector?.('iframe')?.remove();});
 return {open,close,tick,get order(){return order},get app(){return app},get video(){return currentVideo},get interactions(){return interactions}};
}
