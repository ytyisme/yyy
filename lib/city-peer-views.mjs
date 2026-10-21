import {cleanCityPose,sameCitySpace} from './city-room.mjs';
import {attachPlayerSkin} from './skin-visuals.mjs';
const colors=[0x668db4,0x8b9e70,0xb18bad,0xd39464,0x66aaa1,0xb8a45c];
export function createCityPeerViews({THREE,scene,person,car,animatePerson,document=globalThis.document,skinOptions={}}) {
  const peers=new Map(),hiddenCars=new Map();
  function dispose(group) {
    group.removeFromParent();group.traverse(object=>{
      object.geometry?.dispose();
      if(object.material?.userData?.cityOwned){object.material.map?.dispose();object.material.dispose();}
    });
  }
  function label(name) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const context=canvas.getContext('2d');context.fillStyle='#173f4cdd';context.fillRect(0,0,512,96);context.fillStyle='#fff8d5';context.font='bold 45px system-ui';context.textAlign='center';context.textBaseline='middle';context.fillText(name,256,49,490);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true});material.userData.cityOwned=true;
    const sprite=new THREE.Sprite(material);sprite.scale.set(3.5,.66,1);sprite.position.y=2.75;return sprite;
  }
  function removePeer(peer){peer.skin.dispose();dispose(peer.root);}
  function clear(){for(const peer of peers.values())removePeer(peer);peers.clear();for(const [vehicle,visible]of hiddenCars)vehicle.g.visible=visible;hiddenCars.clear();}
  function update(online,local,parked,activeCar,dt) {
    const members=online?.members??new Map(),claimed=new Set();
    for(const [id,peer]of peers)if(!members.has(id)){removePeer(peer);peers.delete(id);}
    for(const member of members.values()) {
      if(member.id===online.id)continue;
      const pose=cleanCityPose(member.pose);let peer=peers.get(member.id);
      if(!pose){if(peer)peer.root.visible=false;continue;}
      if(!peer) {
        const root=new THREE.Group();root.name='city-peer-'+member.id;scene.add(root);
        const color=colors[[...member.id].reduce((sum,ch)=>sum+ch.charCodeAt(0),0)%colors.length];
        const avatar=person(root,0,0,color,member.name),tag=label(member.name);root.add(tag);
        const skin=attachPlayerSkin(avatar.g,{...skinOptions,skinId:'default',height:2.2,maxWidth:2.3});
        peer={root,avatar,tag,skin,vehicle:null,vehicleKey:'',space:null,walk:0};peers.set(member.id,peer);root.position.set(pose.x,pose.y,pose.z);
      }
      const visible=!!online.online&&sameCitySpace(local,pose);peer.root.visible=visible;
      if(!visible)continue;
      peer.skin.setSkin(pose.skinId);peer.walk+=dt;peer.skin.update(peer.walk,{running:pose.moving&&!pose.vehicle});
      const vehicleKey=pose.vehicle?pose.vehicle.plate+':'+pose.vehicle.color:'';
      if(peer.vehicleKey!==vehicleKey) {
        if(peer.vehicle)dispose(peer.vehicle.g);
        peer.vehicle=pose.vehicle?car(peer.root,0,0,pose.vehicle.color,0,false,pose.vehicle.plate):null;
        if(peer.vehicle){peer.vehicle.g.position.set(0,0,0);peer.vehicle.g.traverse(object=>{if(object.material?.map)object.material.userData.cityOwned=true;});}
        peer.vehicleKey=vehicleKey;
      }
      peer.avatar.g.visible=!peer.vehicle;peer.tag.position.y=peer.vehicle?3.15:2.75;
      if(pose.vehicle)claimed.add(pose.vehicle.plate);
      const target=new THREE.Vector3(pose.x,pose.y,pose.z),space=[pose.country,pose.city,pose.zone,pose.space].join(':');
      if(peer.space!==space||peer.root.position.distanceTo(target)>50)peer.root.position.copy(target);
      else peer.root.position.lerp(target,1-Math.exp(-14*dt));
      const angle=Math.atan2(Math.sin(pose.heading-peer.root.rotation.y),Math.cos(pose.heading-peer.root.rotation.y));peer.root.rotation.y+=angle*Math.min(1,dt*14);peer.space=space;
      animatePerson(peer.avatar,pose.moving&&!peer.vehicle,dt);
    }
    for(const [vehicle,visible]of hiddenCars)if(!parked.includes(vehicle)||!claimed.has(vehicle.plate)||vehicle===activeCar){vehicle.g.visible=visible;hiddenCars.delete(vehicle);}
    for(const vehicle of parked)if(vehicle!==activeCar&&claimed.has(vehicle.plate)){if(!hiddenCars.has(vehicle))hiddenCars.set(vehicle,vehicle.g.visible);vehicle.g.visible=false;}
  }
  return {update,clear};
}
