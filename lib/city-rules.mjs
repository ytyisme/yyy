export const buildings = [
 {id:'office',name:'云端写字楼',x:-24,z:-24,color:0xa8c9d5,height:80,floors:20,role:'老板',desc:'坐到工位上上班，每工作5秒发工资50元，可以随时下班。',items:[['开始上班 · 每5秒 ¥50',0,'work',50]]},
 {id:'restaurant',name:'暖光餐厅',x:24,z:-24,color:0xe9ac80,height:10,role:'餐厅老板',desc:'热饭已经准备好了，欢迎坐下来吃。',items:[['牛肉饭',38,'food'],['鲜榨果汁',18,'food']]},
 {id:'hotel',name:'星河酒店',x:-24,z:24,color:0xd7bea0,height:64,floors:16,role:'酒店老板',desc:'入住后进入客房，休息到第二天早晨。',items:[['大床房 · 一晚',588,'stay']]},
 {id:'market',name:'四季超市',x:24,z:24,color:0xb9d29b,height:11,role:'超市老板',desc:'生活用品随你挑，购买后会放入背包。',items:[['牛奶',12,'item'],['面包',8,'item'],['水果礼盒',68,'item']]},
 {id:'school',name:'阳光学校',x:-67,z:-24,color:0xe3cd8f,height:13,role:'老师',desc:'到教室参加一节课，做一道课堂题。',items:[['参加数学课',0,'study']]},
 {id:'store',name:'街角便利店',x:67,z:-24,color:0x91cbbf,height:8,role:'便利店老板',desc:'24小时营业，补充一点零食吧。',items:[['矿泉水',3,'item'],['巧克力',15,'item'],['雨伞',29,'item']]},
 {id:'police',name:'城市警局',x:-67,z:24,color:0x93b5d7,height:14,role:'警察',desc:'查看交通规则、事故责任和赔偿记录。',items:[['了解交通规则',0,'rules'],['查看事故记录',0,'claims']]},
 {id:'court',name:'城市法院',x:-24,z:-67,color:0xd8cfbe,height:16,role:'法官',desc:'法院处理城市违法案件。犯罪进度满格后，由警察押送到这里。',items:[['查看法院公告',0,'courtinfo']]},
 {id:'mall',name:'生活商店',x:67,z:24,color:0xd9b5c8,height:32,floors:8,role:'商店老板',desc:'给自己挑一件喜欢的东西。',items:[['运动鞋',299,'item'],['相机',3999,'item']]},
 {id:'hospital',name:'仁心医院',x:-67,z:-67,color:0xe7edeb,height:48,role:'医生',desc:'可以咨询医生或接受治疗，治疗后恢复健康。',items:[['健康咨询',0,'consult'],['治疗并恢复健康',100,'heal']]},
 {id:'bank',name:'城市银行',x:24,z:-67,color:0xc6bb96,height:44,role:'银行柜员',desc:'查看钱包余额，把游戏里的钱存入银行或取出来。',items:[['查看账户与存取款',0,'bank']]}
];
export function trafficPhase(t){const p=((t%24)+24)%24;return p<10?'NS':p<12?'STOP':p<22?'EW':'STOP';}
export function collisionClaim({driving,speed,npcMoving,playerRed=false}){
 const fault=driving&&(playerRed||Math.abs(speed)>1.5);
 if(!fault&&!npcMoving)return null;
 return {fault,amount:fault?-1500:2000,text:fault?'你撞到了别人，赔偿 ¥1,500。':'对方撞到了你，对方赔偿你 ¥2,000。'};
}
export function terrainHeight(x,z){if(x>=12&&x<=28&&z>=46&&z<70)return -(z-46)/4;if(x>=0&&x<=48&&z>=70&&z<=100)return -6;return 0;}
export function canEnterGarage(from,to){const inLot=p=>p.x>=0&&p.x<=48&&p.z>=70&&p.z<=100;return !inLot(to)||inLot(from)||(from.x>=12&&from.x<=28&&from.z>=46&&from.z<=70&&to.z<72);}
export function trafficCountdown(t,axis){const p=((t%24)+24)%24;const green=trafficPhase(t)===axis;const end=axis==='NS'?(p<10?10:24):(p<12?12:p<22?22:36);return {green,seconds:Math.max(1,Math.ceil(end-p))};}
export function createJustice(max=10000000){let progress=0,phase='free',remaining=0;return {get progress(){return progress},get phase(){return phase},get max(){return max},add(points){if(phase!=='free'||!Number.isFinite(points)||points<=0)return false;progress=Math.min(max,progress+points);if(progress===max)phase='wanted';return true;},begin(){if(phase!=='wanted')return false;phase='escort';remaining=2.5;return true;},advance(dt){if(!['escort','court'].includes(phase)||!Number.isFinite(dt)||dt<0)return null;remaining-=dt;if(remaining>0)return null;if(phase==='escort'){phase='court';remaining=3;return 'court';}phase='free';progress=0;remaining=0;return 'release';}};}
