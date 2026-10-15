export const GARAGE_FEE = 30;
export const GARAGE_GATE = {x:20, z:70, width:16, floor:-6, height:4.8};
export const GARAGE_SERVICE = {x:38, z:59, door:{x:38, z:52.5}};
const STORAGE_KEY = 'lava-city-garage-access-v1';
const validPlate = plate => typeof plate === 'string' && plate.trim().length > 0 && plate.length <= 24;

// Permission belongs to the plate, while one approach produces one announcement.
export function createGarageAccess(storage=globalThis.localStorage) {
 let permits = new Set();
 try {
  const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
  if(Array.isArray(saved)) permits = new Set(saved.filter(validPlate));
 } catch {}
 let progress=0, holdUntil=-1, approach=null, lastZ=null;
 const screens={outside:null, inside:null};
 const has = plate => permits.has(plate);
 return {
  has,
  register(plate) {
   if(!validPlate(plate)||has(plate)) return false;
   permits.add(plate);
   try { storage?.setItem(STORAGE_KEY, JSON.stringify([...permits])); } catch {}
   return true;
  },
  update({position, plate, now, dt, enabled=true, occupied=false}) {
   const detected=enabled&&validPlate(plate)&&(position.y===undefined||position.y<-.5)&&Math.abs(position.x-GARAGE_GATE.x)<8.5&&Math.abs(position.z-GARAGE_GATE.z)<8.5;
   const allowed=has(plate);
   const side=position.z<GARAGE_GATE.z?'outside':'inside';
   const reversing=approach&&side!==approach.side&&Math.abs(position.z-GARAGE_GATE.z)>2.6&&lastZ!==null&&(position.z-lastZ)*(position.z-GARAGE_GATE.z)<-.001;
   let event=null;
   if(!detected) approach=null;
   else if(!approach||approach.plate!==plate||approach.allowed!==allowed||reversing) {
    const message=allowed?(side==='outside'?'欢迎光临':'一路顺风'):'请勿入内';
    event={plate, side, allowed, message, text:plate+message, speech:plate+(allowed?message:'请勿进入')};
    screens[side]=event;
    approach=event;
   }
   lastZ=detected?position.z:null;
   if(detected&&allowed) holdUntil=now+1.2;
   const opening=(detected&&allowed)||now<holdUntil||(progress>0&&occupied);
   progress=Math.max(0,Math.min(1,progress+(opening?1:-1)*Math.max(0,dt)/1.6));
   return {event, detected, allowed, progress, approach};
  },
  blocks(from,to,radius,plate) {
   const r=radius>=1?Math.max(radius,2.6):radius;
   if((from.z-GARAGE_GATE.z)*(to.z-GARAGE_GATE.z)>=0&&Math.abs(to.z-GARAGE_GATE.z)>Math.abs(from.z-GARAGE_GATE.z)) return false;
   if(Math.max(from.z,to.z)+r<GARAGE_GATE.z||Math.min(from.z,to.z)-r>GARAGE_GATE.z) return false;
   const dz=to.z-from.z;
   const t=dz===0?0:Math.max(0,Math.min(1,(GARAGE_GATE.z-from.z)/dz));
   const x=from.x+(to.x-from.x)*t;
   if(Math.abs(x-GARAGE_GATE.x)>GARAGE_GATE.width/2+r) return false;
   return !has(plate)||progress<.95;
  },
  get progress(){return progress},
  get screens(){return screens}
 };
}

