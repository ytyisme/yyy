export const LAVA_WALLET_PREFIX='lava-ingots-v1:';
export const LAVA_PURCHASE_PREFIX='lava-purchases-v1:';
const MAX=Number.MAX_SAFE_INTEGER;
function amount(value){if(typeof value!=='number'&&typeof value!=='string')return 0;const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:0;}
function storageOrNull(){try{return globalThis.localStorage||null;}catch{return null;}}
function records(storage){
  const result=new Map();
  try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(LAVA_WALLET_PREFIX))result.set(key,amount(storage.getItem(key)));}}catch{}
  return result;
}
// A separate monotonically increasing record per run prevents two game tabs
// from overwriting one another's earnings. Re-saving a run is idempotent.
export function createLavaWallet(storage=storageOrNull(),{lock=withPurchaseLock}={}){
  const pending=new Map();
  function purchaseAmount(id){try{const data=JSON.parse(storage.getItem(LAVA_PURCHASE_PREFIX+id));return data?.v===1?amount(data.amount):0;}catch{return 0;}}
  function spent(){let total=0;try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(LAVA_PURCHASE_PREFIX))total=Math.min(MAX,total+purchaseAmount(key.slice(LAVA_PURCHASE_PREFIX.length)));}}catch{}return total;}
  function balance(includePending=true){const all=records(storage);if(includePending)for(const [key,n]of pending)all.set(key,Math.max(n,all.get(key)||0));return Math.max(0,[...all.values()].reduce((sum,n)=>Math.min(MAX,sum+n),0)-spent());}
  function creditRun(id,earned){
    if(typeof id!=='string'||!/^[a-zA-Z0-9-]{8,96}$/.test(id)||!Number.isSafeInteger(earned)||earned<0)throw new Error('Invalid ingot credit');
    const key=LAVA_WALLET_PREFIX+id;let stored=0;
    try{stored=amount(storage.getItem(key));}catch{}
    const before=Math.max(stored,pending.get(key)||0),next=Math.max(before,earned);let persisted=false;
    try{storage.setItem(key,String(next));persisted=true;pending.delete(key);}catch{pending.set(key,next);}
    return {balance:balance(),added:next-before,persisted};
  }
  // Ownership and payment are the same immutable record: a failed write can
  // neither charge the player nor grant a skin. All tabs share a checkout lock.
  async function purchase(id,price){
    if(typeof id!=='string'||!/^[a-z0-9-]{3,80}$/.test(id)||!Number.isSafeInteger(price)||price<=0)throw new Error('Invalid ingot purchase');
    let savedReceipt;
    try{return await lock(()=>{
      if(purchaseAmount(id)>0)return {ok:true,alreadyOwned:true,balance:balance()};
      if(balance(false)<price)return {ok:false,reason:balance()>=price?'unsaved':'funds',balance:balance()};
      try{storage.setItem(LAVA_PURCHASE_PREFIX+id,JSON.stringify({v:1,amount:price}));}catch{return {ok:false,reason:'storage',balance:balance()};}
      savedReceipt={ok:true,alreadyOwned:false,balance:balance()};return savedReceipt;
    });}catch{return savedReceipt&&purchaseAmount(id)>0?{...savedReceipt,balance:balance()}:{ok:false,reason:'storage',balance:balance()};}
  }
  return {balance:()=>balance(),creditRun,purchase,owns:id=>purchaseAmount(id)>0};
}
export function newLavaRunId(){try{return globalThis.crypto.randomUUID();}catch{return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,14)}`;}}

let lockDatabase,nodeQueue=Promise.resolve();
function withPurchaseLock(action){
  if(globalThis.navigator?.locks?.request)return navigator.locks.request('lava-ingot-checkout',action);
  // IndexedDB read/write transactions serialize checkout across tabs on
  // browsers without Web Locks, including older iOS versions.
  if(globalThis.indexedDB){
    lockDatabase??=new Promise((resolve,reject)=>{
      const open=indexedDB.open('lava-checkout-lock',1);
      open.onupgradeneeded=()=>open.result.createObjectStore('mutex');
      open.onsuccess=()=>{open.result.onversionchange=()=>{open.result.close();lockDatabase=undefined;};resolve(open.result);};
      open.onerror=()=>{lockDatabase=undefined;reject(open.error);};
      open.onblocked=()=>{lockDatabase=undefined;reject(new Error('Checkout unavailable'));};
    });
    return lockDatabase.then(db=>new Promise((resolve,reject)=>{
      const tx=db.transaction('mutex','readwrite'),store=tx.objectStore('mutex');let result;
      store.get('checkout').onsuccess=()=>{try{result=action();}catch(error){tx.abort();reject(error);}};
      tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||new Error('Checkout failed'));
    }));
  }
  if(typeof window==='undefined'){const next=nodeQueue.then(action);nodeQueue=next.catch(()=>{});return next;}
  return Promise.reject(new Error('Persistent checkout unavailable'));
}
