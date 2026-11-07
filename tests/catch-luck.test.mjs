import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GOOD,BAD,catchItem,result} from '../lib/catch-luck.mjs';
test('好运计分、烦恼扣血并在目标或三次烦恼结束',()=>{let s={good:0,bad:0};s=catchItem(s,true);assert.deepEqual(s,{good:1,bad:0});s=catchItem(s,false);assert.equal(result(s),null);assert.equal(result({good:20,bad:2}),'won');assert.equal(result({good:19,bad:3}),'lost');assert.equal(GOOD.length,3);assert.equal(BAD.length,3)});
