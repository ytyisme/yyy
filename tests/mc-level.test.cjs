const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

async function harness(){
  const {createMcTouchInput,MC_KEYBOARD_CONTROLS}=await import("../lib/mc-touch.mjs");
  function target(){const listeners=new Map();return {hidden:false,disabled:false,textContent:'',dataset:{},attributes:{},classList:{add(){},remove(){}},setAttribute(name,value){this.attributes[name]=value;},setPointerCapture(){},addEventListener(type,callback){listeners.set(type,callback);},emit(type,event={}){return listeners.get(type)?.(event);}};}
  const elements=new Map(['mc-frame','mc-stage','mc-status','mc-help','mc-intro','mc-start','mc-reload','mc-fullscreen','mc-help-close','mc-touch-toggle','mc-touch-controls','mc-touch-surface','mc-touch-tools','mc-forward','mc-back','mc-left','mc-right','mc-jump','mc-inventory','mc-menu'].map(id=>[id,target()]));
  const packets=[];const el=id=>elements.get(id),timers=new Map(),window=target(),document=target(),navigator={onLine:true};
  let timerId=0,loads=0,src='';
  Object.defineProperty(el('mc-frame'),'src',{get:()=>src,set:value=>{src=value;loads++;}});
  el('mc-frame').dataset.src='mc-client.html?v=1';el('mc-frame').contentWindow={postMessage:(data,origin)=>packets.push({data,origin})};el('mc-frame').hidden=true;el('mc-help').hidden=true;
  el('mc-reload').disabled=true;el('mc-fullscreen').disabled=true;
  window.setTimeout=fn=>{timers.set(++timerId,fn);return timerId;};window.clearTimeout=id=>timers.delete(id);document.getElementById=el;
  const location={href:'http://127.0.0.1:8765/season2-lv19.html'};const context=vm.createContext({window,document,navigator,location,URL,createMcTouchInput,MC_KEYBOARD_CONTROLS});vm.runInContext(fs.readFileSync(new URL('../season2-lv19.js',`file://${__filename}`),'utf8').replace(/^import .*;\n/gm,''),context);
  return {el,window,document,navigator,timers,packets,get loads(){return loads;}};
}

test('the embedded game starts on request and document load does not claim WASM gameplay is ready',async()=>{
  const h=await harness();assert.equal(h.loads,0);assert(h.el('mc-frame').hidden);h.el('mc-start').emit('click');
  assert.equal(h.el('mc-frame').src,'mc-client.html?v=1');assert.equal(h.loads,1);assert(h.el('mc-intro').hidden);assert(!h.el('mc-frame').hidden);assert(!h.el('mc-fullscreen').disabled);
  h.el('mc-frame').emit('load');assert.match(h.el('mc-status').textContent,/等待游戏启动/);assert.equal(h.timers.size,0);assert(h.el('mc-help').hidden);
});
test('slow loading and network recovery never restart a running game automatically',async()=>{
  const h=await harness();h.navigator.onLine=false;h.el('mc-start').emit('click');assert.equal(h.loads,0);assert(!h.el('mc-intro').hidden);
  h.navigator.onLine=true;h.el('mc-start').emit('click');for(const fn of h.timers.values())fn();assert(!h.el('mc-help').hidden);assert.equal(h.loads,1);
  h.el('mc-help-close').emit('click');h.window.emit('offline');h.window.emit('online');assert.equal(h.loads,1);assert(h.el('mc-help').hidden);
  h.el('mc-reload').emit('click');assert.equal(h.loads,2);h.window.emit('pagehide');assert.equal(h.timers.size,0);
});
test('fullscreen controls preserve the game on success, exit and browser denial',async()=>{
  const h=await harness();h.el('mc-start').emit('click');
  h.el('mc-stage').requestFullscreen=async()=>{h.document.fullscreenElement=h.el('mc-stage');h.document.emit('fullscreenchange');};
  h.document.exitFullscreen=async()=>{h.document.fullscreenElement=null;h.document.emit('fullscreenchange');};
  await h.el('mc-fullscreen').emit('click');assert.match(h.el('mc-fullscreen').textContent,/退出全屏/);
  await h.el('mc-fullscreen').emit('click');assert.match(h.el('mc-fullscreen').textContent,/全屏游戏/);
  h.el('mc-stage').requestFullscreen=async()=>{throw new Error('denied');};await h.el('mc-fullscreen').emit('click');assert.match(h.el('mc-status').textContent,/全屏未开启/);assert.equal(h.loads,1);
});

