// The supplied player reference: yellow hooded suit, dark visor, gloves and boots.
export function createHazmatAvatar(THREE,name='玩家'){
  const root=new THREE.Group(),yellow=new THREE.MeshStandardMaterial({color:0xe1c72c,emissive:0xb8a521,emissiveIntensity:1.35,roughness:.84}),dark=new THREE.MeshStandardMaterial({color:0x101714,roughness:.55}),glass=new THREE.MeshStandardMaterial({color:0x080e0d,roughness:.17,metalness:.52});
  const sphere=new THREE.SphereGeometry(1,16,12),capsule=new THREE.CapsuleGeometry(.12,.38,4,10),cube=new THREE.BoxGeometry(1,1,1);
  function mesh(g,m,x,y,z,sx,sy,sz,parent=root){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
  mesh(sphere,yellow,0,1.03,0,.32,.46,.23);mesh(sphere,yellow,0,1.61,0,.265,.315,.24);
  mesh(sphere,glass,0,1.67,-.172,.205,.225,.10);mesh(sphere,yellow,0,1.37,-.08,.24,.16,.18);
  mesh(cube,dark,0,1.16,.245,.37,.51,.13);mesh(cube,dark,0,1.13,-.228,.025,.3,.018);for(const y of [.95,1.04])mesh(sphere,dark,.14,y,-.207,.025,.038,.013);
  const arms=[],legs=[];
  for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.32,1.29,0);root.add(arm);mesh(capsule,yellow,side*.025,-.22,0,1,1.05,1,arm);mesh(sphere,dark,side*.032,-.49,-.015,.091,.115,.08,arm);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.145,.72,0);root.add(leg);mesh(capsule,yellow,0,-.27,0,1.12,1.5,1.12,leg);mesh(sphere,dark,0,-.64,-.065,.12,.075,.19,leg);legs.push(leg);}
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#180807b9';ctx.fillRect(0,0,256,64);ctx.fillStyle='#fff1ba';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 28px sans-serif';ctx.fillText(String(name).slice(0,12),128,33,240);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));tag.position.y=2.18;tag.scale.set(1.5,.375,1);root.add(tag);
  root.userData.animate=(time,running=true)=>{const gait=running?Math.sin(time*13)*.62:0;arms[0].rotation.x=gait;arms[1].rotation.x=-gait;legs[0].rotation.x=-gait;legs[1].rotation.x=gait;};
  root.userData.dispose=()=>{for(const g of [sphere,capsule,cube])g.dispose();for(const m of [yellow,dark,glass])m.dispose();tag.material.dispose();texture.dispose();};
  return root;
}
