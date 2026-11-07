export function moveLook(yaw,pitch,dx,dy){return {yaw:yaw-dx*.006,pitch:Math.max(-1.25,Math.min(.75,pitch-dy*.006))};}
export function drawerVisible(pitch){return pitch<=-.58;}
export function validDrop(active,pointer,distance,target){return active!==null&&active===pointer&&distance>=30&&Boolean(target);}
