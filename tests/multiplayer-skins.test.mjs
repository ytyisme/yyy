import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createSkinShop,cleanSkinId} from '../lib/skin-shop.mjs';
import {createSkinDisplay} from '../lib/player-skins.mjs';
import {attachPlayerSkin} from '../lib/skin-visuals.mjs';
import {Group,Mesh,Sprite,Texture} from '../lib/three.module.js';
import {createChaseRoom,cleanPose} from '../lib/chase-room.mjs';
import {createCityRoom,cleanCityPose} from '../lib/city-room.mjs';
import {createBuildRoom} from '../lib/build-room.mjs';
import {cleanBuildPose} from '../lib/build-world.mjs';

const source=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const flushImages=()=>new Promise(setImmediate);
async function wardrobe(id){
  const data=new Map(),storage={get length(){return data.size;},key:i=>[...data.keys()][i],getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};
  const shop=createSkinShop(storage);shop.wallet.creditRun('multiplayer-skins',1000);
  if(id!=='default')await shop.buy(id);shop.equip(id);
  const display=createSkinDisplay({shop,imageLoader:skin=>({src:skin.image})});await display.ready;
  return {shop,display};
}
function canvas(){
  const images=[],translations=[],texts=[],ctx=new Proxy({drawImage:image=>images.push(image.src),fillText:(...args)=>texts.push(args),translate:(...args)=>translations.push(args),createLinearGradient:()=>({addColorStop(){}})}, {get:(target,key)=>key in target?target[key]:()=>{}});
  return {ctx,images,translations,texts};
}
test('a viewer can see an unowned peer skin; absent, unknown and default peer skins never inherit the viewer skin',async()=>{
  const {shop,display}=await wardrobe('makima'),{ctx,images}=canvas(),box={x:0,y:0,w:28,h:40};
  assert.equal(shop.owns('yellow-egg'),false);
  display.drawCanvas(ctx,box,'yellow-egg');await flushImages();assert(display.drawCanvas(ctx,box,'yellow-egg'));assert.match(images.at(-1),/yellow-egg-cutout.png$/);
  for(const id of ['default',undefined,null,'unknown','https://example.com/face.png',{},'__proto__'])assert.equal(display.drawCanvas(ctx,box,id),false);
  assert(display.drawCanvas(ctx,box));assert.match(images.at(-1),/makima-cutout.png$/);assert.equal(shop.equipped().id,'makima');display.dispose();
});
test('the real blue-level transport and renderer show each independent player’s equipment, including changes while idle',async()=>{
  const channels=new Set();
  class Channel{
    constructor(name){this.name=name;channels.add(this);}
    postMessage(data){for(const peer of channels)if(peer!==this&&peer.name===this.name)peer.onmessage?.({data:structuredClone(data)});}
    close(){channels.delete(this);}
  }
  const code=[...source('season2-lv1.html').matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1]
    .replace(/\}\)\(\);\s*$/, 'window.harness={drawRemotes,drawWorld,drawLocalPlayer,draw,updateCoop,handleCoopMsg,remotes,get player(){return player;},set camera(value){cameraX=value;}};})();');
  async function client(skinId){
    const {shop,display}=await wardrobe(skinId),drawing=canvas(),elements=new Map();
    const element=id=>{if(!elements.has(id))elements.set(id,{width:960,height:540,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},getContext:()=>drawing.ctx});return elements.get(id);};
    const context=vm.createContext({LavaSkins:display,BroadcastChannel:Channel,TextEncoder,TextDecoder,console,document:{getElementById:element,querySelectorAll:()=>[]},addEventListener(){},removeEventListener(){},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){}});context.window=context;
    vm.runInContext(source('coop.js'),context);vm.runInContext(code,context);
    const statusModule=source('season2-lv1.html').match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm,'');
    context.playerSkins=display;vm.runInContext(statusModule,context);
    return {shop,display,drawing,context,element,game:context.harness};
  }
  const a=await client('makima'),b=await client('yellow-egg');a.game.player.x=180;b.game.player.x=280;
  a.game.updateCoop(.5);b.game.updateCoop(.5);a.game.drawRemotes();b.game.drawRemotes();await flushImages();
  a.drawing.images.length=b.drawing.images.length=0;a.game.drawRemotes();b.game.drawRemotes();
  assert.match(a.drawing.images[0],/yellow-egg-cutout.png$/);assert.match(b.drawing.images[0],/makima-cutout.png$/);
  for(const peer of [a,b]){peer.drawing.images.length=0;peer.game.drawLocalPlayer();assert.match(peer.drawing.images[0],peer===a?/makima-cutout.png$/:/yellow-egg-cutout.png$/);assert(peer.drawing.texts.some(text=>text[0]==='我'));assert.match(peer.element('status').textContent,/2 人/);}
  assert.equal(a.element('my-skin').dataset.equippedSkin,'makima');
  a.drawing.images.length=0;a.game.draw();assert.match(a.drawing.images.at(-1),/makima-cutout.png$/);
  b.drawing.images.length=0;b.game.draw();assert.match(b.drawing.images.at(-1),/yellow-egg-cutout.png$/);
  a.game.camera=100;a.drawing.translations.length=0;a.game.drawRemotes();assert.deepEqual(a.drawing.translations[0],[194,440]);
  b.shop.equip('default');b.display.refresh();b.game.updateCoop(.5);a.drawing.images.length=0;a.game.drawRemotes();assert.equal(a.drawing.images.length,0);assert.equal(a.display.equipped().id,'makima');
  // Older clients omit skinId; they must remain ordinary in the viewer’s scene.
  a.game.handleCoopMsg({id:'legacy-peer',lv:101,type:'state',x:300,y:400});assert.equal(a.game.remotes.get('legacy-peer').skinId,'default');
  const observer=await client('default');observer.game.updateCoop(.5);a.game.updateCoop(.5);observer.game.drawRemotes();await flushImages();observer.drawing.images.length=0;observer.game.drawRemotes();assert(observer.drawing.images.some(image=>/makima-cutout.png$/.test(image)));
  observer.drawing.images.length=0;observer.game.drawLocalPlayer();assert.equal(observer.drawing.images.length,0);assert.match(observer.element('my-skin').textContent,/未装备特殊皮肤/);assert.equal(observer.shop.equip('makima').reason,'locked');
  for(const peer of [a,b,observer]){peer.context.LevelCoop.leave();peer.display.dispose();}
});

