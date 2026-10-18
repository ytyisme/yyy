import {cleanBuildScene,loadBuildScene,starterScene} from './build-world.mjs';
const KEY='lava-build-saves-v1',ACTIVE='lava-build-active-v1';
export const newSaveId=()=> 'world_'+crypto.randomUUID().replaceAll('-','');
export function listBuildSaves(storage){try{const data=JSON.parse(storage.getItem(KEY));return Array.isArray(data)?data.filter(p=>p&&typeof p.id==='string'&&/^[a-zA-Z0-9_-]{4,80}$/.test(p.id)&&cleanBuildScene(p.scene)).map(p=>({...p,scene:cleanBuildScene(p.scene)})):[];}catch{return [];}}
export function storeBuildSave(storage,save){
 const scene=cleanBuildScene(save.scene);if(!scene)throw new Error('地图内容无效');
 const records=listBuildSaves(storage),value={...save,name:String(save.name||'我的自由创造').slice(0,40),scene};const index=records.findIndex(p=>p.id===save.id);
 if(index>=0)records[index]=value;else records.push(value);
 storage.setItem(KEY,JSON.stringify(records));return value;
}
export function openBuildSave(storage,{id='',fresh=false}={}){
 const records=listBuildSaves(storage);let active='';try{active=storage.getItem(ACTIVE)||'';}catch{}
 let save=!fresh&&records.find(p=>p.id===(id||active));
 if(!save){save={id:newSaveId(),name:'我的自由创造'+(records.length?' '+(records.length+1):''),scene:fresh?starterScene():loadBuildScene(storage),updatedAt:Date.now(),dirty:true};storeBuildSave(storage,save);}
 storage.setItem(ACTIVE,save.id);return save;
}
export function updateBuildSave(storage,save,scene){return storeBuildSave(storage,{...save,scene,updatedAt:Date.now(),dirty:true});}
export function copySharedSave(storage,map,{keepId=false}={}){const scene=cleanBuildScene(map.scene);if(!scene)throw new Error('这份地图格式无效');return storeBuildSave(storage,{id:keepId?map.id:newSaveId(),name:map.name||'朋友的地图',scene,updatedAt:Date.now(),dirty:!keepId,uploadedAt:keepId?map.updatedAt:0});}
