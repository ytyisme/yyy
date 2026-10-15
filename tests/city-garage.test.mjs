import test from 'node:test';
import assert from 'node:assert/strict';
import {createGarageAccess} from '../lib/city-garage.mjs';
import {createCitySound} from '../lib/city-sound.mjs';

const approach=(gate,overrides={})=>gate.update({position:{x:20,z:64},plate:'城A·10004',now:0,dt:.1,...overrides});
test('denied approach displays 请勿入内, speaks 请勿进入, and cannot cross at speed',()=>{
 const gate=createGarageAccess(null),status=approach(gate);
 assert.equal(status.event.text,'城A·10004请勿入内');assert.equal(status.event.speech,'城A·10004请勿进入');
 assert.equal(status.progress,0);assert(gate.blocks({x:20,z:60},{x:20,z:80},1.4,'城A·10004'));
 assert.equal(approach(gate).event,null);assert.equal(gate.blocks({x:20,z:68},{x:20,z:66},1.4,'城A·10004'),false);
 assert.equal(approach(gate,{position:{x:28.4,y:0,z:69}}).detected,false);
});
test('permission survives reload, rejects duplicate registration, and validates saved plates',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const gate=createGarageAccess(storage);assert(gate.register('城A·10004'));assert.equal(gate.register('城A·10004'),false);
 assert(createGarageAccess(storage).has('城A·10004'));assert.equal(gate.register(''),false);
 assert.equal(createGarageAccess({getItem:()=>'{bad json'}).has('城A·10004'),false);
 assert.equal(createGarageAccess({getItem:()=>JSON.stringify([null,{},'城A·10005'])}).has('城A·10004'),false);
});
test('authorized entry waits for the opening and exit uses the inside display once',()=>{
 const gate=createGarageAccess(null);gate.register('城A·10004');
 assert.equal(approach(gate).event.speech,'城A·10004欢迎光临');assert(gate.blocks({x:20,z:69},{x:20,z:71},1.4,'城A·10004'));
 approach(gate,{now:2,dt:2});assert.equal(gate.progress,1);assert.equal(gate.blocks({x:20,z:69},{x:20,z:71},1.4,'城A·10004'),false);
 assert.equal(approach(gate,{position:{x:20,z:74},now:3}).event,null);
 approach(gate,{position:{x:20,z:80},now:4});
 const exit=approach(gate,{position:{x:20,z:76},now:5});assert.equal(exit.event.speech,'城A·10004一路顺风');assert.equal(exit.event.side,'inside');
 assert.equal(approach(gate,{position:{x:20,z:75},now:6}).event,null);
});
test('an occupied doorway stays open, then closes after passage without admitting another plate',()=>{
 const gate=createGarageAccess(null);gate.register('城A·10004');approach(gate,{dt:2});
 approach(gate,{position:{x:20,z:80},now:5,dt:2,occupied:true});assert.equal(gate.progress,1);
 assert(gate.blocks({x:20,z:69},{x:20,z:71},1.4,'城A·10005'));
 approach(gate,{position:{x:20,z:85},now:7,dt:2});assert.equal(gate.progress,0);
});
test('turning back inside the detection zone announces the new direction',()=>{
 const gate=createGarageAccess(null);gate.register('城A·10004');approach(gate,{dt:2});
 assert.equal(approach(gate,{position:{x:20,z:75},now:2}).event,null);
 const exit=approach(gate,{position:{x:20,z:74.5},now:3});assert.equal(exit.event.speech,'城A·10004一路顺风');
 assert.equal(approach(gate,{position:{x:20,z:65},now:4}).event,null);
 assert.equal(approach(gate,{position:{x:20,z:65.5},now:5}).event.speech,'城A·10004欢迎光临');
});
test('gate speech uses Chinese synthesis, respects mute, and cancels when muted',()=>{
 const spoken=[],host={SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{getVoices:()=>[{lang:'zh-CN',name:'Chinese'}],cancel(){spoken.push('cancel')},speak:u=>spoken.push(u)}};
 const sound=createCitySound(host);assert(sound.speak('城A·10004欢迎光临'));assert.equal(spoken[1].text,'城A·10004欢迎光临');assert.equal(spoken[1].lang,'zh-CN');
 assert.equal(sound.toggle(),false);const count=spoken.length;assert.equal(sound.speak('城A·10004一路顺风'),false);assert.equal(spoken.length,count);
 assert.equal(createCitySound({}).speak('测试'),false);
});
