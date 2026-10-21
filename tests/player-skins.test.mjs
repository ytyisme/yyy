import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createSkinDisplay} from '../lib/player-skins.mjs';
import {createSkinShop,skinById,SKIN_SELECTION_KEY} from '../lib/skin-shop.mjs';
import {attachPlayerSkin} from '../lib/skin-visuals.mjs';
import {Group,Mesh,Texture} from '../lib/three.module.js';

async function setup(imageLoader=skin=>({src:skin.image})){
  const data=new Map(),storage={get length(){return data.size;},key:i=>[...data.keys()][i],getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};
  const shop=createSkinShop(storage);shop.wallet.creditRun('skin-display-test',2000);
  await shop.buy('yellow-egg');await shop.buy('makima');shop.equip('makima');
  const events=new EventTarget(),display=createSkinDisplay({shop,imageLoader,eventTarget:events});
  return {shop,storage,events,display};
}
function canvas(){
  const calls=[],ctx={save:()=>calls.push(['save']),restore:()=>calls.push(['restore']),translate:(...args)=>calls.push(['translate',...args]),scale:(...args)=>calls.push(['scale',...args]),drawImage:(...args)=>calls.push(['image',...args])};
  return {ctx,calls};
}
test('owned equipment is restored in another level and draws at the player feet with original aspect and facing',async()=>{
  const {display,storage}=await setup();await display.ready;
  const nextLevel=createSkinDisplay({shop:createSkinShop(storage),imageLoader:skin=>({src:skin.image})});await nextLevel.ready;
  const {ctx,calls}=canvas();assert.equal(nextLevel.equipped().id,'makima');assert(nextLevel.drawCanvas(ctx,{x:80,y:320,w:28,h:40,facing:-1}));
  assert.deepEqual(calls[1],['translate',94,360]);assert.deepEqual(calls[2],['scale',-1,1]);
  const [,image,x,y,w,h]=calls.find(call=>call[0]==='image');assert.match(image.src,/makima-cutout.png$/);assert.equal(x,-w/2);assert.equal(y,-h);assert.ok(Math.abs(w/h-skinById('makima').imageAspect)<1e-10);
  display.dispose();nextLevel.dispose();
});
test('storage, focus and returning from the shop refresh the selection without buying or charging again',async()=>{
  const {display,shop,storage,events}=await setup(),balance=shop.wallet.balance();await display.ready;
  for(const type of ['storage','focus','pageshow','lava-skin-change']){
    shop.equip(display.equipped().id==='makima'?'yellow-egg':'makima');
    const event=new Event(type);if(type==='storage')Object.defineProperty(event,'key',{value:SKIN_SELECTION_KEY});events.dispatchEvent(event);await display.ready;
    assert.equal(display.equipped().id,shop.equipped().id);assert.equal(shop.wallet.balance(),balance);
  }
  storage.setItem(SKIN_SELECTION_KEY,'jawline-cat');events.dispatchEvent(new Event('pageshow'));assert.equal(display.equipped().id,'default');
  display.dispose();
});
test('an already-open level recovers equipment when a web view misses every change event',async()=>{
  const {shop,display:previous}=await setup();previous.dispose();shop.equip('default');
  let time=0;const events=new EventTarget(),documentTarget=new EventTarget();documentTarget.hidden=false;
  const display=createSkinDisplay({shop,imageLoader:skin=>({src:skin.image}),eventTarget:events,documentTarget,now:()=>time});
  const {ctx,calls}=canvas(),box={x:80,y:320,w:28,h:40},updates=[];display.subscribe(skin=>updates.push(skin.id));
  assert.equal(display.drawCanvas(ctx,box),false);
  // The shop saves a change, but no storage, focus, pageshow or equip event is
  // delivered to this level. Its next reconciliation must still pick it up.
  shop.equip('makima');time=251;assert.equal(display.drawCanvas(ctx,box),false);await display.ready;
  assert(display.drawCanvas(ctx,box));assert.match(calls.find(call=>call[0]==='image')[1].src,/makima-cutout.png$/);assert.equal(display.equipped().id,'makima');assert(updates.includes('makima'));
  shop.equip('yellow-egg');time=502;assert.equal(display.equipped().id,'yellow-egg');await display.ready;calls.length=0;assert(display.drawCanvas(ctx,box));assert.match(calls.find(call=>call[0]==='image')[1].src,/yellow-egg-cutout.png$/);
  shop.equip('default');documentTarget.dispatchEvent(new Event('visibilitychange'));assert.equal(display.equipped().id,'default');assert.equal(display.drawCanvas(ctx,box),false);
  display.dispose();
});
test('visible idle scenes reconcile their subscriptions, skip hidden polling and clean up the fallback timer',async()=>{
  const {shop,display:previous}=await setup();previous.dispose();shop.equip('default');
  let time=0,tick,stopped=false;const events=new EventTarget(),documentTarget=new EventTarget();documentTarget.hidden=false;
  events.setInterval=(callback,delay)=>{assert.equal(delay,250);tick=callback;return 7;};events.clearInterval=id=>{assert.equal(id,7);stopped=true;};
  const display=createSkinDisplay({shop,eventTarget:events,documentTarget,imageLoader:skin=>({src:skin.image}),now:()=>time}),updates=[];display.subscribe(skin=>updates.push(skin.id));
  shop.equip('makima');time=251;tick();assert.equal(updates.at(-1),'makima');
  documentTarget.hidden=true;shop.equip('yellow-egg');time=502;tick();assert.equal(updates.at(-1),'makima');
  documentTarget.hidden=false;tick();assert.equal(updates.at(-1),'yellow-egg');display.dispose();assert(stopped);
});
test('loading failures and a late previous image keep the fallback or the latest chosen character',async()=>{
  const pending=new Map(),{shop,display}=await setup(skin=>new Promise(resolve=>pending.set(skin.id,resolve)));
  const {ctx,calls}=canvas(),box={x:0,y:0,w:28,h:40};await Promise.resolve();assert.equal(display.drawCanvas(ctx,box),false);
  shop.equip('yellow-egg');display.refresh();await Promise.resolve();
  pending.get('makima')({src:'old-image'});await Promise.resolve();assert.equal(display.drawCanvas(ctx,box),false);
  pending.get('yellow-egg')({src:'yellow-image'});await display.ready;assert(display.drawCanvas(ctx,box));assert.equal(calls.find(c=>c[0]==='image')[1].src,'yellow-image');display.dispose();
  const failed=await setup(()=>Promise.reject(Error('offline')));await failed.display.ready;assert.equal(failed.display.drawCanvas(ctx,box),false);failed.display.dispose();
});
test('3D replacement preserves the movement root and props, ignores stale loads, and restores original visibility',async()=>{
  const callbacks=new Set();let selected=skinById('makima');
  const display={subscribe(cb){callbacks.add(cb);cb(selected);return ()=>callbacks.delete(cb);}},choose=id=>{selected=skinById(id);for(const cb of callbacks)cb(selected);};
  const pending=new Map(),root=new Group(),body=new Mesh(),hiddenLabel=new Group();hiddenLabel.visible=false;root.add(body,hiddenLabel);root.position.set(8,0,12);
  const controller=attachPlayerSkin(root,{display,textureProvider:skin=>({texture:new Texture(),ready:new Promise(resolve=>pending.set(skin.id,resolve))})});
  const prop=new Mesh();root.add(prop);assert.equal(body.visible,true);choose('yellow-egg');pending.get('makima')(true);await Promise.resolve();assert.equal(body.visible,true);
  pending.get('yellow-egg')(true);await Promise.resolve();await Promise.resolve();assert.equal(body.visible,false);assert.equal(hiddenLabel.visible,false);assert.equal(prop.visible,true);assert.equal(root.userData.playerSkinId,'yellow-egg');assert.deepEqual(root.position.toArray(),[8,0,12]);
  root.visible=false;controller.update(1,{running:true});assert.equal(root.visible,false);choose('default');assert.equal(body.visible,true);assert.equal(hiddenLabel.visible,false);assert.equal(prop.visible,true);assert.equal(root.children.length,3);controller.dispose();assert.equal(callbacks.size,0);
});
test('the actual first-season renderer uses the equipped image in levels 1 and 15 and retains fallback and name tags',async()=>{
  const {display}=await setup();await display.ready;
  const {ctx,calls}=canvas();for(const method of ['beginPath','ellipse','fill','fillRect','strokeText','fillText'])ctx[method]=(...args)=>calls.push([method,...args]);
  const context=vm.createContext({window:{LavaSkins:display}});
  vm.runInContext(fs.readFileSync(new URL('../lib/draw.js',import.meta.url),'utf8'),context);
  const state={ctx,player:{x:80,y:320,w:28,h:40,facing:1,onGround:true,vx:0},cameraX:20,platforms:[],speedBoost:0,time:0,playerName:'测试玩家',localChat:null,level:1};
  context.window.installGameDraw(state);
  for(const level of [1,15]){calls.length=0;state.level=level;state.drawPlayer();assert.equal(calls.filter(c=>c[0]==='image').length,1);assert.equal(calls.filter(c=>c[0]==='fillRect').length,0);assert(calls.some(c=>c[0]==='fillText'&&c[1]==='测试玩家'));}
  context.window.LavaSkins=null;calls.length=0;state.drawPlayer();assert(calls.some(c=>c[0]==='fillRect'));display.dispose();
});
