import test from 'node:test';
import assert from 'node:assert/strict';
import {setupBuildMaps} from '../lib/build-map-ui.mjs';
import {listBuildSaves,updateBuildSave} from '../lib/build-saves.mjs';
import {starterScene} from '../lib/build-world.mjs';
function environment(){
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},events={},elements=new Map();
 for(const id of ['map-name','save-state','reset-map','save-exit','map-back','circle-link'])elements.set(id,{value:'',textContent:'',disabled:false,addEventListener(){}});
 const old={document:globalThis.document,window:globalThis.window,location:globalThis.location,history:globalThis.history,localStorage:globalThis.localStorage,fetch:globalThis.fetch};
 Object.assign(globalThis,{document:{hidden:false,getElementById:id=>elements.get(id)},window:{addEventListener:(key,fn)=>events[key]=fn},location:{href:'http://test.example/season2-lv18.html'},history:{replaceState(){}},localStorage:storage});
 let scene=starterScene(),left=false;
 const manager=setupBuildMaps({storage,readScene:()=>scene,replaceScene:value=>scene=value,flushEdit(){},reset:()=>scene=starterScene(),leave:()=>left=true,canEdit:()=>true,toast(){},onOpen(){}});
 return {manager,storage,elements,events,get scene(){return scene;},set scene(value){scene=value;},get left(){return left;},close(){events.pagehide();Object.assign(globalThis,old);}};
}
test('an edit made during map upload stays dirty and the newer snapshot can be uploaded',async()=>{
 const env=environment();try{
  env.manager.local();let finish;globalThis.fetch=()=>new Promise(resolve=>finish=()=>resolve(new Response(JSON.stringify({updatedAt:123}),{status:200,headers:{'Content-Type':'application/json'}})));
  const first=env.manager.upload();env.scene=env.scene.map((p,i)=>i? p:{...p,w:27});env.manager.local();finish();await first;
  assert.equal(env.manager.save.dirty,true);assert.equal(env.manager.save.scene[0].w,27);
  const second=env.manager.upload();finish();await second;assert.equal(env.manager.save.dirty,false);
 }finally{env.close();}
});
test('save and exit keeps the complete local map when upload fails and marks it pending',async()=>{
 const env=environment();try{
  globalThis.fetch=async()=>{throw new Error('offline');};env.scene=env.scene.map((p,i)=>i?p:{...p,w:43});
  await env.elements.get('save-exit').onclick();
  assert.equal(env.left,true);assert.match(location.href,/map-list.html\?pending=1/);const saved=listBuildSaves(env.storage);assert.equal(saved[0].scene[0].w,43);assert.equal(saved[0].dirty,true);
 }finally{env.close();}
});
test('reset retains a complete separate backup without overwriting the active save',()=>{
 const env=environment();try{
  env.scene=env.scene.map((p,i)=>i?p:{...p,w:32});env.manager.local();const id=env.manager.save.id;env.elements.get('reset-map').onclick();env.manager.local();
  const records=listBuildSaves(env.storage);assert.equal(records.length,2);assert.equal(records.find(p=>p.backup).scene[0].w,32);assert.equal(records.find(p=>p.id===id).scene[0].w,3);
 }finally{env.close();}
});
test('an unchanged old tab adopts a newer save instead of overwriting it on exit',()=>{
 const env=environment();try{
  env.manager.local();const fresh=env.manager.save.scene.map((p,i)=>i?p:{...p,w:55});updateBuildSave(env.storage,env.manager.save,fresh);
  env.manager.local();assert.equal(env.manager.save.scene[0].w,55);assert.equal(env.scene[0].w,55);assert.equal(listBuildSaves(env.storage).length,1);
 }finally{env.close();}
});
test('two tabs that both edit the same map keep separate complete versions',()=>{
 const env=environment();try{
  env.manager.local();const original=env.manager.save;updateBuildSave(env.storage,original,original.scene.map((p,i)=>i?p:{...p,w:55}));
  env.scene=env.scene.map((p,i)=>i?p:{...p,h:12});env.manager.local();const saves=listBuildSaves(env.storage);assert.equal(saves.length,2);assert.equal(saves.find(p=>p.id===original.id).scene[0].w,55);assert.equal(saves.find(p=>p.id!==original.id).scene[0].h,12);
 }finally{env.close();}
});
