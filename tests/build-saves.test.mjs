import test from 'node:test';
import assert from 'node:assert/strict';
import {openBuildSave,listBuildSaves,storeBuildSave,updateBuildSave,copySharedSave} from '../lib/build-saves.mjs';
import {starterScene,saveBuildScene} from '../lib/build-world.mjs';
import {applyBuildAction,createBuildRoom} from '../lib/build-room.mjs';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
test('legacy scene migrates intact; named worlds survive reload and edits remain in the correct slot',()=>{
 const s=storage(),old=starterScene();old[0].w=25;saveBuildScene(s,old);const first=openBuildSave(s);assert.equal(first.scene[0].w,25);
 const second=openBuildSave(s,{fresh:true});assert.notEqual(second.id,first.id);second.scene[0].h=17;updateBuildSave(s,second,second.scene);
 assert.equal(openBuildSave(s,{id:first.id}).scene[0].w,25);assert.equal(openBuildSave(s,{id:second.id}).scene[0].h,17);assert.equal(listBuildSaves(s).length,2);
 // Uploading an older map does not change which map the player last opened.
 storeBuildSave(s,{...first,dirty:false});assert.equal(openBuildSave(s).id,second.id);
});
test('opening a shared map creates a separate editable save and preserves original work',()=>{
 const s=storage(),mine=openBuildSave(s),copy=copySharedSave(s,{...mine,name:'朋友的轨道'});assert.notEqual(mine.id,copy.id);assert.equal(listBuildSaves(s).length,2);
});
test('reset restores the initial objects atomically even at maximum scene size',()=>{
 const scene=new Map(Array.from({length:150},(_,i)=>{const p={...starterScene()[0],id:'block_'+i};return[p.id,p];}));assert.ok(applyBuildAction(scene,{kind:'reset'}));assert.deepEqual([...scene.values()],starterScene());
});
test('reset is a small authoritative multiplayer commit and all peers receive the same initial scene',()=>{
 const wire=[],host=createBuildRoom({id:'host-player',name:'房主',host:true,initial:starterScene(),send:m=>wire.push(['guest',m])}),guest=createBuildRoom({id:'guest-player',name:'朋友',send:m=>wire.push(['host',m])});
 const pump=()=>{let limit=100;while(wire.length&&limit--){const [to,m]=wire.shift();(to==='host'?host:guest).receive(m);}};
 host.setOnline(true);guest.setOnline(true);host.tick({x:0,z:0,y:0,heading:0});guest.tick({x:0,z:0,y:0,heading:0});pump();guest.tick({x:0,z:0,y:0,heading:0});pump();
 assert.equal(guest.synced,true);host.edit({kind:'put',object:{...starterScene()[0],id:'new-block',w:20}});pump();assert.equal(guest.objects.length,6);assert.equal(guest.edit({kind:'reset'}),true);pump();assert.deepEqual(guest.objects,host.objects);assert.equal(host.objects.length,5);
});
