import test from 'node:test';
import assert from 'node:assert/strict';
import {MOVES,createTraining,samplePose} from '../lib/flash-step.mjs';

test('a lesson requires both the demonstrated clip and the completed matching action',()=>{
  const game=createTraining();
  assert.equal(game.perform(MOVES[0].id),false);
  game.start();
  assert.equal(game.perform(MOVES[1].id),false);
  game.syncVideo(MOVES[0].end);
  assert.equal(game.advance(true),false);
  assert.equal(game.perform(MOVES[0].id),true);
  assert.equal(game.advance(false),false);
  assert.equal(game.advance(true),true);
  assert.equal(game.state.completed,1);
  assert.equal(game.state.index,1);
  assert.equal(game.state.reachedEnd,false);
  assert.equal(game.advance(true),false);
});
test('pausing cannot complete actions or advance lessons and resumes the same mode',()=>{
  const game=createTraining();game.start();game.pause();
  assert.equal(game.perform(MOVES[0].id),false);
  assert.equal(game.syncVideo(500),false);
  assert.equal(game.advance(true),false);
  game.resume();assert.equal(game.state.phase,'training');
  game.start(true);game.pause();game.resume();assert.equal(game.state.phase,'free');
  assert.equal(game.perform('invented'),false);
});
test('ten demonstrated and performed actions win exactly once, while free practice cannot win',()=>{
  const game=createTraining();game.start();
  for(const move of MOVES){assert.equal(game.perform(move.id),true);game.syncVideo(move.end);assert.equal(game.advance(true),true);}
  assert.equal(game.state.phase,'won');assert.equal(game.state.completed,10);assert.equal(game.advance(true),false);
  game.start(true);
  for(const move of MOVES){assert.equal(game.perform(move.id),true);game.syncVideo(move.end);assert.equal(game.advance(true),false);}
  assert.equal(game.state.completed,0);game.reset();assert.equal(game.state.phase,'ready');
});
test('all ten gestures have distinct visible motion, finite hand positions, and return to rest',()=>{
  const rest=samplePose('',0),signatures=new Set();
  for(const move of MOVES){
    assert.equal(JSON.stringify(samplePose(move.id,0)),JSON.stringify(rest));
    const pose=samplePose(move.id,.35);signatures.add(JSON.stringify(pose));
    assert.notDeepEqual(pose,rest);
    for(const value of Object.values(pose).flat())assert.ok(Number.isFinite(value));
    const end=samplePose(move.id,1);
    assert.ok(Math.abs(end.x)<1e-8&&Math.abs(end.duck)<1e-8);
    assert.ok(Math.abs(end.left[0]-rest.left[0])<1e-8);
  }
  assert.equal(signatures.size,10);
});
