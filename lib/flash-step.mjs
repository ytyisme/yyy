// Video chapters and playable poses for the user's ten-move reference.
export const MOVES = Object.freeze([
  {id:'flash', name:'闪身步', key:'1', start:0, end:8.4, duration:1.55, hint:'侧身闪开，双手随身体交叉摆动。'},
  {id:'kick', name:'浪子踢球', key:'2', start:8.4, end:15.6, duration:1.8, hint:'单脚支撑，另一只脚向后摆，双臂展开保持平衡。'},
  {id:'bear', name:'狗熊哆嗦毛', key:'3', start:15.6, end:32.7, duration:2.0, hint:'左右晃肩，两只手向上画圈，再收回。'},
  {id:'sway', name:'摇头晃脑', key:'4', start:32.7, end:43.3, duration:2.0, hint:'打开步子，身体左右摆动，双手一伸一收。'},
  {id:'turn', name:'狮子回头', key:'5', start:43.3, end:45.4, duration:1.65, hint:'转腰回头，一手向侧面伸出，另一手收在身旁。'},
  {id:'water', name:'车水步', key:'6', start:45.4, end:49.1, duration:1.7, hint:'脚下交替换步，两手顺着转身划过。'},
  {id:'monkey', name:'猴子绕花线', key:'7', start:49.1, end:52.8, duration:1.8, hint:'身体前倾，单腿后摆，双手向前绕圈。'},
  {id:'wave', name:'招手式', key:'8', start:52.8, end:57.5, duration:1.8, hint:'一只手举过头顶招手，身体轻轻向侧面倾。'},
  {id:'cross', name:'交叉换步', key:'9', start:57.5, end:61.8, duration:1.8, hint:'两脚交叉换位，双手收在腰前，稳住重心。'},
  {id:'willow', name:'风摆柳碎步', key:'0', start:61.8, end:67.5, duration:2.15, hint:'快速交替小步，身体像柳枝一样左右摆动。'}
].map(move => Object.freeze(move)));

export function createTraining() {
  const state = {phase:'ready', index:0, completed:0, performed:false, reachedEnd:false};
  let previousPhase = 'training';
  return {
    state,
    get move() { return MOVES[state.index]; },
    start(free = false) {
      Object.assign(state, {phase:free?'free':'training', index:0, completed:0, performed:false, reachedEnd:false});
    },
    perform(id) {
      if (!['training','free'].includes(state.phase) || !MOVES.some(move => move.id === id)) return false;
      if (state.phase === 'free') return true;
      if (id !== MOVES[state.index].id) return false;
      state.performed = true;
      return true;
    },
    syncVideo(time) {
      if (state.phase !== 'training' || !Number.isFinite(time)) return false;
      if (time >= MOVES[state.index].end - .04) state.reachedEnd = true;
      return state.reachedEnd;
    },
    advance(animationFinished) {
      if (state.phase !== 'training' || !state.performed || !state.reachedEnd || !animationFinished) return false;
      state.completed++;
      if (state.completed === MOVES.length) state.phase = 'won';
      else {state.index++; state.performed=false; state.reachedEnd=false;}
      return true;
    },
    pause() {
      if (!['training','free'].includes(state.phase)) return false;
      previousPhase=state.phase; state.phase='paused'; return true;
    },
    resume() {
      if (state.phase !== 'paused') return false;
      state.phase=previousPhase; return true;
    },
    reset() { Object.assign(state, {phase:'ready', index:0, completed:0, performed:false, reachedEnd:false}); }
  };
}

