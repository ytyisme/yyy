import test from 'node:test';
import assert from 'node:assert/strict';
import {SIZE, CHARACTERS, matchRating, matches, adjacent, swapped, hint, freshBoard, collapse} from '../lib/sad-match.mjs';
let seed=28;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
test('一次消除Good，两连Great，三连以上Excellent',()=>{
  assert.equal(matchRating(1).label,'Good!');
  assert.equal(matchRating(2).label,'Great!');
  for(const chain of [3,4,15])assert.equal(matchRating(chain).label,'Excellent!');
});
test('匹配横纵相连，交叉只计算一次，空位不匹配',()=>{
  const b=Array(SIZE*SIZE).fill(null);
  [8,9,10,2,16].forEach(i=>b[i]=0);
  assert.deepEqual(new Set(matches(b)),new Set([8,9,10,2,16]));
  assert.deepEqual(matches(Array(49).fill(null)),[]);
  assert.equal(adjacent(6,7),false);assert.equal(adjacent(6,13),true);
});
test('新棋盘无自动消除，提示一定是有效交换',()=>{
  for(let n=0;n<100;n++){
    const b=freshBoard(random),[a,c]=hint(b);
    assert.equal(b.length,49);assert.deepEqual(matches(b),[]);
    assert.ok(adjacent(a,c));assert.ok(matches(swapped(b,a,c)).length>=3);
  }
});
test('消除后原有棋子保持纵向顺序并落底，空位补满',()=>{
  const b=Array.from({length:49},(_,i)=>i);
  const {board,drops}=collapse(b,[14,35],random);
  assert.deepEqual([board[14],board[21],board[28],board[35],board[42]],[0,7,21,28,42]);
  assert.equal(board.length,49);assert.ok(board.every(x=>x!==null));assert.ok(drops.length>0);
});
test('连续完整游戏能完成消除和补齐',()=>{
  for(let game=0;game<20;game++){
    let b=freshBoard(random);
    for(let turn=0;turn<20;turn++){
      const pair=hint(b);assert.ok(pair);
      b=swapped(b,...pair);let found=matches(b),chain=0;
      assert.ok(found.length);
      while(found.length && chain++<15){b=collapse(b,found,random).board;found=matches(b);}
      if(found.length||!hint(b))b=freshBoard(random);
      assert.deepEqual(matches(b),[]);assert.ok(b.every(x=>Number.isInteger(x)&&x>=0&&x<CHARACTERS.length));
    }
  }
});
test('六种人物均可出生和补齐，新人物只与同种人物匹配',()=>{
  assert.deepEqual(CHARACTERS.map(c=>c.id),['chick','fox','bear','owl','hippo','frog']);
  const spawned=new Set(),refilled=new Set();
  for(let n=0;n<20;n++){
    freshBoard(random).forEach(x=>spawned.add(x));
    collapse(Array(49).fill(0),Array.from({length:49},(_,i)=>i),random).board.forEach(x=>refilled.add(x));
  }
  assert.equal(spawned.size,6);assert.equal(refilled.size,6);
  for(let type=0;type<6;type++){
    const b=Array(49).fill(null);b[0]=b[1]=b[2]=type;
    assert.deepEqual(matches(b),[0,1,2]);
    b[1]=(type+1)%6;assert.deepEqual(matches(b),[]);
  }
});
