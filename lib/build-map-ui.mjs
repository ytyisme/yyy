import {openBuildSave,storeBuildSave,updateBuildSave,newSaveId,listBuildSaves} from './build-saves.mjs';
import {publishMap} from './community-client.mjs';
export function setupBuildMaps({storage,readScene,replaceScene,flushEdit,reset,leave,beforeExit=()=>{},canEdit,toast,onOpen}){
 const $=id=>document.getElementById(id),query=new URL(location.href).searchParams;
 let save;try{save=openBuildSave(storage,{id:query.get('map')||'',fresh:query.get('new')==='1'});}catch{save={id:newSaveId(),name:'我的自由创造',scene:readScene(),dirty:true};toast('本机存储不可用，退出前请重试保存。');}
 const url=new URL(location.href);url.searchParams.set('map',save.id);url.searchParams.delete('new');history.replaceState(null,'',url);
 if(!save.uploadedAt||save.backup)save={...save,dirty:true,backup:false};
 $('map-name').value=save.name;replaceScene(save.scene);
 let timer=0,flight=null,exiting=false,paused=false;
 const status=text=>$('save-state').textContent=text;
 const signature=value=>JSON.stringify([value.name,value.scene]);
 const latest=()=>listBuildSaves(storage).find(p=>p.id===save.id);
 function local(scene=readScene()){
  try{
   let name=$('map-name').value.trim()||'我的自由创造';
   const changed=name!==save.name||JSON.stringify(scene)!==JSON.stringify(save.scene);
   const persisted=latest(),elsewhere=persisted&&signature(persisted)!==signature(save);
   if(elsewhere&&!changed){save=persisted;$('map-name').value=save.name;replaceScene(save.scene);}
   else{
    if(elsewhere){name=name.slice(0,30)+'（另一窗口）';save={...save,id:newSaveId(),uploadedAt:0};$('map-name').value=name;const next=new URL(location.href);next.searchParams.set('map',save.id);history.replaceState(null,'',next);toast('另一个窗口已更新原地图，当前作品已另存，两个版本都会保留。');}
    if(changed||!save.updatedAt)save=updateBuildSave(storage,{...save,name},scene);
    else if(persisted?.uploadedAt&&!save.backup)save=persisted;
    else save=storeBuildSave(storage,save);
   }
   status(save.dirty?'已存本机 · 等待上传':'已保存 · 已发游戏圈');
   clearTimeout(timer);if(save.dirty&&!exiting&&!paused)timer=setTimeout(()=>upload().catch(()=>{}),3000);
   return true;
  }catch{status('本机保存失败 · 请勿关闭');return false;}
 }
 async function upload(){
  clearTimeout(timer);if(flight)return flight;
  const persisted=latest();if(persisted&&signature(persisted)!==signature(save)){if(!local())throw new Error('请先恢复本机存储。');clearTimeout(timer);}
  if(!save.dirty)return true;
  const snapshot=structuredClone(save);status('正在上传地图…');
  flight=(async()=>{
   try{const result=await publishMap(snapshot);
    // A newer edit made during upload must remain queued.
    if(save.updatedAt===snapshot.updatedAt&&save.name===snapshot.name&&JSON.stringify(save.scene)===JSON.stringify(snapshot.scene)){
     const persisted=latest();
     if(persisted&&signature(persisted)!==signature(snapshot))local();
     else{save={...save,dirty:false,uploadedAt:result.updatedAt};try{storeBuildSave(storage,save);}catch{}status('已保存 · 已发游戏圈');}
    }else if(!exiting)timer=setTimeout(()=>upload().catch(()=>{}),1500);
    return true;
   }catch(error){status('已存本机 · 待联网上传');throw error;}
   finally{flight=null;}
  })();return flight;
 }
 $('map-name').addEventListener('change',()=>local());
 $('reset-map').onclick=()=>{
  if(!canEdit()){toast('等房间连接和同步完成后再还原。');return;}
  flushEdit();
  try{storeBuildSave(storage,{...save,id:newSaveId(),name:save.name.slice(0,31)+'（还原前备份）',scene:readScene(),updatedAt:Date.now(),dirty:false,uploadedAt:0,backup:true});}
  catch{toast('无法备份原地图，请恢复本机存储后重试还原。');return;}
  reset();toast('已还原到初始场景，原作品在游戏列表的“还原前备份”里。');
 };
 async function exit(){
  if(exiting)return;exiting=true;clearTimeout(timer);$('save-exit').disabled=true;
  beforeExit();flushEdit();
  if(!local()){exiting=false;$('save-exit').disabled=false;toast('地图还未保存成功，请勿关闭页面。');return;}
  status('保存成功，正在上传…');
  let uploaded=false;try{if(flight)await flight;uploaded=save.dirty?await upload():true;}catch{}
  paused=true;leave();location.href='map-list.html?'+(uploaded?'saved=1':'pending=1');
 }
 $('save-exit').onclick=exit;
 $('map-back').onclick=event=>{event.preventDefault();exit();};
 $('circle-link').onclick=()=>{onOpen();flushEdit();local();};
 const retry=setInterval(()=>{if(save.dirty&&!flight&&!exiting&&!document.hidden)upload().catch(()=>{});},20000);
 window.addEventListener('pagehide',()=>{paused=true;clearTimeout(timer);clearInterval(retry);beforeExit();flushEdit();local();});
 window.addEventListener('online',()=>{if(save.dirty)upload().catch(()=>{});});
 return {local,upload,get save(){return save;}};
}
