import * as THREE from './three.module.js';

const up=new THREE.Vector3(0,1,0), temp=new THREE.Vector3();
export function createPlayerView(host, video) {
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.05,80);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  scene.add(camera,new THREE.HemisphereLight(0xf8f1de,0x294754,2.6));
  const light=new THREE.DirectionalLight(0xffe5c3,3.2);light.position.set(-3,5,4);scene.add(light);
  const fill=new THREE.DirectionalLight(0xb7dcf5,1.1);fill.position.set(4,2,-3);scene.add(fill);
  const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...extra});
  const skin=material(0xdba981),sleeve=material(0xe6e1d3),pants=material(0x293a46),shoe=material(0x111c25);
  const palmGeometry=new THREE.SphereGeometry(1,18,12);
  const limbGeometry=new THREE.CylinderGeometry(.075,.085,1,12);
  function ellipsoid(parent,x,y,z,sx,sy,sz,mat) {
    const object=new THREE.Mesh(palmGeometry,mat);object.position.set(x,y,z);object.scale.set(sx,sy,sz);parent.add(object);return object;
  }
  function limb(parent,mat){const mesh=new THREE.Mesh(limbGeometry,mat);parent.add(mesh);return mesh;}
  function connect(mesh,a,b,scale=1) {
    temp.copy(b).sub(a);mesh.position.copy(a).addScaledVector(temp,.5);
    mesh.scale.set(scale,temp.length(),scale);mesh.quaternion.setFromUnitVectors(up,temp.normalize());
  }
  function hand(parent,side) {
    const group=new THREE.Group();group.scale.x=side;parent.add(group);
    ellipsoid(group,0,0,0,.065,.086,.033,skin);
    ellipsoid(group,0,-.065,0,.04,.04,.033,skin);
    const fingers=[];
    for(let i=0;i<4;i++) {
      const finger=new THREE.Group(),length=[.067,.077,.071,.054][i];
      finger.position.set((i-1.5)*.029,.055,0);finger.rotation.z=(1.5-i)*.045;group.add(finger);
      ellipsoid(finger,0,length*.4,0,.015,length*.55,.015,skin);
      const tip=new THREE.Group();tip.position.y=length*.83;finger.add(tip);
      ellipsoid(tip,0,.021,0,.013,.032,.014,skin);fingers.push({finger,tip});
      // Small knuckles make the hand legible even when the fingers are curled.
      ellipsoid(group,(i-1.5)*.028,.052,.024,.018,.021,.014,skin);
    }
    const thumb=new THREE.Group();thumb.position.set(-.057,-.025,.005);thumb.rotation.z=.65;group.add(thumb);
    ellipsoid(thumb,0,.025,0,.021,.044,.02,skin);
    return {group,pose(position,roll,open=0) {
      group.position.set(...position);group.rotation.set(.12,side*.12,roll);
      for(const {finger,tip}of fingers){finger.rotation.x=(1-open)*1.05;tip.rotation.x=(1-open)*1.25;}
      thumb.rotation.x=(1-open)*.7;
    }};
  }
  const first=new THREE.Group();camera.add(first);
  const firstHands=[hand(first,-1),hand(first,1)];
  firstHands.forEach(hand=>hand.group.scale.multiplyScalar(.9));
  const firstArms=[-1,1].map(side=>({side,sleeve:limb(first,sleeve),forearm:limb(first,skin)}));
  const firstFeet=[-1,1].map(side=>({side,leg:limb(first,pants),foot:ellipsoid(first,0,-1,0,.1,.065,.2,shoe)}));
  const body=new THREE.Group();scene.add(body);
  ellipsoid(body,0,1.21,0,.28,.34,.16,sleeve);
  ellipsoid(body,0,.91,0,.22,.16,.15,pants);
  ellipsoid(body,0,1.58,0,.075,.1,.075,skin);
  ellipsoid(body,0,1.79,0,.14,.19,.14,skin);
  ellipsoid(body,0,1.9,-.025,.14,.1,.13,material(0x2b2e30));
  for(const side of[-1,1]) {
    ellipsoid(body,side*.053,1.82,.132,.013,.012,.01,material(0x253846));
    ellipsoid(body,side*.146,1.79,0,.024,.04,.025,skin);
  }
  ellipsoid(body,0,1.77,.14,.025,.031,.026,skin);
  const wholeHands=[hand(body,-1),hand(body,1)];
  const arms=[-1,1].map(side=>({side,upper:limb(body,sleeve),forearm:limb(body,skin)}));
  const legs=[-1,1].map(side=>({side,thigh:limb(body,pants),shin:limb(body,pants),foot:ellipsoid(body,0,.065,.07,.095,.065,.19,shoe)}));
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:0x4f7180,transparent:true,opacity:.13,depthWrite:false}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.035;scene.add(floor);
  const grid=new THREE.GridHelper(36,36,0x97ccda,0x8badbc);grid.material.transparent=true;grid.material.opacity=.14;grid.position.y=-.03;scene.add(grid);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.42,40),new THREE.MeshBasicMaterial({color:0x071721,transparent:true,opacity:.23,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.scale.y=.72;shadow.position.y=-.025;scene.add(shadow);
  // Every pose stays over this single, flat ground plane.
  let fullBody=false;
  function render(pose,time=0) {
    const breathing=Math.sin(time*1.5)*.006;
    first.visible=!fullBody;body.visible=shadow.visible=fullBody;
    if(fullBody) {
      camera.position.set(0,1.7,4.5);camera.lookAt(0,1,0);
      body.position.set((camera.aspect<.75?-.35:-.9)+pose.x*.55,0,pose.z);body.rotation.set(0,pose.turn,pose.lean*.4);body.scale.y=1-pose.duck*.24;
      shadow.position.x=body.position.x;shadow.position.z=body.position.z;
      const wrists=[pose.left,pose.right].map(p=>new THREE.Vector3(p[0]*1.55,p[1]+1.47,p[2]+.85));
      wholeHands.forEach((h,i)=>h.pose(wrists[i].toArray(),i?pose.rightRoll:pose.leftRoll,pose.open));
      arms.forEach((arm,i)=>{
        const shoulder=new THREE.Vector3(arm.side*.2,1.4,0),wrist=wrists[i];
        const elbow=shoulder.clone().lerp(wrist,.5);elbow.x+=arm.side*.1;elbow.z-=.03;
        connect(arm.upper,shoulder,elbow,1.1);connect(arm.forearm,elbow,wrist,.75);
      });
      legs.forEach((leg,i)=>{
        const bend=i?pose.rightLeg:pose.leftLeg,step=pose.steps*leg.side;
        const hip=new THREE.Vector3(leg.side*.13,.92,0);
        const foot=new THREE.Vector3(leg.side*.16+step*.14,Math.abs(bend)*.42,Math.sin(bend)*-.6+step*.22);
        const knee=hip.clone().lerp(foot,.5);knee.z+=Math.abs(bend)*.16;
        connect(leg.thigh,hip,knee,1.05);connect(leg.shin,knee,foot,.78);
        leg.foot.position.copy(foot).add(new THREE.Vector3(0,.065,.07));leg.foot.rotation.x=bend*.6;
      });
      video.style.transform='none';
    } else {
      camera.position.set(pose.x*.45,1.68-pose.duck,pose.z);
      camera.rotation.set(-pose.duck*.16,-pose.turn*.38,pose.lean*.25);
      const fitX=Math.min(1,camera.aspect/1.15),handScale=.9*Math.min(1,camera.aspect/.9);
      const firstWrists=[pose.left,pose.right].map(p=>new THREE.Vector3(p[0]*fitX,Math.min(.2,p[1]*.8+.1)+(camera.aspect<.75?.06:0)+breathing,p[2]-.15));
      firstHands.forEach((h,i)=>{h.group.scale.set((i?1:-1)*handScale,handScale,handScale);h.pose(firstWrists[i].toArray(),i?pose.rightRoll:pose.leftRoll,pose.open);});
      firstArms.forEach((arm,i)=>{
        const shoulder=new THREE.Vector3(arm.side*.57*fitX,-.92,-.12),wrist=firstWrists[i];
        const elbow=shoulder.clone().lerp(wrist,.5);elbow.x+=arm.side*.025;
        connect(arm.sleeve,shoulder,elbow,1.28*handScale/.9);connect(arm.forearm,elbow,wrist,.8*handScale/.9);
      });
      firstFeet.forEach((foot,i)=>{
        const bend=Math.abs(i?pose.rightLeg:pose.leftLeg);foot.leg.visible=foot.foot.visible=bend>.12;
        const end=new THREE.Vector3(foot.side*.18,-.93+bend*.26,-.54-bend*.4);
        connect(foot.leg,new THREE.Vector3(foot.side*.14,-1.05,-.1),end,1.25);
        foot.foot.position.copy(end);foot.foot.rotation.x=-bend*.35;
      });
      video.style.transform=`translate(${-pose.x*1.5}%,${pose.duck*4}%) rotate(${-pose.lean*1.8}deg) scale(${1.015+pose.duck*.03})`;
    }
    renderer.render(scene,camera);
  }
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
  window.addEventListener('resize',resize);
  return {render,setFullBody(value){fullBody=value;},get fullBody(){return fullBody;}};
}
