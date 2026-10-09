(function(root){
  function create(){
    let phase="ready",distance=100;
    return {get phase(){return phase},get distance(){return distance},start(){if(phase!=="ready")return false;phase="incoming";return true},catchBullet(){if(phase!=="incoming")return false;phase="catching";return true},caught(){if(phase!=="catching")return false;phase="approach";return true},move(dt){if(phase!=="approach")return false;distance=Math.max(0,distance-dt*35);if(distance===0)phase="near";return true},syncApproach(progress){if(phase!=="approach"||!Number.isFinite(progress))return false;distance=Math.min(distance,Math.max(0,100*(1-Math.max(0,Math.min(1,progress)))));if(distance===0)phase="near";return true},grab(){if(phase!=="near")return false;phase="grabbing";return true},armed(){if(phase!=="grabbing")return false;phase="armed";return true},attack(){if(phase!=="armed")return false;phase="attacking";return true},finish(){if(phase!=="attacking")return false;phase="won";return true},miss(){if(phase!=="incoming")return false;phase="missed";return true}};
  }
  root.CatchBullet={create};
})(typeof window!=="undefined"?window:globalThis);
