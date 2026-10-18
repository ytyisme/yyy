import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.js';
import {buildLoadingProgress,BUILD_LOADING_DURATION} from '../lib/build-loading-timeline.mjs';
import {createBuildLoading} from '../lib/build-loading.mjs';
import {makeBuilderAvatar} from '../lib/build-visuals.mjs';

test('the progress bar pauses exactly 700ms at half and 1000ms near full, then shows 100% before entering',()=>{
 let half=0,almost=0,previous=0;
 for(let t=0;t<=BUILD_LOADING_DURATION;t++){
  const value=buildLoadingProgress(t);assert.ok(value.value>=previous&&value.value<=100);previous=value.value;
  if(value.phase==='half'){half++;assert.equal(value.value,50);}
  if(value.phase==='almost'){almost++;assert.equal(value.value,92);}
  assert.equal(value.done,t===BUILD_LOADING_DURATION);
 }
 assert.equal(half,700);assert.equal(almost,1000);assert.equal(buildLoadingProgress(4550).value,100);assert.equal(buildLoadingProgress(4550).done,false);
});

test('the loading runner moves and jumps in the existing world, then restores the player, camera and controls without saving the animation obstacles',()=>{
 const previous={document:globalThis.document,location:globalThis.location,history:globalThis.history},elements=new Map(),events=new Map(),updates=[];
 for(const id of ['build-loading','build-loading-progress','build-loading-fill','build-loading-percent','build-loading-message','build-loading-map'])elements.set(id,{textContent:'',dataset:{},style:{},setAttribute:(key,value)=>updates.push([key,value])});
 const root={dataset:{buildLoading:'true'}};let finished=0,href='';
 Object.assign(globalThis,{document:{documentElement:root,getElementById:id=>elements.get(id),addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)},location:{href:'http://game.example/season2-lv18.html?map=world-original&loading=1'},history:{replaceState:(_a,_b,url)=>href=String(url)}});
 const scene=new THREE.Scene(),world=new THREE.Group(),camera=new THREE.PerspectiveCamera(),player=makeBuilderAvatar('');scene.add(world,player.root);player.root.position.set(0,0,17);player.root.rotation.y=.38;camera.position.set(10,19,38);camera.lookAt(0,0,4);
 const playerPosition=player.root.position.toArray(),playerRotation=player.root.quaternion.toArray(),cameraPosition=camera.position.toArray();
 try{
  const loading=createBuildLoading({scene,camera,player,mapName:'我的轨道公园',onFinish:()=>finished++});assert.equal(scene.children.length,5);assert.equal(elements.get('build-loading-map').textContent,'我的轨道公园');
  loading.update(0,0);loading.update(1000,.016);assert.ok(player.root.position.z<17);assert.ok(player.root.position.y>.6);assert.notEqual(player.legs[0].rotation.x,0);
  loading.update(1100,.016);assert.equal(elements.get('build-loading').dataset.phase,'half');assert.equal(elements.get('build-loading-percent').textContent,'50%');
  loading.update(2900,.016);assert.equal(elements.get('build-loading').dataset.phase,'almost');assert.equal(elements.get('build-loading-percent').textContent,'92%');assert.equal(loading.active,true);
  loading.update(4550,.016);assert.equal(elements.get('build-loading-percent').textContent,'100%');assert.equal(loading.active,true);
  loading.update(BUILD_LOADING_DURATION,.016);assert.equal(loading.active,false);assert.equal(finished,1);assert.equal(scene.children.length,2);assert.equal(scene.children[0],world);assert.deepEqual(player.root.position.toArray(),playerPosition);assert.deepEqual(player.root.quaternion.toArray(),playerRotation);assert.deepEqual(camera.position.toArray(),cameraPosition);assert.ok(!('buildLoading' in root.dataset));assert.ok(!href.includes('loading='));assert.ok(href.includes('map=world-original'));
 }finally{Object.assign(globalThis,previous);}
});
