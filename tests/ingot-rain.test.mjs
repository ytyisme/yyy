import test from 'node:test';
import assert from 'node:assert/strict';
import {createIngotRain} from '../lib/ingot-rain.mjs';
import {createLavaWallet} from '../lib/lava-wallet.mjs';
import {createSkinShop} from '../lib/skin-shop.mjs';
const make=options=>createIngotRain({random:()=>.5,...options});
function memory(){const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};}

test('the opening waits for Start, then displays 3, 2, 1 for one full second each before any rain',()=>{
  const game=make();game.advance(100000);assert.equal(game.state.phase,'ready');assert.equal(game.coins.size,0);assert.equal(game.start(100000),true);assert.equal(game.start(100100),false);
  for(const [offset,count]of [[0,3],[999,3],[1000,2],[1999,2],[2000,1],[2999,1]]){game.advance(100000+offset);assert.equal(game.state.phase,'countdown');assert.equal(game.state.countdown,count);assert.equal(game.coins.size,0);assert.equal(game.state.remaining,30);}
  game.advance(103000);assert.equal(game.state.phase,'running');assert.equal(game.state.remaining,30);assert.equal(game.coins.size,1);
});
test('one airborne ingot credits exactly once; clicking the same or an unknown coin cannot duplicate it',()=>{
  const events=[],game=make({onCollect:event=>events.push(event)});game.start(0);game.advance(3500);const coin=[...game.coins.values()].find(c=>c.y>=0);assert.ok(coin);assert.equal(game.collect(coin.id,3500),true);assert.equal(game.collect(coin.id,3500),false);assert.equal(game.collect('missing',3500),false);assert.equal(game.state.collected,1);assert.equal(events.length,1);assert.equal(events[0].collected,1);
});
test('coins cannot be picked above the sky and disappear precisely when they reach the ground',()=>{
  const game=make();game.start(0);game.advance(3000);const coin=[...game.coins.values()][0];assert.equal(game.collect(coin.id,3000),false);const landing=(3+coin.life)*1000;game.advance(landing-1);assert.equal(game.coins.has(coin.id),true);game.advance(landing);assert.equal(game.coins.has(coin.id),false);assert.equal(game.collect(coin.id,landing),false);assert.equal(game.state.collected,0);assert.ok(game.state.missed>=1);
});
test('the rain lasts exactly 30 seconds after countdown and rejects all clicks at or after its deadline',()=>{
  const game=make();game.start(0);game.advance(32900);const coin=[...game.coins.values()].find(c=>c.y>.1&&c.y<.5);assert.ok(coin);assert.equal(game.collect(coin.id,32999),true);const other=[...game.coins.values()].find(c=>c.y>=0);assert.ok(other);assert.equal(game.collect(other.id,33000),false);assert.equal(game.state.phase,'finished');assert.equal(game.state.remaining,0);assert.equal(game.state.elapsed,30);assert.equal(game.coins.size,0);assert.equal(game.collect(other.id,34000),false);assert.equal(game.state.collected,1);
});
test('background time and a very late frame finish the round without extending it or granting unclicked coins',()=>{
  const game=make();game.start(1000);game.advance(1000000);assert.equal(game.state.phase,'finished');assert.equal(game.state.remaining,0);assert.equal(game.state.elapsed,30);assert.equal(game.state.collected,0);assert.equal(game.coins.size,0);assert.equal(game.state.spawned,game.state.missed);assert.ok(game.state.spawned>80&&game.state.spawned<140);
});
test('slow and smooth frame schedules produce the same falling coins and expiry state',()=>{
  const smooth=make(),slow=make();smooth.start(0);slow.start(0);for(let time=0;time<9000;time+=16)smooth.advance(time);smooth.advance(9000);slow.advance(9000);assert.deepEqual(smooth.state,slow.state);assert.deepEqual([...smooth.coins.values()],[...slow.coins.values()]);for(const coin of smooth.coins.values()){assert.ok(coin.x>0&&coin.x<1);assert.ok(coin.y<1);}
});
test('replaying resets the score and countdown, and an old round click cannot collect a new round coin',()=>{
  const game=make();game.start(0);game.advance(3500);const id=[...game.coins.values()][0].id;game.collect(id,3500);game.advance(33000);assert.equal(game.start(34000),true);assert.equal(game.state.collected,0);assert.equal(game.state.phase,'countdown');assert.equal(game.state.countdown,3);assert.equal(game.state.remaining,30);game.advance(37500);assert.equal(game.collect(id,37500),false);assert.ok([...game.coins.keys()].every(next=>next!==id));
});
test('invalid or backwards clocks never advance time or award an ingot',()=>{
  const game=make();assert.equal(game.start(NaN),false);game.start(0);game.advance(3500);const id=[...game.coins.keys()][0],before={...game.state};for(const time of [NaN,Infinity,-1,3499]){assert.equal(game.collect(id,time),false);game.advance(time);assert.deepEqual(game.state,before);}assert.equal(game.collect(id,3500),true);
});
test('two rain rounds save collected currency into the shared wallet and can pay for an actual skin',async()=>{
  const storage=memory(),wallet=createLavaWallet(storage);let run='rain-test-round-one';
  const game=make({onCollect:({collected})=>wallet.creditRun(run,collected)});let earned=0;
  for(let round=0;round<2;round++){
    run=round?'rain-test-round-two':run;const base=round*40000;game.start(base);
    for(let offset=3000;offset<33000;offset+=100){const now=base+offset;game.advance(now);for(const coin of [...game.coins.values()])if(coin.y>=0)game.collect(coin.id,now);}
    game.advance(base+33000);earned+=game.state.collected;wallet.creditRun(run,game.state.collected);assert.equal(wallet.balance(),earned);
  }
  assert.ok(earned>=120);const shop=createSkinShop(storage);assert.equal((await shop.buy('yellow-egg')).ok,true);assert.equal(shop.wallet.balance(),earned-120);assert.equal(shop.equip('yellow-egg').ok,true);assert.equal(createSkinShop(storage).equipped().id,'yellow-egg');
});