export function createGarageScene({THREE, city, box, sign, person, solids, access, document}) {
 const {x,z,floor,height,width}=GARAGE_GATE;
 const gate=new THREE.Group();
 gate.position.set(x,floor,z);
 city.add(gate);
 for(const side of [-1,1]) box(gate,side*(width/2+.2),2.75,0,.4,5.5,.65,0x60737d);
 box(gate,0,5.15,0,width+.8,.7,.7,0x617581);
 const panels=[];
 for(let i=0;i<6;i++) {
  const panel=new THREE.Group();
  panel.userData.cityDynamic=true;
  gate.add(panel);
  box(panel,0,0,0,width-.1,.79,.2,0xb5bec6);
  box(panel,0,-.37,-.12,width-.18,.035,.04,0x788a97,false);
  box(panel,0,.24,-.12,width-.3,.025,.04,0xd8dfe3,false);
  if(i===0) box(panel,0,-.39,0,width-.1,.09,.23,0x35464c,false);
  panels.push(panel);
 }
 // Finish the front wall on both sides of the vehicle opening.
 box(city,6,-3.25,z,12,5.5,.4,0xb4beb4);
 box(city,38,-3.25,z,20,5.5,.4,0xb4beb4);
 const screens={};
 for(const side of ['outside','inside']) {
  const screenZ=side==='outside'?69.5:72;
  const group=new THREE.Group();
  group.position.set(30.4,floor,screenZ);
  group.rotation.y=side==='outside'?Math.PI:0;
  city.add(group);
  box(group,0,1.25,0,.22,2.5,.22,0x647881);
  box(group,0,2.55,0,4,2.1,.28,0x263a43);
  const display=sign(group,'车辆识别\n'+(side==='outside'?'请先办理入库权限':'出口 · 自动感应'),0,2.55,.16,3.8,'#0d2228','#8cdfd4');
  display.scale.y=1.45;
  screens[side]={display, lastText:''};
 }
 const center=new THREE.Group();
 center.position.set(GARAGE_SERVICE.x,0,GARAGE_SERVICE.z);
 city.add(center);
 box(center,0,2.4,0,12,4.8,10,0x9ebdbb);
 box(center,0,4.9,0,12.6,.3,10.6,0xe2e5d5);
 box(center,0,2,-5.08,3,4,.16,0x335965);
 for(const offset of [-4,4]) box(center,offset,2.2,-5.1,3,2.6,.16,0x547d8c);
 box(center,0,4,-5.65,10,.25,1.5,0xe4d9bb);
 sign(center,'车库服务中心',0,5.8,-5.2,11,'#284d59','#fff5db');
 sign(center,'办理入库权限 · ¥30',0,3.9,-5.9,8,'#fff5db','#2d555b');
 const staff=person(city,GARAGE_SERVICE.door.x+3,GARAGE_SERVICE.door.z,0x537f83,'车库管理员');
 sign(city,'车库管理员',staff.g.position.x,2.8,staff.g.position.z,4);
 solids.push({x:GARAGE_SERVICE.x,z:GARAGE_SERVICE.z,w:12,d:10});
 function update(progress,event) {
  for(let i=0;i<panels.length;i++) {
   const panel=panels[i],s=(i+.5)*height/6+progress*5.6,bend=Math.PI*.4/2;
   if(s<=height) {panel.position.set(0,s,0);panel.rotation.x=0;}
   else if(s<height+bend) {
    const angle=(s-height)/.4;
    panel.position.set(0,height+Math.sin(angle)*.4,(1-Math.cos(angle))*.4);
    panel.rotation.x=angle;
   } else {
    panel.position.set(0,height+.4,.4+s-height-bend);
    panel.rotation.x=Math.PI/2;
   }
  }
  if(event) {
   const screen=screens[event.side],texture=screen.display.material.map,canvas=texture.image,c=canvas.getContext('2d');
   c.fillStyle='#0d2228';c.fillRect(0,0,canvas.width,canvas.height);
   c.fillStyle=event.allowed?'#8bffc0':'#ff947d';c.textAlign='center';c.textBaseline='middle';
   c.font='bold 30px sans-serif';c.fillText(event.plate,canvas.width/2,canvas.height*.3,canvas.width-18);
   c.font='bold 40px sans-serif';c.fillText(event.message,canvas.width/2,canvas.height*.72,canvas.width-18);
   texture.needsUpdate=true;screen.lastText=event.text;
  }
 }
 update(access.progress,null);
 return {gate,panels,screens,center,update};
}
