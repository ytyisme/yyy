import test from 'node:test';
import assert from 'node:assert/strict';
import {SadMatchAudio} from '../lib/sad-match-audio.mjs';

function setup(fetchAudio = async name => name) {
  const started = [], stopped = [];
  const context = {
    state: 'suspended', destination: {},
    async resume() { this.state = 'running'; },
    async decodeAudioData(data) { return data; },
    createGain() { return {gain:{value:0}, connect(){}, disconnect(){}}; },
    createBufferSource() {
      return {connect(){}, disconnect(){}, start(){started.push(this.buffer);}, stop(){stopped.push(this.buffer);this.onended?.();}};
    },
  };
  return {sound:new SadMatchAudio({contextFactory:()=>context,fetchAudio}),started,stopped};
}
test('消除使用独立短音效，结束后按连消档位播放原视频评价',async()=>{
  const {sound,started,stopped}=setup();
  sound.play(1); assert.equal(started.length,0);
  await sound.unlock();
  sound.play(1);sound.praise(1);sound.play(2);
  assert.deepEqual(stopped,['clear']); // New effects do not interrupt Good.
  sound.praise(2);sound.praise(3);sound.praise(10);
  assert.deepEqual(started,['clear','good','clear','great','excellent','excellent']);
  assert.deepEqual(stopped,['clear','good','great','excellent']);
});
test('静音立即停止，重开音效后可以再次播放',async()=>{
  const {sound,started,stopped}=setup();await sound.unlock();sound.play(1);
  sound.toggle();assert.equal(sound.enabled,false);sound.play(2);
  assert.deepEqual(started,['clear']);assert.deepEqual(stopped,['clear']);
  sound.toggle();await sound.unlock();sound.play(2);
  assert.deepEqual(started,['clear','clear']);
});
test('关闭音效同时停止消除声和评价，静音时不播评价',async()=>{
  const {sound,started,stopped}=setup();await sound.unlock();
  sound.play(1);sound.praise(2);sound.toggle();sound.praise(3);
  assert.deepEqual(started,['clear','great']);
  assert.deepEqual(stopped,['clear','great']);
});
test('加载失败可重试，不抛出异常或播放过时声音',async()=>{
  let fail=true;
  const {sound,started}=setup(async name=>{if(fail)throw new Error('offline');return name;});
  await sound.unlock();assert.equal(sound.failed,true);sound.play(1);assert.equal(started.length,0);
  fail=false;await sound.unlock();assert.equal(sound.failed,false);assert.equal(started.length,0);
  sound.play(1);assert.deepEqual(started,['clear']);
});
