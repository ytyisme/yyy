import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {answerQuestion} from '../lib/xiaoyan.mjs';
import {createLavaWallet,LAVA_WALLET_PREFIX,formatLavaCount} from '../lib/lava-wallet.mjs';
import {COLORS,NORMAL_PER_COLOR,DIAMOND_COUNT,DIAMOND_CHANCE,DIAMOND_REWARD,TRAY_LIMIT,spawnDiamonds,census,createDuckMatch,allIds,previewFromSearch} from '../lib/duck-tank.mjs';
import {createBodies,tossBodies,stepBodies,rayPick,contained} from '../lib/duck-tank-physics.mjs';
import {createDuckQuack} from '../lib/duck-quack.mjs';

const knowledge=JSON.parse(fs.readFileSync(new URL('../lib/xiaoyan-knowledge.json',import.meta.url)));
function store(){const data=new Map();return {data,get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};}
function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

test('reward is the exact 49-digit integer and is not a float',()=>{
  assert.equal(DIAMOND_REWARD,'3'+'0'.repeat(48));
  assert.equal(DIAMOND_REWARD.length,49);
  assert.notEqual(Number(DIAMOND_REWARD).toString(),DIAMOND_REWARD);
  assert.equal(formatLavaCount(DIAMOND_REWARD).replace(/,/g,''),DIAMOND_REWARD);
  for(const n of [0,7,880,1234567])assert.equal(formatLavaCount(n),n.toLocaleString('zh-CN'));
});

test('each normal color has 30 ducks and the rare roll adds one whole set of 3',()=>{
  let calls=0;
  const plain=createDuckMatch(()=>{calls++;return 0.2;});
  assert.equal(calls,1);
  assert.equal(plain.diamonds,false);
  assert.equal(plain.tank.length,COLORS.length*NORMAL_PER_COLOR);
  for(const color of COLORS)assert.equal(census(plain.tank)[color],NORMAL_PER_COLOR);
  assert.equal(census(plain.tank).diamond,0);
  const rare=createDuckMatch(()=>0);
  assert.equal(rare.diamonds,true);
  assert.equal(rare.tank.length,150+DIAMOND_COUNT);
  assert.equal(census(rare.tank).diamond,DIAMOND_COUNT);
  for(const color of COLORS)assert.equal(census(rare.tank)[color],NORMAL_PER_COLOR);
  const forced=createDuckMatch({diamonds:true,preview:true,random(){throw new Error('preview must not roll');}});
  assert.equal(forced.preview,true);
  assert.equal(census(forced.tank).diamond,3);
});

test('0.5% boundary is a single strict less-than, not a per-duck roll',()=>{
  assert.equal(DIAMOND_CHANCE,0.005);
  assert.equal(spawnDiamonds(0),true);
  assert.equal(spawnDiamonds(0.004999999999),true);
  assert.equal(spawnDiamonds(0.005),false);
  assert.equal(spawnDiamonds(0.0050000001),false);
  assert.equal(spawnDiamonds(1),false);
  assert.equal(previewFromSearch('?preview=diamonds'),'diamonds');
  assert.equal(previewFromSearch('preview=plain'),'plain');
  assert.equal(previewFromSearch('?preview=farm'),null);
});

test('three of a color clear once, other colors stay, and the seventh slot loses',()=>{
  const match=createDuckMatch(()=>1);
  const yellow=match.tank.filter(duck=>duck.color==='yellow');
  assert.equal(match.pick(yellow[0].id).sounds,0);
  assert.equal(match.pick(yellow[1].id).matched,null);
  const third=match.pick(yellow[2].id);
  assert.equal(third.sounds,1);
  assert.equal(third.matched.ducks.length,3);
  assert.equal(third.matched.reward,null);
  assert.equal(match.tray.length,0);
  assert.equal(match.eliminated.length,3);
  assert.equal(match.pick(yellow[3].id).sounds,0);
  const green=match.tank.find(duck=>duck.color==='green');
  assert.equal(match.pick(green.id).matched,null);
  assert.equal(match.tray.length,2);
  const fillers=['blue','red','purple','yellow','green'];
  for(const color of fillers){
    const duck=match.tank.find(item=>item.color===color);
    match.pick(duck.id);
  }
  assert.equal(match.status,'lost');
  assert.equal(match.tray.length,TRAY_LIMIT);
  const blocked=match.pick(match.tank[0].id);
  assert.equal(blocked.ok,false);
  assert.equal(match.eliminated.length,3);
});

