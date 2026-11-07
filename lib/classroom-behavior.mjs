export function teacherX(elapsedMs){return Math.sin(Math.floor(elapsedMs/1000)*.5)*5;}
export function noticeEating(player,elapsedMs,item,target){if(target!=='mouth')return false;const pos=player.position||{x:(player.seat%5-2)*2.4,z:-3+Math.floor(player.seat/5)*2.4+1};const distance=Math.hypot(pos.x-teacherX(elapsedMs),pos.z+5);const hearing=item==='snack'?5:2;return distance<=3.5||distance<=hearing;}
export function catchEating(player){player.warnings=(player.warnings||0)+1;if(player.warnings>=2)player.standing=true;}
export function rps(player,opponent){const options=['石头','剪刀','布'],a=options.indexOf(player),b=options.indexOf(opponent);if(a<0||b<0)return '';return a===b?'平局':(a-b+3)%3===2?'你赢了！':'同学赢了！';}
