export const initial=()=>({money:0,capacity:20,items:0,wood:0,stone:0,speed:0,axe:false,pick:false,mount:false});
export function resourceAt(objects,x,y,now=Date.now()){
  return [...objects].reverse().find(o=>!(o.until>now)&&(o.type==='tree'?Math.abs(x-o.x)<=40&&y>=o.y-85&&y<=o.y+10:Math.abs(x-o.x)<=32&&Math.abs(y-o.y)<=23))||null;
}
export function duration(s,type){return Math.max(1,(type==='tree'?(s.axe?3:10):5)*Math.pow(.8,s.speed));}
export function collect(s,type,x,y,now){if(s.items>=s.capacity)return null;s.items++;s[type==='tree'?'wood':'stone']++;return {x,y,amount:type==='tree'?7:5,readyAt:now+900,collected:false};}
export function pickup(s,drop,player,now){if(drop.collected||now<drop.readyAt||Math.hypot(player.x-drop.x,player.y-drop.y)>55)return false;drop.collected=true;s.money+=drop.amount;return true;}
export function buy(s,kind){const costs={speed:30*(s.speed+1),capacity:40,axe:35,pick:30,mount:100};const cost=costs[kind];if(!Number.isFinite(cost)||s.money<cost||(['axe','pick','mount'].includes(kind)&&s[kind])||(kind==='speed'&&s.speed>=5))return false;s.money-=cost;if(kind==='speed')s.speed++;else if(kind==='capacity')s.capacity+=10;else s[kind]=true;return true;}

// 20 world units per metre, centred on the original island.
export const ISLAND = {left:-550,top:-740,size:2000};
export function clampIsland(x,y){return {x:Math.max(ISLAND.left+10,Math.min(ISLAND.left+ISLAND.size-10,x)),y:Math.max(ISLAND.top+25,Math.min(ISLAND.top+ISLAND.size-25,y))};}
export function islandResources(){
  const objects=[{x:215,y:160,type:'stone'},{x:625,y:175,type:'stone'},{x:685,y:380,type:'stone'},{x:310,y:390,type:'stone'},{x:210,y:350,type:'tree'},{x:340,y:130,type:'tree'},{x:540,y:360,type:'tree'},{x:675,y:210,type:'tree'}];
  for(let row=0;row<11;row++)for(let col=0;col<11;col++){
    const x=ISLAND.left+120+col*175+(row%2)*30,y=ISLAND.top+120+row*175;
    if(objects.some(o=>Math.hypot(o.x-x,o.y-y)<115)||Math.hypot(x-450,y-280)<170)continue;
    objects.push({x,y,type:(row+col)%3===0?'stone':'tree'});
  }
  return objects;
}
export function validChat(name,text){return typeof name==='string'&&name.trim().length>0&&name.length<=12&&typeof text==='string'&&text.trim().length>0&&text.length<=120;}

// The camera follows the player; game and network positions remain in island coordinates.
export const CAMERA_SCALE=2.5;
export function screenToWorld(x,y,player){return {x:(x-450)/CAMERA_SCALE+player.x,y:(y-260)/CAMERA_SCALE+player.y};}
