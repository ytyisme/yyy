import {listBuildSaves,storeBuildSave,openBuildSave,copySharedSave} from './lib/build-saves.mjs';
import {communityRequest,publishMap} from './lib/community-client.mjs';
import {isTrack,sampleTrack} from './lib/coaster.mjs';
const $=id=>document.getElementById(id),query=new URL(location.href).searchParams;let storage;try{storage=localStorage;}catch{}
const node=(tag,cls='',text='')=>{const el=document.createElement(tag);el.className=cls;el.textContent=text;return el;};
function preview(canvas,scene){
 canvas.width=640;canvas.height=300;const ctx=canvas.getContext('2d');ctx.fillStyle='#dde7d0';ctx.fillRect(0,0,640,300);
 const points=scene.flatMap(p=>isTrack(p)?sampleTrack(p).points:[{x:p.x-p.w/2,z:p.z-p.l/2},{x:p.x+p.w/2,z:p.z+p.l/2}]),xs=points.map(p=>p.x),zs=points.map(p=>p.z),minX=Math.min(-20,...xs)-8,maxX=Math.max(20,...xs)+8,minZ=Math.min(-20,...zs)-8,maxZ=Math.max(20,...zs)+8,scale=Math.min(600/(maxX-minX),260/(maxZ-minZ));
 const pos=p=>({x:320+(p.x-(minX+maxX)/2)*scale,y:150+(p.z-(minZ+maxZ)/2)*scale});
 ctx.save();ctx.strokeStyle='#c3cfb7';ctx.lineWidth=1;for(let x=-120;x<120;x+=10){const a=pos({x,z:-120}),b=pos({x,z:120});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(let z=-120;z<120;z+=10){const a=pos({x:-120,z}),b=pos({x:120,z});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 const road=pos({x:0,z:0});ctx.fillStyle='#a8b49e';ctx.fillRect(road.x-3*scale,0,6*scale,300);ctx.setLineDash([7,9]);ctx.strokeStyle='#e9ecd9';ctx.beginPath();ctx.moveTo(road.x,0);ctx.lineTo(road.x,300);ctx.stroke();ctx.setLineDash([]);
 for(const object of scene){if(isTrack(object))continue;const p=pos(object);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-object.rotation);ctx.fillStyle={brick:'#c9916b',pool:'#7baead',slide:'#d1ae58',beer:'#90a271',tv:'#608984',coaster:'#b57d58',stairs:'#c3b28c',tunnel:'#9d9e80',dig:'#89967b'}[object.type]||'#bdcaa8';const w=Math.max(5,object.w*scale),l=Math.max(5,object.l*scale);ctx.fillRect(-w/2+2,-l/2+3,w,l);ctx.fillStyle=object.type==='pool'?'#92c6c2':'#f8e5bf66';ctx.fillRect(-w/2,-l/2,w,l);ctx.restore();}
 for(const track of scene.filter(isTrack)){const points=sampleTrack(track).points;ctx.beginPath();points.forEach((p,i)=>{const point=pos(p);if(i)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});ctx.strokeStyle=track.y<0?'#7f9682':'#577e6b';ctx.lineWidth=Math.max(3,track.w*scale);ctx.stroke();ctx.strokeStyle='#d8c493';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
}
function render(){
 $('my-maps').replaceChildren();const records=listBuildSaves(storage).sort((a,b)=>b.updatedAt-a.updatedAt);
 if(!records.length){const empty=node('div','empty-state','这里还没有地图。点击“新建自由创造”，开始你的第一个世界吧。');$('my-maps').append(empty);}
 for(const save of records){const card=node('article','save-card'),canvas=node('canvas','save-preview');canvas.setAttribute('aria-label',save.name+'的地图预览');preview(canvas,save.scene);const details=node('div','save-details');details.append(node('h2','',save.name),node('p','',`${save.scene.length} 件物品 · ${new Date(save.updatedAt).toLocaleString('zh-CN')}`),node('p','',save.backup?'还原前的完整备份':save.dirty?'已存本机 · 等待上传':save.uploadedAt?'已上传 · 已自动发布游戏圈':'已保存在本机'));
  const actions=node('div','save-actions'),play=node('a','primary','继续游戏 ↗');play.href='season2-lv18.html?map='+encodeURIComponent(save.id)+'&loading=1';const upload=node('button','',save.dirty?'重试上传':'更新上传');upload.type='button';upload.onclick=async()=>{upload.disabled=true;try{await sync(save);$('map-list-status').textContent='上传成功，游戏圈里的地图已更新。';render();}catch(error){$('map-list-status').textContent=error.message;upload.disabled=false;}};actions.append(play,upload);details.append(actions);card.append(canvas,details);$('my-maps').append(card);
 }
}
async function sync(save){const result=await publishMap(save),current=listBuildSaves(storage).find(p=>p.id===save.id);if(current&&current.updatedAt===save.updatedAt)storeBuildSave(storage,{...current,dirty:false,uploadedAt:result.updatedAt});}
async function remote(){
 try{const data=await communityRequest('my-maps');const ids=new Set(listBuildSaves(storage).map(p=>p.id));$('remote-maps').replaceChildren();for(const map of data.maps.filter(p=>!ids.has(p.id))){const row=node('div','remote-card'),restore=node('button','','恢复到本机');restore.onclick=async()=>{restore.disabled=true;try{copySharedSave(storage,await communityRequest('maps/'+encodeURIComponent(map.id)),{keepId:true});render();row.remove();}catch(error){$('map-list-status').textContent=error.message;restore.disabled=false;}};row.append(node('span','',map.name),restore);$('remote-maps').append(row);}if(!$('remote-maps').children.length)$('remote-maps').append(node('p','hint','已上传的地图都在上面的列表中。'));}
 catch(error){$('remote-maps').textContent=error.message;$('remote-maps').className='hint';}
}
async function start(){
 if(query.get('shared')){ $('map-list-status').textContent='正在打开朋友分享的地图…';try{const map=await communityRequest('maps/'+encodeURIComponent(query.get('shared'))),copy=copySharedSave(storage,map);location.replace('season2-lv18.html?map='+encodeURIComponent(copy.id));return;}catch(error){$('map-list-status').textContent=error.message;}}
 // Keep the original single-scene save when upgrading existing builders.
 try{if(!listBuildSaves(storage).length&&storage.getItem('lava-build-world-v1'))openBuildSave(storage);}catch{}
 render();if(query.has('saved'))$('map-list-status').textContent='地图已保存并上传，已自动发到游戏圈。下次点击“继续游戏”就能接着建造。';else if(query.has('pending'))$('map-list-status').textContent='地图已保存在本机。上传尚未完成，联网后会自动重试，也可以点击“重试上传”。';
 await remote();for(const save of listBuildSaves(storage).filter(p=>p.dirty)){try{await sync(save);render();}catch{break;}}
}
window.addEventListener('online',()=>start());window.addEventListener('storage',event=>{if(event.key==='lava-build-saves-v1')render();});start();
