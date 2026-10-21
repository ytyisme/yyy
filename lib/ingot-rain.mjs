export const INGOT_RAIN=Object.freeze({countdown:3,duration:30,minGap:.23,maxGap:.34,minLife:2.7,maxLife:4.1});

// Absolute timestamps keep a slow frame or a background tab from extending
// the round. Rendering and clicking advance the very same clock.
export function createIngotRain({random=Math.random,onCollect=()=>{}}={}){
  const state={phase:'ready',countdown:3,elapsed:0,remaining:30,collected:0,missed:0,spawned:0};
  const coins=new Map();let began=0,lastNow=-Infinity,nextBirth=0,serial=0,round=0;
  const sample=()=>{const n=random();return Number.isFinite(n)?Math.max(0,Math.min(1,n)):.5;};
  function start(now){
    if(!Number.isFinite(now)||['countdown','running'].includes(state.phase))return false;
    coins.clear();began=now;lastNow=now;nextBirth=0;serial=0;round++;
    Object.assign(state,{phase:'countdown',countdown:3,elapsed:0,remaining:30,collected:0,missed:0,spawned:0});return true;
  }
  function advance(now){
    if(!Number.isFinite(now)||now<lastNow||!['countdown','running'].includes(state.phase))return state;
    lastNow=now;const sinceStart=(now-began)/1000;
    if(sinceStart<INGOT_RAIN.countdown){state.countdown=Math.ceil(INGOT_RAIN.countdown-sinceStart);return state;}
    state.phase='running';state.countdown=0;state.elapsed=Math.min(INGOT_RAIN.duration,sinceStart-INGOT_RAIN.countdown);state.remaining=Math.max(0,INGOT_RAIN.duration-state.elapsed);
    while(nextBirth<=state.elapsed&&nextBirth<INGOT_RAIN.duration){
      const coin={id:'round-'+round+'-drop-'+(++serial),birth:nextBirth,life:INGOT_RAIN.minLife+sample()*(INGOT_RAIN.maxLife-INGOT_RAIN.minLife),baseX:.07+sample()*.86,phase:sample()*Math.PI*2,x:0,y:0,angle:0};
      coins.set(coin.id,coin);state.spawned++;nextBirth+=INGOT_RAIN.minGap+sample()*(INGOT_RAIN.maxGap-INGOT_RAIN.minGap);
    }
    for(const [id,coin]of coins){
      const age=state.elapsed-coin.birth,progress=age/coin.life;
      if(progress>=1){coins.delete(id);state.missed++;continue;}
      coin.x=coin.baseX+Math.sin(age*2+coin.phase)*.022;coin.y=-.08+1.08*progress;coin.angle=Math.sin(age*2.3+coin.phase)*14;
    }
    if(state.remaining===0){state.missed+=coins.size;coins.clear();state.phase='finished';}
    return state;
  }
  function collect(id,now){
    if(!Number.isFinite(now)||now<lastNow)return false;
    advance(now);if(state.phase!=='running')return false;
    const coin=coins.get(id);if(!coin||coin.y<0||coin.y>=1)return false;
    coins.delete(id);state.collected++;onCollect({coin,collected:state.collected});return true;
  }
  return {state,coins,start,advance,collect};
}
