import test from 'node:test';
import assert from 'node:assert/strict';
import {createMcTouchInput,installMcTouchClient} from '../lib/mc-touch.mjs';

function inputHarness(){const events=[],timers=new Map();let id=0;const input=createMcTouchInput(event=>events.push(event),{setTimer:fn=>{timers.set(++id,fn);return id;},clearTimer:id=>timers.delete(id)});return {input,events,timers,hold(){const pending=[...timers.values()];timers.clear();for(const fn of pending)fn();}};}
test('a short tap places exactly one block and never starts demolition',()=>{
 const h=inputHarness();h.input.start(1,100,100);h.input.end(1);h.hold();assert.deepEqual(h.events,[{type:'mouse',button:2,down:true},{type:'mouse',button:2,down:false}]);
});
test('a long press keeps the demolition button held until release and never places a block',()=>{
 const h=inputHarness();h.input.start(1,100,100);h.hold();assert.deepEqual(h.events,[{type:'mouse',button:0,down:true}]);h.input.end(1);assert.deepEqual(h.events.at(-1),{type:'mouse',button:0,down:false});assert(!h.events.some(e=>e.button===2));
});
test('dragging changes the view without triggering tap or long-press actions',()=>{
 const h=inputHarness();h.input.start(1,100,100);h.input.move(1,115,104);h.hold();h.input.move(1,120,103);h.input.end(1);assert.deepEqual(h.events,[{type:'look',dx:15,dy:4},{type:'look',dx:5,dy:-1}]);
});
test('looking while already demolishing preserves the held button until the finger lifts',()=>{
 const h=inputHarness();h.input.start(1,0,0);h.hold();h.input.move(1,12,8);h.input.end(1);assert.deepEqual(h.events,[{type:'mouse',button:0,down:true},{type:'look',dx:12,dy:8},{type:'mouse',button:0,down:false}]);
});
test('multiple fingers can walk diagonally, jump and look without releasing each other',()=>{
 const h=inputHarness();h.input.press('KeyW',1);h.input.press('KeyD',2);h.input.press('Space',3);h.input.start(4,0,0);h.input.move(4,20,0);h.input.release(3);assert.equal(h.events.filter(e=>e.type==='key'&&e.down===false).length,1);assert.equal(h.events.at(-1).code,'Space');h.input.release(1);h.input.release(2);h.input.end(4);assert(!h.events.some(e=>e.type==='mouse'));
});
test('two fingers on the same movement key do not release it prematurely',()=>{
 const h=inputHarness();h.input.press('KeyW',1);h.input.press('KeyW',2);h.input.release(1);assert.deepEqual(h.events,[{type:'key',code:'KeyW',down:true}]);h.input.release(2);assert.deepEqual(h.events.at(-1),{type:'key',code:'KeyW',down:false});
});
test('cancellation, capture loss and lifecycle reset cannot leave keys or demolition stuck',()=>{
 const h=inputHarness();h.input.start(1,0,0);h.input.end(1,true);h.hold();assert.equal(h.events.length,0);h.input.press('KeyW',2);h.input.start(3,0,0);h.hold();h.input.reset();assert(h.events.some(e=>e.code==='KeyW'&&!e.down));assert(h.events.some(e=>e.button===0&&!e.down));assert.equal(h.events.at(-1).type,'release');assert(!h.events.some(e=>e.button===2));
});

