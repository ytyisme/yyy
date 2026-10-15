import {connectRoom,makeRoomCode,makePlayerId,ROOM_PATTERN} from './chase-network.mjs';
import {createChaseRoom,cleanName} from './chase-room.mjs';
const $=id=>document.getElementById(id);
const phases={ready:'准备中',running:'奔跑中',paused:'已暂停',won:'已逃离',caught:'被追上'};
export function setupChaseOnline({onStart,onLeave,onPause,onModeChange=()=>{}}){
  let transport=null,room=null,code='',pending=false,generation=0,findTimer=0,lastRoster='',name='';
  const id=makePlayerId();try{name=cleanName(localStorage.getItem('lava-level16-name')||'防护员'+id.slice(0,4));}catch{name='防护员'+id.slice(0,4);} $('player-name').value=name;
  function show(){onPause();$('lobby').hidden=false;}
  function hide(){if(room&&!room.state.joined){leave();return;}$('lobby').hidden=true;}
  function error(message){$('room-status').textContent=message;}
  function update(){if(!room)return;const st=room.state;const connected=transport?.online||false;
    $('online-toggle').textContent=connected?'联机 '+room.members.size+' 人':st.online?'联机':'重新连接…';
    $('room-code-display').textContent=code;$('room-count').textContent=room.members.size+' / 6 人';$('room-active').hidden=false;$('room-setup').hidden=true;$('room-mini').hidden=false;$('room-mini-label').textContent='房间 '+code+' · '+room.members.size+' 人';
    if(st.error)error(st.error);else if(!connected)error('连接中，请稍等。网络恢复后会重新连接。');else if(!st.joined)error('正在寻找房间，请让房主保持页面打开。');else if(st.phase==='countdown')error('准备开跑！');else if(st.phase==='running')error(st.roundPlayers.includes(id)?'同一条长廊 · 3,000米出口':'这一局已经开始，你将在下一局加入。');else error(room.isHost?'让朋友输入房间码，全部准备后一起开跑。':'点击准备，等房主开始。');
    const me=room.members.get(id);$('room-ready').textContent=me?.ready?'✓ 已准备 · 取消':'我准备好了';$('room-ready').disabled=!connected||!st.joined||st.phase!=='lobby';$('room-start').hidden=!room.isHost;$('room-start').disabled=!connected||st.phase!=='lobby'||room.members.size<2||!Array.from(room.members.values()).every(p=>p.ready);
    const roster=Array.from(room.members.values()).sort((a,b)=>b.pose.distance-a.pose.distance||a.joinedAt-b.joinedAt);
    const signature=JSON.stringify(roster.map(p=>[p.id,p.name,p.ready,Math.floor(p.pose.distance),p.pose.phase,st.hostId]));
    if(signature!==lastRoster){lastRoster=signature;for(const list of [$('room-players'),$('mini-players')]){list.replaceChildren();for(const p of roster){const li=document.createElement('li'),label=document.createElement('span'),detail=document.createElement('small');label.textContent=p.name+(p.id===id?'（我）':'')+(p.id===st.hostId?' · 房主':'');detail.textContent=st.phase==='lobby'?(p.ready?'✓ 已准备':'等待准备'):(Math.floor(p.pose.distance).toLocaleString('zh-CN')+'米 · '+phases[p.pose.phase]);li.append(label,detail);list.append(li);}}}
    $('intro').hidden=true;onModeChange(true);
  }
  async function enter(host,requestedCode){if(pending)return;pending=true;const mine=++generation;
    clearTimeout(findTimer);transport?.close();room?.leave();transport=null;room=null;lastRoster='';
    code=host?makeRoomCode($('backup-route').checked?1:0):String(requestedCode||'').toUpperCase().replace(/[\s-]/g,'');
    if(!ROOM_PATTERN.test(code)){pending=false;error('请输入8位房间码，例如 1ABCDEFG');return;}
    name=cleanName($('player-name').value);try{localStorage.setItem('lava-level16-name',name);}catch{}
    $('create-room').disabled=true;$('join-room-button').disabled=true;error('正在连接联机房间…');
    room=createChaseRoom({id,name,host,send:msg=>transport?.send(msg),onStart:info=>{if(mine!==generation)return;$('lobby').hidden=true;$('countdown').hidden=true;onStart({...info,index:room.state.roundPlayers.indexOf(id)});},onChange:update});
    try{const created=await connectRoom({code,id,onMessage:msg=>{if(mine===generation)room.receive(msg);},onStatus:status=>{if(mine!==generation)return;room.setOnline(status==='online');if(status==='offline')onPause();update();}});if(mine!==generation){created.close();return;}transport=created;update();findTimer=setTimeout(()=>{if(room&&!room.state.joined)error('没有找到房间，请确认房间码和房主的网络。');else if(!transport?.online)error('当前线路连接较慢，可以退出后勾选备用线路创建房间。');},15000);
    }catch(err){if(mine===generation){room=null;error(err.message||'连接失败，请重试');$('room-setup').hidden=false;$('room-active').hidden=true;}}
    finally{if(mine===generation){pending=false;$('create-room').disabled=false;$('join-room-button').disabled=false;}}
  }
  function leave(){generation++;clearTimeout(findTimer);room?.leave();transport?.close();room=null;transport=null;code='';pending=false;lastRoster='';$('lobby').hidden=true;$('room-active').hidden=true;$('room-setup').hidden=false;$('room-mini').hidden=true;$('countdown').hidden=true;$('online-toggle').textContent='联机';$('create-room').disabled=false;$('join-room-button').disabled=false;error('创建房间，或输入朋友的房间码。');onModeChange(false);onLeave();}
  $('online-toggle').onclick=show;$('multiplayer').onclick=show;$('room-mini-label').onclick=show;$('close-lobby').onclick=hide;$('leave-room').onclick=leave;
  $('create-room').onclick=()=>enter(true);$('join-room').onsubmit=e=>{e.preventDefault();enter(false,$('room-code-input').value);};
  $('room-ready').onclick=()=>room?.ready(!room.members.get(id)?.ready);$('room-start').onclick=()=>{if(room?.begin()){$('lobby').hidden=true;}};
  $('copy-room').onclick=async()=>{try{await navigator.clipboard.writeText(code);$('copy-room').textContent='已复制';}catch{$('room-code-display').focus();error('房间码：'+code+'，请把它告诉朋友。');}};
  window.addEventListener('pagehide',()=>{room?.leave();transport?.close();});
  return {id,get active(){return !!room;},get members(){return room?.members||new Map();},get state(){return room?.state;},get isHost(){return room?.isHost||false;},leave,show,hide,tick(pose){if(!room)return;room.tick(pose);const st=room.state;if(st.phase==='countdown'&&st.roundPlayers.includes(id)){const seconds=Math.ceil((st.startAt-Date.now())/1000);$('countdown').hidden=seconds<=0;$('countdown').textContent=seconds>0?String(seconds):'跑！';}else $('countdown').hidden=true;},retry(){if(!room)return false;room.ready(true);show();return true;}};
}
