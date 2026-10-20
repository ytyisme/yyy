export const MC_TOUCH_KEYS=Object.freeze({KeyW:['w',87],KeyS:['s',83],KeyA:['a',65],KeyD:['d',68],Space:[' ',32],KeyE:['e',69],Escape:['Escape',27]});
export const MC_KEYBOARD_CONTROLS=Object.freeze({KeyW:'KeyW',KeyS:'KeyS',KeyA:'KeyA',KeyD:'KeyD',ArrowUp:'KeyW',ArrowDown:'KeyS',ArrowLeft:'KeyA',ArrowRight:'KeyD',Space:'Space',KeyE:'KeyE',Escape:'Escape'});

// Keep gestures separate from the client so cancellations and simultaneous fingers
// produce the same key/button releases on every mobile browser.
export function createMcTouchInput(send,{setTimer=setTimeout,clearTimer=clearTimeout,holdMs=380,dragPixels=8}={}){
 const pointers=new Map(),owners=new Map();let gesture=null;
 function release(id){const code=pointers.get(id);if(!code)return;const set=owners.get(code);pointers.delete(id);set.delete(id);if(!set.size){owners.delete(code);send({type:'key',code,down:false});}}
 function press(code,id){if(!MC_TOUCH_KEYS[code])return;release(id);pointers.set(id,code);let set=owners.get(code);if(!set){set=new Set();owners.set(code,set);send({type:'key',code,down:true});}set.add(id);}
 function stopTimer(g){if(g?.timer!=null){clearTimer(g.timer);g.timer=null;}}
 function start(id,x,y){if(gesture)return false;const g=gesture={id,x,y,startX:x,startY:y,dragged:false,mining:false,timer:null};g.timer=setTimer(()=>{if(gesture!==g||g.dragged)return;g.timer=null;g.mining=true;send({type:'mouse',button:0,down:true});},holdMs);return true;}
 function move(id,x,y){const g=gesture;if(!g||g.id!==id)return;const dx=x-g.x,dy=y-g.y;g.x=x;g.y=y;
  if(!g.dragged&&Math.hypot(x-g.startX,y-g.startY)>=dragPixels){g.dragged=true;stopTimer(g);}
  if(g.dragged&&(dx||dy))send({type:'look',dx,dy});
 }
 function end(id,cancelled=false){const g=gesture;if(!g||g.id!==id)return;stopTimer(g);gesture=null;
  if(g.mining)send({type:'mouse',button:0,down:false});
  else if(!cancelled&&!g.dragged){send({type:'mouse',button:2,down:true});send({type:'mouse',button:2,down:false});}
 }
 function reset(){for(const id of [...pointers.keys()])release(id);if(gesture)end(gesture.id,true);send({type:'release'});}
 return {press,release,start,move,end,reset};
}

export function installMcTouchClient({window,document,notify=()=>{}}){
 let enabled=false,virtual=null,canvas=null,mouseButtons=0;const downKeys=new Map(),emittedKeys=new WeakSet();
 const nativeGet=Object.getOwnPropertyDescriptor(window.Document.prototype,'pointerLockElement')?.get;
 const nativeExit=document.exitPointerLock?.bind(document);
 const nativeRequest=window.HTMLCanvasElement.prototype.requestPointerLock;
 function current(){return virtual??nativeGet?.call(document)??null;}
 function report(){notify({type:'mc-touch-state',ready:!!canvas,captured:!!current(),enabled});}
 function changed(){document.dispatchEvent(new window.Event('pointerlockchange'));report();}
 // This captures only the in-page virtual mouse; it never captures the phone's
 // real cursor or asks for an unsupported mobile Pointer Lock permission.
 Object.defineProperty(document,'pointerLockElement',{configurable:true,get:current});
 document.exitPointerLock=()=>{if(virtual){virtual=null;changed();}else nativeExit?.();};
 window.HTMLCanvasElement.prototype.requestPointerLock=function(...args){
  if(enabled&&this===canvas){virtual=this;changed();return Promise.resolve();}
  return nativeRequest?.apply(this,args);
 };
 function key(code,down,owner='bridge'){const config=MC_TOUCH_KEYS[code];if(!config)return;
  let owners=downKeys.get(code);
  if(down){if(owners?.has(owner))return;if(owners){owners.add(owner);return;}owners=new Set([owner]);downKeys.set(code,owners);}
  else{if(!owners?.delete(owner))return;if(owners.size)return;downKeys.delete(code);}
  const event=new window.KeyboardEvent(down?'keydown':'keyup',{code,key:config[0],keyCode:config[1],which:config[1],location:0,bubbles:true,cancelable:true});
  emittedKeys.add(event);window.dispatchEvent(event);
 }
 function mouse(type,button=0,dx=0,dy=0){if(!canvas)return;const r=canvas.getBoundingClientRect(),x=r.width/2,y=r.height/2;
  const event=new window.MouseEvent(type,{button,buttons:mouseButtons,clientX:r.left+x,clientY:r.top+y,bubbles:true,cancelable:true});
  Object.defineProperties(event,{offsetX:{value:x},offsetY:{value:y},movementX:{value:dx},movementY:{value:dy}});canvas.dispatchEvent(event);
 }
 function release(){for(const [code,owners] of [...downKeys])for(const owner of [...owners])key(code,false,owner);for(const button of [0,2])if(mouseButtons&(button===0?1:2)){mouseButtons&=~(button===0?1:2);mouse('mouseup',button);}mouseButtons=0;}
 function setEnabled(value){release();enabled=!!value;if(!enabled&&virtual){virtual=null;changed();}report();}
 function input(packet){if(!canvas||!packet)return;
  if(packet.type==='release'){release();return;}
  if(packet.type==='key'){
   if(!enabled&&!current()&&!(!packet.down&&downKeys.has(packet.code)))return;
   window.dispatchEvent(new window.FocusEvent('focus'));key(packet.code,!!packet.down);return;
  }
  if(!enabled||!current())return;
  if(packet.type==='mouse'&&(packet.button===0||packet.button===2)){const bit=packet.button===0?1:2;packet.down?mouseButtons|=bit:mouseButtons&=~bit;mouse(packet.down?'mousedown':'mouseup',packet.button);}
  if(packet.type==='look'&&Number.isFinite(packet.dx)&&Number.isFinite(packet.dy))mouse('mousemove',0,Math.max(-120,Math.min(120,packet.dx)),Math.max(-120,Math.min(120,packet.dy)));
 }
 // Merge real keys with screen input so releasing either one cannot cancel
 // another held input. Menus and text entry keep the original client's keys.
 function keyboard(event,down){
  if(emittedKeys.has(event))return;
  const code=MC_KEYBOARD_CONTROLS[event.code];if(!code)return;
  const owner=`native:${event.code}`;
  if(down){if(!current()||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||event.target?.isContentEditable||event.target?.closest?.('input,textarea,select'))return;}
  else if(!downKeys.get(code)?.has(owner))return;
  event.preventDefault();event.stopImmediatePropagation();key(code,down,owner);
 }
 window.addEventListener('keydown',event=>keyboard(event,true),true);
 window.addEventListener('keyup',event=>keyboard(event,false),true);
 const observer=new window.MutationObserver(()=>{const next=document.querySelector('canvas._eaglercraftX_canvas_element');if(next&&next!==canvas){canvas=next;report();}});
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('pointerlockchange',report);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});window.addEventListener('blur',release);window.addEventListener('pagehide',release);
 report();return {input,setEnabled,release};
}