test('only the selected client can enable mobile controls, and menus hide the world gesture surface',async()=>{
 const h=await harness();h.el('mc-start').emit('click');h.el('mc-touch-toggle').emit('click');
 const packet={type:'mc-touch-state',ready:true,captured:true};
 h.window.emit('message',{source:{},origin:'http://127.0.0.1:8765',data:packet});assert(h.el('mc-touch-controls').hidden);
 h.window.emit('message',{source:h.el('mc-frame').contentWindow,origin:'https://other.example',data:packet});assert(h.el('mc-touch-controls').hidden);
 h.window.emit('message',{source:h.el('mc-frame').contentWindow,origin:'http://127.0.0.1:8765',data:packet});assert(!h.el('mc-touch-controls').hidden);assert(!h.el('mc-touch-surface').hidden);
 h.window.emit('message',{source:h.el('mc-frame').contentWindow,origin:'http://127.0.0.1:8765',data:{...packet,captured:false}});assert(h.el('mc-touch-surface').hidden);assert(h.el('mc-touch-controls').hidden);assert(!h.el('mc-touch-tools').hidden);
});

function playing(h){h.el('mc-start').emit('click');h.window.emit('message',{source:h.el('mc-frame').contentWindow,origin:'http://127.0.0.1:8765',data:{type:'mc-touch-state',ready:true,captured:true}});h.packets.length=0;}
function keyEvent(code,extra={}){return {code,preventDefault(){this.prevented=true;},...extra};}
function keyPackets(h){return h.packets.map(p=>p.data.input).filter(p=>p?.type==='key').map(p=>({code:p.code,down:p.down}));}

test('WASD, arrow keys and jump work after screen buttons take focus and do not release a held finger',async()=>{
 const h=await harness();playing(h);
 h.el('mc-forward').emit('pointerdown',{pointerId:1,preventDefault(){}});
 h.window.emit('keydown',keyEvent('KeyW'));h.window.emit('keydown',keyEvent('KeyW',{repeat:true}));
 h.window.emit('keydown',keyEvent('ArrowRight'));h.window.emit('keydown',keyEvent('Space'));
 assert.deepEqual(keyPackets(h),[{code:'KeyW',down:true},{code:'KeyD',down:true},{code:'Space',down:true}]);
 h.window.emit('keyup',keyEvent('KeyW'));assert(!keyPackets(h).some(p=>p.code==='KeyW'&&!p.down));
 h.el('mc-forward').emit('pointerup',{pointerId:1,preventDefault(){}});assert.deepEqual(keyPackets(h).at(-1),{code:'KeyW',down:false});
 h.window.emit('keyup',keyEvent('ArrowRight'));h.window.emit('keyup',keyEvent('Space'));
 for(const code of ['KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft']){const down=keyEvent(code);h.window.emit('keydown',down);assert(down.prevented);h.window.emit('keyup',keyEvent(code));}
 assert.equal(keyPackets(h).filter(p=>p.down).length,keyPackets(h).filter(p=>!p.down).length);
});

test('keyboard forwarding ignores menus, text input and shortcuts and releases keys on blur and pause',async()=>{
 const h=await harness();playing(h);
 for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true},{target:{isContentEditable:true}},{target:{closest:()=>true}}]){const event=keyEvent('KeyW',extra);h.window.emit('keydown',event);assert(!event.prevented);}
 assert.equal(keyPackets(h).length,0);
 h.window.emit('keydown',keyEvent('KeyW'));h.window.emit('keydown',keyEvent('Space'));h.window.emit('blur');assert.equal(keyPackets(h).filter(p=>!p.down).length,2);
 h.window.emit('keydown',keyEvent('KeyW'));h.window.emit('message',{source:h.el('mc-frame').contentWindow,origin:'http://127.0.0.1:8765',data:{type:'mc-touch-state',ready:true,captured:false}});
 assert.deepEqual(keyPackets(h).at(-1),{code:'KeyW',down:false});const count=keyPackets(h).length;
 const event=keyEvent('KeyW');h.window.emit('keydown',event);assert(!event.prevented);h.window.emit('keyup',keyEvent('KeyW'));assert.equal(keyPackets(h).length,count);
});
