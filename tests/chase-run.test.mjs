import test from 'node:test';import assert from 'node:assert/strict';
import {createChase,createObstacles,RUN_LENGTH,PLAYER_SPEED,MONSTER_SPEED} from '../lib/chase-run.mjs';
test('the full 3,000 metre course is escapable with a slower pursuer and an open lane at every obstacle',()=>{
  assert(PLAYER_SPEED>MONSTER_SPEED);const g=createChase();assert.equal(RUN_LENGTH,3000);g.start();
  const groups=Map.groupBy(createObstacles(),o=>o.distance);for(const rows of groups.values())assert(new Set(rows.map(r=>r.lane)).size<3);
  for(let t=0;t<20000&&g.state.phase==='running';t++){
    const next=g.obstacles.find(o=>o.distance>=g.state.distance-1&&o.distance-g.state.distance<25);
    if(next){const blocked=new Set(groups.get(next.distance).map(o=>o.lane));const open=[-1,0,1].find(l=>!blocked.has(l));g.lane(open-g.state.lane);}
    g.step(1/60);
  }
  assert.equal(g.state.phase,'won');assert.equal(g.state.distance,3000);assert.equal(g.state.hits,0);assert(g.gap>30);assert(Math.abs(g.state.elapsed-3000/PLAYER_SPEED)<.02);
});
test('pause freezes distance, chase gap, jump and elapsed time; reset clears a previous run',()=>{
  const g=createChase();g.start();g.jump();g.step(.2);g.pause();const before={...g.state};for(let i=0;i<200;i++)g.step(.1);assert.deepEqual(g.state,before);g.resume();g.step(.1);assert(g.state.distance>before.distance);g.reset();assert.equal(g.state.phase,'ready');assert.equal(g.state.distance,0);assert.equal(g.state.monsterDistance,-30);assert.equal(g.state.hits,0);assert.equal(g.state.jumpHeight,0);
});
test('jump clears a low barricade while repeated collisions let the monster catch the runner',()=>{
  const g=createChase();g.start();const low=g.obstacles[0];g.state.distance=low.distance-4;g.state.x=low.x;g.state.lane=low.lane;g.jump();for(let i=0;i<35;i++)g.step(1/60);assert.equal(g.state.hits,0);
  const bad=createChase();bad.start();bad.state.distance=low.distance-2;bad.state.monsterDistance=bad.state.distance-8;bad.state.x=low.x;bad.state.lane=low.lane;for(let i=0;i<200&&bad.state.phase==='running';i++)bad.step(1/60);assert.equal(bad.state.hits,1);assert.equal(bad.state.phase,'caught');bad.step(.5);assert.equal(bad.state.phase,'caught');
});
test('lane inputs are bounded and late frames cannot skip the blocking bed',()=>{const g=createChase();g.start();for(let i=0;i<10;i++)g.lane(1);assert.equal(g.state.lane,1);g.lane(-1);assert.equal(g.state.lane,0);const bed=g.obstacles.find(o=>o.kind==='bed');g.state.distance=bed.distance-4;g.state.x=bed.x;g.state.lane=bed.lane;g.step(.5);assert.equal(g.state.hits,1);assert(g.state.stumble>0);g.step(NaN);assert(Number.isFinite(g.state.distance));});