test('shuffle keeps the same ducks, selection, eliminations and does not reroll or revive',()=>{
  const match=createDuckMatch(()=>1);
  const yellow=match.tank.filter(duck=>duck.color==='yellow');
  match.pick(yellow[0].id);
  match.pick(yellow[1].id);
  const green=match.tank.filter(duck=>duck.color==='green').slice(0,3);
  for(const duck of green)match.pick(duck.id);
  const before={ids:allIds(match),tank:census(match.tank),tray:match.tray.map(duck=>duck.id),eliminated:match.eliminated.map(duck=>duck.id),diamonds:match.diamonds,reward:match.rewardAmount};
  let samples=0;
  const shuffled=match.shuffle(()=>{samples++;return 0;});
  assert.equal(shuffled.ok,true);
  assert.ok(samples>0);
  assert.deepEqual(allIds(match),before.ids);
  assert.deepEqual(census(match.tank),before.tank);
  assert.deepEqual(match.tray.map(duck=>duck.id),before.tray);
  assert.deepEqual(match.eliminated.map(duck=>duck.id),before.eliminated);
  assert.equal(match.diamonds,false);
  assert.equal(census(match.tank).diamond,0);
  assert.equal(match.rewardAmount,before.reward);
  match.setBusy(true);
  assert.equal(match.shuffle().reason,'busy');
  assert.equal(match.pick(match.tank[0].id).reason,'busy');
  assert.deepEqual(allIds(match),before.ids);
  match.setBusy(false);
});

test('clearing the diamond set reports the exact reward once and shuffle cannot grant it again',()=>{
  const match=createDuckMatch(()=>0);
  const diamonds=match.tank.filter(duck=>duck.color==='diamond');
  assert.equal(diamonds.length,3);
  assert.equal(match.pick(diamonds[0].id).matched,null);
  assert.equal(match.pick(diamonds[1].id).matched,null);
  const clear=match.pick(diamonds[2].id);
  assert.equal(clear.sounds,1);
  assert.equal(clear.matched.reward,DIAMOND_REWARD);
  assert.equal(match.rewardGranted,true);
  assert.equal(match.rewardAmount,DIAMOND_REWARD);
  assert.equal(census(match.tank).diamond,0);
  assert.equal(census(match.eliminated).diamond,3);
  match.shuffle(()=>0);
  assert.equal(match.rewardGranted,true);
  assert.equal(match.rewardAmount,DIAMOND_REWARD);
  assert.equal(census(match.eliminated).diamond,3);
  assert.equal(match.tank.some(duck=>duck.color==='diamond'),false);
});

test('the exact reward persists once, survives reload, and keeps older small saves',async()=>{
  const storage=store();
  storage.setItem(LAVA_WALLET_PREFIX+'run-old-1234','15');
  const wallet=createLavaWallet(storage);
  assert.equal(wallet.balance(),15);
  const first=wallet.creditExact('duck29-session-one',DIAMOND_REWARD);
  assert.equal(first.addedExact,DIAMOND_REWARD);
  assert.equal(first.persisted,true);
  assert.equal(first.balanceExact, (15n+BigInt(DIAMOND_REWARD)).toString());
  assert.equal(wallet.balanceExact(),first.balanceExact);
  assert.equal(wallet.balance(),Number.MAX_SAFE_INTEGER);
  const again=wallet.creditExact('duck29-session-one',DIAMOND_REWARD);
  assert.equal(again.addedExact,'0');
  assert.equal(again.balanceExact,first.balanceExact);
  assert.equal(storage.getItem(LAVA_WALLET_PREFIX+'duck29-session-one'),DIAMOND_REWARD);
  wallet.creditRun('duck29-session-one',9);
  assert.equal(storage.getItem(LAVA_WALLET_PREFIX+'duck29-session-one'),DIAMOND_REWARD);
  wallet.creditRun('run-legacy-01',4);
  const expected=15n+BigInt(DIAMOND_REWARD)+4n;
  assert.equal(createLavaWallet(storage).balanceExact(),expected.toString());
  assert.equal(storage.getItem(LAVA_WALLET_PREFIX+'run-old-1234'),'15');
  const bought=await wallet.purchase('skin-yellow-egg',120);
  assert.equal(bought.ok,true);
  assert.equal(wallet.balanceExact(),(expected-120n).toString());
  assert.notEqual(wallet.balanceExact(),String(Number(wallet.balanceExact())));
});

