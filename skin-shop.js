import * as THREE from './lib/three.module.js';
import {SHOP_SKINS,DEFAULT_SKIN,skinById,createSkinShop} from './lib/skin-shop.mjs';
import {makeBankRunner} from './lib/bank-run-visuals.mjs';
const $=id=>document.getElementById(id),shop=createSkinShop(),cards=new Map();
let selected=shop.equipped(),filter='all',busy=false,toastTimer,drawPreview=()=>{};
function say(text){clearTimeout(toastTimer);$('message').textContent=text;toastTimer=setTimeout(()=>{$('message').textContent='';},6500);}
function actionLabel(skin){if(shop.equipped().id===skin.id)return '✓ 已装备';if(shop.owns(skin.id))return '装备皮肤';return `<span class="ingot" aria-hidden="true"></span>${skin.price.toLocaleString('zh-CN')} · 购买并装备`;}
function paintAction(button,skin){
  const owned=shop.owns(skin.id),equipped=shop.equipped().id===skin.id,short=!owned&&shop.wallet.balance()<skin.price;
  button.innerHTML=actionLabel(skin);button.className='action'+(equipped?' equipped':owned?' owned':short?' short':'');button.disabled=busy||equipped;
  button.setAttribute('aria-label',equipped?`${skin.name}，已装备`:owned?`装备${skin.name}`:`花费${skin.price}岩浆币购买并装备${skin.name}`);
}
for(const skin of SHOP_SKINS){
  const card=document.createElement('article');card.className='skin-card';card.dataset.skin=skin.id;
  card.innerHTML=`<button class="skin-image" aria-label="试穿${skin.name}" aria-pressed="false"><img src="${skin.image}" alt="${skin.name}人物皮肤"><span class="skin-tag">${skin.tier}</span><span class="owned-tag" hidden></span></button><div class="skin-details"><h3>${skin.name}</h3><p>人物皮肤 · 多关卡通用</p><button class="action"></button></div>`;
  const preview=card.querySelector('.skin-image'),action=card.querySelector('.action');preview.onclick=()=>select(skin);action.onclick=()=>checkout(skin);$('skin-grid').append(card);cards.set(skin.id,{card,preview,action});
}
function select(skin){selected=skin;$('preview-name').textContent=skin.name;$('preview-tier').textContent=skin.tier+' / '+(skin.price?skin.price+' 岩浆币':'永久免费');$('preview-description').textContent=skin.description;drawPreview(skin.id);refresh();}
function refresh(){
  const ownedCount=SHOP_SKINS.filter(skin=>shop.owns(skin.id)).length;$('balance').textContent=shop.wallet.balance().toLocaleString('zh-CN');$('owned-count').textContent=ownedCount;$('empty').hidden=filter!=='owned'||ownedCount>0;
  for(const skin of SHOP_SKINS){const {card,preview,action}=cards.get(skin.id),owned=shop.owns(skin.id),equipped=shop.equipped().id===skin.id;card.hidden=filter==='owned'&&!owned;card.classList.toggle('selected',skin.id===selected.id);preview.setAttribute('aria-pressed',String(skin.id===selected.id));const tag=card.querySelector('.owned-tag');tag.hidden=!owned;tag.textContent=equipped?'✓ 已装备':'已拥有';paintAction(action,skin);}
  $('equipped-note').textContent=shop.equipped().id===selected.id?'✓ 正在使用这款皮肤':shop.owns(selected.id)?'已拥有 · 随时免费换装':shop.wallet.balance()<selected.price?`还差 ${(selected.price-shop.wallet.balance()).toLocaleString('zh-CN')} 岩浆币`:'解锁后永久拥有';
  $('default-skin').setAttribute('aria-pressed',String(selected.id==='default'));$('default-skin').querySelector('.default-status').textContent=shop.equipped().id==='default'?'已装备 · 试穿 →':'试穿 →';paintAction($('preview-action'),selected);
}
async function checkout(skin){
  if(busy)return;selected=skin;select(skin);
  if(shop.owns(skin.id)){const result=shop.equip(skin.id);if(result.ok){say(`已装备「${skin.name}」，进入人物关卡就能看到。`);refresh();}else say('浏览器未能保存换装，请检查存储设置后重试。');return;}
  busy=true;refresh();
  try{
    const receipt=await shop.buy(skin.id);
    if(!receipt.ok){say(receipt.reason==='funds'?`岩浆币不够，还差 ${Math.max(0,skin.price-receipt.balance)} 个。去第21关收集吧！`:receipt.reason==='unsaved'?'本局岩浆币还没有保存成功，请先回游戏完成保存。':'浏览器未能保存购买，请检查存储空间后重试。本次没有扣币。');return;}
    const equipped=shop.equip(skin.id);
    say(equipped.ok?(receipt.alreadyOwned?`已装备「${skin.name}」，没有重复扣币。`:`已解锁并装备「${skin.name}」！花费 ${skin.price} 岩浆币。`):'皮肤已解锁，换装未能保存；可稍后在「我的衣橱」重新装备。');
  }finally{busy=false;refresh();}
}
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));refresh();};
$('default-skin').onclick=()=>select(DEFAULT_SKIN);$('preview-action').onclick=()=>checkout(selected);
window.addEventListener('storage',refresh);window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});

