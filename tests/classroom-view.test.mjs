import test from 'node:test';import assert from 'node:assert/strict';import {moveLook,drawerVisible,validDrop} from '../lib/classroom-view.mjs';
test('向下拖动显示桌斗、向上拖动抬头并收起，限制视角',()=>{let p=moveLook(0,0,0,120);assert.equal(drawerVisible(p.pitch),true);p=moveLook(p.yaw,p.pitch,0,-120);assert.equal(drawerVisible(p.pitch),false);assert.equal(moveLook(0,0,0,1000).pitch,-1.25);assert.equal(moveLook(0,0,0,-1000).pitch,.75)});

test('没有按下物品的释放、错误指针与短拖不能触发操作',()=>{assert.equal(validDrop(null,1,80,'mouth'),false);assert.equal(validDrop(1,2,80,'mouth'),false);assert.equal(validDrop(1,1,5,'mouth'),false);assert.equal(validDrop(1,1,80,'mouth'),true)});
