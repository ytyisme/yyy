import {connectRoom,makeRoomCode,makePlayerId,ROOM_PATTERN} from './chase-network.mjs';
import {cleanName} from './chase-room.mjs';
import {createBuildRoom,MAX_PLAYERS} from './build-room.mjs';

export function setupBuildOnline({readPose,readScene,replaceScene,saveSolo,toast,onOpen}){
  const $=id=>document.getElementById(id),id=makePlayerId();
  let room=null,transport=null,code='',pending=false,generation=0,backup=null,createdHost=false,lastRoster='',searchTimer;
  try{$('player-name').value=cleanName(localStorage.getItem('lava-build-player')||localStorage.getItem('s2_player')||'建造者');}catch{$('player-name').value='建造者';}
  const status=text=>$('room-status').textContent=text;
  function paint(){
    if(!room)return;
    const connected=!!transport?.online&&room.state.joined;
    $('online-label').textContent=connected?'联机 '+room.members.size+'人':'连接中';$('online-toggle').classList.toggle('connected',connected);
    $('room-code').textContent=code;$('room-count').textContent=`${room.members.size} / ${MAX_PLAYERS} 人`;
    $('room-setup').hidden=true;$('room-active').hidden=false;$('room-badge').hidden=false;
    $('room-summary').textContent=`${code} · ${connected?room.members.size+'人一起建造':'重连中'}`;
    $('keep-room-scene').disabled=!connected||!room.synced;
    if(room.state.error)status(room.state.error);
    else if(!transport?.online)status('正在连接联机服务，网络恢复后会自动重连。');
    else if(!room.state.joined)status('正在寻找房间，请让房主保持游戏打开。');
    else if(!room.synced)status('正在同步房间里的物品…');
    else status('已联机！每个人都能放置、移动和调整物品，修改会同步给所有人。');
    const rows=[...room.members.values()].map(p=>[p.id,p.name,p.id===room.state.hostId]);
    const signature=JSON.stringify(rows);if(signature===lastRoster)return;lastRoster=signature;$('room-members').replaceChildren();
    for(const [peerId,name,host]of rows){const li=document.createElement('li');li.textContent=name+(peerId===id?'（我）':'')+(host?' · 房主':'');$('room-members').append(li);}
  }
  function show(){onOpen();$('online').showModal();}
  function leave(close=true,keepScene=false){
    generation++;clearTimeout(searchTimer);room?.leave();transport?.close();
    const previous=backup,wasHost=createdHost;
    room=transport=null;code='';pending=false;backup=null;createdHost=false;lastRoster='';
    if(previous&&!wasHost&&!keepScene)replaceScene(previous);
    if(previous)saveSolo(readScene());
    $('room-setup').hidden=false;$('room-active').hidden=true;$('room-badge').hidden=true;
    $('online-label').textContent='联机';$('online-toggle').classList.remove('connected');$('create-room').disabled=$('join-button').disabled=false;$('copy-room').textContent='复制房间码';
    status('最多6人，一起放置、移动和调整物品。');if(close)$('online').close();
  }
  async function enter(host,value=''){
    if(pending)return;
    const requested=host?makeRoomCode($('backup-route').checked?1:0):value.toUpperCase().replace(/[\s-]/g,'');
    if(!ROOM_PATTERN.test(requested)){status('请输入8位房间码，以1或2开头。');return;}
    leave(false);code=requested;pending=true;createdHost=host;backup=readScene();const mine=++generation;
    const name=cleanName($('player-name').value);try{localStorage.setItem('lava-build-player',name);}catch{}
    $('create-room').disabled=$('join-button').disabled=true;
    room=createBuildRoom({id,name,host,initial:host?backup:[],send:message=>transport?.send(message),onChange:paint,onError:toast,onScene:objects=>{replaceScene(objects);if(createdHost)saveSolo(objects);}});
    paint();
    try{
      const created=await connectRoom({code,id,scope:'build18',onMessage:message=>{if(mine===generation)room?.receive(message);},onStatus:value=>{if(mine===generation){room?.setOnline(value==='online');paint();}}});
      if(mine!==generation){created.close();return;}transport=created;paint();
      searchTimer=setTimeout(()=>{if(mine!==generation)return;if(!transport.online)status('当前线路较慢，可退出后勾选备用线路重新创建房间。');else if(!room.state.joined)status('没有找到房间，请核对房间码，并让房主保持游戏打开。');},18000);
    }catch(error){if(mine===generation){leave(false);status(error.message||'连接失败，请重试。');}}
    finally{if(mine===generation){pending=false;$('create-room').disabled=$('join-button').disabled=false;}}
  }
  $('online-toggle').onclick=show;$('room-summary').onclick=show;$('online-close').onclick=()=>$('online').close();
  $('online').addEventListener('close',onOpen);
  $('create-room').onclick=()=>enter(true);$('join-room').onsubmit=event=>{event.preventDefault();enter(false,$('room-input').value);};
  $('leave-room').onclick=()=>leave();
  $('copy-room').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('copy-room').textContent='已复制';}catch{status('房间码：'+code+'，把它告诉朋友即可加入。');}};
  $('keep-room-scene').onclick=()=>{if(!room?.synced)return;backup=room.objects;saveSolo(backup);toast('已保存房间作品，退出联机后也能继续建造。');};
  const timer=setInterval(()=>{if(room){room.tick(readPose());paint();}},100);
  window.addEventListener('pagehide',()=>{clearInterval(timer);room?.leave();transport?.close();});
  return {id,show,leave,get now(){return room?.clockNow()??Date.now();},get active(){return !!room;},get online(){return !!transport?.online&&!!room?.state.joined;},get synced(){return !!room?.synced;},get members(){return room?.members??new Map();},edit(action){return room?.edit(action)??false;}};
}