test('poured and tossed ducks keep their identities and stay inside the tank',()=>{
  const match=createDuckMatch(()=>0);
  const random=mulberry32(29);
  const bodies=createBodies(match.tank,random);
  const ids=bodies.map(body=>body.id).join(',');
  assert.equal(bodies.length,153);
  for(let i=0;i<220;i++)stepBodies(bodies,1/30);
  assert.equal(bodies.map(body=>body.id).join(','),ids);
  assert.equal(contained(bodies),true);
  const tossed=bodies.map(body=>body.id).join(',');
  tossBodies(bodies,mulberry32(7));
  assert.equal(bodies.map(body=>body.id).join(','),tossed);
  assert.equal(bodies.length,153);
  for(let i=0;i<180;i++)stepBodies(bodies,1/30);
  assert.equal(bodies.map(body=>body.id).join(','),tossed);
  assert.equal(contained(bodies),true);
  const front=rayPick(bodies,{x:0,y:1,z:8},{x:0,y:0,z:-1});
  const back=bodies.reduce((far,body)=>body.z<far.z?body:far,bodies[0]);
  assert.ok(front);
  assert.notEqual(front.id,back.id);
});

test('a quack is one gesture-gated sound and mute or a missing gesture stays silent',()=>{
  const events=[];
  function factory(){
    return {state:'suspended',destination:{},resume(){this.state='running';events.push('resume');return Promise.resolve();},
      createOscillator(){return {type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){events.push('start');},stop(){}};},
      createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},value:0},connect(){}};},
      createBiquadFilter(){return {type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},Q:{value:1},connect(){}};}
    };
  }
  const memory=store();
  const silent=createDuckQuack({contextFactory:factory,storage:memory});
  assert.equal(silent.quack(),false);
  assert.equal(events.includes('start'),false);
  silent.unlock();
  assert.equal(silent.quack(),true);
  assert.equal(events.filter(event=>event==='start').length,2);
  silent.toggle();
  assert.equal(silent.quack(),false);
  assert.equal(events.filter(event=>event==='start').length,2);
  assert.equal(memory.getItem('duck-tank-sound'),'off');
});

test('season 3 level 4 is wired into its selector and keeps season 2 numbering',()=>{
  const html=fs.readFileSync(new URL('../season3-lv4.html',import.meta.url),'utf8');
  const page=fs.readFileSync(new URL('../season3-lv4.js',import.meta.url),'utf8');
  const select=fs.readFileSync(new URL('../season3.html',import.meta.url),'utf8');
  const season2=fs.readFileSync(new URL('../season2.html',import.meta.url),'utf8');
  assert.ok(html.includes(`data-exact="${DIAMOND_REWARD}"`));
  assert.match(html,/第三季第4关/);
  assert.match(page,/creditExact/);
  assert.match(page,/result\.sounds\)audio\.quack/);
  assert.match(page,/match\.preview/);
  assert.match(select,/玻璃缸橡皮鸭/);
  assert.match(select,/season3-lv4\.html/);
  assert.doesNotMatch(season2,/玻璃缸橡皮鸭/);
  assert.match(season2,/1–28 关/);
  const answer=answerQuestion('第三季第4关怎么玩？',knowledge);
  assert.equal(answer.level,null);
  assert.ok(answer.text.includes(DIAMOND_REWARD));
  assert.ok(answer.text.includes('0.5%'));
  assert.equal(answerQuestion('第4关怎么玩？',knowledge).level,4);
  assert.match(answerQuestion('第35关怎么玩',knowledge).text,/还没有开放/);
  assert.match(answerQuestion('怎么获得岩浆币',knowledge).text,/第22关/);
  assert.match(answerQuestion('第三季第1关怎么玩',knowledge).text,/还没有开放/);
});
