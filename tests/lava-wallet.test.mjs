import test from 'node:test';
import assert from 'node:assert/strict';
import {createLavaWallet,LAVA_WALLET_PREFIX} from '../lib/lava-wallet.mjs';
function store(){const data=new Map();return {data,get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};}
test('a run saves monotonically; refreshes and stale repeated saves never duplicate or remove earnings',()=>{
  const storage=store(),wallet=createLavaWallet(storage);assert.equal(wallet.balance(),0);assert.equal(wallet.creditRun('run-first-123',7).added,7);assert.equal(wallet.creditRun('run-first-123',7).added,0);assert.equal(wallet.creditRun('run-first-123',3).balance,7);assert.equal(wallet.creditRun('run-first-123',12).added,5);assert.equal(createLavaWallet(storage).balance(),12);
});
test('two independent tabs earn concurrently without overwriting one another and both homepages see their sum',()=>{
  const storage=store(),a=createLavaWallet(storage),b=createLavaWallet(storage);a.creditRun('run-player-a',11);b.creditRun('run-player-b',9);a.creditRun('run-player-a',13);b.creditRun('run-player-b',10);assert.equal(a.balance(),23);assert.equal(b.balance(),23);assert.equal(createLavaWallet(storage).balance(),23);
});
test('invalid storage and invalid credits cannot create negative, fractional or non-finite balances',()=>{
  const storage=store();for(const [key,n]of Object.entries({nan:'NaN',inf:'Infinity',negative:'-20',fraction:'1.3',json:'{}',ok:'8'}))storage.setItem(LAVA_WALLET_PREFIX+key,n);storage.setItem('another-game-balance','9000');const wallet=createLavaWallet(storage);assert.equal(wallet.balance(),8);
  for(const n of [-1,NaN,Infinity,2.1,'3'])assert.throws(()=>wallet.creditRun('run-correct',n));assert.throws(()=>wallet.creditRun('../bad',2));assert.equal(wallet.balance(),8);
});
test('blocked or full storage preserves this page earnings and reports failure; retrying persistence is idempotent',()=>{
  const memory=createLavaWallet(null);assert.equal(memory.creditRun('run-offline',4).persisted,false);assert.equal(memory.balance(),4);
  const storage=store(),save=storage.setItem;storage.setItem=()=>{throw Error('quota');};const wallet=createLavaWallet(storage);assert.deepEqual(wallet.creditRun('run-recover',5),{balance:5,added:5,persisted:false});storage.setItem=save;assert.deepEqual(wallet.creditRun('run-recover',5),{balance:5,added:0,persisted:true});assert.equal(createLavaWallet(storage).balance(),5);
});
