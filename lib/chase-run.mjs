export const RUN_LENGTH = 3000;
export const PLAYER_SPEED = 22;
export const MONSTER_SPEED = 16;
export const LANE_WIDTH = 2.1;
export function createObstacles() {
  const rows = [];
  for (let i = 0, distance = 68; distance < RUN_LENGTH - 70; i++, distance += 42) {
    const open = (i * 7 + Math.floor(i / 3)) % 3 - 1;
    const lanes = i % 5 === 4 ? [-1, 0, 1].filter(lane => lane !== open) : [((i * 5 + 1) % 3) - 1];
    lanes.forEach((lane, n) => rows.push({id: `${i}-${n}`, distance, lane, x: lane * LANE_WIDTH, height: i % 3 === 0 ? .7 : 1.25, kind: i % 3 === 0 ? 'barrier' : 'bed'}));
  }
  return rows;
}
export function createChase() {
  const obstacles = createObstacles();
  const checked = new Set();
  const state = {};
  function reset() {
    checked.clear();
    Object.assign(state, {phase:'ready', distance:0, monsterDistance:-30, x:0, monsterX:0, lane:0, elapsed:0, jumpTime:0, jumpHeight:0, jumping:false, stumble:0, speed:0, hits:0, lastHit:null});
  }
  reset();
  function start() {if(state.phase !== 'ready') return false; state.phase='running'; return true;}
  function lane(direction) {if(state.phase!=='running') return; state.lane=Math.max(-1,Math.min(1,state.lane+Math.sign(direction)));}
  function jump() {if(state.phase!=='running'||state.jumping||state.stumble>0) return false; state.jumping=true;state.jumpTime=0;return true;}
  function pause() {if(state.phase==='running'){state.phase='paused';return true;}return false;}
  function resume() {if(state.phase==='paused'){state.phase='running';return true;}return false;}
  function step(dt) {
    if(state.phase!=='running'||!Number.isFinite(dt)||dt<=0)return;
    // Substeps retain collision accuracy after a delayed animation frame.
    let remaining=Math.min(dt, .5);
    while(remaining>1e-7&&state.phase==='running') {
      const h=Math.min(remaining,1/60);remaining-=h;
      const previous=state.distance;
      state.elapsed+=h;
      state.x+=(state.lane*LANE_WIDTH-state.x)*(1-Math.exp(-12*h));
      if(state.jumping){state.jumpTime+=h;state.jumpHeight=1.8*Math.sin(Math.PI*Math.min(1,state.jumpTime/.95));if(state.jumpTime>=.95){state.jumping=false;state.jumpHeight=0;}}
      state.speed=state.stumble>0?5:PLAYER_SPEED;
      state.stumble=Math.max(0,state.stumble-h);
      state.distance=Math.min(RUN_LENGTH,state.distance+state.speed*h);
      state.monsterDistance+=MONSTER_SPEED*h;
      state.monsterX+=(state.x-state.monsterX)*(1-Math.exp(-2*h));
      for(const obstacle of obstacles) {
        if(checked.has(obstacle.id)||obstacle.distance<previous-1||obstacle.distance>state.distance+1)continue;
        checked.add(obstacle.id);
        if(Math.abs(state.x-obstacle.x)<.95&&state.jumpHeight<obstacle.height+.15){state.stumble=1.9;state.hits++;state.lastHit=obstacle.id;}
      }
      if(state.monsterDistance>=state.distance-.8){state.phase='caught';state.speed=0;}
      else if(state.distance>=RUN_LENGTH){state.phase='won';state.speed=0;}
    }
  }
  return {state, obstacles, start, lane, jump, pause, resume, step, reset, get gap(){return Math.max(0,state.distance-state.monsterDistance);}};
}
