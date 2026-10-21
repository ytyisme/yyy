import test from 'node:test';
import assert from 'node:assert/strict';
import {BANK_RUN,BANK_STORY,bankStoryAt,createBankRun,createBankSegment} from '../lib/bank-run.mjs';
import {createLavaWallet} from '../lib/lava-wallet.mjs';

const obstacle=(kind,distance=15,id='test-obstacle')=>({id,kind,distance,lane:0,length:kind==='row'?17.6:kind==='single'?4:.9,height:BANK_RUN.carHeight});
function runner(obstacles=[],coins=[],options={}){const game=createBankRun({course:{obstacles,coins},...options});game.start();game.skipIntro();return game;}
function advance(game,until,limit=10000){for(let n=0;!until()&&n<limit;n++){if(!['running','intro'].includes(game.state.phase))break;game.step(1/120);}assert(until(),JSON.stringify(game.state));}

test('the four-shot animation finishes on the road; pausing freezes both its story and the chase',()=>{
  const game=createBankRun();assert.equal(game.skipIntro(),false);assert(game.start());assert.equal(game.state.phase,'intro');
  for(const shot of BANK_STORY)assert.equal(bankStoryAt(shot.at+.01),shot);
  for(let n=0;n<20;n++)game.step(.1);assert.equal(game.state.distance,0);assert.equal(game.state.coins,0);
  game.pause();const frozen={...game.state};game.step(.5);assert.deepEqual(game.state,frozen);game.resume();
  advance(game,()=>game.state.phase==='running');assert.equal(game.state.introTime,12);assert.equal(game.skipIntro(),false);
  game.step(.1);assert(game.state.distance>0);game.pause();const distance=game.state.distance;game.step(.5);assert.equal(game.state.distance,distance);game.resume();game.step(.1);assert(game.state.distance>distance);
});
test('a real jump lands on a row of cars, keeps walking on the whole roof, and falls to the road at its end',()=>{
  const game=runner([obstacle('row')]);advance(game,()=>game.state.distance>=10);assert(game.jump());
  advance(game,()=>game.state.distance>=25);assert.equal(game.state.hits,0);assert(game.state.onRoof);assert.equal(game.state.y,BANK_RUN.carHeight);assert(game.state.grounded);
  advance(game,()=>game.state.distance>=42);assert.equal(game.state.hits,0);assert.equal(game.state.y,0);assert(!game.state.onRoof);
  const roofJump=runner([obstacle('row')]);advance(roofJump,()=>roofJump.state.distance>=10);roofJump.jump();advance(roofJump,()=>roofJump.state.onRoof);assert(roofJump.jump());roofJump.step(.1);assert(roofJump.state.y>BANK_RUN.carHeight);
});
test('an individual car must be cleared in one jump and never becomes a walkable roof',()=>{
  const good=runner([obstacle('single',10)]);advance(good,()=>good.state.distance>=6);good.jump();advance(good,()=>good.state.distance>=22);assert.equal(good.state.hits,0);assert.equal(good.state.y,0);
  const early=runner([obstacle('single',10)]);advance(early,()=>early.state.distance>=1);early.jump();advance(early,()=>early.state.distance>=20);assert.equal(early.state.hits,1);assert(!early.state.onRoof);
  const noJump=runner([obstacle('single',10)]);advance(noJump,()=>noJump.state.distance>=25);assert.equal(noJump.state.hits,1);assert.equal(noJump.state.hitSerial,1);
});
test('the high striped barricade requires crouching; running or jumping into it causes one hit',()=>{
  const sliding=runner([obstacle('duck',10)]);advance(sliding,()=>sliding.state.distance>=8);assert(sliding.duck());advance(sliding,()=>sliding.state.distance>=23);assert.equal(sliding.state.hits,0);assert.equal(sliding.state.duckTime,0);
  const jumping=runner([obstacle('duck',10)]);advance(jumping,()=>jumping.state.distance>=6);jumping.jump();advance(jumping,()=>jumping.state.distance>=20);assert.equal(jumping.state.hits,1);
  const standing=runner([obstacle('duck',10)]);advance(standing,()=>standing.state.distance>=20);assert.equal(standing.state.hits,1);
});
test('eight collisions remain playable and exactly the ninth captures both runners once',()=>{
  const events=[],game=runner(Array.from({length:11},(_,i)=>obstacle('single',10+i*25,'car-'+i)),[],{onHit:event=>events.push(event)});
  advance(game,()=>game.state.hits===8);assert.equal(game.state.phase,'running');advance(game,()=>game.state.phase==='caught');assert.equal(game.state.hits,9);assert.equal(events.length,9);
  const final={...game.state};game.step(100);game.lane(1);assert.equal(game.jump(),false);assert.equal(game.duck(),false);assert.deepEqual(game.state,final);assert.equal(game.policeGap,.8);
});
test('late frames cannot tunnel through an obstacle and invalid frame times cannot corrupt the run',()=>{
  const game=runner([obstacle('single',4)]);for(const value of [NaN,Infinity,-1,0])game.step(value);assert.equal(game.state.distance,0);game.step(100);assert.equal(game.state.hits,1);assert(game.state.distance<7);assert.equal(game.state.phase,'running');
});
test('collected red ingots credit the wallet once, survive capture and retry, and pause cannot award any',()=>{
  const values=new Map(),storage={get length(){return values.size;},key:i=>[...values.keys()][i],getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const wallet=createLavaWallet(storage);let run='bank-run-one';
  const game=runner([obstacle('single',12)],[{id:'first',lane:0,distance:2,height:.85},{id:'second',lane:0,distance:4,height:.85},{id:'other-lane',lane:1,distance:4,height:.85}],{onCoin:({earned})=>wallet.creditRun(run,earned)});
  game.pause();game.step(.5);assert.equal(wallet.balance(),0);game.resume();advance(game,()=>game.state.distance>=20);assert.equal(game.state.coins,2);assert.equal(wallet.balance(),2);game.step(.5);assert.equal(wallet.balance(),2);
  game.reset();run='bank-run-two';game.start();game.skipIntro();advance(game,()=>game.state.distance>=20);assert.equal(wallet.balance(),4);assert.equal(createLavaWallet(storage).balance(),4);
});
test('changing lanes avoids obstacles, and streamed road generation stays bounded during a long playable run',()=>{
  for(let i=0;i<40;i++){const section=createBankSegment(i);assert.equal(new Set(section.obstacles.map(o=>o.id)).size,3);assert(section.obstacles.every(o=>Math.abs(o.lane)<=1));assert(section.coins.some(c=>c.height>BANK_RUN.carHeight));}
  const game=createBankRun();game.start();game.skipIntro();let safety=0;
  while(game.state.distance<3500&&game.state.phase==='running'&&safety++<40000){
    const distance=game.state.distance;
    const clearance=lane=>{const list=game.obstacles.filter(o=>o.lane===lane&&o.distance+o.length>=distance-1);return list.length?Math.min(...list.map(o=>o.distance-distance)):Infinity;};
    if(clearance(game.state.lane)<30){const choices=[-1,0,1].filter(lane=>clearance(lane)>8).sort((a,b)=>clearance(b)-clearance(a));if(choices.length)game.lane(choices[0]-game.state.lane);}
    game.step(.025);
  }
  assert(game.state.distance>=3500,JSON.stringify(game.state));assert.equal(game.state.hits,0);assert(game.obstacles.length<14);assert(game.coins.length<160);
});
