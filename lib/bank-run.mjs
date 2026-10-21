export const BANK_RUN = Object.freeze({laneWidth:3.2, carHeight:1.4, jumpSpeed:10.4, gravity:25, duckDuration:.95, maxHits:9, introDuration:12, segmentLength:108});
export const BANK_STORY = Object.freeze([
  {at:0, label:'戴上头套', text:'你和朋友来到岩浆银行，悄悄戴上头套。'},
  {at:3, label:'计划失败', text:'还没拿到任何东西，银行的警报就响了！'},
  {at:5.8, label:'警犬发现了你们', text:'警察牵着警犬赶来。汪！它发现你们了！'},
  {at:9, label:'传送到马路', text:'一道传送门打开——抓紧朋友，跑起来！'},
]);
export function bankStoryAt(time){return [...BANK_STORY].reverse().find(shot=>time>=shot.at)||BANK_STORY[0];}

// Each encounter leaves two lanes clear. Rows have a continuous, walkable roof;
// individual cars never provide a landing surface.
export function createBankSegment(index){
  if(!Number.isInteger(index)||index<0)throw new Error('Invalid road segment');
  const base=index*BANK_RUN.segmentLength, obstacles=[], coins=[];
  for(let n=0;n<3;n++){
    const kind=['row','single','duck'][n], lane=index===0?0:((index*7+n*2)%3)-1;
    const distance=base+28+n*36;
    const obstacle={id:`road-${index}-${n}`,kind,lane,distance,length:kind==='row'?17.6:kind==='single'?4:.9,height:BANK_RUN.carHeight};
    obstacles.push(obstacle);
    for(let j=0;j<4;j++)coins.push({id:`coin-${index}-${n}-${j}`,lane,distance:distance-15+j*3,height:.85});
    if(kind==='row')for(let j=0;j<4;j++)coins.push({id:`roof-${index}-${j}`,lane,distance:distance+3+j*3.5,height:BANK_RUN.carHeight+.85});
    else if(kind==='single')coins.push({id:`jump-${index}`,lane,distance:distance+2,height:2.6});
    // A second trail rewards changing lanes without forcing a collision.
    for(let j=0;j<3;j++)coins.push({id:`side-${index}-${n}-${j}`,lane:lane===1?-1:lane+1,distance:distance+5+j*3,height:.85});
  }
  return {obstacles,coins};
}

