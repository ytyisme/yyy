import test from 'node:test';
import assert from 'node:assert/strict';
import {SadMatchMusic} from '../lib/sad-match-music.mjs';

function setup() {
  const media = {paused:true, currentTime:12, plays:0, fail:false,
    addEventListener(){}, load(){}, pause(){this.paused=true;},
    async play(){if(this.fail)throw new Error('load failed');this.paused=false;this.plays++;},
  };
  return {media,music:new SadMatchMusic(media)};
}
test('首次操作才启动，循环播放，多次点击不会重开主题曲',async()=>{
  const {media,music}=setup();await music.play();assert.equal(media.plays,0);
  assert.equal(media.loop,true);assert.equal(media.volume,.3);
  music.unlock();await music.play();music.unlock();
  assert.equal(media.plays,1);assert.equal(media.currentTime,12);
});
test('隐藏页面暂停，回来续播；手动关闭后不被点击或切页重新开启',async()=>{
  const {media,music}=setup();music.unlock();music.setVisible(false);
  assert.equal(media.paused,true);music.setVisible(true);assert.equal(media.plays,2);
  music.toggle();assert.equal(media.paused,true);assert.equal(music.enabled,false);
  music.unlock();music.setVisible(false);music.setVisible(true);assert.equal(media.plays,2);
  music.toggle();assert.equal(media.plays,3);
});
test('播放失败可以重试，不影响棋盘',async()=>{
  const {media,music}=setup();media.fail=true;music.started=true;await music.play();
  assert.equal(music.failed,true);media.fail=false;music.toggle();await music.play();
  assert.equal(music.enabled,true);assert.equal(music.failed,false);assert.equal(media.paused,false);
});
