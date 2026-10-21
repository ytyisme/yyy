import {createSkinShop,SKIN_SELECTION_KEY,skinById,cleanSkinId} from './skin-shop.mjs';

function loadImage(skin){
  if(typeof Image==='undefined')return Promise.resolve(null);
  return new Promise(resolve=>{
    const image=new Image();image.decoding='async';
    image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
    image.src=new URL('../'+skin.image,import.meta.url).href;
  });
}

// One owned selection for Canvas, DOM and 3D levels. Loading failures keep the
// original avatar visible, and a late image cannot replace a newer selection.
export function createSkinDisplay({shop=createSkinShop(),imageLoader=loadImage,eventTarget=globalThis.window,documentTarget=globalThis.document,now=()=>globalThis.performance?.now?.()??Date.now()}={}){
  const images=new Map(),listeners=new Set();let selected=shop.equipped();
  let nextCheck=now()+250;
  function notify(){for(const listener of listeners)listener(selected);}
  function imageFor(skin){
    if(!skin.image)return null;
    if(!images.has(skin.id)){
      const record={image:null,ready:null};images.set(skin.id,record);
      record.ready=Promise.resolve().then(()=>imageLoader(skin)).then(image=>{
        record.image=image;if(selected.id===skin.id)notify();return Boolean(image);
      },()=>false);
    }
    return images.get(skin.id);
  }
  function refresh(){
    nextCheck=now()+250;
    const next=shop.equipped(),changed=next.id!==selected.id;selected=next;
    imageFor(selected);if(changed)notify();return selected;
  }
  // Web views and suspended tabs can miss storage/focus events. Local rendering
  // and outgoing poses must reconcile the same saved selection, even when idle.
  function equipped(){if(now()>=nextCheck)refresh();return selected;}
  function visible(){if(!documentTarget.hidden)refresh();}
  function storageChanged(event){
    if(event.key==null||event.key===SKIN_SELECTION_KEY||event.key.startsWith('lava-purchases-v1:'))refresh();
  }
  eventTarget?.addEventListener('storage',storageChanged);
  eventTarget?.addEventListener('pageshow',refresh);
  eventTarget?.addEventListener('focus',refresh);
  eventTarget?.addEventListener('lava-skin-change',refresh);
  documentTarget?.addEventListener('visibilitychange',visible);
  const checkTimer=eventTarget?.setInterval?.(()=>{if(!documentTarget?.hidden)equipped();},250);
  imageFor(selected);
  return {
    equipped,refresh,
    cleanId:cleanSkinId,
    get ready(){return imageFor(equipped())?.ready??Promise.resolve(true);},
    subscribe(listener){listeners.add(listener);listener(selected);return ()=>listeners.delete(listener);},
    drawCanvas(ctx,{x,y,w,h,facing=1},...selection){
      const skin=skinById(cleanSkinId(selection.length?selection[0]:equipped().id));
      const image=imageFor(skin)?.image;if(!image)return false;
      const aspect=skin.imageAspect,height=Math.min(h*1.1,w*2/aspect),width=height*aspect;
      ctx.save();ctx.translate(x+w/2,y+h);if(facing<0)ctx.scale(-1,1);
      ctx.drawImage(image,-width/2,-height,width,height);ctx.restore();return true;
    },
    bindElement(element){
      const image=element.ownerDocument.createElement('img');image.alt='';image.hidden=true;
      image.className='equipped-player-skin';
      Object.assign(image.style,{position:'absolute',left:'50%',bottom:'0',transform:'translateX(-50%)',width:'200%',height:'110%',maxWidth:'none',objectFit:'contain',objectPosition:'center bottom',pointerEvents:'none'});
      element.append(image);
      const parts=[...element.querySelectorAll(':scope > .head, :scope > .body')].map(part=>[part,part.style.visibility]);
      const unsubscribe=this.subscribe(skin=>{
        const loaded=imageFor(skin)?.image;
        image.hidden=!loaded;if(loaded)image.src=loaded.src;
        element.dataset.skinId=loaded?skin.id:'default';
        for(const [part,visibility]of parts)part.style.visibility=loaded?'hidden':visibility;
      });
      return ()=>{unsubscribe();image.remove();for(const [part,visibility]of parts)part.style.visibility=visibility;delete element.dataset.skinId;};
    },
    dispose(){
      listeners.clear();eventTarget?.removeEventListener('storage',storageChanged);
      for(const type of ['pageshow','focus','lava-skin-change'])eventTarget?.removeEventListener(type,refresh);
      documentTarget?.removeEventListener('visibilitychange',visible);
      if(checkTimer!=null)eventTarget?.clearInterval?.(checkTimer);
    }
  };
}

export const playerSkins=createSkinDisplay();
if(typeof window!=='undefined'){
  window.LavaSkins=playerSkins;
  const bind=()=>document.querySelectorAll('[data-player-skin]').forEach(element=>playerSkins.bindElement(element));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
}
