// 一组三消只叫一声。静音不创建声音；没经过点击或触摸的 resume 也不播放。

const STORAGE_KEY='duck-tank-sound';

export function createDuckQuack({contextFactory,storage}={}){
  const store=storage===undefined?safeStore():storage;
  let enabled=true;
  try{enabled=store?.getItem(STORAGE_KEY)!=='off';}catch{}
  let context=null;
  let gestured=false;
  function unlock(){
    if(!enabled)return false;
    const Factory=contextFactory||globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Factory)return false;
    try{
      context||=new Factory();
      gestured=true;
      if(context.state!=='running')context.resume?.();
      return true;
    }catch{return false;}
  }
  function quack(){
    if(!enabled||!gestured||!context||context.state==='closed')return false;
    if(context.state!=='running'&&context.state!=='suspended')return false;
    try{play(context);return true;}catch{return false;}
  }
  function toggle(){
    enabled=!enabled;
    try{store?.setItem(STORAGE_KEY,enabled?'on':'off');}catch{}
    return enabled;
  }
  return {get enabled(){return enabled;},unlock,quack,toggle};
}

function play(context){
  const t=context.currentTime;
  const osc=context.createOscillator();
  const nasal=context.createOscillator();
  const filter=context.createBiquadFilter();
  const gain=context.createGain();
  osc.type='sawtooth';
  nasal.type='triangle';
  osc.frequency.setValueAtTime(820,t);
  osc.frequency.exponentialRampToValueAtTime(360,t+0.15);
  nasal.frequency.setValueAtTime(540,t);
  nasal.frequency.exponentialRampToValueAtTime(250,t+0.16);
  filter.type='bandpass';
  filter.frequency.setValueAtTime(1500,t);
  filter.frequency.exponentialRampToValueAtTime(680,t+0.16);
  filter.Q.value=5;
  gain.gain.setValueAtTime(0.0001,t);
  gain.gain.exponentialRampToValueAtTime(0.16,t+0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
  osc.connect(filter);nasal.connect(filter);filter.connect(gain);gain.connect(context.destination);
  osc.start(t);nasal.start(t);osc.stop(t+0.22);nasal.stop(t+0.22);
}

function safeStore(){try{return globalThis.localStorage||null;}catch{return null;}}
