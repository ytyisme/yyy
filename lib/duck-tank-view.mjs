import * as THREE from './three.module.js';

const RUBBER={
  yellow:0xffc400,
  green:0x22c55e,
  blue:0x2f7bff,
  red:0xff3b3b,
  purple:0xa855f7
};

export function mountDuckTank(container){
  const canvas=document.createElement('canvas');
  container.replaceChildren(canvas);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
  }catch(error){
    canvas.remove();
    throw error;
  }
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.setClearColor(0xd7f3f8,1);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xd7f3f8);
  const camera=new THREE.PerspectiveCamera(36,1,0.1,80);
  let yaw=0.18;
  scene.add(new THREE.HemisphereLight(0xfff8ee,0x7ea8b8,2.35));
  const key=new THREE.DirectionalLight(0xffffff,2.7);
  key.position.set(-5.5,9.5,6.5);
  scene.add(key);
  const rim=new THREE.DirectionalLight(0xd8f6ff,1.55);
  rim.position.set(6,4.5,-5);
  scene.add(rim);
  const fill=new THREE.PointLight(0xfff3d4,12,24);
  fill.position.set(-1.2,2.4,3.2);
  scene.add(fill);
  buildRoom(renderer,scene);
  buildTank(scene);
  const rubber=makeRubberGeometry();
  const beakGeo=makeBeak();
  const eyeGeo=new THREE.SphereGeometry(0.045,10,8);
  const pupilGeo=new THREE.SphereGeometry(0.024,8,6);
  const rubberMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.38,metalness:0});
  const beakMat=new THREE.MeshStandardMaterial({color:0xff9a1f,roughness:0.42});
  const eyeMat=new THREE.MeshStandardMaterial({color:0xfffdf8,roughness:0.28});
  const pupilMat=new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:0.35});
  const diamondMat=new THREE.MeshStandardMaterial({
    color:0xf4feff,roughness:0.08,metalness:0.55,emissive:0x7adfff,emissiveIntensity:0.72
  });
  const gemMat=new THREE.MeshStandardMaterial({color:0xf7feff,emissive:0xb7f3ff,emissiveIntensity:0.9,roughness:0.08,metalness:0.2});
  const partGeos=[
    ['rubber',rubber],
    ['beak',beakGeo],
    ['eyeL',eyeGeo.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(0.07,0.2,0.27))],
    ['eyeR',eyeGeo.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(-0.07,0.2,0.27))],
    ['pupilL',pupilGeo.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(0.07,0.2,0.305))],
    ['pupilR',pupilGeo.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(-0.07,0.2,0.305))]
  ];
  const materials={rubber:rubberMat,beak:beakMat,eyeL:eyeMat,eyeR:eyeMat,pupilL:pupilMat,pupilR:pupilMat};
  let meshes=[],ids=[],groups=[],time=0;
  const dummy=new THREE.Object3D();
  const pickList=[];
  const clock=new THREE.Clock();

  function setRoster(ducks){
    clearRoster();
    const normals=ducks.filter(duck=>duck.kind!=='diamond');
    ids=normals.map(duck=>duck.id);
    if(normals.length){
      meshes=partGeos.map(([name,geo])=>{
        const mesh=new THREE.InstancedMesh(geo,materials[name],normals.length);
        mesh.userData.kind='instanced';
        mesh.userData.ids=ids;
        mesh.frustumCulled=false;
        mesh.count=normals.length;
        scene.add(mesh);
        pickList.push(mesh);
        return mesh;
      });
      const colorMesh=meshes[0];
      normals.forEach((duck,index)=>colorMesh.setColorAt(index,new THREE.Color(RUBBER[duck.color])));
      if(colorMesh.instanceColor)colorMesh.instanceColor.needsUpdate=true;
    }
    for(const duck of ducks){
      if(duck.kind!=='diamond')continue;
      const group=new THREE.Group();
      group.userData.duckId=duck.id;
      for(const [name,geo] of partGeos)group.add(new THREE.Mesh(geo,name==='pupilL'||name==='pupilR'?pupilMat:diamondMat));
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.09,0),gemMat);
      gem.position.set(0,0.38,0.05);
      gem.userData.gem=true;
      group.add(gem);
      scene.add(group);
      groups.push(group);
      pickList.push(group);
    }
    const hidden=new THREE.Matrix4().makeScale(0.0001,0.0001,0.0001);
    for(const mesh of meshes)for(let i=0;i<mesh.count;i++)mesh.setMatrixAt(i,hidden);
  }

  function clearRoster(){
    for(const mesh of meshes){scene.remove(mesh);pickList.splice(pickList.indexOf(mesh),1);}
    for(const group of groups){scene.remove(group);pickList.splice(pickList.indexOf(group),1);}
    meshes=[];ids=[];groups=[];
  }

  function sync(list){
    const byId=new Map(list.map(item=>[item.id,item]));
    if(meshes.length){
      ids.forEach((id,index)=>{
        const item=byId.get(id);
        writeDummy(item);
        for(const mesh of meshes)mesh.setMatrixAt(index,dummy.matrix);
      });
      for(const mesh of meshes){mesh.instanceMatrix.needsUpdate=true;mesh.boundingSphere=null;mesh.boundingBox=null;}
    }
    for(const group of groups){
      const item=byId.get(group.userData.duckId);
      writeDummy(item,1.16);
      group.position.copy(dummy.position);
      group.rotation.copy(dummy.rotation);
      group.scale.copy(dummy.scale);
      group.visible=dummy.scale.x>0.01;
    }
  }

  function writeDummy(item,extra=1){
    if(!item||item.scale<0.01){dummy.position.set(0,-20,0);dummy.rotation.set(0,0,0);dummy.scale.setScalar(0.0001);dummy.updateMatrix();return;}
    dummy.position.set(item.x,item.y,item.z);
    dummy.rotation.set(item.roll||0,item.yaw||0,0);
    dummy.scale.setScalar(item.scale*extra);
    dummy.updateMatrix();
  }

  function pick(clientX,clientY,allow){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    const ndc=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(ndc,camera);
    const hits=raycaster.intersectObjects(pickList,true);
    for(const hit of hits){
      const id=idFromHit(hit);
      if(id!=null&&allow.has(id))return id;
    }
    return null;
  }

  function tick(){
    const dt=Math.min(clock.getDelta(),0.05);
    time+=dt;
    diamondMat.emissiveIntensity=0.28+Math.sin(time*3.2)*0.1;
    for(const group of groups){
      const gem=group.children.find(child=>child.userData.gem);
      if(gem)gem.rotation.y+=dt*1.8;
    }
    renderer.render(scene,camera);
  }

  function resize(){
    const {width,height}=container.getBoundingClientRect();
    if(!width||!height)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<800?1:1.25));
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.fov=width/height<0.85?42:36;
    camera.updateProjectionMatrix();
    placeCamera();
  }
  function placeCamera(){
    const aspect=camera.aspect||1;
    const dist=aspect<0.85?13.6:11.6;
    const height=aspect<0.85?6.7:5.55;
    camera.position.set(Math.sin(yaw)*dist,height,Math.cos(yaw)*dist);
    camera.lookAt(0,1.35,0.15);
  }
  function orbitBy(dx){yaw-=dx*0.0075;placeCamera();}
  function getYaw(){return yaw;}
  const observer=new ResizeObserver(resize);
  observer.observe(container);
  resize();
  renderer.render(scene,camera);
  return {canvas,setRoster,sync,pick,tick,orbitBy,getYaw,resize,dispose(){observer.disconnect();clearRoster();renderer.dispose();}};
}

