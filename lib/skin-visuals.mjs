import * as THREE from './three.module.js';
import {skinById,cleanSkinId} from './skin-shop.mjs';
import {playerSkins} from './player-skins.mjs';

const images=new Map();
function loadSkinImage(skin){
  if(images.has(skin.id))return images.get(skin.id);
  const record={texture:new THREE.Texture(),ready:Promise.resolve(false)};
  if(typeof document!=='undefined')record.ready=new Promise(resolve=>{
    record.texture=new THREE.TextureLoader().load(new URL('../'+skin.image,import.meta.url).href,()=>resolve(true),undefined,()=>resolve(false));
  });
  record.texture.colorSpace=THREE.SRGBColorSpace;
  images.set(skin.id,record);return record;
}

let hoodTexture;
function makeHoodTexture(){
  if(hoodTexture)return hoodTexture;
  // A separate story prop. The original skin texture is never painted over.
  const width=96,height=112,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=(x+.5)/width,v=(y+.5)/height,index=(y*width+x)*4;
    if(((u-.5)/.49)**2+((v-.50)/.49)**2>1)continue;
    const eye=[.32,.68].some(cx=>((u-cx)/.11)**2+((v-.64)/.055)**2<1);
    const pupil=[.32,.68].some(cx=>((u-cx)/.035)**2+((v-.64)/.048)**2<1);
    pixels.set(eye&&!pupil?[246,234,210,255]:[24,31,40,255],index);
  }
  hoodTexture=new THREE.DataTexture(pixels,width,height);hoodTexture.colorSpace=THREE.SRGBColorSpace;hoodTexture.magFilter=THREE.LinearFilter;hoodTexture.needsUpdate=true;return hoodTexture;
}

// The shop and game share the same transparent character cutout. Sprite alpha
// reveals the world around the subject; scaling preserves its aspect ratio.
export function makeSkinRunner(id,{textureProvider=loadSkinImage,height:fitHeight=2.1,maxWidth=1.65}={}){
  const skin=skinById(id);if(!skin?.image)return null;
  const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
  const image=textureProvider(skin),width=Math.min(maxWidth,fitHeight*skin.imageAspect),height=width/skin.imageAspect;
  const material=new THREE.SpriteMaterial({map:image.texture,transparent:true,depthWrite:false,toneMapped:false,fog:false});
  const portrait=new THREE.Sprite(material);portrait.name='original-skin-image';portrait.center.set(.5,0);portrait.scale.set(width,height,1);portrait.visible=false;rig.add(portrait);
  const maskMaterial=new THREE.SpriteMaterial({map:makeHoodTexture(),transparent:true,depthWrite:false,toneMapped:false,fog:false});
  const mask=new THREE.Sprite(maskMaterial),face=skin.face;mask.scale.set(width*face.width,height*face.height,1);mask.renderOrder=1;rig.add(mask);
  root.userData.skinId=id;root.userData.imageSkin=true;root.userData.imageSource=skin.image;root.userData.portrait=portrait;
  root.userData.ready=Promise.resolve(image.ready).then(loaded=>{portrait.visible=Boolean(loaded);root.userData.imageError=!loaded;return Boolean(loaded);},()=>{root.userData.imageError=true;return false;});
  root.userData.animate=(time,{running=false,duck=false,jump=false,masked=false,lift=1}={})=>{
    rig.scale.setScalar(duck?.48:1);
    rig.position.y=running&&!jump&&!duck?Math.abs(Math.sin(time*15))*.055:0;
    material.rotation=running&&!duck?Math.sin(time*7.5)*.025:0;
    mask.visible=masked&&portrait.visible;
    mask.position.set((face.x-.5)*width+.28*(1-lift),(1-face.y)*height-.8*(1-lift),0);
    maskMaterial.rotation=material.rotation-.8*(1-lift);
  };
  root.userData.dispose=()=>{material.dispose();maskMaterial.dispose();};
  root.userData.animate(0);return root;
}

// Attach to the local physics root so movement, vehicles, camera modes and
// existing limb references continue to work. NPC factories stay unchanged.
export function attachPlayerSkin(root,{display=playerSkins,skinId,parts=[...root.children],onChange=()=>{},...options}={}){
  const original=parts.map(part=>[part,part.visible]);let avatar=null,selected=null,generation=0;
  function restore(){for(const [part,visible]of original)part.visible=visible;}
  function clear(){if(avatar){root.remove(avatar);avatar.userData.dispose();avatar=null;}restore();root.userData.playerSkinId='default';}
  function select(skin){
    if(selected===skin.id)return;selected=skin.id;const version=++generation;clear();
    const next=makeSkinRunner(skin.id,options);if(!next){onChange();return;}
    next.traverse(part=>{part.userData.cityDynamic=true;});
    avatar=next;root.add(next);next.userData.ready.then(loaded=>{
      if(version!==generation)return;
      if(loaded){for(const [part]of original)part.visible=false;root.userData.playerSkinId=skin.id;}
      else clear();
      onChange();
    });
    onChange();
  }
  const unsubscribe=skinId===undefined?display.subscribe(select):()=>{};
  if(skinId!==undefined)select(skinById(cleanSkinId(skinId)));
  return {setSkin:id=>select(skinById(cleanSkinId(id))),update:(time,pose)=>avatar?.userData.animate(time,pose),dispose(){generation++;unsubscribe();clear();}};
}
