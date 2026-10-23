import test from 'node:test';
import assert from 'node:assert/strict';
import {XiaoyanChat} from '../lib/xiaoyan-chat.mjs';
const reply=(data,ok=true)=>({ok,json:async()=>data});

test('default transport invokes browser fetch with the global receiver',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async function(){assert.equal(this,globalThis);return reply({configured:false});};
 try{assert.deepEqual(await new XiaoyanChat().status(),{configured:false});}finally{globalThis.fetch=original;}
});

test('follow-up includes successful conversation; context is bounded to five rounds',async()=>{
 const bodies=[];const chat=new XiaoyanChat(async(url,options)=>{bodies.push(JSON.parse(options.body));return reply({reply:'回复'});});
 await chat.ask('我叫豆豆');await chat.ask('我叫什么？');
 assert.deepEqual(bodies[1].messages,[{role:'user',content:'我叫豆豆'},{role:'assistant',content:'回复'},{role:'user',content:'我叫什么？'}]);
 for(let i=0;i<10;i++)await chat.ask('继续'+i);
 assert.equal(chat.history.length,10);assert.equal(bodies.at(-1).messages.length,11);
 chat.clear();await chat.ask('新话题');assert.equal(bodies.at(-1).messages.length,1);
});

test('missing key or provider failure never becomes a canned answer or pollutes history',async()=>{
 let calls=0;const bodies=[];
 const chat=new XiaoyanChat(async(url,options)=>{bodies.push(JSON.parse(options.body));return ++calls===1?reply({error:'ai_not_configured',message:'尚未接通'},false):reply({reply:'真实返回'});});
 await assert.rejects(chat.ask('你好'),error=>error.code==='ai_not_configured');
 assert.deepEqual(chat.history,[]);assert.equal(chat.busy,false);
 await chat.ask('你好');assert.equal(bodies[1].messages.length,1);assert.equal(chat.history[1].content,'真实返回');
});

test('double sends are blocked and oversized context drops complete pairs',async()=>{
 let resolve;const chat=new XiaoyanChat(()=>new Promise(done=>resolve=done));
 const pending=chat.ask('第一句');await assert.rejects(chat.ask('第二句'),/等小岩/);
 resolve(reply({reply:'收到'}));await pending;
 let sent;chat.fetcher=async(url,options)=>{sent=JSON.parse(options.body);return reply({reply:'继续'});};
 chat.history=Array.from({length:5},()=>[{role:'user',content:'a'.repeat(2000)},{role:'assistant',content:'b'.repeat(6000)}]).flat();
 await chat.ask('c'.repeat(2000));assert.ok(sent.messages.reduce((n,m)=>n+m.content.length,0)<=24000);assert.equal(sent.messages[0].role,'user');
});

test('HTML errors and offline failures are readable and leave no fake assistant turn',async()=>{
 const chat=new XiaoyanChat(async()=>({ok:false,json:async()=>{throw Error('HTML');}}));
 await assert.rejects(chat.ask('你好'),/服务器/);
 chat.fetcher=async()=>{throw new TypeError('Failed to fetch');};
 await assert.rejects(chat.ask('你好'),/网络/);assert.equal(chat.history.length,0);
});
