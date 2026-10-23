import test from 'node:test';
import assert from 'node:assert/strict';
import {MUSIC_MAZE_SONGS,MAZE,musicBeatMap,audibleClock,createMusicRoute,musicRouteAt,previewBeats,musicTime} from '../lib/music-maze.mjs';
import {MUSIC_BEAT_CHARTS} from '../lib/music-maze-beats.mjs';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('the three requested songs use existing recordings',()=>{
  assert.deepEqual(MUSIC_MAZE_SONGS.map(s=>s.title),['夜、萤火虫和你','稻香','Level!']);
  for(const song of MUSIC_MAZE_SONGS)assert.ok(existsSync(new URL('../'+song.file,import.meta.url)));
});
test('beat charts belong to these exact recordings and retain one collision per pulse',()=>{
  for(const song of MUSIC_MAZE_SONGS){
    const chart=MUSIC_BEAT_CHARTS[song.id],recording=readFileSync(new URL('../'+song.file,import.meta.url));
    assert.equal(createHash('sha256').update(recording).digest('hex'),chart.sha256,'recording changed without recalibration');
    assert.equal(song.bpm,chart.bpm);const period=60/chart.bpm;
    const {beats}=musicBeatMap(song.id,chart.duration);
    assert.ok(Math.abs(beats.length-chart.duration/period)<2);
    for(let i=0;i<beats.length;i++){assert.ok(beats[i]>0&&beats[i]<chart.duration);if(i){const gap=beats[i]-beats[i-1];assert.ok(Math.abs(gap-period)<.085,'extra volume peaks must not insert collisions');}}
  }
  assert.throws(()=>musicBeatMap('unknown',100));
  assert.throws(()=>musicBeatMap('rice',188));
});
test('every actual collision occurs at its calibrated beat, including after seeking',()=>{
  for(const song of MUSIC_MAZE_SONGS){const {duration,beats}=MUSIC_BEAT_CHARTS[song.id],route=createMusicRoute(beats,duration);
    for(let i=0;i<beats.length;i++){const time=beats[i];assert.equal(musicRouteAt(route,time-.001).index,i);const hit=musicRouteAt(route,time);assert.equal(hit.index,i+1);assert.equal(hit.flash,1);}
    assert.equal(musicRouteAt(route,duration).index,beats.length,'ending must not add an off-beat collision');
  }
});
test('visible time follows the audible output clock and rejects stale timestamps',()=>{
  assert.ok(Math.abs(audibleClock(10,.1,{contextTime:9.9,performanceTime:9950},10000)-9.95)<1e-10);
  assert.equal(audibleClock(20,.08,{contextTime:1,performanceTime:100},10000),19.92);
  assert.equal(audibleClock(20,.08),19.92);
  assert.equal(audibleClock(.01,.08),0);
});
test('hundreds of reflections stay inside the maze and out of obstacles',()=>{
  for(let seed=0;seed<3;seed++){
    const route=createMusicRoute(previewBeats(240,180),240,seed),{bounds:b,radius:r}=MAZE;
    for(let t=0;t<=240;t+=.031){const p=musicRouteAt(route,t);assert.ok(p.x>=b.x+r-.001&&p.x<=b.x+b.w-r+.001);assert.ok(p.y>=b.y+r-.001&&p.y<=b.y+b.h-r+.001);
      for(const wall of MAZE.obstacles)assert.ok(!(p.x>wall.x-r+.001&&p.x<wall.x+wall.w+r-.001&&p.y>wall.y-r+.001&&p.y<wall.y+wall.h+r-.001),`entered a wall at ${t}`);
    }
  }
});
test('seeking and dropped frames produce identical positions and collision counts',()=>{
  const route=createMusicRoute(previewBeats(50),50);
  const sample=musicRouteAt(route,17.35);for(let t=0;t<40;t+=.1)musicRouteAt(route,t);
  assert.deepEqual(musicRouteAt(route,17.35),sample);assert.equal(musicRouteAt(route,-3).index,0);
  assert.deepEqual(musicRouteAt(route,500),musicRouteAt(route,50));
  for(let i=1;i<route.points.length-1;i++){const point=route.points[i],frame=musicRouteAt(route,point.time);assert.equal(frame.index,i);assert.equal(frame.x,point.x);assert.equal(frame.y,point.y);assert.ok(point.nx||point.ny);}
});
test('audio clock labels use minutes and seconds',()=>{assert.equal(musicTime(64.9),'1:04');assert.equal(musicTime(-4),'0:00');assert.equal(musicTime(NaN),'0:00');});