function idFromHit(hit){
  if(hit.instanceId!=null&&hit.object.userData.kind==='instanced')return hit.object.userData.ids[hit.instanceId]??null;
  let object=hit.object;
  while(object&&object.userData.duckId==null)object=object.parent;
  return object?.userData.duckId??null;
}

function buildRoom(renderer,scene){
  const room=new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.SphereGeometry(18,24,16),new THREE.MeshBasicMaterial({color:0xd7f4ff,side:THREE.BackSide})));
  const floor=new THREE.Mesh(new THREE.CircleGeometry(18,32),new THREE.MeshBasicMaterial({color:0xf6e4c4}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-2;room.add(floor);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(2.2,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));
  sun.position.set(6,10,4);room.add(sun);
  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(room,0.04).texture;
  pmrem.dispose();
}

function buildTank(scene){
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(4.3,40),new THREE.MeshBasicMaterial({map:radialTexture(),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=0.012;scene.add(shadow);
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(3.85,4.15,0.62,48),new THREE.MeshStandardMaterial({color:0xf7f1e7,roughness:0.78}));
  pedestal.position.y=-0.34;scene.add(pedestal);
  const wood=new THREE.Mesh(new THREE.CylinderGeometry(3.35,3.45,0.16,48),new THREE.MeshStandardMaterial({color:0xe0b15d,roughness:0.62}));
  wood.position.y=0.02;scene.add(wood);
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(3.48,3.48,3.72,64,1,true),glassMaterial());
  glass.position.y=1.92;glass.renderOrder=3;scene.add(glass);
  const floorGlass=new THREE.Mesh(new THREE.CircleGeometry(3.42,48),glassMaterial());
  floorGlass.rotation.x=-Math.PI/2;floorGlass.position.y=0.09;floorGlass.renderOrder=2;scene.add(floorGlass);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(3.48,0.085,12,48),new THREE.MeshStandardMaterial({color:0xf7fbff,roughness:0.16,metalness:0.04}));
  lip.rotation.x=Math.PI/2;lip.position.y=3.78;scene.add(lip);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(18,20,14),new THREE.MeshBasicMaterial({color:0xe7f7fb,side:THREE.BackSide})));
}

function glassMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`varying vec3 vN;varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);vec3 N=normalize(vN);float fres=pow(1.0-abs(dot(N,V)),2.35);vec3 L=normalize(vec3(-0.35,0.85,0.4));float spec=pow(max(dot(N,normalize(L+V)),0.0),90.0);vec3 color=mix(vec3(0.76,0.91,0.98),vec3(1.0),fres);color+=spec*vec3(1.0);float alpha=0.045+fres*0.5+spec*0.42;gl_FragColor=vec4(color,alpha);}`
  });
}

function makeRubberGeometry(){
  const body=new THREE.SphereGeometry(0.3,18,12);
  const head=new THREE.SphereGeometry(0.155,14,10);
  const tail=new THREE.SphereGeometry(0.11,10,8);
  const wing=new THREE.SphereGeometry(0.12,10,8);
  return mergeGeometries([
    place(body,[0,-0.03,-0.02],[0,0,0],[1.14,0.88,1.24]),
    place(head,[0,0.17,0.18],[0,0,0],[1,1,1]),
    place(tail,[0,0.1,-0.34],[0.4,0,0],[0.72,0.78,1.15]),
    place(wing,[0.33,0.02,0.02],[0,0,0.5],[0.34,0.95,1.18]),
    place(wing,[-0.33,0.02,0.02],[0,0,-0.5],[0.34,0.95,1.18])
  ]);
}

function makeBeak(){
  return place(new THREE.ConeGeometry(0.075,0.28,10),[0,0.14,0.4],[Math.PI/2,0,0],[1,1,1]);
}

function place(geometry,pos,rot,scale){
  const g=geometry.clone();
  const matrix=new THREE.Matrix4();
  matrix.compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale));
  g.applyMatrix4(matrix);
  return g.index?g.toNonIndexed():g;
}

function mergeGeometries(parts){
  let count=0;
  for(const part of parts)count+=part.getAttribute('position').count;
  const position=new Float32Array(count*3);
  const normal=new Float32Array(count*3);
  let offset=0;
  for(const part of parts){
    if(!part.getAttribute('normal'))part.computeVertexNormals();
    const p=part.getAttribute('position'),n=part.getAttribute('normal');
    for(let i=0;i<p.count;i++){
      position[(offset+i)*3]=p.getX(i);position[(offset+i)*3+1]=p.getY(i);position[(offset+i)*3+2]=p.getZ(i);
      normal[(offset+i)*3]=n.getX(i);normal[(offset+i)*3+1]=n.getY(i);normal[(offset+i)*3+2]=n.getZ(i);
    }
    offset+=p.count;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(position,3));
  geo.setAttribute('normal',new THREE.BufferAttribute(normal,3));
  geo.computeBoundingSphere();
  return geo;
}

function radialTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  const paint=ctx.createRadialGradient(64,64,8,64,64,64);
  paint.addColorStop(0,'rgba(48,86,104,0.32)');paint.addColorStop(1,'rgba(48,86,104,0)');
  ctx.fillStyle=paint;ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
