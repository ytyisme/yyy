export const SIZE = 7;
export const TARGET = 2400;
export const MOVES = 50;
export const POINTS_PER_TILE = 30;
export function matchRating(chain) {
  if (chain >= 3) return {id: 'excellent', label: 'Excellent!', tier: 3};
  if (chain === 2) return {id: 'great', label: 'Great!', tier: 2};
  return {id: 'good', label: 'Good!', tier: 1};
}
export const CHARACTERS = [
  {id: 'chick', name: '哭哭小黄鸡'},
  {id: 'fox', name: '哭哭小狐狸'},
  {id: 'bear', name: '哭哭小熊'},
  {id: 'owl', name: '哭哭猫头鹰'},
  {id: 'hippo', name: '哭哭小河马'},
  {id: 'frog', name: '哭哭小青蛙'},
];
const TYPES = CHARACTERS.map((_, index) => index);
export function adjacent(a, b) {
  return Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs(a % SIZE - b % SIZE) === 1;
}
export function matches(board) {
  const found = new Set();
  for (let axis = 0; axis < 2; axis++) {
    for (let line = 0; line < SIZE; line++) {
      const at = pos => axis ? pos * SIZE + line : line * SIZE + pos;
      for (let start = 0; start < SIZE;) {
        let end = start + 1;
        while (end < SIZE && board[at(start)] !== null && board[at(end)] === board[at(start)]) end++;
        if (end - start >= 3) for (let i = start; i < end; i++) found.add(at(i));
        start = end;
      }
    }
  }
  return [...found];
}
export function swapped(board, a, b) {
  const next = [...board];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
export function hint(board) {
  for (let a = 0; a < board.length; a++) {
    for (const b of [a + 1, a + SIZE]) {
      if (b < board.length && adjacent(a, b) && board[a] !== board[b] && matches(swapped(board, a, b)).length) return [a, b];
    }
  }
  return null;
}
export function freshBoard(random = Math.random) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const board = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      const options = TYPES.filter(type => !(i % SIZE > 1 && board[i-1] === type && board[i-2] === type) && !(i >= SIZE*2 && board[i-SIZE] === type && board[i-SIZE*2] === type));
      if (!options.length) break;
      board.push(options[Math.floor(random() * options.length)]);
    }
    if (board.length === SIZE * SIZE && hint(board)) return board;
  }
  throw new Error('无法生成棋盘，请重试');
}
export function collapse(board, removed, random = Math.random) {
  const next = [...board], drops = [];
  for (const i of removed) next[i] = null;
  for (let col = 0; col < SIZE; col++) {
    let dest = SIZE - 1;
    for (let row = SIZE - 1; row >= 0; row--) {
      const from = row * SIZE + col;
      if (next[from] === null) continue;
      const to = dest-- * SIZE + col;
      next[to] = next[from];
      if (to !== from) { next[from] = null; drops.push({to, distance: (to - from) / SIZE}); }
    }
    for (let row = dest; row >= 0; row--) {
      const to = row * SIZE + col;
      // Six character types allow natural refill matches and cascades.
      next[to] = TYPES[Math.floor(random() * TYPES.length)];
      drops.push({to, distance: dest + 1});
    }
  }
  return {board: next, drops};
}
