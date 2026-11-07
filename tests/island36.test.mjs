import test from 'node:test';
import assert from 'node:assert/strict';
import { initial, duration, collect, pickup, buy, resourceAt, clampIsland, validChat, screenToWorld, CAMERA_SCALE, ISLAND, islandResources } from '../lib/island36.mjs';
import { yellowLevels } from '../lib/season2-yellow-levels.mjs';

test('直接按住时只命中触碰到的可用树木或石块', () => {
  const tree = {x: 100, y: 100, type: 'tree'};
  const stone = {x: 180, y: 100, type: 'stone'};
  assert.equal(resourceAt([tree, stone], 100, 40, 1000), tree);
  assert.equal(resourceAt([tree, stone], 180, 100, 1000), stone);
  assert.equal(resourceAt([tree, stone], 145, 100, 1000), null);
  stone.until = 2000;
  assert.equal(resourceAt([tree, stone], 180, 100, 1000), null);
  assert.equal(resourceAt([tree, stone], 180, 100, 2000), stone);
});

test('采集产生掉落，靠近后只拾取一次，背包满后停止采集', () => {
  const s = initial(), player = {x: 10, y: 20};
  assert.equal(duration(s, 'tree'), 10);
  assert.equal(duration(s, 'stone'), 5);
  const tree = collect(s, 'tree', 10, 20, 1000);
  const stone = collect(s, 'stone', 100, 20, 1000);
  assert.equal(s.money, 0);
  assert.deepEqual([s.wood,s.stone,s.items], [1,1,2]);
  assert.equal(pickup(s,tree,player,1899), false);
  assert.equal(pickup(s,tree,player,1900), true);
  assert.equal(pickup(s,tree,player,1901), false);
  assert.equal(pickup(s,stone,player,1901), false);
  assert.equal(pickup(s,stone,{x:100,y:20},1901), true);
  assert.equal(s.money, 12);
  s.items = s.capacity;
  assert.equal(collect(s, 'stone', 0, 0, 2000), null);
  assert.equal(s.money, 12);
});

test('商店扣款、工具、升级与重复购买', () => {
  const s = initial();
  assert.equal(buy(s, 'axe'), false);
  s.money = 300;
  assert.equal(buy(s, 'axe'), true);
  assert.equal(duration(s, 'tree'), 3);
  assert.equal(buy(s, 'axe'), false);
  assert.equal(buy(s, 'pick'), true);
  assert.equal(duration(s, 'stone'), 5);
  assert.equal(buy(s, 'speed'), true);
  assert.ok(Math.abs(duration(s, 'tree') - 2.4) < 1e-9);
  assert.equal(buy(s, 'capacity'), true);
  assert.equal(s.capacity, 30);
  assert.equal(buy(s, 'mount'), true);
  assert.equal(s.mount, true);
});

test('黄色主页提供第35和36关入口', () => {
  for (const level of [35, 36]) assert.ok(yellowLevels.some(item => item.href === `season2-lv${level}.html`));
});

test('岛屿为 100×100 米，角色和联机位置不会进入海里', () => {
  assert.equal(ISLAND.size / 20,100);
  assert.deepEqual(clampIsland(-1000, -1000), {x: -540, y: -715});
  assert.deepEqual(clampIsland(2000, 2000), {x: 1440, y: 1235});
  assert.deepEqual(clampIsland(-200, 1100), {x: -200, y: 1100});
  assert.deepEqual(clampIsland(450, 260), {x: 450, y: 260});
});
test('扩展区域有稳定分布的树木和石块', () => {
  const resources=islandResources();
  for(const type of ['tree','stone']) {
    const found=resources.filter(o=>o.type===type);
    assert.ok(found.some(o=>o.x<0)&&found.some(o=>o.x>900));
    assert.ok(found.some(o=>o.y<0)&&found.some(o=>o.y>700));
  }
  assert.deepEqual(islandResources(),resources);
});
test('聊天拒绝空消息、超长消息和无效昵称', () => {
  assert.equal(validChat('小岩','你好'), true);
  assert.equal(validChat('小岩','  '), false);
  assert.equal(validChat('小岩','a'.repeat(121)), false);
  assert.equal(validChat('', '你好'), false);
});

test('出生视野位于岛内，接近海岸才显示边界，指针按相机还原坐标', () => {
  const spawn = {x:450,y:280};
  const topLeft = screenToWorld(0,0,spawn), bottomRight = screenToWorld(900,520,spawn);
  assert.ok(topLeft.x > ISLAND.left && topLeft.y > ISLAND.top && bottomRight.x < ISLAND.left+ISLAND.size && bottomRight.y < ISLAND.top+ISLAND.size);
  for (const [player,axis,coordinate] of [[{x:-540,y:280},'x',0],[{x:1440,y:280},'x',900],[{x:450,y:-715},'y',0],[{x:450,y:1235},'y',520]]) {
    const point = screenToWorld(axis === 'x' ? coordinate : 450, axis === 'y' ? coordinate : 260,player);
    assert.ok(axis === 'x' ? (coordinate===0 ? point.x<ISLAND.left : point.x>ISLAND.left+ISLAND.size) : (coordinate===0 ? point.y<ISLAND.top : point.y>ISLAND.top+ISLAND.size));
  }
  const tree = {x:540,y:360,type:'tree'};
  const screen = {x:450+(tree.x-spawn.x)*CAMERA_SCALE,y:260+(tree.y-spawn.y)*CAMERA_SCALE};
  const point = screenToWorld(screen.x,screen.y,spawn);
  assert.equal(resourceAt([tree],point.x,point.y),tree);
});
