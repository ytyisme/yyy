/* Shared by the early theme bootstrap, the page and schedule tests. Beijing time. */
(function(root){
 const DAY=86400000,OFFSET=8*3600000,DAYS=new Set([0,1,5,6]);
 function isYellow(value=Date.now()){
  const d=new Date(Number(value)+OFFSET);
  return DAYS.has(d.getUTCDay())&&d.getUTCHours()>=18;
 }
 function state(value=Date.now()){
  const now=Number(value),active=isYellow(now),midnight=Math.floor((now+OFFSET)/DAY)*DAY-OFFSET;
  const sleeping=active&&now-midnight>=(23*60+30)*60000;
  let next=Infinity;
  for(let i=0;i<=8;i++)for(const hour of [0,18]){
   const time=midnight+i*DAY+hour*3600000;
   if(time>now&&isYellow(time)!==isYellow(time-1))next=Math.min(next,time);
  }
  return {active,sleeping,next,remaining:Math.max(0,next-now)};
 }
 const api={isYellow,state};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root){root.Season2Clock=api;if(root.document)root.document.documentElement.dataset.s2Theme=isYellow()?'yellow':'blue';}
})(typeof window==='undefined'?null:window);