function clientHarness(){
 class Target{constructor(){this.listeners=new Map();}addEventListener(type,fn,capture=false){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push({fn,capture});}dispatchEvent(event){for(const {fn} of [...(this.listeners.get(event.type)??[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){fn(event);if(event.stopped)break;}}}
 class Event{constructor(type,options={}){this.type=type;Object.assign(this,options);}preventDefault(){this.defaultPrevented=true;}stopImmediatePropagation(){this.stopped=true;}}
 let native=null,nativeRequests=0,observer;
 class Document extends Target{get pointerLockElement(){return native;}exitPointerLock(){native=null;this.dispatchEvent(new Event('pointerlockchange'));}querySelector(){return canvas;}}
 class Canvas extends Target{requestPointerLock(){nativeRequests++;native=this;}getBoundingClientRect(){return {left:20,top:30,width:400,height:300};}}
 const canvas=new Canvas(),document=new Document(),window=new Target(),states=[];document.body={};Object.assign(window,{Document,HTMLCanvasElement:Canvas,Event,KeyboardEvent:Event,MouseEvent:Event,FocusEvent:Event,MutationObserver:class{constructor(fn){observer=fn;}observe(){}}});
 const client=installMcTouchClient({window,document,notify:state=>states.push(state)});observer();return {client,window,document,canvas,states,Event,get nativeRequests(){return nativeRequests;}};
}
test('phone capture uses only an in-page virtual mouse and desktop capture remains native',async()=>{
 const h=clientHarness();h.client.setEnabled(true);await h.canvas.requestPointerLock();assert.equal(h.nativeRequests,0);assert(h.document.pointerLockElement===h.canvas);assert(h.states.at(-1).captured);h.document.exitPointerLock();assert.equal(h.document.pointerLockElement,null);h.client.setEnabled(false);await h.canvas.requestPointerLock();assert.equal(h.nativeRequests,1);
});
test('the actual client adapter emits game keyboard and relative mouse events and releases them on blur',async()=>{
 const h=clientHarness(),keys=[],mouse=[];h.window.addEventListener('keydown',e=>keys.push(e));h.window.addEventListener('keyup',e=>keys.push(e));for(const type of ['mousedown','mouseup','mousemove'])h.canvas.addEventListener(type,e=>mouse.push(e));
 h.client.setEnabled(true);await h.canvas.requestPointerLock();h.client.input({type:'key',code:'KeyW',down:true});h.client.input({type:'key',code:'Space',down:true});assert.equal(keys[0].keyCode,87);assert.equal(keys[1].keyCode,32);h.client.input({type:'look',dx:25,dy:-13});assert.equal(mouse[0].movementX,25);assert.equal(mouse[0].offsetX,200);
 h.client.input({type:'mouse',button:0,down:true});h.window.dispatchEvent(new h.Event('blur'));assert.equal(keys.filter(e=>e.type==='keyup').length,2);assert.equal(mouse.at(-1).type,'mouseup');assert.equal(mouse.at(-1).buttons,0);
});
test('menus ignore world gestures and disabled controls cannot send game input',()=>{
 const h=clientHarness(),events=[];h.canvas.addEventListener('mousedown',e=>events.push(e));h.window.addEventListener('keydown',e=>events.push(e));h.client.input({type:'key',code:'KeyW',down:true});h.client.setEnabled(true);h.client.input({type:'mouse',button:2,down:true});h.client.input({type:'key',code:'Unknown',down:true});assert.equal(events.length,0);
});

test('native WASD, arrow keys and screen buttons share held keys in desktop and touch modes',async()=>{
 for(const mobile of [false,true]){
  const h=clientHarness(),keys=[];h.client.setEnabled(mobile);await h.canvas.requestPointerLock();
  h.window.addEventListener('keydown',e=>keys.push([e.type,e.code]));h.window.addEventListener('keyup',e=>keys.push([e.type,e.code]));
  const native=(type,code,options={})=>h.window.dispatchEvent(new h.Event(type,{code,...options}));
  native('keydown','KeyW');native('keydown','KeyW',{repeat:true});native('keydown','ArrowUp');
  h.client.input({type:'key',code:'KeyW',down:true});
  native('keyup','KeyW');native('keyup','ArrowUp');assert.deepEqual(keys,[['keydown','KeyW']]);
  h.client.input({type:'key',code:'KeyW',down:false});assert.deepEqual(keys.at(-1),['keyup','KeyW']);
  for(const [arrow,code] of [['ArrowLeft','KeyA'],['ArrowDown','KeyS'],['ArrowRight','KeyD'],['Space','Space']]){native('keydown',arrow);native('keyup',arrow);assert.deepEqual(keys.slice(-2),[['keydown',code],['keyup',code]]);}
  native('keydown','KeyA');native('keydown','Space');h.window.dispatchEvent(new h.Event('blur'));assert.deepEqual(keys.slice(-2),[['keyup','KeyA'],['keyup','Space']]);
 }
});

test('native menu keys, text entry and browser shortcuts keep the original event',async()=>{
 const h=clientHarness(),seen=[];h.window.addEventListener('keydown',e=>seen.push(e));
 const menu=new h.Event('keydown',{code:'ArrowUp'});h.window.dispatchEvent(menu);assert.equal(seen[0],menu);assert(!menu.defaultPrevented);
 await h.canvas.requestPointerLock();
 for(const options of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true},{target:{isContentEditable:true}},{target:{closest:()=>true}}]){const event=new h.Event('keydown',{code:'KeyW',...options});h.window.dispatchEvent(event);assert.equal(seen.at(-1),event);assert(!event.defaultPrevented);}
});
