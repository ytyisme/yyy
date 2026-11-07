const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const els = {};
  for (const id of ['game','overlay','message','start','status','jump','left','right','ending-choice']) els[id] = {textContent:'', hidden:false, disabled:false, addEventListener(){}};
  const wrap = {classList:{add(){},remove(){}}}; let selected='normal';
  const document = {querySelector(q){if(q==='.jump-wrap')return wrap;if(q.startsWith('input['))return {value:selected};return els[q.slice(1)]},addEventListener(){}};
  class Object3D {constructor(){this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};this.rotation={x:0};}add(){} remove(){} lookAt(){}}
  class Renderer {setSize(){} setPixelRatio(){} render(){}}
  class TextureLoader {load(path,cb){const t={};cb(t);return t}}
  const THREE={WebGLRenderer:Renderer,Scene:Object3D,Group:Object3D,PerspectiveCamera:Object3D,HemisphereLight:Object3D,DirectionalLight:Object3D,Mesh:Object3D,BoxGeometry:class{},PlaneGeometry:class{},MeshStandardMaterial:class{},Color:class{},Fog:class{},TextureLoader,SRGBColorSpace:1};
  const context=vm.createContext({document,THREE,devicePixelRatio:1,requestAnimationFrame(){},Math});
  vm.runInContext(fs.readFileSync('season2-lv29.js','utf8') + `
;globalThis.api={reset,jump,move,frame,get:()=>({active,distance,lane,height,vy,stolen,obstacles,ending}),set:(v)=>{if(v.distance!==undefined)distance=v.distance;if(v.height!==undefined)height=v.height;if(v.vy!==undefined)vy=v.vy;if(v.last!==undefined)last=v.last;}}`,context);
  return {api:context.api,els,select:v=>selected=v};
}
test('换道有边界，死亡结局禁跳且重玩恢复',()=>{
  const {api,els,select}=setup();select('death');api.reset();api.move(-1);api.move(-1);assert.equal(api.get().lane,-1);api.move(1);api.move(1);api.move(1);assert.equal(api.get().lane,1);
  api.set({distance:850});api.frame(1000);assert.equal(api.get().stolen,true);assert.equal(els.jump.disabled,true);assert.equal(api.get().obstacles.length,3);api.jump();assert.equal(api.get().vy,0);
  let t=1000;while(api.get().active && t<6000){t+=50;api.frame(t)}assert.equal(api.get().active,false);assert.match(els.message.textContent,/碰到课本/);
  select('normal');api.reset();assert.equal(api.get().stolen,false);assert.equal(els.jump.disabled,false);api.jump();assert.ok(api.get().vy>0);assert.equal(api.get().lane,0);
});
test('英雄和普通结局在终点显示不同结果',()=>{
  for(const ending of ['hero','normal']){const {api,els,select}=setup();select(ending);api.reset();api.set({distance:1000});api.frame(1000);assert.equal(api.get().active,false);assert.equal(els.message.textContent,ending==='hero'?'想啥呢，想看英雄救美？':'成功！你跑到终点了！');}
});