export function createBankRun({course=null,onCoin=()=>{},onHit=()=>{}}={}){
  const state={}, obstacles=[], coins=[], hitObjects=new Set();
  let nextSegment=0, pausedPhase='running';
  function ensureCourse(){
    if(course)return;
    while(nextSegment*BANK_RUN.segmentLength<state.distance+250){const part=createBankSegment(nextSegment++);obstacles.push(...part.obstacles);coins.push(...part.coins);}
    for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].distance+obstacles[i].length<state.distance-28){hitObjects.delete(obstacles[i].id);obstacles.splice(i,1);}
    for(let i=coins.length-1;i>=0;i--)if(coins[i].distance<state.distance-18)coins.splice(i,1);
  }
  function reset(){
    obstacles.length=0;coins.length=0;hitObjects.clear();nextSegment=0;
    Object.assign(state,{phase:'ready',introTime:0,distance:0,elapsed:0,x:0,lane:0,y:0,vy:0,grounded:true,onRoof:false,duckTime:0,hits:0,coins:0,speed:0,stumble:0,hitSerial:0,lastHit:null});
    if(course){obstacles.push(...course.obstacles.map(o=>({...o})));coins.push(...(course.coins||[]).map(c=>({...c,picked:false})));}
    else ensureCourse();
  }
  function start(){if(state.phase!=='ready')return false;state.phase='intro';return true;}
  function skipIntro(){if(state.phase!=='intro')return false;state.introTime=BANK_RUN.introDuration;state.phase='running';return true;}
  function lane(direction){if(state.phase!=='running'||!Number.isFinite(direction))return false;state.lane=Math.max(-1,Math.min(1,state.lane+Math.sign(direction)));return true;}
  function jump(){if(state.phase!=='running'||!state.grounded)return false;state.vy=BANK_RUN.jumpSpeed;state.grounded=false;state.duckTime=0;return true;}
  function duck(){if(state.phase!=='running'||!state.grounded)return false;state.duckTime=BANK_RUN.duckDuration;return true;}
  function pause(){if(!['running','intro'].includes(state.phase))return false;pausedPhase=state.phase;state.phase='paused';return true;}
  function resume(){if(state.phase!=='paused')return false;state.phase=pausedPhase;return true;}
  function hit(obstacle){
    if(hitObjects.has(obstacle.id))return;
    hitObjects.add(obstacle.id);state.hits++;state.hitSerial++;state.lastHit=obstacle.kind;state.stumble=.55;
    onHit({obstacle,hits:state.hits});
    if(state.hits===BANK_RUN.maxHits){state.phase='caught';state.speed=0;state.duckTime=0;}
  }
  function step(dt){
    if(!Number.isFinite(dt)||dt<=0||!['intro','running'].includes(state.phase))return;
    let remaining=Math.min(dt,.5);
    while(remaining>1e-8&&['intro','running'].includes(state.phase)){
      const h=Math.min(remaining,1/120);remaining-=h;
      if(state.phase==='intro'){state.introTime=Math.min(BANK_RUN.introDuration,state.introTime+h);if(state.introTime>=BANK_RUN.introDuration)state.phase='running';continue;}
      state.elapsed+=h;state.stumble=Math.max(0,state.stumble-h);state.duckTime=Math.max(0,state.duckTime-h);
      state.speed=(13+Math.min(7,state.distance/350))*(state.stumble>0?.62:1);
      state.x+=(state.lane*BANK_RUN.laneWidth-state.x)*(1-Math.exp(-15*h));
      const previousY=state.y;
      state.distance+=state.speed*h;ensureCourse();
      state.vy-=BANK_RUN.gravity*h;state.y=Math.max(0,state.y+state.vy*h);state.grounded=state.y===0;state.onRoof=false;
      if(state.grounded)state.vy=0;
      for(const obstacle of obstacles){
        if(hitObjects.has(obstacle.id)||Math.abs(state.x-obstacle.lane*BANK_RUN.laneWidth)>1.13||state.distance+.33<obstacle.distance||state.distance-.33>obstacle.distance+obstacle.length)continue;
        if(obstacle.kind==='row'){
          if(state.y>=obstacle.height-.075||previousY>=obstacle.height-.025){
            if(state.vy<=0&&state.y<=obstacle.height){state.y=obstacle.height;state.vy=0;state.grounded=true;state.onRoof=true;}
          }else hit(obstacle);
        }else if(obstacle.kind==='single'){
          if(state.y<obstacle.height+.08)hit(obstacle);
        }else if(obstacle.kind==='duck'){
          if(!(state.duckTime>0&&state.y<.12))hit(obstacle);
        }
        if(state.phase==='caught')break;
      }
      if(state.phase!=='running')break;
      for(const coin of coins){
        if(coin.picked||Math.abs(coin.distance-state.distance)>.7||Math.abs(state.x-coin.lane*BANK_RUN.laneWidth)>.8||Math.abs(state.y+(state.duckTime>0?.45:.85)-coin.height)>.8)continue;
        coin.picked=true;state.coins++;onCoin({coin,earned:state.coins});
      }
    }
  }
  reset();
  return {state,obstacles,coins,start,skipIntro,lane,jump,duck,pause,resume,step,reset,wasHit:id=>hitObjects.has(id),get policeGap(){return state.phase==='caught'?.8:Math.max(2,10-state.hits*1.03);}};
}
