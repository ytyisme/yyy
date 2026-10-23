import test from 'node:test';
import {createLavaWallet} from '../lib/lava-wallet.mjs';
import assert from 'node:assert/strict';
import {FindXiaoyanRound,HIDE_MS,SHUFFLE_MS,MOVE_MS,SWAP_MS,DIFFICULTIES} from '../lib/find-xiaoyan.mjs';
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
test('nine piles, five slow adjacent swaps and no guessing until all ten seconds finish',()=>{
 const r=new FindXiaoyanRound(seeded(42));assert.equal(r.order.length,9);assert.equal(r.swaps.length,5);
 for(const [a,b] of r.swaps)assert.equal(Math.abs(a%3-b%3)+Math.abs(Math.floor(a/3)-Math.floor(b/3)),1);
 assert.equal(SWAP_MS*r.swaps.length,SHUFFLE_MS);assert.equal(MOVE_MS,1600);
 assert.equal(r.guess(r.winningSlot),null);r.advance(HIDE_MS-1);assert.equal(r.phase,'hide');
 r.advance(1);assert.equal(r.phase,'shuffle');assert.equal(r.remaining,10);
 r.advance(SHUFFLE_MS-1);assert.equal(r.phase,'shuffle');assert.equal(r.guess(r.winningSlot),null);
 r.advance(1);assert.equal(r.phase,'guess');assert.equal(r.remaining,0);
 assert.equal(r.guess(r.winningSlot),true);assert.equal(r.phase,'result');assert.equal(r.guess(r.winningSlot),null);
});
test('animation follows the actual hidden pile and all final positions match the answer',()=>{
 for(let seed=1;seed<=100;seed++){
  const r=new FindXiaoyanRound(seeded(seed));const ids=Array.from({length:9},(_,i)=>i);
  assert.deepEqual([...r.order].sort((a,b)=>a-b),ids);
  r.advance(HIDE_MS);
  for(let step=0;step<5;step++){
   const before=r.positions();r.advance(MOVE_MS/2);const during=r.positions();
   assert.equal(during.filter((p,i)=>Math.hypot(p.x-before[i].x,p.y-before[i].y)>.01).length,2);
   r.advance(SWAP_MS-MOVE_MS/2);
  }
  const final=r.positions();r.order.forEach((id,slot)=>assert.deepEqual(final[id],{x:slot%3,y:Math.floor(slot/3),slot}));
  assert.equal(r.order[r.winningSlot],r.hiddenId);
 }
});
test('wrong answers reveal the real location and a replay has independent state',()=>{
 const r=new FindXiaoyanRound(seeded(5));r.advance(999999);assert.equal(r.phase,'guess');
 assert.equal(r.guess(-1),null);assert.equal(r.guess(9),null);assert.equal(r.guess((r.winningSlot+1)%9),false);
 const frozen=r.elapsed;r.advance(2000);assert.equal(r.elapsed,frozen);
 const replay=new FindXiaoyanRound(seeded(6));assert.equal(replay.phase,'hide');assert.equal(replay.selection,null);assert.equal(replay.elapsed,0);
});

test('each difficulty uses its requested interval and keeps the same ten-second guessing boundary',()=>{
 for(const [mode,interval,count] of [['easy',2000,5],['hard',1000,10],['master',300,33],['s',100,100]]){
  const r=new FindXiaoyanRound(seeded(22),mode);
  assert.equal(r.swapMs,interval);assert.equal(r.swaps.length,count);
  r.advance(HIDE_MS);
  for(let i=0;i<count;i++){
   const before=r.positions();r.advance(r.moveMs/2);
   assert.equal(r.positions().filter((p,id)=>Math.hypot(p.x-before[id].x,p.y-before[id].y)>.01).length,2);
   r.advance(interval-r.moveMs/2);
  }
  if(count*interval<SHUFFLE_MS){
   const settled=r.positions();assert.equal(r.phase,'shuffle');assert.equal(r.guess(r.winningSlot),null);
   r.advance(SHUFFLE_MS-count*interval-1);assert.deepEqual(r.positions(),settled);assert.equal(r.phase,'shuffle');r.advance(1);
  }
  assert.equal(r.phase,'guess');assert.equal(r.remaining,0);
  r.order.forEach((id,slot)=>assert.deepEqual(r.positions()[id],{x:slot%3,y:Math.floor(slot/3),slot}));
  assert.equal(r.guess(r.winningSlot),true);
 }
 assert.equal(new FindXiaoyanRound(seeded(1),'unknown').difficulty,'easy');
});

 test('rewards require a correct completed round and increase with difficulty',()=>{
  for(const [mode,amount]of [['easy',20],['hard',60],['master',200],['s',500]]){
   const r=new FindXiaoyanRound(seeded(9),mode);assert.equal(DIFFICULTIES[mode].reward,amount);
   assert.equal(r.reward,0);assert.equal(r.guess(r.winningSlot),null);assert.equal(r.reward,0);
   r.advance(HIDE_MS+SHUFFLE_MS);assert.equal(r.reward,0);assert.equal(r.guess(r.winningSlot),true);
   assert.equal(r.reward,amount);assert.equal(r.guess(r.winningSlot),null);assert.equal(r.reward,amount);
   const wrong=new FindXiaoyanRound(seeded(9),mode);wrong.advance(HIDE_MS+SHUFFLE_MS);
   assert.equal(wrong.guess((wrong.winningSlot+1)%9),false);assert.equal(wrong.reward,0);
  }
 });

test('S reward is saved once per run, survives reload, and can be spent in the shared wallet',async()=>{
 const data=new Map(),storage={get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
 const wallet=createLavaWallet(storage),r=new FindXiaoyanRound(seeded(8),'s');
 r.advance(HIDE_MS+SHUFFLE_MS);r.guess(r.winningSlot);
 assert.equal(wallet.creditRun('find-test-first',r.reward).added,500);
 assert.equal(wallet.creditRun('find-test-first',r.reward).added,0);
 const shop=createLavaWallet(storage);assert.equal(shop.balance(),500);
 assert.equal((await shop.purchase('test-skin',200)).ok,true);assert.equal(wallet.balance(),300);
 assert.equal(wallet.creditRun('find-test-first',r.reward).added,0);assert.equal(wallet.balance(),300);
 wallet.creditRun('find-test-second',r.reward);assert.equal(createLavaWallet(storage).balance(),800);
});