function setupPreview(){
  const host=$('preview'),photo=document.createElement('img'),tools=document.querySelector('.preview-tools'),fitting=host.closest('.fitting');
  photo.className='skin-photo';photo.hidden=true;photo.decoding='async';host.append(photo);
  let renderer,scene,camera,actor,stand,angle=-.35,running=false,dirty=true,elapsed=0,last=performance.now(),isImage=true,unavailable=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const resize=()=>{if(!renderer)return;const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;};
  new ResizeObserver(resize).observe(host);
  function initializeDefault(){
    if(renderer||unavailable)return;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{unavailable=true;$('preview-error').hidden=false;tools.hidden=true;return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.append(renderer.domElement);
    scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfff4db,0x7c9186,3));const sun=new THREE.DirectionalLight(0xffedcf,3.5);sun.position.set(-3,5,-4);scene.add(sun);
    camera=new THREE.PerspectiveCamera(37,1,.1,30);camera.position.set(0,1.40,-4.7);camera.lookAt(0,1.05,0);
    stand=new THREE.Mesh(new THREE.CylinderGeometry(.78,.86,.10,48),new THREE.MeshStandardMaterial({color:0xc7d1bd,roughness:.9}));stand.position.y=-.12;scene.add(stand);
    actor=makeBankRunner(0x4b9695);scene.add(actor);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();unavailable=true;if(!isImage)$('preview-error').hidden=false;});renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  }
  drawPreview=id=>{
    const skin=skinById(id);isImage=Boolean(skin?.image);fitting.dataset.preview=isImage?'image':'model';photo.hidden=!isImage;tools.hidden=isImage||unavailable;
    fitting.querySelector('.fitting-top>span').textContent=isImage?'人物皮肤预览':'3D 试穿间';fitting.querySelector('.live-dot').textContent=isImage?'与游戏外观一致':'可旋转查看';
    host.setAttribute('aria-label',isImage?`${skin.name}的抠图人物`:'角色三维预览');$('preview-error').hidden=true;
    if(isImage){photo.src=skin.image;photo.alt=skin.name+'抠图人物';if(renderer)renderer.domElement.hidden=true;}
    else{initializeDefault();if(renderer)renderer.domElement.hidden=false;$('preview-error').hidden=!unavailable;resize();}
    dirty=true;
  };
  $('turn-left').onclick=()=>{angle-=.65;dirty=true;};$('turn-right').onclick=()=>{angle+=.65;dirty=true;};
  $('pose').onclick=()=>{running=!running;$('pose').textContent=running?'站好看看':'跑起来';$('pose').setAttribute('aria-pressed',String(running));dirty=true;};
  function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden||isImage||!renderer||unavailable)return;if(!dirty&&(!running||reduced.matches))return;elapsed+=dt;actor.userData.animate(elapsed,{running,masked:false});actor.rotation.y=angle;renderer.render(scene,camera);dirty=false;}requestAnimationFrame(frame);
}
setupPreview();select(selected);