export function samplePose(id, progress) {
  const t=Math.max(0,Math.min(1,Number(progress)||0)), envelope=Math.sin(Math.PI*t);
  const wave=Math.sin(t*Math.PI*2)*envelope;
  const pose={x:0,z:0,lean:0,turn:0,duck:0,left:[-.34,-.38,-.62],right:[.34,-.38,-.62],leftRoll:0,rightRoll:0,open:0,leftLeg:0,rightLeg:0,steps:0};
  if (id==='flash') {
    pose.x=wave*.6;pose.lean=-wave*.28;pose.steps=wave*.5;
    pose.left=[-.34+wave*.38,-.38+envelope*.16,-.62-envelope*.08];
    pose.right=[.34+wave*.38,-.38+envelope*.16,-.62-envelope*.08];
  } else if (id==='kick') {
    pose.lean=envelope*.2;pose.duck=envelope*.13;pose.rightLeg=-envelope*1.1;pose.turn=wave*.25;
    pose.left=[-.34-envelope*.28,-.38+envelope*.24,-.62];pose.right=[.34+envelope*.3,-.38+envelope*.25,-.62];pose.open=envelope;
  } else if (id==='bear') {
    pose.x=wave*.25;pose.lean=-wave*.2;pose.duck=envelope*.16;pose.steps=wave;
    pose.left=[-.34+envelope*.2+wave*.16,-.38+envelope*.8,-.62-envelope*.1];
    pose.right=[.34-envelope*.2+wave*.16,-.38+envelope*.8,-.62-envelope*.1];pose.open=envelope;
  } else if (id==='sway') {
    pose.x=wave*.35;pose.lean=-wave*.3;pose.turn=wave*.22;pose.steps=wave;
    pose.left=[-.34-wave*.35,-.38+Math.max(0,wave)*.45,-.62-Math.max(0,wave)*.2];
    pose.right=[.34-wave*.35,-.38+Math.max(0,-wave)*.45,-.62-Math.max(0,-wave)*.2];pose.open=envelope;
  } else if (id==='turn') {
    pose.turn=envelope*1.1;pose.x=-envelope*.25;pose.steps=envelope*.5;
    pose.left=[-.34-envelope*.3,-.38+envelope*.24,-.62-envelope*.28];
    pose.right=[.34-envelope*.2,-.38,-.62+envelope*.2];pose.open=envelope;
  } else if (id==='water') {
    pose.turn=wave*.65;pose.x=wave*.3;pose.steps=wave;pose.lean=-wave*.12;
    pose.left=[-.34+wave*.45,-.38+envelope*.22,-.62-wave*.2];
    pose.right=[.34+wave*.45,-.38+envelope*.22,-.62+wave*.2];pose.open=envelope;
  } else if (id==='monkey') {
    pose.duck=envelope*.38;pose.lean=wave*.18;pose.leftLeg=-envelope*.95;pose.turn=wave*.35;
    pose.left=[-.34+wave*.25,-.38+envelope*.2,-.62-envelope*.35];
    pose.right=[.34+wave*.25,-.38+envelope*.2,-.62-envelope*.35];pose.open=envelope;
  } else if (id==='wave') {
    pose.lean=-envelope*.22;pose.turn=wave*.12;
    pose.right=[.34+wave*.2,-.38+envelope*1.05,-.62];pose.rightRoll=wave*.6;pose.open=envelope;
  } else if (id==='cross') {
    pose.x=wave*.23;pose.turn=wave*.2;pose.steps=wave*1.2;pose.duck=envelope*.12;
    pose.left=[-.34+envelope*.2,-.38-envelope*.12,-.62];pose.right=[.34-envelope*.2,-.38-envelope*.12,-.62];
  } else if (id==='willow') {
    const sway=Math.sin(t*Math.PI*6)*envelope;
    pose.x=sway*.3;pose.lean=-sway*.25;pose.turn=sway*.25;pose.steps=sway;
    pose.left=[-.34+sway*.3,-.38+envelope*.16,-.62];pose.right=[.34+sway*.3,-.38+envelope*.16,-.62];pose.open=envelope;
  }
  pose.leftRoll+=pose.lean*.6;pose.rightRoll+=pose.lean*.6;
  return pose;
}
