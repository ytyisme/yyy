import * as THREE from './three.module.js';
import {makeBuildObject} from './build-world.mjs';
import {makeBuildView,disposeBuildView,animateBuilder} from './build-visuals.mjs';
import {buildLoadingProgress,BUILD_LOADING_DURATION} from './build-loading-timeline.mjs';

export function createBuildLoading({scene,camera,player,mapName,onFinish=()=>{}}){
 const root=document.documentElement,overlay=document.getElementById('build-loading'),bar=document.getElementById('build-loading-progress'),fill=document.getElementById('build-loading-fill'),percent=document.getElementById('build-loading-percent'),phaseLabel=document.getElementById('build-loading-message');
 document.getElementById('build-loading-map').textContent=mapName;
 const original={position:player.root.position.clone(),quaternion:player.root.quaternion.clone(),camera:camera.position.clone(),cameraQuaternion:camera.quaternion.clone(),walk:player.walk};
 const hurdles=[10,-1,-12].map((z,i)=>{const mesh=makeBuildView({...makeBuildObject('brick','loading_hurdle_'+i,0,z),w:1.7,h:.65,l:.65});scene.add(mesh);return mesh;});
 let active=true,elapsed=0,last=null;
 const pauseClock=()=>{last=null;};document.addEventListener('visibilitychange',pauseClock);
 const readyToPlay=()=>{
  active=false;for(const mesh of hurdles)disposeBuildView(mesh);
  player.root.position.copy(original.position);player.root.quaternion.copy(original.quaternion);player.walk=original.walk;animateBuilder(player,false,0);
  camera.position.copy(original.camera);camera.quaternion.copy(original.cameraQuaternion);camera.up.set(0,1,0);
  document.removeEventListener('visibilitychange',pauseClock);delete root.dataset.buildLoading;
  const url=new URL(location.href);url.searchParams.delete('loading');history.replaceState(null,'',url);
  onFinish();
 };
 function update(now,dt){
  if(!active)return;
  if(last!==null)elapsed+=Math.max(0,now-last);last=now;
  const progress=buildLoadingProgress(elapsed),time=Math.min(elapsed,BUILD_LOADING_DURATION)/1000,z=17-time*7;
  // A short forward run with three jumps. The surrounding world is the actual save.
  let jump=0;for(const obstacleZ of [10,-1,-12]){const distance=z-obstacleZ;if(Math.abs(distance)<3.3)jump=Math.max(jump,Math.sin((3.3-distance)/6.6*Math.PI)*1.65);}
  const lean=Math.sin(time*10)*.025;
  player.root.position.set(Math.sin(time*2)*.12,jump+Math.abs(Math.sin(time*10))*.035,z);player.root.rotation.set(-.08,Math.PI+lean,0);
  animateBuilder(player,true,dt*1.4);if(jump>.3){for(const leg of player.legs)leg.rotation.x=leg===player.legs[0]?-.65:.55;for(const arm of player.arms)arm.rotation.x=-.9;}
  camera.position.set(6.4,5.4,z+12.5);camera.up.set(0,1,0);camera.lookAt(0,1,z-2.5);
  fill.style.transform=`scaleX(${progress.value/100})`;percent.textContent=Math.floor(progress.value)+'%';bar.setAttribute('aria-valuenow',String(Math.floor(progress.value)));overlay.dataset.phase=progress.phase;
  phaseLabel.textContent=progress.phase==='half'?'正在准备你的建造…':progress.phase==='almost'?'马上就能接着玩了…':progress.phase==='ready'?'准备好了，出发！':'跑起来，回到你的世界。';
  if(progress.done)readyToPlay();
 }
 return {update,get active(){return active;}};
}