const roomTypes=[
  {name:'chase',create:createChaseRoom,clean:cleanPose,pose:{distance:0,x:0,jump:0,elapsed:0,phase:'ready'}},
  {name:'city',create:createCityRoom,clean:cleanCityPose,pose:{country:0,city:0,zone:'city',space:'',label:'街道',x:8,y:0,z:12,heading:0,moving:false,mode:'walk',vehicle:null}},
  {name:'building',create:createBuildRoom,clean:cleanBuildPose,pose:{x:0,y:0,z:17,heading:0,moving:false}}
];
for(const spec of roomTypes)test(`${spec.name} rooms transmit distinct skins, idle changes and late joins while sanitizing old or unknown IDs`,()=>{
  let time=10000;const queue=[],clients=[];
  const make=(id,host,skinId)=>{const room=spec.create({id,name:id,host,now:()=>time,send:message=>queue.push(message)}),client={room,skinId};clients.push(client);room.setOnline(true);return client;};
  const flush=()=>{let count=0;while(queue.length){assert(++count<1000);const message=queue.shift();for(const client of clients)client.room.receive(message);}};
  const tick=()=>{time+=200;for(const client of clients)client.room.tick({...spec.pose,skinId:client.skinId});flush();};
  const a=make('skin-host',true,'makima'),b=make('skin-guest',false,'yellow-egg');flush();tick();
  assert.equal(a.room.members.get('skin-guest').pose.skinId,'yellow-egg');assert.equal(b.room.members.get('skin-host').pose.skinId,'makima');
  if(spec.name==='chase'){
    b.room.ready();flush();assert(a.room.begin());flush();
    assert.equal(a.room.members.get('skin-guest').pose.skinId,'yellow-egg');assert.equal(b.room.members.get('skin-host').pose.skinId,'makima');
  }
  b.skinId='default';tick();assert.equal(a.room.members.get('skin-guest').pose.skinId,'default');
  const late=make('skin-late',false,'smile-cat');flush();tick();assert.equal(late.room.members.get('skin-host').pose.skinId,'makima');assert.equal(late.room.members.get('skin-guest').pose.skinId,'default');assert.equal(a.room.members.get('skin-late').pose.skinId,'smile-cat');
  for(const id of [undefined,null,{},'unknown','https://example.com/face.png','__proto__'])assert.equal(spec.clean({...spec.pose,skinId:id}).skinId,'default');
  assert.equal(cleanSkinId('jawline-cat'),'jawline-cat');
});
test('3D peers accept only their own transmitted selection, retain names, and never subscribe to the viewer wardrobe',async()=>{
  const root=new Group(),body=new Mesh(),tag=new Sprite();root.add(body,tag);
  const viewer={subscribe(){throw Error('A remote avatar must not read the local wardrobe');}};
  const skin=attachPlayerSkin(root,{display:viewer,skinId:'default',parts:[body],textureProvider:()=>({texture:new Texture(),ready:Promise.resolve(true)})});
  skin.setSkin('yellow-egg');await root.children.find(child=>child.userData.imageSkin).userData.ready;assert.equal(root.userData.playerSkinId,'yellow-egg');assert.equal(body.visible,false);assert.equal(tag.visible,true);
  skin.setSkin('makima');await root.children.find(child=>child.userData.imageSkin).userData.ready;assert.equal(root.userData.playerSkinId,'makima');
  skin.setSkin(undefined);assert.equal(root.userData.playerSkinId,'default');assert.equal(body.visible,true);assert.equal(tag.visible,true);skin.dispose();assert.equal(root.children.length,2);
});
