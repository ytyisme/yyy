const PREFIX='/api/community/';
let identity;
export function communityIdentity(){
 if(identity)return identity;
 try{let key=localStorage.getItem('lava-community-key');if(!key){key=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');localStorage.setItem('lava-community-key',key);}identity=key;return key;}catch{throw new Error('浏览器未允许保存，请开启本机存储后发布。');}
}
export function playerName(){try{return localStorage.getItem('lava-community-name')||localStorage.getItem('lava-build-player')||localStorage.getItem('s2_player')||'建造者';}catch{return '建造者';}}
export async function communityRequest(path,{method='GET',body,signal,timeout=20000}={}){
 const headers={'X-Community-Key':communityIdentity()};
 if(body&&!(body instanceof Blob)){headers['Content-Type']='application/json';body=JSON.stringify(body);}else if(body)headers['Content-Type']=body.type;
 let response;try{response=await fetch(PREFIX+path,{method,headers,body,signal:signal||AbortSignal.timeout(timeout),cache:'no-store'});}catch{throw new Error('游戏圈连接失败，已保留本机存档，请联网后重试上传。');}
 let data;try{data=await response.json();}catch{throw new Error('游戏圈服务尚未连接，请从游戏服务器打开。');}
 if(!response.ok)throw new Error(data.error||'发布失败，请重试');return data;
}
export async function publishMap(save){return communityRequest('maps',{method:'POST',body:{id:save.id,name:save.name,scene:save.scene,modifiedAt:save.updatedAt,author:playerName()}});}
