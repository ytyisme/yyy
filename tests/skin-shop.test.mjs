import test from 'node:test';
import assert from 'node:assert/strict';
import {createLavaWallet,LAVA_PURCHASE_PREFIX} from '../lib/lava-wallet.mjs';
import {SHOP_SKINS,createSkinShop,SKIN_SELECTION_KEY} from '../lib/skin-shop.mjs';
import {makeSkinRunner} from '../lib/skin-visuals.mjs';
import {Texture,SRGBColorSpace} from '../lib/three.module.js';
function storage(){const data=new Map();return {data,get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};}
function setup(coins=1000){const store=storage(),wallet=createLavaWallet(store);wallet.creditRun('run-shop-1234',coins);return {store,wallet,shop:createSkinShop(store,wallet)};}

test('buying pays the listed price once, grants permanent ownership and survives reload',async()=>{
  const {store,wallet,shop}=setup();const result=await shop.buy('yellow-egg');assert.equal(result.ok,true);assert.equal(wallet.balance(),880);assert.equal(shop.owns('yellow-egg'),true);assert.equal(shop.equip('yellow-egg').ok,true);
  const reopened=createSkinShop(store);assert.equal(reopened.equipped().id,'yellow-egg');assert.equal(reopened.wallet.balance(),880);assert.equal((await reopened.buy('yellow-egg')).alreadyOwned,true);assert.equal(reopened.wallet.balance(),880);
});
test('insufficient funds and unknown skins never deduct currency or grant ownership',async()=>{
  const {shop,wallet}=setup(119);assert.equal((await shop.buy('yellow-egg')).reason,'funds');assert.equal((await shop.buy('unknown')).reason,'invalid');assert.equal(shop.owns('yellow-egg'),false);assert.equal(shop.equip('yellow-egg').reason,'locked');assert.equal(wallet.balance(),119);assert.equal(shop.equipped().id,'default');
});
test('simultaneous checkout in independent tabs cannot overspend or double-charge one skin',async()=>{
  const {store,wallet,shop}=setup(400),other=createSkinShop(store);
  const receipts=await Promise.all([shop.buy('jawline-cat'),other.buy('jawline-cat'),other.buy('yellow-egg')]);assert.equal(receipts.filter(r=>r.ok&&!r.alreadyOwned).length,1);assert.equal(receipts[1].alreadyOwned,true);assert.equal(receipts[2].reason,'funds');assert.equal(wallet.balance(),40);assert.equal(other.wallet.balance(),40);
});
test('different simultaneous purchases both succeed when the balance covers both',async()=>{
  const {store,wallet,shop}=setup(500),other=createSkinShop(store);const results=await Promise.all([shop.buy('yellow-egg'),other.buy('smile-cat')]);assert.ok(results.every(r=>r.ok));assert.equal(wallet.balance(),160);assert.ok(shop.owns('yellow-egg')&&shop.owns('smile-cat'));
});
test('storage failure does not charge or grant ownership; a retry is safe',async()=>{
  const {store,wallet,shop}=setup(),save=store.setItem;store.setItem=()=>{throw Error('full');};assert.equal((await shop.buy('yellow-egg')).reason,'storage');assert.equal(wallet.balance(),1000);assert.equal(shop.owns('yellow-egg'),false);store.setItem=save;assert.equal((await shop.buy('yellow-egg')).ok,true);assert.equal(wallet.balance(),880);
});
test('a purchase remains owned if saving the equipped choice fails',async()=>{
  const {store,shop}=setup(),save=store.setItem;await shop.buy('yellow-egg');store.setItem=(key,value)=>{if(key===SKIN_SELECTION_KEY)throw Error('full');save(key,value);};assert.equal(shop.equip('yellow-egg').reason,'storage');assert.ok(shop.owns('yellow-egg'));assert.equal(shop.wallet.balance(),880);store.setItem=save;assert.ok(shop.equip('yellow-egg').ok);
});
test('a lock release failure after a durable purchase reports the saved receipt accurately',async()=>{
  const store=storage(),wallet=createLavaWallet(store,{lock:action=>{action();throw Error('lock closed');}});wallet.creditRun('run-release-123',200);const receipt=await wallet.purchase('skin-yellow-egg',120);assert.equal(receipt.ok,true);assert.equal(receipt.alreadyOwned,false);assert.equal(wallet.balance(),80);assert.equal(wallet.owns('skin-yellow-egg'),true);
});
test('new runs add currency after purchases; stale credits cannot refund spent currency',async()=>{
  const {wallet,shop}=setup();await shop.buy('makima');assert.equal(wallet.balance(),120);wallet.creditRun('run-shop-1234',1000);assert.equal(wallet.balance(),120);wallet.creditRun('run-second-123',30);assert.equal(wallet.balance(),150);wallet.creditRun('run-shop-1234',1007);assert.equal(wallet.balance(),157);
});
test('unsaved earnings cannot buy a skin that would disappear after a reload',async()=>{
  const store=storage(),save=store.setItem;store.setItem=()=>{throw Error('full');};const wallet=createLavaWallet(store);wallet.creditRun('run-pending-123',150);store.setItem=save;const shop=createSkinShop(store,wallet);assert.equal((await shop.buy('yellow-egg')).reason,'unsaved');assert.equal(shop.owns('yellow-egg'),false);wallet.creditRun('run-pending-123',150);assert.equal((await shop.buy('yellow-egg')).ok,true);
});
test('unowned or invalid saved selections fall back to the free original skin',()=>{
  const {store,shop}=setup();for(const id of ['makima','unknown','__proto__',null]){store.setItem(SKIN_SELECTION_KEY,id);assert.equal(shop.equipped().id,'default');}assert.equal(shop.equip('default').ok,true);
});
test('malformed spend records cannot produce negative, fractional or infinite balances',()=>{
  const {store,wallet}=setup(100);for(const [id,value]of Object.entries({a:'not json',b:'{"v":1,"amount":-10}',c:'{"v":1,"amount":0.5}',d:'{"v":2,"amount":1000}',e:'{"v":1,"amount":"Infinity"}'}))store.setItem(LAVA_PURCHASE_PREFIX+id,value);assert.equal(wallet.balance(),100);assert.equal(wallet.owns('a'),false);
});
test('every paid skin uses its character cutout with full UVs, unchanged colors and aspect ratio',async()=>{
  for(const skin of SHOP_SKINS){
    const original=new Texture();original.colorSpace=SRGBColorSpace;let requested;
    const model=makeSkinRunner(skin.id,{textureProvider:item=>{requested=item.image;return {texture:original,ready:Promise.resolve(true)};}});await model.userData.ready;
    const image=model.userData.portrait;assert.equal(requested,skin.image);assert.equal(model.userData.imageSource,skin.image);assert.equal(image.isSprite,true);assert.equal(image.material.map,original);assert.equal(image.material.toneMapped,false);assert.equal(image.visible,true);assert.equal(original.colorSpace,SRGBColorSpace);assert.deepEqual(original.repeat.toArray(),[1,1]);assert.deepEqual(original.offset.toArray(),[0,0]);assert.ok(Math.abs(image.scale.x/image.scale.y-skin.imageAspect)<1e-10);assert.equal(image.center.y,0);
    model.rotation.y=Math.PI;model.userData.animate(1,{running:true});assert.equal(image.material.map,original);model.userData.animate(1,{duck:true});assert.equal(model.children[0].scale.y,.48);assert.equal(model.children[0].scale.x,.48);assert.equal(model.position.y,0);model.userData.animate(2,{jump:true});assert.equal(model.children[0].scale.y,1);assert.equal(image.material.map,original);model.userData.dispose();
  }
  assert.equal(makeSkinRunner('default'),null);assert.equal(makeSkinRunner('unknown'),null);
});
test('an asynchronously loaded skin becomes visible when its original image is ready, including an idle scene',async()=>{
  let finish;const model=makeSkinRunner('yellow-egg',{textureProvider:()=>({texture:new Texture(),ready:new Promise(resolve=>{finish=resolve;})})});assert.equal(model.userData.portrait.visible,false);finish(true);assert.equal(await model.userData.ready,true);assert.equal(model.userData.portrait.visible,true);assert.equal(model.userData.imageError,false);
  const broken=makeSkinRunner('makima',{textureProvider:()=>({texture:new Texture(),ready:Promise.reject(Error('missing'))})});assert.equal(await broken.userData.ready,false);assert.equal(broken.userData.portrait.visible,false);assert.equal(broken.userData.imageError,true);
});
test('the story hood is a removable prop and never overwrites any original image',async()=>{
  const original=new Texture(),model=makeSkinRunner('jawline-cat',{textureProvider:()=>({texture:original,ready:Promise.resolve(true)})});await model.userData.ready;const rig=model.children[0],image=model.userData.portrait,hood=rig.children.find(child=>child!==image);
  model.userData.animate(1,{masked:true,lift:.5});assert.equal(hood.visible,true);assert.equal(image.material.map,original);model.userData.animate(2,{running:true,masked:false});assert.equal(hood.visible,false);assert.equal(image.visible,true);assert.equal(image.material.map,original);
});
