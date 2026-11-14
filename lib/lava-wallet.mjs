export const LAVA_WALLET_PREFIX='lava-ingots-v1:';
export const LAVA_PURCHASE_PREFIX='lava-purchases-v1:';
const MAX=Number.MAX_SAFE_INTEGER;
const MAX_BIG=BigInt(MAX);
const MAX_DIGITS=200;

// Group a non-negative integer without ever passing it through Number.
export function formatLavaCount(value){
  const digits=typeof value==='bigint'?value.toString():String(value??'0');
  if(!/^\d+$/.test(digits))return '0';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g,',');
}

function exactAmount(value){
  if(typeof value!=='number'&&typeof value!=='string')return 0n;
  if(typeof value==='string'){
    const text=value.trim();
    if(/^(0|[1-9]\d*)$/.test(text)){
      if(text.length>MAX_DIGITS)return 0n;
      // Longer than 15 digits is parsed as BigInt. Number() would round it.
      if(text.length>15)return BigInt(text);
    }
  }
  const n=Number(typeof value==='string'?value.trim():value);
  return Number.isSafeInteger(n)&&n>=0?BigInt(n):0n;
}
function parseCredit(value){
  if(typeof value==='bigint'){
    if(value<0n||value.toString().length>MAX_DIGITS)throw new Error('Invalid ingot credit');
    return value;
  }
  if(typeof value==='string'&&/^(0|[1-9]\d*)$/.test(value)&&value.length<=MAX_DIGITS)return BigInt(value);
  if(typeof value==='number'&&Number.isSafeInteger(value)&&value>=0)return BigInt(value);
  throw new Error('Invalid ingot credit');
}
function storageOrNull(){try{return globalThis.localStorage||null;}catch{return null;}}
function records(storage){
  const result=new Map();
  try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(LAVA_WALLET_PREFIX))result.set(key,exactAmount(storage.getItem(key)));}}catch{}
  return result;
}
function creditSum(storage,pending,includePending){
  const all=records(storage);
  if(includePending)for(const [key,n] of pending){const prev=all.get(key)||0n;all.set(key,prev>n?prev:n);}
  let sum=0n;
  for(const n of all.values())sum+=n;
  return sum;
}
// A separate monotonically increasing record per run prevents two game tabs
// from overwriting one another's earnings. Re-saving a run is idempotent.
export function createLavaWallet(storage=storageOrNull(),{lock=withPurchaseLock}={}){
  const pending=new Map();
  function purchaseAmount(id){try{const data=JSON.parse(storage.getItem(LAVA_PURCHASE_PREFIX+id));if(data?.v!==1)return 0;const n=exactAmount(data.amount);return n>0n&&n<=MAX_BIG?Number(n):0;}catch{return 0;}}
  function spent(){let total=0;try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(LAVA_PURCHASE_PREFIX))total=Math.min(MAX,total+purchaseAmount(key.slice(LAVA_PURCHASE_PREFIX.length)));}}catch{}return total;}
  function spentExact(){let total=0n;try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(LAVA_PURCHASE_PREFIX))total+=BigInt(purchaseAmount(key.slice(LAVA_PURCHASE_PREFIX.length)));}}catch{}return total;}
  function balance(includePending=true){
    const sum=creditSum(storage,pending,includePending);
    const capped=sum>MAX_BIG?MAX_BIG:sum;
    const left=capped-BigInt(spent());
    if(left<=0n)return 0;
    if(left>MAX_BIG)return MAX;
    return Number(left);
  }
  function balanceExact(includePending=true){
    const left=creditSum(storage,pending,includePending)-spentExact();
    return left>0n?left.toString():'0';
  }
  function writeCredit(key,next){
    let persisted=false;
    try{storage.setItem(key,next.toString());persisted=true;pending.delete(key);}catch{pending.set(key,next);}
    return persisted;
  }
  function creditRun(id,earned){
    if(typeof id!=='string'||!/^[a-zA-Z0-9-]{8,96}$/.test(id)||!Number.isSafeInteger(earned)||earned<0)throw new Error('Invalid ingot credit');
    const key=LAVA_WALLET_PREFIX+id;let stored=0n;
    try{stored=exactAmount(storage.getItem(key));}catch{}
    const before=stored>(pending.get(key)||0n)?stored:(pending.get(key)||0n);
    // A safe-integer credit must not overwrite an exact larger reward.
    if(before>MAX_BIG){let persisted=false;try{persisted=storage.getItem(key)!=null;}catch{}return {balance:balance(),added:0,persisted};}
    const next=before>BigInt(earned)?before:BigInt(earned);
    const persisted=writeCredit(key,next);
    return {balance:balance(),added:Number(next-before),persisted};
  }
  function creditExact(id,earned){
    if(typeof id!=='string'||!/^[a-zA-Z0-9-]{8,96}$/.test(id))throw new Error('Invalid ingot credit');
    const amount=parseCredit(earned);
    const key=LAVA_WALLET_PREFIX+id;let stored=0n;
    try{stored=exactAmount(storage.getItem(key));}catch{}
    const before=stored>(pending.get(key)||0n)?stored:(pending.get(key)||0n);
    const next=before>amount?before:amount;
    const persisted=writeCredit(key,next);
    const added=next-before;
    return {balance:balance(),balanceExact:balanceExact(),added:added<=MAX_BIG?Number(added):0,addedExact:added.toString(),persisted};
  }
  // Ownership and payment are the same immutable record: a failed write can
  // neither charge the player nor grant a skin. All tabs share a checkout lock.
  async function purchase(id,price){
    if(typeof id!=='string'||!/^[a-z0-9-]{3,80}$/.test(id)||!Number.isSafeInteger(price)||price<=0)throw new Error('Invalid ingot purchase');
    let savedReceipt;
    try{return await lock(()=>{
      if(purchaseAmount(id)>0)return {ok:true,alreadyOwned:true,balance:balance()};
      const saved=creditSum(storage,pending,false)-spentExact();
      const visible=creditSum(storage,pending,true)-spentExact();
      if(saved<BigInt(price))return {ok:false,reason:visible>=BigInt(price)?'unsaved':'funds',balance:balance()};
      try{storage.setItem(LAVA_PURCHASE_PREFIX+id,JSON.stringify({v:1,amount:price}));}catch{return {ok:false,reason:'storage',balance:balance()};}
      savedReceipt={ok:true,alreadyOwned:false,balance:balance()};return savedReceipt;
    });}catch{return savedReceipt&&purchaseAmount(id)>0?{...savedReceipt,balance:balance()}:{ok:false,reason:'storage',balance:balance()};}
  }
  return {balance:()=>balance(),balanceExact:()=>balanceExact(),creditRun,creditExact,purchase,owns:id=>purchaseAmount(id)>0};
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
