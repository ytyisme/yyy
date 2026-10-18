import {connectRoom,makeRoomCode,makePlayerId,ROOM_PATTERN} from './chase-network.mjs';
import {createCityRoom,cleanCityPose,sameCitySpace,MAX_PLAYERS} from './city-room.mjs';
import {cleanName} from './chase-room.mjs';

export function setupCityOnline({readPose,onAssemble,onOpen=()=>{},onLeave=()=>{}}) {
  const $=id=>document.getElementById(id),id=makePlayerId();
  let transport=null,room=null,code='',pending=false,generation=0,findTimer=0,lastRoster='',assembled=false;
  try{$('city-player-name').value=cleanName(localStorage.getItem('lava-city-online-name')||localStorage.getItem('s2_player')||'市民'+id.slice(0,4));}
  catch{$('city-player-name').value='市民'+id.slice(0,4);}
  function status(message){$('city-room-status').textContent=message;}
  function show(){onOpen();if(!$('city-online-dialog').open)$('city-online-dialog').showModal();}
  function paint() {
    if(!room)return;
    const state=room.state,connected=!!transport?.online;
    $('city-online-toggle').textContent=connected&&state.joined?'联机 '+room.members.size+'人':'联机连接中…';
    $('city-room-code').textContent=code;$('city-room-count').textContent=`${room.members.size} / ${MAX_PLAYERS} 人`;
    $('city-room-setup').hidden=true;$('city-room-active').hidden=false;$('city-online-mini').hidden=false;
    $('city-online-summary').textContent=`房间 ${code} · ${connected?room.members.size+'人':'重连中'}`;
    if(state.error)status(state.error);
    else if(!connected)status('正在连接。网络恢复后会自动重连。');
    else if(!state.joined)status('正在寻找房间，请让房主保持游戏打开。');
    else status('已经联机。在同一地点可以看见朋友，也可以点击“集合”前往朋友所在城市。');
    if(connected&&state.joined&&!assembled&&!room.isHost) {
      const host=room.members.get(state.hostId),pose=cleanCityPose(host?.pose);
      if(pose){assembled=true;onAssemble(pose,true);}
    }
    const members=[...room.members.values()].sort((a,b)=>a.joinedAt-b.joinedAt||a.id.localeCompare(b.id));
    const signature=JSON.stringify(members.map(p=>[p.id,p.name,p.id===state.hostId,p.pose?.label,p.pose?.mode,p.pose?.zone,state.online,state.joined]));
    if(signature===lastRoster)return;lastRoster=signature;$('city-room-players').replaceChildren();
    for(const member of members) {
      const li=document.createElement('li'),text=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');
      name.textContent=member.name+(member.id===id?'（我）':'')+(member.id===state.hostId?' · 房主':'');
      const pose=cleanCityPose(member.pose);
      const mode={walk:'步行',drive:'驾驶中',passenger:'乘车中',flight:'乘机中'};
      detail.textContent=pose?`${pose.label} · ${mode[pose.mode]}`:'正在同步位置';
      text.append(name,detail);li.append(text);
      if(member.id!==id) {
        const meet=document.createElement('button');meet.type='button';meet.textContent='集合';
        meet.disabled=!connected||!state.joined||!pose||pose.zone!=='city';
        if(pose&&pose.zone!=='city')meet.title='请等朋友回到城市街道后集合';
        meet.onclick=()=>{const latest=cleanCityPose(room?.members.get(member.id)?.pose);if(latest&&onAssemble(latest,false))$('city-online-dialog').close();};
        li.append(meet);
      }
      $('city-room-players').append(li);
    }
  }
  function leave(close=true) {
    generation++;clearTimeout(findTimer);room?.leave();transport?.close();room=null;transport=null;code='';pending=false;lastRoster='';assembled=false;
    $('city-room-setup').hidden=false;$('city-room-active').hidden=true;$('city-online-mini').hidden=true;$('city-online-toggle').textContent='联机';
    $('city-create-room').disabled=$('city-join-button').disabled=false;$('city-copy-room').textContent='复制房间码';
    if(close)$('city-online-dialog').close();status('创建房间，把8位房间码告诉朋友；朋友打开游戏后输入房间码加入。');onLeave();
  }
  async function enter(host,value='') {
    if(pending)return;
    const requested=host?makeRoomCode($('city-backup-route').checked?1:0):value.toUpperCase().replace(/[\s-]/g,'');
    if(!ROOM_PATTERN.test(requested)){status('请输入8位房间码，以1或2开头。');return;}
    leave(false);code=requested;pending=true;const mine=++generation;
    const name=cleanName($('city-player-name').value);
    try{localStorage.setItem('lava-city-online-name',name);}catch{}
    $('city-create-room').disabled=$('city-join-button').disabled=true;status('正在连接联机房间…');
    room=createCityRoom({id,name,host,send:message=>transport?.send(message),onChange:paint});
    try {
      const created=await connectRoom({code,id,scope:'city15',onMessage:message=>{if(mine===generation)room?.receive(message);},onStatus:value=>{if(mine!==generation)return;room?.setOnline(value==='online');paint();}});
      if(mine!==generation){created.close();return;}
      transport=created;paint();
      findTimer=setTimeout(()=>{
        if(mine!==generation)return;
        if(!transport?.online)status('当前线路连接较慢。可退出联机，再勾选“备用线路”创建房间。');
        else if(!room?.state.joined)status('没有找到房间，请检查房间码，并让房主保持游戏打开。');
      },15000);
    } catch(error) {
      if(mine===generation){leave(false);status(error.message||'连接失败，请稍后重试。');}
    } finally {
      if(mine===generation){pending=false;$('city-create-room').disabled=$('city-join-button').disabled=false;}
    }
  }
  $('city-online-toggle').onclick=show;$('city-online-summary').onclick=show;
  $('city-online-close').onclick=()=>$('city-online-dialog').close();
  $('city-online-dialog').addEventListener('close',onOpen);
  $('city-create-room').onclick=()=>enter(true);
  $('city-join-form').onsubmit=event=>{event.preventDefault();enter(false,$('city-room-input').value);};
  $('city-leave-room').onclick=()=>leave();
  $('city-copy-room').onclick=async()=>{
    try{await navigator.clipboard.writeText(code);$('city-copy-room').textContent='已复制';}
    catch{status('房间码：'+code+'，请把这个房间码告诉朋友。');}
  };
  const timer=setInterval(()=>{if(room){room.tick(readPose());paint();}},100);
  window.addEventListener('pagehide',()=>{clearInterval(timer);room?.leave();transport?.close();});
  return {id,show,leave,get active(){return !!room;},get online(){return !!transport?.online&&!!room?.state.joined;},get members(){return room?.members??new Map();},
    isVehicleTaken(plate,pose){return !!room&&[...room.members.values()].some(p=>p.id!==id&&p.pose?.vehicle?.plate===plate&&sameCitySpace(pose,p.pose));}};
}
