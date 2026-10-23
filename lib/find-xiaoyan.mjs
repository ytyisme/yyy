export const HIDE_MS=2200, SHUFFLE_MS=10000, SWAP_MS=2000, MOVE_MS=1600;
export const DIFFICULTIES=Object.freeze({
 easy:Object.freeze({label:'简单',seconds:'2',swapMs:2000,reward:20}),
 hard:Object.freeze({label:'困难',seconds:'1',swapMs:1000,reward:60}),
 master:Object.freeze({label:'大师',seconds:'0.3',swapMs:300,reward:200}),
 s:Object.freeze({label:'S级',seconds:'0.1',swapMs:100,reward:500})
});
const center=slot=>({x:slot%3,y:Math.floor(slot/3)});
// Each selected interval includes movement and a short rest. Finish all swaps before guessing.
export class FindXiaoyanRound {
 constructor(random=Math.random,difficulty='easy'){
  this.difficulty=Object.hasOwn(DIFFICULTIES,difficulty)?difficulty:'easy';
  this.swapMs=DIFFICULTIES[this.difficulty].swapMs;this.moveMs=this.swapMs*.8;
  this.hiddenId=Math.floor(random()*9);this.elapsed=0;this.phase='hide';this.selection=null;
  this.order=Array.from({length:9},(_,i)=>i);this.swaps=[];
  let hiddenSlot=this.hiddenId,previous=-1;
  for(let step=0;step<Math.floor(SHUFFLE_MS/this.swapMs);step++){
   const a=step%2===0?hiddenSlot:Math.floor(random()*9);
   const neighbors=Array.from({length:9},(_,i)=>i).filter(b=>Math.abs(b%3-a%3)+Math.abs(Math.floor(b/3)-Math.floor(a/3))===1);
   const choices=neighbors.filter(b=>b!==previous);const pool=choices.length?choices:neighbors;
   const b=pool[Math.floor(random()*pool.length)];this.swaps.push([a,b]);
   [this.order[a],this.order[b]]=[this.order[b],this.order[a]];
   hiddenSlot=this.order.indexOf(this.hiddenId);previous=a;
  }
 }
 advance(ms){
  if(this.phase==='guess'||this.phase==='result')return;
  this.elapsed=Math.min(HIDE_MS+SHUFFLE_MS,this.elapsed+Math.max(0,ms));
  this.phase=this.elapsed<HIDE_MS?'hide':this.elapsed<HIDE_MS+SHUFFLE_MS?'shuffle':'guess';
 }
 get remaining(){return Math.ceil((SHUFFLE_MS-Math.max(0,this.elapsed-HIDE_MS))/1000);}
 get winningSlot(){return this.order.indexOf(this.hiddenId);}
 get reward(){return this.phase==='result'&&this.selection===this.winningSlot?DIFFICULTIES[this.difficulty].reward:0;}
 guess(slot){
  if(this.phase!=='guess'||!Number.isInteger(slot)||slot<0||slot>8)return null;
  this.selection=slot;this.phase='result';return slot===this.winningSlot;
 }
 positions(){
  const order=Array.from({length:9},(_,i)=>i),elapsed=Math.max(0,this.elapsed-HIDE_MS);
  const completed=Math.min(this.swaps.length,Math.floor(elapsed/this.swapMs));
  for(let i=0;i<completed;i++){const [a,b]=this.swaps[i];[order[a],order[b]]=[order[b],order[a]];}
  const positions=Array(9);order.forEach((id,slot)=>{positions[id]={...center(slot),slot};});
  if(this.phase!=='hide'&&completed<this.swaps.length){
   const [a,b]=this.swaps[completed],p=Math.min(1,(elapsed%this.swapMs)/this.moveMs),t=p*p*(3-2*p);
   const from=center(a),to=center(b),dx=to.x-from.x,dy=to.y-from.y,arc=Math.sin(Math.PI*t)*.23;
   positions[order[a]]={x:from.x+dx*t-dy*arc,y:from.y+dy*t+dx*arc,slot:p===1?b:a};
   positions[order[b]]={x:to.x-dx*t+dy*arc,y:to.y-dy*t-dx*arc,slot:p===1?a:b};
  }
  return positions;
 }
}
