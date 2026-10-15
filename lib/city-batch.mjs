// Static blocks share a draw call; cars, signs and moving gates keep their objects.
export function batchCityChunk(THREE,group){
 group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),batches=new Map(),eligible=[];
 group.traverse(mesh=>{
  if(!mesh.isMesh||mesh.geometry?.type!=='BoxGeometry'||mesh.material?.map||mesh.material?.userData?.cityOwned)return;
  for(let p=mesh;p&&p!==group;p=p.parent)if(p.userData.cityDynamic)return;
  const list=batches.get(mesh.material)??[];list.push(mesh);batches.set(mesh.material,list);eligible.push(mesh);
 });
 for(const [material,list] of batches){
  const instanced=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,list.length),scale=new THREE.Matrix4();
  for(const [i,mesh] of list.entries()){const {width,height,depth}=mesh.geometry.parameters;scale.makeScale(width,height,depth);instanced.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld).multiply(scale));instanced.castShadow||=mesh.castShadow;instanced.receiveShadow||=mesh.receiveShadow;}
  instanced.instanceMatrix.needsUpdate=true;group.add(instanced);
 }
 for(const mesh of eligible){mesh.removeFromParent();mesh.geometry.dispose();}
}
