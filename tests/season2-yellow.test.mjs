import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {answerQuestion,tickleLines,safeLevelHref} from '../lib/xiaoyan.mjs';
import {yellowLevels} from '../lib/season2-yellow-levels.mjs';
const {isYellow,state}=createRequire(import.meta.url)('../lib/season2-clock.js');
const time=s=>Date.parse(s+'+08:00');
const knowledge=JSON.parse(fs.readFileSync(new URL('../lib/xiaoyan-knowledge.json',import.meta.url)));
test('Beijing opening follows all seven weekdays, exact 18:00 and midnight boundaries',()=>{
 for(const [day,active] of [[19,false],[20,false],[21,false],[22,false],[23,true],[24,true],[25,true]]){
  assert.equal(isYellow(time(`2026-10-${day}T17:59:59.999`)),false);
  assert.equal(isYellow(time(`2026-10-${day}T18:00:00`)),active);
  assert.equal(isYellow(time(`2026-10-${day}T23:59:59.999`)),active);
  assert.equal(isYellow(time(`2026-10-${day}T00:00:00`)),false);
 }
 assert.equal(isYellow(Date.parse('2026-10-23T10:00:00Z')),true);
 assert.equal(isYellow(Date.parse('2026-10-23T16:00:00Z')),false);
});
test('next switch skips closed days and includes month/year boundaries',()=>{
 assert.equal(state(time('2026-10-25T23:59:59')).next,time('2026-10-26T00:00:00'));
 assert.equal(state(time('2026-10-26T00:00:00')).next,time('2026-10-30T18:00:00'));
 assert.equal(isYellow(time('2026-10-26T21:00:00')),false);
 assert.equal(state(time('2026-10-19T23:59:59')).next,time('2026-10-23T18:00:00'));
 assert.equal(state(time('2026-10-20T00:00:00')).next,time('2026-10-23T18:00:00'));
 assert.equal(state(time('2026-10-24T00:00:00')).next,time('2026-10-24T18:00:00'));
 assert.equal(state(time('2026-12-31T23:00:00')).next,time('2027-01-01T18:00:00'));
});
test('Xiaoyan sleeps from Beijing 23:30 until midnight only on yellow evenings',()=>{
 for(const [day,open] of [[19,false],[20,false],[21,false],[22,false],[23,true],[24,true],[25,true]]){
  assert.equal(state(time(`2026-10-${day}T23:29:59.999`)).sleeping,false);
  assert.equal(state(time(`2026-10-${day}T23:30:00`)).sleeping,open);
  assert.equal(state(time(`2026-10-${day}T23:59:59.999`)).sleeping,open);
  assert.equal(state(time(`2026-10-${day}T00:00:00`)).sleeping,false);
 }
 assert.equal(state(Date.parse('2026-10-23T15:30:00Z')).sleeping,true);
 assert.equal(state(Date.parse('2026-10-23T16:00:00Z')).sleeping,false);
});
test('yellow first level is find Xiaoyan and unsafe navigation cannot be configured',()=>{
 assert.equal(yellowLevels.length,6);
 assert.equal(yellowLevels[0].title,'找小岩');
 assert.equal(safeLevelHref(yellowLevels[0].href),'season2-yellow-lv1.html');
 assert.equal(yellowLevels[1].title,'岩浆跑酷打卡点');
 assert.equal(safeLevelHref(yellowLevels[1].href),'season2-lv25.html');
 assert.equal(yellowLevels[2].title,'蓝红战场');
 assert.equal(safeLevelHref(yellowLevels[2].href),'season2-lv26.html');
 assert.equal(yellowLevels[3].title,'末日生存');
 assert.equal(safeLevelHref(yellowLevels[3].href),'season2-lv27.html');
 assert.equal(yellowLevels[4].title,'伤心消消乐');
 assert.equal(safeLevelHref(yellowLevels[4].href),'season2-lv28.html');
 const bookLevel=yellowLevels.find(level=>level.href==='season2-lv29.html');
 assert.ok(bookLevel,'book obstacle course must be reachable from yellow mode');
 assert.equal(safeLevelHref(bookLevel.href),bookLevel.href);
 assert.ok(fs.statSync(new URL('../'+bookLevel.href,import.meta.url)).isFile(),'configured new level has a real entry page');
 assert.equal(safeLevelHref('my-yellow-level.html'),'my-yellow-level.html');
 for(const url of ['javascript:alert(1)','https://elsewhere.com','../file.html','//x/x.html','<img>.html'])assert.equal(safeLevelHref(url),null);
});
test('Xiaoyan answers targeted and follow-up questions using existing game knowledge',()=>{
 const city=answerQuestion('第十五关怎么联机？',knowledge);assert(city.text.includes('8位'));assert.equal(city.level,15);
 assert(answerQuestion('那怎么买房？',knowledge,city.level).text.includes('物业大厅'));
 assert(answerQuestion('第22关怎么玩',knowledge).text.includes('30 秒'));
 assert(answerQuestion('皮肤为什么没有换？',knowledge).text.includes('127.0.0.1'));
 assert(answerQuestion('黄色主页怎么没有关卡？',knowledge).text.includes('自己制作'));
 assert(answerQuestion('怎么获得岩浆币',knowledge).text.includes('第22关'));
 assert(answerQuestion('第35关怎么玩',knowledge).text.includes('还没有开放'));
 assert(answerQuestion('宇宙的秘密是什么',knowledge).text.includes('还没有收录'));
 assert(answerQuestion('<img src=x onerror=alert(1)>',knowledge).text.includes('还没有收录'));
 for(let n=1;n<=24;n++)assert.equal(answerQuestion(`第${n}关怎么玩？`,knowledge).level,n);
});
test('tickling subtitles exactly match the requested silent reactions',()=>{
 assert.deepEqual(tickleLines,['嘻嘻 好痒！','哼！不跟你玩了！','哈哈哈哈，太痒了']);
});
