import {communityRequest,playerName} from './lib/community-client.mjs';
const $=id=>document.getElementById(id),form=$('compose');
const stickers=['开玩啦 🎮','我来了 🐾','太强了 ✨','哈哈哈哈 😂','今日摸鱼 🐟','抱抱你 🫂'];
let files=[],posts=new Map(),cursor='',filter='全部',loading=false,clientId=crypto.randomUUID().replaceAll('-','');
$('author').value=playerName();
try{const draft=JSON.parse(localStorage.getItem('lava-circle-draft')||'null');if(draft){$('post-title').value=draft.title||'';$('post-text').value=draft.text||'';$('post-category').value=draft.category||'游戏';}}catch{}
form.addEventListener('input',()=>{try{localStorage.setItem('lava-circle-draft',JSON.stringify({title:$('post-title').value,text:$('post-text').value,category:$('post-category').value}));localStorage.setItem('lava-community-name',$('author').value.trim());}catch{}});
const node=(tag,className='',text='')=>{const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;};
for(const emoji of ['😀','😂','🥹','😎','😍','🤔','👍','🎮','❤️','✨','🎉','🐾','🌈','🍀','🏗️','🚀']){const button=node('button','',emoji);button.type='button';button.setAttribute('aria-label','插入表情 '+emoji);button.onclick=()=>insert(emoji);$('emojis').append(button);}
for(const label of stickers){const button=node('button','',label);button.type='button';button.onclick=()=>insert('\n[表情包:'+label+']\n');$('stickers').append(button);}
function insert(text){const input=$('post-text');input.setRangeText(text,input.selectionStart,input.selectionEnd,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
$('add-emoji').onclick=()=>{$('emoji-panel').hidden=!$('emoji-panel').hidden;$('add-emoji').setAttribute('aria-expanded',String(!$('emoji-panel').hidden));};
function showAttachments(){
 $('attachments').replaceChildren();$('attachments').hidden=!files.length;
 for(const [index,file]of files.entries()){
  const wrap=node('div','attachment'),preview=node(file.type.startsWith('video/')?'video':'img');preview.src=file.url;if(preview.tagName==='VIDEO'){preview.muted=true;preview.preload='metadata';}else preview.alt=file.name;
  const remove=node('button','','×');remove.type='button';remove.setAttribute('aria-label','移除附件 '+file.name);remove.onclick=()=>{URL.revokeObjectURL(file.url);files.splice(index,1);showAttachments();};wrap.append(preview,node('small','',file.name),remove);$('attachments').append(wrap);
 }
}
$('media-files').onchange=()=>{
 for(const file of $('media-files').files){if(files.length>=4){$('compose-status').textContent='一次最多4个附件。';break;}if(file.size>40*1024*1024){$('compose-status').textContent=file.name+' 超过40MB，请选择小一点的附件。';continue;}files.push({file,name:file.name,type:file.type,url:URL.createObjectURL(file)});}
 $('media-files').value='';showAttachments();
};
form.onsubmit=async event=>{
 event.preventDefault();const title=$('post-title').value.trim(),text=$('post-text').value.trim();
 if(!title&&!text&&!files.length){$('compose-status').textContent='先写点内容，或选一张图片、表情包吧。';return;}
 const author=$('author').value.trim()||'玩家',category=$('post-category').value;
 const controls=[...form.querySelectorAll('input,button,textarea,select')];controls.forEach(el=>el.disabled=true);
 try{
  try{localStorage.setItem('lava-community-name',author);}catch{}
  const media=[];for(const [index,item]of files.entries()){$('compose-status').textContent=`正在上传附件 ${index+1}/${files.length}…`;if(!item.uploaded)item.uploaded=await communityRequest('media',{method:'POST',body:item.file,timeout:120000});media.push(item.uploaded.id);}
  $('compose-status').textContent='正在发布…';await communityRequest('posts',{method:'POST',body:{clientId,author,category,title,text,media}});
  $('post-title').value='';$('post-text').value='';for(const file of files)URL.revokeObjectURL(file.url);files=[];showAttachments();$('emoji-panel').hidden=true;$('add-emoji').setAttribute('aria-expanded','false');
  clientId=crypto.randomUUID().replaceAll('-','');try{localStorage.removeItem('lava-circle-draft');}catch{}
  $('compose-status').textContent='已发布，所有玩家都能在游戏圈看到。';filter='全部';paintTabs();await refresh();
 }catch(error){$('compose-status').textContent=error.message;}
 finally{controls.forEach(el=>el.disabled=false);}
};
function viewPhoto(url,alt){const dialog=node('dialog','photo-viewer'),img=node('img');img.src=url;img.alt=alt;const close=node('button','','关闭图片');close.onclick=()=>dialog.close();dialog.append(img,close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();}
function content(body,text){
 const parts=text.split(/(\[表情包:[^\]\n]+\])/g);for(const part of parts){const label=part.slice(5,-1);if(part.startsWith('[表情包:')&&stickers.includes(label))body.append(node('span','post-sticker',label));else body.append(document.createTextNode(part));}
}
function postCard(post){
 const article=node('article','post');article.dataset.id=post.id;article.dataset.signature=JSON.stringify(post);
 const head=node('div','post-head'),who=node('div','post-who'),date=new Date(post.updatedAt),time=node('time','',date.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}));time.dateTime=date.toISOString();who.append(node('b','',post.author),time);head.append(node('span','avatar','☻'),who,node('span','category-tag',post.category));article.append(head);
 if(post.title)article.append(node('h3','',post.title));if(post.text){const body=node('div','post-body');content(body,post.text);article.append(body);}
 if(post.map){const card=node('div','map-share'),picture=node('div','map-picture');picture.append(node('span','','▦'));const detail=node('div','map-share-detail');detail.append(node('small','','A WORLD MADE BY YOU'),node('strong','',post.map.name),node('p','',post.map.count+' 件建造物品 · 可继续创造、联机'));const link=node('a','','进入这张地图 ↗');link.href='map-list.html?shared='+encodeURIComponent(post.map.id);detail.append(link);card.append(picture,detail);article.append(card);}
 if(post.media.length){const grid=node('div','post-media');for(const media of post.media){const el=node(media.kind==='video'?'video':'img');el.src=media.url;if(media.kind==='video'){el.controls=true;el.preload='metadata';el.playsInline=true;}else{el.alt=post.title||post.author+'分享的图片';el.loading='lazy';el.onclick=()=>viewPhoto(media.url,el.alt);}grid.append(el);}article.append(grid);}
 return article;
}
function render(){
 const selected=[...posts.values()].sort((a,b)=>b.updatedAt-a.updatedAt||b.id.localeCompare(a.id)).filter(p=>filter==='全部'||p.category===filter),feed=$('feed');
 const nodes=new Map([...feed.querySelectorAll('.post')].map(el=>[el.dataset.id,el]));
 for(const el of [...feed.children])if(!selected.some(p=>p.id===el.dataset.id))el.remove();
 selected.forEach((post,index)=>{let el=nodes.get(post.id);if(!el||el.dataset.signature!==JSON.stringify(post)){const next=postCard(post);if(el)el.replaceWith(next);el=next;}if(feed.children[index]!==el)feed.insertBefore(el,feed.children[index]||null);});
 if(!selected.length)feed.replaceChildren(node('div','empty-state',filter==='全部'?'游戏圈还很安静。发一条动态，和大家打个招呼吧 ☻':'这个分类还没有动态，来分享第一条吧 ☻'));
 $('load-more').hidden=!cursor;
}
function paintTabs(){document.querySelectorAll('[data-filter]').forEach(button=>button.classList.toggle('selected',button.dataset.filter===filter));render();}
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;paintTabs();});
async function refresh(more=false,quiet=false){
 if(loading)return;loading=true;$('refresh-feed').disabled=true;$('load-more').disabled=true;
 try{const data=await communityRequest('feed'+(more?'?before='+encodeURIComponent(cursor):''));if(!more&&!quiet)posts.clear();for(const post of data.posts)posts.set(post.id,post);if(!quiet||!cursor)cursor=data.next;$('feed-status').textContent='';render();}
 catch(error){$('feed-status').textContent=error.message;if(!posts.size)$('feed').replaceChildren();}
 finally{loading=false;$('refresh-feed').disabled=false;$('load-more').disabled=false;}
}
$('refresh-feed').onclick=()=>refresh();$('load-more').onclick=()=>refresh(true);
// Quietly receive new global messages while the composer stays editable.
const poll=setInterval(()=>{if(!document.hidden)refresh(false,true);},7000);window.addEventListener('pagehide',()=>clearInterval(poll));refresh();
