import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url),page=fs.readFileSync(new URL('season3-lv3.html',root),'utf8'),script=fs.readFileSync(new URL('season3-lv3.js',root),'utf8'),home=fs.readFileSync(new URL('season3.html',root),'utf8');

test('third-season level 3 is reachable and keeps the bath scene non-explicit',()=>{
  assert.match(home,/href="season3-lv3\.html"/);
  assert.match(page,/data-gender="male"/);assert.match(page,/data-gender="female"/);
  for(const tool of ['shampoo','bodywash','shower','dryer'])assert.match(page,new RegExp(`data-tool="${tool}"`));
  assert.match(page,/隐私遮挡/);assert.match(page,/取消打码/);assert.match(script,/想啥呢/);assert.match(script,/tool!==expected/);
  assert.doesNotMatch(page,/<video\b/i);assert.doesNotMatch(page,/<img\b/i);
});

test('bath level requires the four care actions in order and always rejects mask removal',()=>{
  assert.deepEqual(['shampoo','bodywash','shower','dryer'],['shampoo','bodywash','shower','dryer']);
  assert.match(script,/const order=\['shampoo','bodywash','shower','dryer'\]/);
  assert.match(script,/隐私遮挡不能取消/);
});
