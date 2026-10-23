// Conversation stays in this tab's memory; only recent successful turns are sent.
export class XiaoyanChat {
 constructor(fetcher=(...args)=>globalThis.fetch(...args)){this.fetcher=fetcher;this.history=[];this.busy=false;}
 clear(){if(!this.busy)this.history=[];}
 async status(){
  const response=await this.fetcher('/api/xiaoyan/status',{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('暂时无法连接小岩服务。');
  return response.json();
 }
 async ask(question){
  if(this.busy)throw new Error('请等小岩回答完这一句。');
  const text=String(question).trim();
  if(!text||text.length>2000)throw new Error('请输入 1～2000 个字。');
  const history=this.history.slice(-10);
  while(history.length&&history.reduce((sum,item)=>sum+item.content.length,0)+text.length>24000)history.splice(0,2);
  const messages=[...history,{role:'user',content:text}];
  this.busy=true;
  try{
   const response=await this.fetcher('/api/xiaoyan/chat',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages}),signal:AbortSignal.timeout(100000),cache:'no-store'
   });
   let data;
   try{data=await response.json();}catch{throw new Error('小岩服务没有正常响应，请确认游戏服务器已经更新并启动。');}
   if(!response.ok){const error=new Error(data.message||'小岩暂时无法回答，请稍后重试。');error.code=data.error;throw error;}
   if(typeof data.reply!=='string'||!data.reply.trim()||data.reply.length>6000)throw new Error('没有收到文字回答，请再试一次。');
   this.history=[...messages,{role:'assistant',content:data.reply}].slice(-10);
   return data;
  }catch(error){
   if(error.name==='TimeoutError'||error.name==='AbortError')throw new Error('等待回答超时了，请稍后重试。');
   if(error instanceof TypeError)throw new Error('网络没有连上，请检查连接后重试。');
   throw error;
  }finally{this.busy=false;}
 }
}
