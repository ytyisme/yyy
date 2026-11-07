import test from 'node:test';
import assert from 'node:assert/strict';
import {tracks, readMusicSettings, musicPlayerUrl, installThemeMusic} from '../lib/theme-music.mjs';

class Element {
  constructor(){this.children=[];this.attributes={};this.hidden=false;this.map={};}
  setAttribute(k,v){this.attributes[k]=v;}
  append(child){this.children.push(child);}
  replaceChildren(...children){this.children=children;}
  querySelector(selector){return this.map[selector] ||= new Element();}
}
function setup(saved){
  let value=saved;
  const storage={getItem:()=>value,setItem:(_key,v)=>{value=v;}};
  const head=new Element(),body=new Element(),events={};
  const doc={head,body,getElementById:()=>null,createElement:()=>new Element()};
  const win={addEventListener:(key,fn)=>{events[key]=fn;}};
  installThemeMusic(doc,storage,win);
  return {root:body.children[0],storage,events};
}
test('默认关闭并只允许两个指定的视频',()=>{
  assert.deepEqual(readMusicSettings({getItem:()=>null}),{enabled:false,track:tracks[0].id});
  assert.deepEqual(readMusicSettings({getItem:()=>'{bad'}),{enabled:false,track:tracks[0].id});
  assert.equal(readMusicSettings({getItem:()=>'{"enabled":true,"track":"unknown"}'}).track,tracks[0].id);
  assert.equal(new URL(musicPlayerUrl(tracks[1].id)).searchParams.get('bvid'),tracks[1].id);
});
test('开启、切换、关闭及跨页面保存',()=>{
  const {root,storage}=setup(null),power=root.querySelector('.theme-power'),select=root.querySelector('.theme-track'),video=root.querySelector('.theme-video');
  assert.equal(video.children.length,0);
  power.onclick();
  assert.equal(video.children.length,1);
  assert.equal(readMusicSettings(storage).enabled,true);
  select.value=tracks[1].id;select.onchange();
  assert.match(video.children[0].src,/BV1ExpA6aE3U/);
  assert.equal(readMusicSettings(storage).track,tracks[1].id);
  power.onclick();
  assert.equal(video.children.length,0);
  assert.equal(readMusicSettings(storage).enabled,false);
});
