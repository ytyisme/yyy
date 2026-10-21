import {createLavaWallet} from './lava-wallet.mjs';

export const SKIN_SELECTION_KEY='lava-equipped-skin-v1';
export const DEFAULT_SKIN=Object.freeze({id:'default',name:'城市跑者',price:0,tier:'初始',color:'#4b9695',description:'熟悉的青绿色外套，陪你跑过每一条街。',image:null});
export const SHOP_SKINS=Object.freeze([
  Object.freeze({id:'yellow-egg',name:'绝望的蛋 · 小黄',price:120,tier:'元气',color:'#e9bc3d',image:'assets/skins/yellow-egg-cutout.png',originalImage:'assets/skins/yellow-egg.png',imageAspect:1448/1086,face:Object.freeze({x:.46,y:.47,width:.38,height:.43}),description:'小天线、快乐的笑脸和白色靴子，小黄已单独抠出。'}),
  Object.freeze({id:'smile-cat',name:'微笑表情猫',price:220,tier:'趣味',color:'#a38c71',image:'assets/skins/jawline-plus-cutout.png',originalImage:'assets/skins/jawline-plus.jpg',imageAspect:1,face:Object.freeze({x:.50,y:.49,width:.88,height:.84}),description:'保留猫猫的表情和模样，带着这张笑脸继续冒险。'}),
  Object.freeze({id:'jawline-cat',name:'完美下颚线 · 橘猫',price:360,tier:'稀有',color:'#ba7941',image:'assets/skins/jawline-cutout.png',originalImage:'assets/skins/jawline.jpg',imageAspect:1186/1326,face:Object.freeze({x:.50,y:.39,width:.74,height:.61}),description:'完美下颚线和淡定的眼神，橘猫已单独抠出。'}),
  Object.freeze({id:'makima',name:'玛奇玛',price:880,tier:'典藏',color:'#b34135',image:'assets/skins/makima-cutout.png',originalImage:'assets/skins/makima.jpg',imageAspect:1675/939,face:Object.freeze({x:.52,y:.38,width:.39,height:.69}),description:'红发、金色眼睛和原来的手势，人物已单独抠出。'})
]);
export function skinById(id){return SHOP_SKINS.find(skin=>skin.id===id)||(id==='default'?DEFAULT_SKIN:null);}
export function cleanSkinId(id){return skinById(id)?.id||'default';}
function localStore(){try{return globalThis.localStorage||null;}catch{return null;}}
export function createSkinShop(storage=localStore(),wallet=createLavaWallet(storage)){
  const owns=id=>id==='default'||Boolean(skinById(id)&&wallet.owns('skin-'+id));
  function equipped(){let id;try{id=storage.getItem(SKIN_SELECTION_KEY);}catch{}return owns(id)?skinById(id):DEFAULT_SKIN;}
  function equip(id){
    if(!owns(id))return {ok:false,reason:'locked'};
    try{storage.setItem(SKIN_SELECTION_KEY,id);}catch{return {ok:false,reason:'storage'};}
    if(typeof window!=='undefined')window.dispatchEvent(new Event('lava-skin-change'));
    return {ok:true,skin:skinById(id)};
  }
  async function buy(id){const skin=SHOP_SKINS.find(item=>item.id===id);if(!skin)return {ok:false,reason:'invalid'};return wallet.purchase('skin-'+id,skin.price);}
  return {wallet,owns,equipped,equip,buy};
}
