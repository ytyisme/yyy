// 第29关规则：玻璃缸橡皮鸭三消。
// 选取槽 7 格。点一只缸里的鸭子进入槽，同色靠在一起，满 3 只消除。
// 槽里满 7 只仍未消除则失败。缸和槽都空则普通通关，普通通关不发岩浆币。
// 每次开局只抽一次：小于 0.5% 才额外生成整组 3 只钻石鸭，否则一只都没有。
// 洗罐只打乱缸里剩下的鸭子，不重抽、不复活、不重复发奖。重开才是新的一局。

export const COLORS=['yellow','green','blue','red','purple'];
export const COLOR_LABEL={yellow:'黄色',green:'绿色',blue:'蓝色',red:'红色',purple:'紫色',diamond:'钻石'};
export const NORMAL_PER_COLOR=30;
export const DIAMOND_COUNT=3;
export const DIAMOND_CHANCE=0.005;
export const TRAY_LIMIT=7;
export const MATCH_SIZE=3;
// 精确整数，禁止改成数字字面量或科学计数法。
export const DIAMOND_REWARD='3000000000000000000000000000000000000000000000000';

export function spawnDiamonds(sample){
  const n=typeof sample==='function'?sample():sample;
  return n<DIAMOND_CHANCE;
}

function resolveOptions(options){
  if(typeof options==='function')return {random:options,diamonds:null,preview:false};
  const random=options?.random||Math.random;
  const preview=options?.preview===true;
  const diamonds=options?.diamonds===true?true:options?.diamonds===false?false:null;
  return {random,diamonds,preview};
}

export function createDeal(options=Math.random){
  const {random,diamonds:forced}=resolveOptions(options);
  const diamonds=forced==null?spawnDiamonds(random):forced;
  const ducks=[];
  let id=1;
  for(const color of COLORS){
    for(let i=0;i<NORMAL_PER_COLOR;i++)ducks.push({id:id++,color,kind:'normal'});
  }
  if(diamonds){
    for(let i=0;i<DIAMOND_COUNT;i++)ducks.push({id:id++,color:'diamond',kind:'diamond'});
  }
  return {ducks,diamonds};
}

export function census(ducks){
  const counts={yellow:0,green:0,blue:0,red:0,purple:0,diamond:0};
  for(const duck of ducks)counts[duck.color]+=1;
  return counts;
}

export function createDuckMatch(options=Math.random){
  const {random,diamonds,preview}=resolveOptions(options);
  const deal=createDeal({random,diamonds});
  const state={
    tank:deal.ducks,
    tray:[],
    eliminated:[],
    diamonds:deal.diamonds,
    rewardGranted:false,
    rewardAmount:'0',
    status:'playing',
    preview
  };
  let busy=false;
  function fail(reason){return {ok:false,reason,matched:null,duck:null};}
  function pick(id){
    if(busy)return fail('busy');
    if(state.status!=='playing')return fail('over');
    const index=state.tank.findIndex(duck=>duck.id===id);
    if(index<0)return fail('missing');
    if(state.tray.length>=TRAY_LIMIT)return fail('full');
    const [duck]=state.tank.splice(index,1);
    let insertAt=state.tray.length;
    for(let i=state.tray.length-1;i>=0;i--)if(state.tray[i].color===duck.color){insertAt=i+1;break;}
    state.tray.splice(insertAt,0,duck);
    const matched=resolve(state,duck.color);
    if(state.tank.length===0&&state.tray.length===0)state.status='won';
    else if(state.tray.length>=TRAY_LIMIT)state.status='lost';
    return {ok:true,reason:null,matched,duck,sounds:matched?1:0};
  }
  function shuffle(rng=Math.random){
    if(busy)return {ok:false,reason:'busy'};
    if(state.status!=='playing')return {ok:false,reason:'over'};
    const before=state.tank.map(duck=>duck.id);
    for(let i=state.tank.length-1;i>0;i--){
      const j=Math.floor(rng()*(i+1));
      const swap=state.tank[i];state.tank[i]=state.tank[j];state.tank[j]=swap;
    }
    return {ok:true,before,after:state.tank.map(duck=>duck.id)};
  }
  return {
    get tank(){return state.tank;},
    get tray(){return state.tray;},
    get eliminated(){return state.eliminated;},
    get diamonds(){return state.diamonds;},
    get rewardGranted(){return state.rewardGranted;},
    get rewardAmount(){return state.rewardAmount;},
    get status(){return state.status;},
    get busy(){return busy;},
    get preview(){return state.preview;},
    setBusy(value){busy=!!value;},
    pick,shuffle
  };
}

function resolve(state,color){
  const same=state.tray.filter(duck=>duck.color===color);
  if(same.length<MATCH_SIZE)return null;
  const removed=same.slice(0,MATCH_SIZE);
  const ids=new Set(removed.map(duck=>duck.id));
  state.tray=state.tray.filter(duck=>!ids.has(duck.id));
  state.eliminated.push(...removed);
  let reward=null;
  if(color==='diamond'&&!state.rewardGranted){
    state.rewardGranted=true;
    state.rewardAmount=DIAMOND_REWARD;
    reward=DIAMOND_REWARD;
  }
  return {color,ducks:removed,reward};
}

export function allIds(match){
  return [...match.tank,...match.tray,...match.eliminated].map(duck=>duck.id).sort((a,b)=>a-b);
}

export function previewFromSearch(search){
  const value=new URLSearchParams(search.startsWith('?')?search:'?'+search).get('preview');
  return value==='diamonds'||value==='plain'?value:null;
}
